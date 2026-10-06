#!/usr/bin/env node
/**
 * ForSaleDNS RFC 10023 Adoption History Importer
 * 
 * Fetches verified historical telemetry from the official ForSaleDNS API:
 * GET https://forsaledns.net/api/v1/adoption-history
 * 
 * Strictly preserves methodological separation:
 * - Writes exclusively to data/adoption-history-forsaledns.json
 * - Never mixes with data/adoption-history.json (Domains Monitor)
 * - Safe error handling: retains previous data if network/API fails
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

export const FORSALEDNS_FILE = path.join(projectRoot, 'data', 'adoption-history-forsaledns.json');
export const CURRENT_FILE = path.join(projectRoot, 'data', 'adoption-current.json');
export const FORSALEDNS_API_URL = 'https://forsaledns.net/api/v1/adoption-history';
export const USER_AGENT = 'RFC10023-AdoptionTracker/1.0 (+https://www.rfc10023.de)';

/**
 * Validates raw API entries from ForSaleDNS
 * @param {any} rawItem 
 * @returns {boolean}
 */
export function validateForSaleDnsItem(rawItem) {
  if (!rawItem || typeof rawItem !== 'object') return false;
  if (typeof rawItem.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(rawItem.day)) return false;
  if (typeof rawItem.active !== 'number' || isNaN(rawItem.active) || rawItem.active <= 0) return false;
  if (typeof rawItem.inventoryTotal !== 'number' || rawItem.inventoryTotal <= 0) return false;
  if (typeof rawItem.inventoryCompleted !== 'number' || rawItem.inventoryCompleted < 0) return false;
  return true;
}

/**
 * Sanitizes and structures raw API entries.
 * @param {Array<any>} rawData 
 * @returns {Array<{date: string, activeListings: number, conformant: number, priced: number, dnssec: number, inventoryCompleted: number, inventoryTotal: number, baselineComplete: boolean, sweepComplete: boolean}>}
 */
export function processForSaleDnsEntries(rawData) {
  if (!Array.isArray(rawData)) {
    throw new Error('API response is not an array');
  }

  const validEntries = rawData.filter(validateForSaleDnsItem);
  if (validEntries.length === 0) {
    throw new Error('No valid entries found in API response');
  }

  // Deduplicate by day (keep latest/last occurrence if any duplicate)
  const mapByDay = new Map();
  for (const item of validEntries) {
    mapByDay.set(item.day, {
      date: item.day,
      activeListings: item.active,
      conformant: typeof item.conformant === 'number' ? item.conformant : item.active,
      priced: typeof item.priced === 'number' ? item.priced : 0,
      dnssec: typeof item.dnssec === 'number' ? item.dnssec : 0,
      inventoryCompleted: item.inventoryCompleted,
      inventoryTotal: item.inventoryTotal,
      baselineComplete: Boolean(item.baselineComplete),
      sweepComplete: item.inventoryCompleted === item.inventoryTotal,
    });
  }

  // Sort chronologically ascending
  const sorted = Array.from(mapByDay.values()).sort((a, b) => a.date.localeCompare(b.date));
  return sorted;
}

/**
 * Applies ForSaleDNS update rules distinguishing latestSnapshotDate and lastSuccessfulFetch.
 *
 * Fall A: Fetch erfolgreich + neuer Messpunkt -> Snapshot-Datum & Fetch-Zeit aktualisiert
 * Fall B: Fetch erfolgreich + kein neuer Messpunkt -> Snapshot-Datum bleibt gleich, Fetch-Zeit aktualisiert
 * Fall C: Fetch schlägt fehl -> Snapshot-Datum & Fetch-Zeit bleiben unberührt
 *
 * @param {object} currentMeta { latestSnapshotDate?: string, lastSuccessfulFetch?: string }
 * @param {Array<object>} existingHistory
 * @param {Array<object>|null} fetchedEntries
 * @param {string} fetchTimeIso
 * @returns {{
 *   meta: { latestSnapshotDate: string, lastSuccessfulFetch: string },
 *   history: Array<object>,
 *   historyChanged: boolean,
 *   metaChanged: boolean,
 *   status: 'success-new-data' | 'success-no-new-data' | 'fetch-failed'
 * }}
 */
