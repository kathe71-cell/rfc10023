import { describe, it, expect } from 'vitest';
import {
  updateForSaleDnsHistory,
  applyForSaleDnsUpdate,
  processForSaleDnsEntries,
  parseRetryAfter,
} from '../scripts/import-forsaledns-history.mjs';
import { processAdoptionUpdate } from '../scripts/update-adoption.mjs';

// Realistic payload: field set and values exactly as returned by
// https://forsaledns.net/api/v1/adoption-history on 2026-10-06 (17:13 UTC).
const API_2026_10_05 = {
  day: '2026-10-05',
  observedAt: '2026-10-05T23:51:09.132296752Z',
  active: 346658,
  everObserved: 374962,
  currentlyRemoved: 28304,
  conformant: 167615,
  priced: 92822,
  dnssec: 162118,
  withContact: 239685,
  new24Hours: 6203,
  changed24Hours: 7926,
  removed24Hours: 262,
  relisted24Hours: 22,
  inventorySnapshot: '8727febddc0c9a91a18a24a9ae884aa24d7d72deb18168b1ac61b4b86b84f78d',
  inventoryCompleted: 343818996,
  inventoryTotal: 343818996,
  baselineComplete: false,
};
const API_2026_10_06 = {
  ...API_2026_10_05,
  day: '2026-10-06',
  observedAt: '2026-10-06T17:13:10.636819163Z',
  active: 351205,
  everObserved: 379534,
  currentlyRemoved: 28329,
  conformant: 171925,
  priced: 96688,
  dnssec: 162231,
  withContact: 244178,
  new24Hours: 6170,
  changed24Hours: 2323,
  removed24Hours: 111,
  relisted24Hours: 23,
};

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });

const fastOpts = { retryDelayMs: 0, timeoutMs: 1000 };

const sequenceFetcher = (responses: Array<() => Response | Promise<Response>>) => {
  let calls = 0;
  const fetcher = async () => responses[Math.min(calls++, responses.length - 1)]();
  return { fetcher, calls: () => calls };
};

describe('ForSaleDNS HTTP behaviour', () => {
  it('200 → success on first attempt', async () => {
    const f = sequenceFetcher([() => jsonResponse([API_2026_10_05, API_2026_10_06])]);
    const res = await updateForSaleDnsHistory({ fetcher: f.fetcher, ...fastOpts });
    expect(f.calls()).toBe(1);
    expect(res.data).toHaveLength(2);
  });

  it('429 → retry, honouring Retry-After', async () => {
    const f = sequenceFetcher([
      () => new Response('slow down', { status: 429, statusText: 'Too Many Requests', headers: { 'retry-after': '0' } }),
      () => jsonResponse([API_2026_10_06]),
    ]);
    const res = await updateForSaleDnsHistory({ fetcher: f.fetcher, ...fastOpts });
    expect(f.calls()).toBe(2);
    expect(res.data).toHaveLength(1);
    expect(res.logs.join('\n')).toMatch(/Attempt 1\/3: HTTP 429.*retry-after=0.*retrying in 0 ms/);
  });

  it('503 → retry, then success', async () => {
    const f = sequenceFetcher([
      () => new Response('upstream down', { status: 503, statusText: 'Service Unavailable' }),
      () => jsonResponse([API_2026_10_06]),
    ]);
    const res = await updateForSaleDnsHistory({ fetcher: f.fetcher, ...fastOpts });
    expect(f.calls()).toBe(2);
    expect(res.data).toHaveLength(1);
    expect(res.logs.join('\n')).toContain('Attempt 2/3 succeeded');
  });

  it('network error → retried up to maxAttempts, code reported', async () => {
    const f = sequenceFetcher([
      () => {
        throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
      },
    ]);
    const res = await updateForSaleDnsHistory({ fetcher: f.fetcher, maxAttempts: 3, ...fastOpts });
    expect(f.calls()).toBe(3);
    expect(res.data).toBeNull();
    expect(res.error).toContain('code: ECONNRESET');
    expect(res.error).toContain('url=https://forsaledns.net/api/v1/adoption-history');
    expect(res.logs.join('\n')).toContain('Attempt 3/3');
    expect(res.logs.join('\n')).toContain('no attempts left');
  });

  it.each([400, 401, 403, 404])('%i → no retry, diagnostics include status and headers', async (status) => {
    const f = sequenceFetcher([
      () =>
        new Response('<html>Attention Required! | Cloudflare</html>', {
          status,
          statusText: 'Client Error',
          headers: { server: 'cloudflare', 'cf-ray': 'abc123-IAD', 'cf-mitigated': 'challenge' },
        }),
    ]);
    const res = await updateForSaleDnsHistory({ fetcher: f.fetcher, ...fastOpts });
    expect(f.calls()).toBe(1);
    expect(res.data).toBeNull();
    expect(res.error).toContain(`HTTP ${status}`);
    expect(res.error).toContain('server=cloudflare');
    expect(res.error).toContain('cf-ray=abc123-IAD');
    expect(res.error).toContain('cf-mitigated=challenge');
    expect(res.error).toContain('Attention Required');
    expect(res.logs.join('\n')).toContain('not retrying (permanent client error)');
  });

  it('parses Retry-After as seconds and as HTTP date', () => {
    expect(parseRetryAfter('7')).toBe(7000);
    expect(parseRetryAfter('')).toBeNull();
    expect(parseRetryAfter('garbage')).toBeNull();
    const inFuture = new Date(Date.now() + 5000).toUTCString();
    expect(parseRetryAfter(inFuture)).toBeGreaterThan(0);
  });
});

