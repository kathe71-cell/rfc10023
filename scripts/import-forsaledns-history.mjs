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

  const latestEntry = fetchedEntries[fetchedEntries.length - 1];
  const newSnapshotDate = latestEntry.date;
  const prevSnapshotDate = currentMeta?.latestSnapshotDate;

  const historyJson = JSON.stringify(existingHistory || []);
  const newHistoryJson = JSON.stringify(fetchedEntries);
  const historyChanged = historyJson !== newHistoryJson;

  const updatedMeta = {
    latestSnapshotDate: newSnapshotDate,
    lastSuccessfulFetch: fetchTimeIso,
  };

  const isNewSnapshot = !prevSnapshotDate || newSnapshotDate !== prevSnapshotDate;

  return {
    meta: updatedMeta,
    history: fetchedEntries,
    historyChanged,
    metaChanged: true,
    status: isNewSnapshot ? 'success-new-data' : 'success-no-new-data',
  };
}

/**
 * Fetches and processes ForSaleDNS adoption history.
 * @param {object} [options]
 * @param {Function} [options.fetcher]
 * @returns {Promise<{ data: Array<object>, changed: boolean, logs: string[] }>}
 */
export async function updateForSaleDnsHistory(options = {}) {
  const fetcher = options.fetcher || globalThis.fetch;
  const logs = [];

  logs.push(`Connecting to ForSaleDNS API: ${FORSALEDNS_API_URL}...`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  let response;
  try {
    response = await fetcher(FORSALEDNS_API_URL, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    logs.push(`✗ Network request failed: ${err.message}`);
    return { data: null, changed: false, logs };
  }
  clearTimeout(timeoutId);

  if (!response.ok) {
    logs.push(`✗ HTTP Error ${response.status} ${response.statusText}`);
    return { data: null, changed: false, logs };
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
