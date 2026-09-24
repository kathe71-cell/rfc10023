#!/usr/bin/env node
/**
 * RFC 10023 Adoption Data Update Script
 * 
 * Automates fetching and updating telemetry metrics for rfc10023.de.
 * Strictly adheres to conservative data governance:
 * - No aggressive scraping
 * - Never overwrite valid data with zeros or errors
 * - Plausibility threshold checking (flags jumps > 50%)
 * - Daily deduplication in adoption-history.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

export const CURRENT_FILE = path.join(projectRoot, 'data', 'adoption-current.json');
export const HISTORY_FILE = path.join(projectRoot, 'data', 'adoption-history.json');

/**
 * Validates whether a fetched adoption number is plausible.
 * @param {number} newValue 
 * @param {number} previousValue 
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validatePlausibility(newValue, previousValue) {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    return { valid: false, reason: 'Value is not a valid number' };
  }
  if (!isFinite(newValue)) {
    return { valid: false, reason: 'Value is not finite' };
  }
  if (newValue <= 0) {
    return { valid: false, reason: 'Value must be greater than zero' };
  }

  // If there is an existing baseline value, check for sudden extreme jumps (> 50%)
  if (previousValue && previousValue > 0) {
    const diff = Math.abs(newValue - previousValue);
    const ratio = diff / previousValue;
    if (ratio > 0.5) {
      return {
        valid: false,
        reason: `Value jumped by ${(ratio * 100).toFixed(1)}% (from ${previousValue} to ${newValue}), exceeding 50% plausibility threshold`,
      };
    }
  }

  return { valid: true };
}

/**
 * Updates adoption history array ensuring max 1 entry per source per calendar day.
 * @param {Array<{date: string, source: string, value: number}>} history 
 * @param {string} dateString YYYY-MM-DD
 * @param {string} sourceKey 
 * @param {number} value 
 * @returns {Array<{date: string, source: string, value: number}>}
 */
export function recordHistoryEntry(history, dateString, sourceKey, value) {
  const cloned = [...history];
  const existingIndex = cloned.findIndex(
    (item) => item.date === dateString && item.source === sourceKey
  );

  if (existingIndex >= 0) {
    // Update existing day record without duplicating
    cloned[existingIndex] = {
      date: dateString,
      source: sourceKey,
      value,
    };
  } else {
    // Append new entry
    cloned.push({
      date: dateString,
      source: sourceKey,
      value,
    });
  }

  // Sort chronologically
  cloned.sort((a, b) => a.date.localeCompare(b.date));
  return cloned;
}

/**
 * Core processing logic for an adoption dataset.
 * Can be run with custom fetchers for deterministic unit testing.
 * 
 * @param {object} currentData 
 * @param {Array} historyData 
 * @param {object} options
 * @param {Function} [options.fetcher] Custom fetch implementation
 * @param {string} [options.today] Custom YYYY-MM-DD string
 * @returns {Promise<{ current: object, history: Array, changed: boolean, logs: string[] }>}
 */