describe('ForSaleDNS field mapping (real API payload)', () => {
  it('maps every used field from the current API structure', () => {
    const [e] = processForSaleDnsEntries([API_2026_10_06]);
    expect(e).toEqual({
      date: '2026-10-06', // day
      activeListings: 351205, // active
      conformant: 171925, // conformant
      priced: 96688, // priced
      dnssec: 162231, // dnssec
      inventoryCompleted: 343818996, // sweep coverage numerator
      inventoryTotal: 343818996, // sweep coverage denominator
      baselineComplete: false, // baselineComplete
      sweepComplete: true, // inventoryCompleted === inventoryTotal
    });
  });

  it('partial sweep is reported as incomplete', () => {
    const [e] = processForSaleDnsEntries([{ ...API_2026_10_06, inventoryCompleted: 248291790 }]);
    expect(e.sweepComplete).toBe(false);
    expect(e.inventoryCompleted).toBe(248291790);
  });

  it('produces no NaN/null values for the real payload', () => {
    const out = processForSaleDnsEntries([API_2026_10_05, API_2026_10_06]);
    for (const e of out) {
      for (const v of Object.values(e)) {
        expect(v).not.toBeNull();
        if (typeof v === 'number') expect(Number.isFinite(v)).toBe(true);
      }
    }
  });
});

