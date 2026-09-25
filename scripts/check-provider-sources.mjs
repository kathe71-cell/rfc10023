#!/usr/bin/env node

/**
 * Audit script for RFC 10023 Provider Compatibility Sources (DE & EN).
 *
 * Verifies that all provider documentation/source URLs are reachable
 * and do NOT return soft-404 error pages or invalid redirects.
 * Read-only: Does NOT mutate any data files or statuses.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath = resolve(__dirname, '../data/provider-compatibility.json');

const providers = JSON.parse(readFileSync(dataPath, 'utf-8'));

console.log(`Auditing provider compatibility sources (DE & EN) across ${providers.length} providers...\n`);

let totalChecked = 0;
let failedCount = 0;

async function checkUrl(name, lang, url) {
  totalChecked++;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const status = res.status;
    const ok = status >= 200 && status < 400;

    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ') : 'NO TITLE';

    // Detect soft 404s (e.g. HTTP 200 with title "404 - ...")
    const isSoft404 = /^(404|not found|page not found)/i.test(title) || /<link[^>]*canonical[^>]*\/404/i.test(html);

    if (ok && !isSoft404) {
      console.log(`[PASS] ${name} ${lang}: ${status} | "${title.slice(0, 36)}"`);
    } else {
      const reason = isSoft404 ? `SOFT-404 ("${title}")` : `HTTP ${status}`;
      console.error(`[FAIL] ${name} ${lang}: ${reason} | ${url}`);
      failedCount++;
    }
  } catch (err) {
    console.error(`[ERR ] ${name} ${lang}: ${err.message} | ${url}`);
    failedCount++;
  }
}

for (const provider of providers) {
  const { name, sourceUrl, sourceUrlEn } = provider;
  
  // Check German sourceUrl
  await checkUrl(name, 'DE', sourceUrl);

  // Check English sourceUrlEn if present
  if (sourceUrlEn) {
    await checkUrl(name, 'EN', sourceUrlEn);
  } else {
    console.log(`[INFO] ${name} EN: (Fallback to DE: ${sourceUrl})`);
  }
}

console.log(`\nAudit complete: ${totalChecked - failedCount}/${totalChecked} checked URLs valid & reachable.`);
if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