export function applyForSaleDnsUpdate(currentMeta, existingHistory, fetchedEntries, fetchTimeIso) {
  if (!fetchedEntries || !Array.isArray(fetchedEntries) || fetchedEntries.length === 0) {
    return {
      meta: currentMeta ? { ...currentMeta } : { latestSnapshotDate: '', lastSuccessfulFetch: '' },
      history: existingHistory || [],
      historyChanged: false,
      metaChanged: false,
      status: 'fetch-failed',
    };
  }

  // Upsert per calendar day: keep days the API no longer returns (it serves at
  // most 400 days), let the API's current value win for every day it returns
  // (an intraday value is later replaced by the finalized one), never duplicate.
  const byDay = new Map();
  for (const item of existingHistory || []) {
    if (item && typeof item.date === 'string') byDay.set(item.date, item);
  }
  for (const item of fetchedEntries) byDay.set(item.date, item);
  const mergedHistory = Array.from(byDay.values()).sort((x, y) => x.date.localeCompare(y.date));

  const newSnapshotDate = mergedHistory[mergedHistory.length - 1].date;
  const prevSnapshotDate = currentMeta?.latestSnapshotDate;

  const historyChanged = JSON.stringify(existingHistory || []) !== JSON.stringify(mergedHistory);

  const updatedMeta = {
    latestSnapshotDate: newSnapshotDate,
    lastSuccessfulFetch: fetchTimeIso,
  };

  const isNewSnapshot = !prevSnapshotDate || newSnapshotDate !== prevSnapshotDate;

  return {
    meta: updatedMeta,
    history: mergedHistory,
    historyChanged,
    metaChanged: true,
    status: isNewSnapshot ? 'success-new-data' : 'success-no-new-data',
  };
}

/**
 * Parses a Retry-After header (delta-seconds or HTTP-date) into milliseconds.
 * @param {string} value
 * @returns {number|null}
 */
export function parseRetryAfter(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
  const at = Date.parse(trimmed);
  return Number.isNaN(at) ? null : Math.max(0, at - Date.now());
}

/**
 * Fetches and processes ForSaleDNS adoption history.
 * @param {object} [options]
 * @param {Function} [options.fetcher]
 * @param {number} [options.maxAttempts]
 * @param {number} [options.retryDelayMs]
 * @param {number} [options.timeoutMs]
 * @returns {Promise<{ data: Array<object>|null, changed: boolean, logs: string[], error?: string }>}
 */