describe('ForSaleDNS history upsert', () => {
  const repoState = [
    { date: '2026-10-04', activeListings: 340695 },
    { date: '2026-10-05', activeListings: 344381 }, // intraday value fetched 2026-10-05 14:10 UTC
  ];
  const meta = { latestSnapshotDate: '2026-10-05', lastSuccessfulFetch: '2026-10-05T14:10:54.055Z' };

  it('appends a new day and replaces a later-finalized existing day, without duplicates', () => {
    const fetched = processForSaleDnsEntries([API_2026_10_05, API_2026_10_06]);
    const out = applyForSaleDnsUpdate(meta, repoState, fetched, '2026-10-06T17:30:00Z');
    expect(out.history.map((e) => e.date)).toEqual(['2026-10-04', '2026-10-05', '2026-10-06']);
    expect(out.history[1].activeListings).toBe(346658);
    expect(out.history[2].activeListings).toBe(351205);
    expect(out.status).toBe('success-new-data');
    expect(out.meta).toEqual({ latestSnapshotDate: '2026-10-06', lastSuccessfulFetch: '2026-10-06T17:30:00Z' });
  });

  it('keeps days that the API no longer returns', () => {
    const fetched = processForSaleDnsEntries([API_2026_10_06]);
    const out = applyForSaleDnsUpdate(meta, repoState, fetched, '2026-10-06T17:30:00Z');
    expect(out.history.map((e) => e.date)).toEqual(['2026-10-04', '2026-10-05', '2026-10-06']);
  });

  it('dedupes a day repeated inside one API response (last wins)', () => {
    const out = processForSaleDnsEntries([{ ...API_2026_10_05, active: 344381 }, API_2026_10_05]);
    expect(out).toHaveLength(1);
    expect(out[0].activeListings).toBe(346658);
  });

  it('successful fetch without a new day only updates lastSuccessfulFetch', () => {
    const history = processForSaleDnsEntries([API_2026_10_05, API_2026_10_06]);
    const m = { latestSnapshotDate: '2026-10-06', lastSuccessfulFetch: '2026-10-06T05:17:00Z' };
    const out = applyForSaleDnsUpdate(m, history, processForSaleDnsEntries([API_2026_10_05, API_2026_10_06]), '2026-10-06T09:47:00Z');
    expect(out.status).toBe('success-no-new-data');
    expect(out.historyChanged).toBe(false);
    expect(out.meta).toEqual({ latestSnapshotDate: '2026-10-06', lastSuccessfulFetch: '2026-10-06T09:47:00Z' });
  });

  it('failed fetch changes neither history nor lastSuccessfulFetch', () => {
    const out = applyForSaleDnsUpdate(meta, repoState, null, '2026-10-06T05:17:00Z');
    expect(out.status).toBe('fetch-failed');
    expect(out.meta).toEqual(meta);
    expect(out.history).toBe(repoState);
    expect(out.historyChanged).toBe(false);
  });

  it('snapshot date comes from the API calendar day, not the local clock (UTC/Berlin edge)', () => {
    // 2026-10-06T22:30Z = 07.10. 00:30 MESZ; newest API day is still 2026-10-06.
    const out = applyForSaleDnsUpdate(undefined, [], processForSaleDnsEntries([API_2026_10_06]), '2026-10-06T22:30:00Z');
    expect(out.meta.latestSnapshotDate).toBe('2026-10-06');
  });
});

describe('Domains Monitor stays independent of ForSaleDNS', () => {
  const current = {
    lastUpdated: '2026-10-05T18:51:00Z',
    sources: {
      domainsMonitor: {
        value: 1322773,
        count: 1322773,
        sourceDate: '2026-10-05',
        sourceUrl: 'https://domains-monitor.com/for-sale-domains/',
        lastSuccessfulFetch: '2026-10-05T18:51:00Z',
        mode: 'automatic',
      },
    },
  };
  const history = [{ date: '2026-10-05', source: 'domainsMonitor', value: 1322773 }];
  const html =
    '<table><tr title="Domains for sale with _for-sale DNS records (full dataset)"><td>all</td><td>06.10.2026</td><td>1 323 262</td></tr></table>';

  it('uses the source date (06.10) even when the run happens after midnight UTC', async () => {
    const res = await processAdoptionUpdate(current, history, {
      fetcher: async () => new Response(html, { status: 200 }),
      today: '2026-10-07',
      nowIso: '2026-10-07T00:10:00Z',
    });
    expect(res.history.map((h: { date: string }) => h.date)).toEqual(['2026-10-05', '2026-10-06']);
    expect(res.current.sources.domainsMonitor.sourceDate).toBe('2026-10-06');
  });

  it('a failing Domains Monitor fetch keeps its value and lastSuccessfulFetch', async () => {
    const res = await processAdoptionUpdate(current, history, {
      fetcher: async () => new Response('', { status: 502, statusText: 'Bad Gateway' }),
      today: '2026-10-06',
      nowIso: '2026-10-06T05:17:00Z',
    });
    expect(res.changed).toBe(false);
    expect(res.current.sources.domainsMonitor.lastSuccessfulFetch).toBe('2026-10-05T18:51:00Z');
    expect(res.history).toEqual(history);
  });

  it('re-delivering the same day does not duplicate the history point', async () => {
    const res = await processAdoptionUpdate(
      { ...current, sources: { domainsMonitor: { ...current.sources.domainsMonitor, value: 1323262 } } },
      [...history, { date: '2026-10-06', source: 'domainsMonitor', value: 1323262 }],
      { fetcher: async () => new Response(html, { status: 200 }), today: '2026-10-06', nowIso: '2026-10-06T16:17:00Z' }
    );
    expect(res.history.filter((h: { date: string }) => h.date === '2026-10-06')).toHaveLength(1);
  });
});