export async function processAdoptionUpdate(currentData, historyData, options = {}) {
  const fetcher = options.fetcher || globalThis.fetch;
  const today = options.today || new Date().toISOString().split('T')[0];
  const nowIso = options.nowIso || new Date().toISOString();
  const logs = [];
  let hasChanges = false;

  const updatedCurrent = JSON.parse(JSON.stringify(currentData));
  let updatedHistory = JSON.parse(JSON.stringify(historyData));

  if (!updatedCurrent.sources) {
    updatedCurrent.sources = {};
  }

  for (const [sourceKey, source] of Object.entries(updatedCurrent.sources)) {
    logs.push(`Evaluating source [${sourceKey}] (mode: ${source.mode || 'manual'})...`);

    if (source.mode !== 'automatic') {
      logs.push(`  → Source [${sourceKey}] is set to mode: manual. Retaining current value (${source.value}).`);
      continue;
    }

    if (!source.sourceUrl) {
      logs.push(`  ⚠ Warning: Source [${sourceKey}] is marked automatic but has no sourceUrl.`);
      continue;
    }

    try {
      logs.push(`  → Fetching endpoint: ${source.sourceUrl}`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetcher(source.sourceUrl, {
        headers: { 'Accept': 'application/json, text/plain, */*' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        logs.push(`  ✗ HTTP Error ${response.status} ${response.statusText} for [${sourceKey}]. Retaining previous value (${source.value}).`);
        continue;
      }

      const rawText = await response.text();
      let extractedValue = null;

      try {
        const json = JSON.parse(rawText);
        // Look for common count fields
        if (typeof json.value === 'number') extractedValue = json.value;
        else if (typeof json.count === 'number') extractedValue = json.count;
        else if (typeof json.total === 'number') extractedValue = json.total;
        else if (typeof json.domainsCount === 'number') extractedValue = json.domainsCount;
        else if (typeof json.detectedDomains === 'number') extractedValue = json.detectedDomains;
      } catch {
        // Fallback: Check if response is raw plain text number
        const parsed = parseInt(rawText.trim(), 10);
        if (!isNaN(parsed)) extractedValue = parsed;
      }

      if (extractedValue === null) {
        logs.push(`  ✗ Error: Could not extract numeric metric from response payload for [${sourceKey}]. Retaining previous value (${source.value}).`);
        continue;
      }

      const plausibility = validatePlausibility(extractedValue, source.value);
      if (!plausibility.valid) {
        logs.push(`  ⚠ Plausibility check failed for [${sourceKey}]: ${plausibility.reason}. Rejecting value and retaining (${source.value}).`);
        continue;
      }

      // Valid and plausible value received
      if (extractedValue !== source.value) {
        logs.push(`  ✓ New valid value for [${sourceKey}]: ${source.value} → ${extractedValue}`);
        source.value = extractedValue;
        source.lastSuccessfulFetch = nowIso;
        hasChanges = true;

        updatedHistory = recordHistoryEntry(updatedHistory, today, sourceKey, extractedValue);
      } else {
        logs.push(`  ℹ Value unchanged (${source.value}). Updating lastSuccessfulFetch timestamp.`);
        source.lastSuccessfulFetch = nowIso;
        hasChanges = true;
        // Ensure today is registered in history if missing
        updatedHistory = recordHistoryEntry(updatedHistory, today, sourceKey, source.value);
      }
    } catch (err) {
      logs.push(`  ✗ Network/Parsing exception for [${sourceKey}]: ${err.message}. Retaining previous value (${source.value}).`);
    }
  }

  if (hasChanges) {
    updatedCurrent.lastUpdated = nowIso;
  }

  return {
    current: updatedCurrent,
    history: updatedHistory,
    changed: hasChanges,
    logs,
  };
}

/**
 * Main CLI entrypoint
 */
async function main() {
  console.log('=== RFC 10023 Adoption Data Update Script ===');
  console.log(`Time: ${new Date().toISOString()}`);

  if (!fs.existsSync(CURRENT_FILE) || !fs.existsSync(HISTORY_FILE)) {
    console.error('Error: Required data files not found in /data directory.');
    process.exit(1);
  }

  const currentRaw = fs.readFileSync(CURRENT_FILE, 'utf-8');
  const historyRaw = fs.readFileSync(HISTORY_FILE, 'utf-8');

  const current = JSON.parse(currentRaw);
  const history = JSON.parse(historyRaw);

  const result = await processAdoptionUpdate(current, history);

  result.logs.forEach((log) => console.log(log));

  if (result.changed) {
    fs.writeFileSync(CURRENT_FILE, JSON.stringify(result.current, null, 2) + '\n', 'utf-8');
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(result.history, null, 2) + '\n', 'utf-8');
    console.log('✓ Successfully wrote updated adoption files.');
  } else {
    console.log('ℹ No data changes recorded. Files left intact.');
  }

  console.log('=== Execution finished ===');
}

// Run if executed directly from CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error('Fatal error in adoption update script:', err);
    process.exit(1);
  });
}
