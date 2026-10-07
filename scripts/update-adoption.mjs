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
export function validatePlausibility(newValue, previousValue, maxRatio = 0.5) {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    return { valid: false, reason: 'Value is not a valid number' };
  }
  if (!isFinite(newValue)) {
    return { valid: false, reason: 'Value is not finite' };
  }
  if (newValue <= 0) {
    return { valid: false, reason: 'Value must be greater than zero' };
  }

  // If there is an existing baseline value, check for sudden extreme jumps
  if (previousValue && previousValue > 0) {
    const diff = Math.abs(newValue - previousValue);
    const ratio = diff / previousValue;
    if (ratio > maxRatio) {
      return {
        valid: false,
        reason: `Value jumped by ${(ratio * 100).toFixed(1)}% (from ${previousValue} to ${newValue}), exceeding ${(maxRatio * 100).toFixed(0)}% plausibility threshold`,
      };
    }
  }

  return { valid: true };
}

/**
 * Basic validity check for telemetry metrics.
 * Rejects corrupt data (non-numeric, non-finite, zero/negative, invalid date, backwards date).
 * 
 * @param {any} value 
 * @param {string} [date] 
 * @param {string} [prevDate] 
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateTelemetryBasic(value, date, prevDate) {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, reason: 'Value is not a valid number' };
  }
  if (!isFinite(value)) {
    return { valid: false, reason: 'Value is not finite' };
  }
  if (value <= 0) {
    return { valid: false, reason: 'Value must be greater than zero' };
  }
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { valid: false, reason: 'Date format is invalid (expected YYYY-MM-DD)' };
  }
  if (date && prevDate && date < prevDate) {
    return { valid: false, reason: `New observation date (${date}) is older than previous (${prevDate})` };
  }
  return { valid: true };
}

/**
 * Generic Anomaly Detector for new adoption snapshots.
 * Flags points with relative change > 20% or unusual magnitude.
 * The point is NEVER discarded or smoothed, but flagged with anomaly metadata.
 * 
 * @param {number} newValue 
 * @param {number} [previousValue] 
 * @param {string} [currentMetric] 
 * @param {string} [previousMetric] 
 * @returns {{
 *   anomaly: boolean,
 *   changeAbsolute: number | null,
 *   changePercent: number | null,
 *   anomalyReason: string | null,
 *   anomalyReasonEn: string | null,
 *   verificationStatus: 'normal' | 'anomaly-unexplained' | 'source-methodology-change' | 'externally-confirmed'
 * }}
 */
export function detectAnomaly(newValue, previousValue, currentMetric = 'full_dataset', previousMetric = 'full_dataset') {
  if (!previousValue || previousValue <= 0) {
    return {
      anomaly: false,
      changeAbsolute: null,
      changePercent: null,
      anomalyReason: null,
      anomalyReasonEn: null,
      verificationStatus: 'normal',
    };
  }

  // If source metric changed (e.g. earlier research baseline vs full dataset),
  // do NOT calculate misleading percentage change across incompatible metrics.
  if (currentMetric && previousMetric && currentMetric !== previousMetric) {
    return {
      anomaly: false,
      changeAbsolute: null,
      changePercent: null,
      anomalyReason: `Quellmetrik geändert (${previousMetric} → ${currentMetric}) – kein longitudinaler Vergleich`,
      anomalyReasonEn: `Source metric changed (${previousMetric} → ${currentMetric}) – no longitudinal comparison`,
      verificationStatus: 'source-methodology-change',
    };
  }

  const changeAbsolute = newValue - previousValue;
  const changePercent = Number(((changeAbsolute / previousValue) * 100).toFixed(2));
  const relRatio = Math.abs(changeAbsolute) / previousValue;

  if (relRatio > 0.20) {
    const sign = changePercent > 0 ? '+' : '';
    const formattedPctDe = sign + changePercent.toFixed(1).replace('.', ',') + ' %';
    const formattedPctEn = sign + changePercent.toFixed(1) + '%';
    const formattedAbsDe = sign + changeAbsolute.toLocaleString('de-DE');
    const formattedAbsEn = sign + changeAbsolute.toLocaleString('en-US');
    const formattedPrevDe = previousValue.toLocaleString('de-DE');
    const formattedPrevEn = previousValue.toLocaleString('en-US');
    return {
      anomaly: true,
      changeAbsolute,
      changePercent,
      anomalyReason: `Auffälliger Sprung um ${formattedAbsDe} Domains (${formattedPctDe}) gegenüber dem vorherigen Snapshot (${formattedPrevDe}) überschreitet den 20%-Schwellenwert`,
      anomalyReasonEn: `Notable jump of ${formattedAbsEn} domains (${formattedPctEn}) compared to previous snapshot (${formattedPrevEn}) exceeds 20% threshold`,
      verificationStatus: 'anomaly-unexplained',
    };
  }

  return {
    anomaly: false,
    changeAbsolute,
    changePercent,
    anomalyReason: null,
    anomalyReasonEn: null,
    verificationStatus: 'normal',
  };
}