export async function updateForSaleDnsHistory(options = {}) {
  const fetcher = options.fetcher || globalThis.fetch;
  const maxAttempts = options.maxAttempts ?? 3;
  const retryDelayMs = options.retryDelayMs ?? 5000;
  const timeoutMs = options.timeoutMs ?? 20000;
  const logs = [];

  logs.push(`Connecting to ForSaleDNS API: ${FORSALEDNS_API_URL}...`);

  let response = null;
  let lastError = '';
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    let retryable = true;
    let retryAfterMs = null;
    try {
      const res = await fetcher(FORSALEDNS_API_URL, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      if (res.ok) {
        response = res;
      } else {
        // Record enough detail to tell a WAF/bot block (e.g. Cloudflare 403) from an outage.
        const header = (name) => res.headers?.get?.(name) || '';
        let snippet = '';
        try {
          snippet = (await res.text()).replace(/\s+/g, ' ').slice(0, 200);
        } catch {
          snippet = '';
        }
        lastError = `HTTP ${res.status} ${res.statusText || ''}`.trim() +
          ` | url=${FORSALEDNS_API_URL}` +
          (header('server') ? ` | server=${header('server')}` : '') +
          (header('cf-ray') ? ` | cf-ray=${header('cf-ray')}` : '') +
          (header('cf-mitigated') ? ` | cf-mitigated=${header('cf-mitigated')}` : '') +
          (header('retry-after') ? ` | retry-after=${header('retry-after')}` : '') +
          (snippet ? ` | body="${snippet}"` : '');
        retryable = res.status === 429 || res.status >= 500;
        if (res.status === 429) retryAfterMs = parseRetryAfter(header('retry-after'));
      }
    } catch (err) {
      const cause = err?.cause?.code || err?.cause?.message;
      lastError = `Network error: ${err?.name === 'AbortError' ? `timeout after ${timeoutMs} ms` : err?.message}` +
        (cause ? ` (code: ${cause})` : '') +
        ` | url=${FORSALEDNS_API_URL}`;
    } finally {
      clearTimeout(timeoutId);
    }
    if (response) {
      if (attempt > 1) logs.push(`✓ Attempt ${attempt}/${maxAttempts} succeeded.`);
      break;
    }
    const willRetry = retryable && attempt < maxAttempts;
    const waitMs = willRetry ? Math.min(retryAfterMs ?? retryDelayMs * attempt, 60000) : 0;
    logs.push(
      `✗ Attempt ${attempt}/${maxAttempts}: ${lastError} → ` +
        (willRetry
          ? `retrying in ${waitMs} ms`
          : retryable
            ? 'no attempts left'
            : 'not retrying (permanent client error)')
    );
    if (!willRetry) break;
    if (waitMs > 0) await new Promise((r) => setTimeout(r, waitMs));
  }

  if (!response) {
    // Surface as a GitHub Actions annotation so the cause is visible without opening raw logs.
    if (process.env.GITHUB_ACTIONS === 'true') {
      console.log(`::warning title=ForSaleDNS fetch failed::${lastError.replace(/[\r\n]+/g, ' ')}`);
    }
    return { data: null, changed: false, logs, error: lastError };
  }

  let rawJson;
  try {
    rawJson = await response.json();
  } catch (err) {
    logs.push(`✗ Failed to parse JSON response: ${err.message}`);
    return { data: null, changed: false, logs };
  }

  let cleanedEntries;
  try {
    cleanedEntries = processForSaleDnsEntries(rawJson);
  } catch (err) {
    logs.push(`✗ Validation error: ${err.message}`);
    return { data: null, changed: false, logs };
  }

  // Read existing file if present
  let existingEntries = [];
  if (fs.existsSync(FORSALEDNS_FILE)) {
    try {
      existingEntries = JSON.parse(fs.readFileSync(FORSALEDNS_FILE, 'utf-8'));
    } catch {
      existingEntries = [];
    }
  }

  const existingJson = JSON.stringify(existingEntries);
  const newJson = JSON.stringify(cleanedEntries);
  const changed = existingJson !== newJson;

  logs.push(`✓ Processed ${cleanedEntries.length} daily entries (${cleanedEntries[0].date} to ${cleanedEntries[cleanedEntries.length - 1].date}).`);
  if (changed) {
    logs.push(`✓ Changes detected compared to existing file.`);
  } else {
    logs.push(`ℹ Data is identical to local snapshot. No changes needed.`);
  }

  return {
    data: cleanedEntries,
    changed,
    logs,
  };
}

/**
 * CLI runner
 */
async function main() {
  console.log('=== ForSaleDNS RFC 10023 Adoption Importer ===');
  console.log(`Time: ${new Date().toISOString()}`);

  const result = await updateForSaleDnsHistory();
  result.logs.forEach((log) => console.log(log));

  let currentAdoption = {};
  if (fs.existsSync(CURRENT_FILE)) {
    try {
      currentAdoption = JSON.parse(fs.readFileSync(CURRENT_FILE, 'utf-8'));
    } catch {
      currentAdoption = {};
    }
  }

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
    result.data,
    new Date().toISOString()
  );

  if (updateOutcome.status !== 'fetch-failed') {
    if (updateOutcome.historyChanged) {
      fs.writeFileSync(FORSALEDNS_FILE, JSON.stringify(updateOutcome.history, null, 2) + '\n', 'utf-8');
      console.log(`✓ Wrote ${result.data.length} records to ${FORSALEDNS_FILE}`);
    } else {
      console.log('ℹ Historical data points are up to date.');
    }
    currentAdoption.forSaleDns = updateOutcome.meta;
    fs.writeFileSync(CURRENT_FILE, JSON.stringify(currentAdoption, null, 2) + '\n', 'utf-8');
    console.log(`✓ Updated ForSaleDNS metadata (Snapshot: ${updateOutcome.meta.latestSnapshotDate}, Fetch: ${updateOutcome.meta.lastSuccessfulFetch}, Status: ${updateOutcome.status}).`);
  } else {
    console.warn('⚠ Could not retrieve data. Existing file and fetch timestamp retained unchanged.');
  }

  console.log('=== Finished ===');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((err) => {
    console.error('Fatal error in import-forsaledns-history:', err);
    process.exit(1);
  });
}
