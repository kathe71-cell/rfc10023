#!/usr/bin/env node

/**
 * Audit script for RFC 10023 Provider Compatibility Sources.
 *
 * Verifies that all provider documentation/source URLs are reachable.
 * Read-only: Does NOT mutate any data files or statuses.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '../data/provider-compatibility.json');

const providers = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log(`Auditing ${providers.length} provider compatibility sources...\n`);

let failedCount = 0;

for (const provider of providers) {
  const { id, name, sourceUrl, lastVerified } = provider;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(sourceUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RFC10023-Audit/1.0; +https://www.rfc10023.de)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const status = res.status;
    const ok = status >= 200 && status < 400;

    if (ok) {
      console.log(`[PASS] ${name.padEnd(26)} HTTP ${status} | Verified: ${lastVerified} | ${sourceUrl}`);
    } else {
      console.error(`[FAIL] ${name.padEnd(26)} HTTP ${status} | ${sourceUrl}`);
      failedCount++;
    }
  } catch (err) {
    console.error(`[ERR ] ${name.padEnd(26)} ${err.message} | ${sourceUrl}`);
    failedCount++;
  }
}

console.log(`\nAudit complete: ${providers.length - failedCount}/${providers.length} sources reachable.`);
if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