/**
 * Updates adoption history array ensuring max 1 entry per source per calendar day.
 * Preserves anomaly and verification metadata.
 * 
 * @param {Array<any>} history 
 * @param {string} dateString YYYY-MM-DD
 * @param {string} sourceKey 
 * @param {number} value 
 * @param {object} [metadata]
 * @returns {Array<any>}
 */
export function recordHistoryEntry(history, dateString, sourceKey, value, metadata = {}) {
  const cloned = [...history];
  const existingIndex = cloned.findIndex(
    (item) => item.date === dateString && item.source === sourceKey
  );

  const entry = {
    date: dateString,
    source: sourceKey,
    value,
    ...metadata,
  };

  if (existingIndex >= 0) {
    cloned[existingIndex] = entry;
  } else {
    cloned.push(entry);
  }

  // Sort chronologically
  cloned.sort((a, b) => a.date.localeCompare(b.date));
  return cloned;
}

/**
 * Parses full dataset count and date from Domains Monitor HTML table.
 * Specifically targets "Domains for sale with _for-sale DNS records (full dataset)".
 * 
 * @param {string} html 
 * @returns {{ count: number, sourceDate: string } | null}
 */
export function parseDomainsMonitorHtml(html) {
  if (typeof html !== 'string' || !html.trim()) return null;

  const toIsoDate = (raw) => {
    const m = String(raw).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
    return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : null;
  };
  const toCount = (raw) => {
    const digits = String(raw)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;|&#160;|&#xa0;|&thinsp;|&#8239;/gi, '')
      .replace(/\D/g, '');
    const n = parseInt(digits, 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  // Strategy 1: <tr title="...full dataset..."> with cells [zone, date, count]
  const rowMatch = html.match(/<tr[^>]*title=['"][^'"]*full dataset[^'"]*['"][^>]*>([\s\S]*?)<\/tr>/i);
  if (rowMatch) {
    const cells = rowMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi);
    if (cells && cells.length >= 3) {
      const count = toCount(cells[2]);
      const sourceDate = toIsoDate(cells[1].replace(/<[^>]+>/g, ''));
      if (count && sourceDate) return { count, sourceDate };
    }
  }

  // Strategy 2 (markup-independent fallback): visible text
  // "... (full dataset) 03.10.2026 569 405"
  const text = html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;|&#xa0;/gi, '\u00a0')
    .replace(/&amp;/gi, '&');
  const textMatch = text.match(
    /full dataset\)?\s*(\d{1,2}\.\d{1,2}\.\d{4})\s*(\d{1,3}(?:[ \u00a0\u202f.,]\d{3})*)/i
  );
  if (textMatch) {
    const count = toCount(textMatch[2]);
    const sourceDate = toIsoDate(textMatch[1]);
    if (count && sourceDate) return { count, sourceDate };
  }

  return null;
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
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/json,text/plain,*/*;q=0.9',
          'User-Agent': 'Mozilla/5.0 (compatible; rfc10023-telemetry/1.0; +https://www.rfc10023.de)'
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        logs.push(`  ✗ HTTP Error ${response.status} ${response.statusText} for [${sourceKey}]. Retaining previous value (${source.value}).`);
        continue;
      }

      const rawText = await response.text();
      let extractedValue = null;
      let extractedDate = null;

      // 1. Check if source is Domains Monitor HTML page
      if (sourceKey === 'domainsMonitor' || source.sourceUrl.includes('domains-monitor.com')) {
        const dmParsed = parseDomainsMonitorHtml(rawText);
        if (dmParsed) {
          extractedValue = dmParsed.count;
          extractedDate = dmParsed.sourceDate;
        }
      }

      // 2. Check JSON payload if not extracted from HTML
      if (extractedValue === null) {
        try {
          const json = JSON.parse(rawText);
          if (typeof json.value === 'number') extractedValue = json.value;
          else if (typeof json.count === 'number') extractedValue = json.count;
          else if (typeof json.total === 'number') extractedValue = json.total;
          else if (typeof json.domainsCount === 'number') extractedValue = json.domainsCount;
          else if (typeof json.detectedDomains === 'number') extractedValue = json.detectedDomains;
          if (json.date) extractedDate = json.date;
        } catch {
          // Fallback: Check if response is raw plain text number
          const parsed = parseInt(rawText.trim(), 10);
          if (!isNaN(parsed)) extractedValue = parsed;
        }
      }

      if (extractedValue === null) {
        logs.push(`  ✗ Error: Could not extract numeric metric from response payload for [${sourceKey}]. Retaining previous value (${source.value}).`);
        continue;
      }

      const effectiveDate = extractedDate || today;

      // 1. Basic sanity & validity checks (non-numeric, <= 0, older date)
      const basicCheck = validateTelemetryBasic(extractedValue, effectiveDate, source.sourceDate);
      if (!basicCheck.valid) {
        logs.push(`  ✗ Basic validity check failed for [${sourceKey}]: ${basicCheck.reason}. Retaining previous value (${source.value}).`);
        continue;
      }

      // 2. Anomaly detection (relative change > 20%, unexpected jumps)
      const currentMetric = source.metric || 'full_dataset';
      const anomalyCheck = detectAnomaly(extractedValue, source.value, currentMetric, currentMetric);

      if (anomalyCheck.anomaly) {
        logs.push(`  ⚠ Anomaly detected for [${sourceKey}]: ${anomalyCheck.anomalyReason}. Storing with verificationStatus: ${anomalyCheck.verificationStatus}`);
      }

      // Valid value received - save without smoothing or synthetic tampering
      if (extractedValue !== source.value) {
        logs.push(`  ✓ New valid value for [${sourceKey}]: ${source.value} → ${extractedValue}`);
        source.value = extractedValue;
        source.count = extractedValue;
        if (extractedDate) source.sourceDate = extractedDate;
        source.lastSuccessfulFetch = nowIso;
        source.fetchedAt = nowIso;
        source.anomaly = anomalyCheck.anomaly;
        source.changeAbsolute = anomalyCheck.changeAbsolute;
        source.changePercent = anomalyCheck.changePercent;
        source.anomalyReason = anomalyCheck.anomalyReason;
        source.anomalyReasonEn = anomalyCheck.anomalyReasonEn;
        source.verificationStatus = anomalyCheck.verificationStatus;
        hasChanges = true;

        updatedHistory = recordHistoryEntry(updatedHistory, effectiveDate, sourceKey, extractedValue, {
          metric: currentMetric,
          changeAbsolute: anomalyCheck.changeAbsolute,
          changePercent: anomalyCheck.changePercent,
          anomaly: anomalyCheck.anomaly,
          anomalyReason: anomalyCheck.anomalyReason,
          verificationStatus: anomalyCheck.verificationStatus,
        });
      } else {
        logs.push(`  ℹ Value unchanged (${source.value}). Updating lastSuccessfulFetch timestamp.`);
        source.lastSuccessfulFetch = nowIso;
        source.fetchedAt = nowIso;
        if (extractedDate) source.sourceDate = extractedDate;
        hasChanges = true;
        // Ensure effectiveDate is registered in history if missing
        updatedHistory = recordHistoryEntry(updatedHistory, effectiveDate, sourceKey, source.value, {
          metric: currentMetric,
          changeAbsolute: 0,
          changePercent: 0,
          anomaly: Boolean(source.anomaly),
          verificationStatus: source.verificationStatus || 'normal',
        });
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
 * Sets <lastmod> for the given <loc> URLs in a sitemap (only moves forward in time).
 * @param {string} xml
 * @param {string[]} locs
 * @param {string} date YYYY-MM-DD
 * @returns {string}
 */
export function updateSitemapLastmod(xml, locs, date) {
  let out = xml;
  for (const loc of locs) {
    const re = new RegExp(`(<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?<lastmod>)([^<]+)(</lastmod>)`);
    out = out.replace(re, (m, a, old, b) => (old < date ? `${a}${date}${b}` : m));
  }
  return out;
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
    console.log('ℹ No data changes recorded for Domains Monitor. Files left intact.');
  }

  // Also update ForSaleDNS adoption history as a separate data source
  console.log('\n--- Checking ForSaleDNS Adoption History ---');
  try {
    const { updateForSaleDnsHistory, applyForSaleDnsUpdate, FORSALEDNS_FILE } = await import('./import-forsaledns-history.mjs');
    const forSaleResult = await updateForSaleDnsHistory();
    forSaleResult.logs.forEach((log) => console.log(log));

    const currentAdoption = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
    let existingForSale = [];
    if (fs.existsSync(FORSALEDNS_FILE)) {
      try {
        existingForSale = JSON.parse(fs.readFileSync(FORSALEDNS_FILE, 'utf-8'));
      } catch {
        existingForSale = [];
      }
    }

    const updateOutcome = applyForSaleDnsUpdate(
      currentAdoption.forSaleDns,
      existingForSale,
      forSaleResult.data,
      new Date().toISOString()
    );

    if (updateOutcome.status !== 'fetch-failed') {
      if (updateOutcome.historyChanged) {
        fs.writeFileSync(FORSALEDNS_FILE, JSON.stringify(updateOutcome.history, null, 2) + '\n', 'utf-8');
        console.log('✓ Successfully wrote updated ForSaleDNS history.');
      }
      currentAdoption.forSaleDns = updateOutcome.meta;
      fs.writeFileSync(CURRENT_FILE, JSON.stringify(currentAdoption, null, 2) + '\n', 'utf-8');
      console.log(`✓ Updated ForSaleDNS metadata (Snapshot: ${updateOutcome.meta.latestSnapshotDate}, Fetch: ${updateOutcome.meta.lastSuccessfulFetch}, Status: ${updateOutcome.status}).`);
    } else {
      console.warn('⚠ ForSaleDNS fetch failed. Retaining existing snapshot and fetch timestamp.');
    }
  } catch (forSaleErr) {
    console.error('⚠ Error updating ForSaleDNS history (retaining existing data):', forSaleErr.message);
  }

  // Keep sitemap lastmod of the data-driven pages in sync with each successful data update
  try {
    const sitemapPath = path.join(projectRoot, 'public', 'sitemap.xml');
    const current = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
    const dates = [
      current.sources?.domainsMonitor?.sourceDate,
      current.forSaleDns?.latestSnapshotDate,
    ].filter(Boolean).sort();
    const latest = dates[dates.length - 1];
    if (latest && fs.existsSync(sitemapPath)) {
      const xml = fs.readFileSync(sitemapPath, 'utf-8');
      const updated = updateSitemapLastmod(xml, [
        'https://www.rfc10023.de/oekosystem',
        'https://www.rfc10023.de/en/ecosystem',
      ], latest);
      if (updated !== xml) {
        fs.writeFileSync(sitemapPath, updated, 'utf-8');
        console.log(`✓ Sitemap lastmod for ecosystem pages set to ${latest}.`);
      }
    }
  } catch (err) {
    console.warn('⚠ Could not update sitemap lastmod:', err.message);
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
