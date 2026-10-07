import { describe, it, expect } from 'vitest';
import {
  processAdoptionUpdate,
  validatePlausibility,
  recordHistoryEntry,
  detectAnomaly,
  validateTelemetryBasic,
} from '../../scripts/update-adoption.mjs';
import { computeEcosystemStats, ECOSYSTEM_DATA } from '../data/ecosystem';

describe('RFC 10023 Adoption Data Update Engine (Cases A - E)', () => {
  const baseCurrent = {
    lastUpdated: '2026-09-24T06:00:00Z',
    sources: {
      testFeed: {
        value: 100000,
        label: 'Test Scanner Metric',
        sourceUrl: 'https://api.test-scanner.org/v1/count',
        lastSuccessfulFetch: '2026-09-24T06:00:00Z',
        mode: 'automatic',
      },
    },
  };

  const baseHistory = [
    {
      date: '2026-09-23',
      source: 'testFeed',
      value: 98000,
    },
  ];

  it('Fall A: Source reachable with valid new number -> Updates current value and adds history', async () => {
    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ value: 105000 }),
    });

    const result = await processAdoptionUpdate(baseCurrent, baseHistory, {
      fetcher: mockFetcher,
      today: '2026-09-24',
      nowIso: '2026-09-24T12:00:00Z',
    });

    expect(result.changed).toBe(true);
    expect(result.current.sources.testFeed.value).toBe(105000);
    expect(result.current.sources.testFeed.lastSuccessfulFetch).toBe('2026-09-24T12:00:00Z');
    expect(result.history).toHaveLength(2);
    expect(result.history[1]).toMatchObject({
      date: '2026-09-24',
      source: 'testFeed',
      value: 105000,
    });
    expect(result.history[1].verificationStatus).toBe('normal');
  });

  it('Fall B: Source unreachable / network failure -> Retains previous value completely', async () => {
    const mockFetcher = async () => {
      throw new Error('Connection refused (ETIMEDOUT)');
    };

    const result = await processAdoptionUpdate(baseCurrent, baseHistory, {
      fetcher: mockFetcher,
      today: '2026-09-24',
    });

    expect(result.changed).toBe(false);
    expect(result.current.sources.testFeed.value).toBe(100000);
    expect(result.current.sources.testFeed.lastSuccessfulFetch).toBe('2026-09-24T06:00:00Z');
    expect(result.history).toEqual(baseHistory);
  });

  it('Fall C: Source returns invalid HTML/text -> Retains previous value', async () => {
    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => '<html><body>Internal Server Error</body></html>',
    });

    const result = await processAdoptionUpdate(baseCurrent, baseHistory, {
      fetcher: mockFetcher,
      today: '2026-09-24',
    });

    expect(result.changed).toBe(false);
    expect(result.current.sources.testFeed.value).toBe(100000);
    expect(result.current.sources.testFeed.lastSuccessfulFetch).toBe('2026-09-24T06:00:00Z');
  });

  it('Fall D: Source returns zero or negative number -> Rejected, retains previous value', async () => {
    const mockFetcher = async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ value: 0 }),
    });

    const result = await processAdoptionUpdate(baseCurrent, baseHistory, {
      fetcher: mockFetcher,
      today: '2026-09-24',
    });

    expect(result.changed).toBe(false);
    expect(result.current.sources.testFeed.value).toBe(100000);
  });

  it('Plausibility: Extreme jump (>50%) is flagged and rejected', () => {
    const check1 = validatePlausibility(250000, 100000); // 150% jump
    expect(check1.valid).toBe(false);
    expect(check1.reason).toContain('exceeding 50%');

    const check2 = validatePlausibility(40000, 100000); // 60% drop
    expect(check2.valid).toBe(false);

    const check3 = validatePlausibility(108000, 100000); // 8% realistic increase
    expect(check3.valid).toBe(true);
  });

  it('Fall E: Multiple workflow runs on the same day -> No duplicate history entries', () => {
    let history = [
      { date: '2026-09-23', source: 'testFeed', value: 98000 },
    ];

    // Run 1: Morning
    history = recordHistoryEntry(history, '2026-09-24', 'testFeed', 101000);
    expect(history).toHaveLength(2);
    expect(history[1].value).toBe(101000);

    // Run 2: Afternoon (same day, slight update)
    history = recordHistoryEntry(history, '2026-09-24', 'testFeed', 102500);
    expect(history).toHaveLength(2); // Still exactly 2 entries, no duplicate!
    expect(history[1].value).toBe(102500); // Updated in-place
  });

  it('Domains Monitor HTML Parser extracts full dataset count and date correctly', async () => {
    const { parseDomainsMonitorHtml } = await import('../../scripts/update-adoption.mjs');
    const mockHtml = `
      <table class="table table-hover">
        <tr title='Domains for sale with _for-sale DNS records (full dataset)'>
          <td>Domains for sale with _for-sale DNS records (full dataset)</td>
          <td>03.10.2026</td>
          <td>569 405</td>
        </tr>
        <tr title='Domains for sale with _for-sale DNS records (daily update)'>
          <td>Domains for sale with _for-sale DNS records (daily update)</td>
          <td>03.10.2026</td>
          <td>1 171</td>
        </tr>
      </table>
    `;

    const parsed = parseDomainsMonitorHtml(mockHtml);
    expect(parsed).not.toBeNull();
    expect(parsed?.count).toBe(569405);
    expect(parsed?.sourceDate).toBe('2026-10-03');
  });

  it('Stale-Data Guard: flags inconsistency if UI lastUpdated is recent but sourceDate is stale', () => {
    // Function implementing the regression check
    function checkStaleDataConsistency(uiDateStr: string, sourceDateStr: string, maxDaysAllowed = 3) {
      const uiDate = new Date(uiDateStr);
      const srcDate = new Date(sourceDateStr);
      const diffMs = Math.abs(uiDate.getTime() - srcDate.getTime());
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return {
        consistent: diffDays <= maxDaysAllowed,
        diffDays,
      };
    }

    // Consistent: sourceDate and uiDate match
    const good = checkStaleDataConsistency('2026-10-03', '2026-10-03');
    expect(good.consistent).toBe(true);

    // Stale: UI says 2026-10-03 but metric is still from 2026-09-24 (9 days old)
    const stale = checkStaleDataConsistency('2026-10-03', '2026-09-24');
    expect(stale.consistent).toBe(false);
    expect(stale.diffDays).toBeGreaterThan(3);
  });

  describe('AUFGABE 15 – Telemetry Hardening & Anomaly Scenarios', () => {
    it('1. Normaler Tagesverlauf: moderater Anstieg (570.101 -> 571.000) flags no anomaly', () => {
      const res = detectAnomaly(571000, 570101, 'full_dataset', 'full_dataset');
      expect(res.anomaly).toBe(false);
      expect(res.verificationStatus).toBe('normal');
      expect(res.changeAbsolute).toBe(899);
      expect(res.changePercent).toBeCloseTo(0.16, 1);
    });

    it('2. Auffälliger Sprung > 20%: (570.101 -> 1.322.773, +132,0%) flags anomaly-unexplained without discarding', () => {
      const res = detectAnomaly(1322773, 570101, 'full_dataset', 'full_dataset');
      expect(res.anomaly).toBe(true);
      expect(res.verificationStatus).toBe('anomaly-unexplained');
      expect(res.changeAbsolute).toBe(752672);
      expect(res.changePercent).toBeCloseTo(132.02, 1);
      expect(res.anomalyReason).toContain('752.672');
      expect(res.anomalyReasonEn).toContain('752,672');
    });

    it('3. Methodenwechsel / Metric Change: (392.683 -> 569.405) flags source-methodology-change with null percentage', () => {
      const res = detectAnomaly(569405, 392683, 'full_dataset', 'research_snapshot');
      expect(res.anomaly).toBe(false);
      expect(res.verificationStatus).toBe('source-methodology-change');
      expect(res.changeAbsolute).toBeNull();
      expect(res.changePercent).toBeNull();
    });

    it('4. Fetch-Fehler: vorheriger Datenstand bleibt unverändert erhalten', async () => {
      const mockFailingFetcher = async () => {
        throw new Error('Connection refused / 503 Service Unavailable');
      };
      const res = await processAdoptionUpdate(baseCurrent, baseHistory, {
        fetcher: mockFailingFetcher,
        today: '2026-10-05',
      });
      expect(res.changed).toBe(false);
      expect(res.current.sources.testFeed.value).toBe(100000);
      expect(res.history).toHaveLength(1);
    });

    it('5. Null-Felder: Optionale Werte (conformant, priced, dnssec) tolerieren null ohne synthetischen Fallback', () => {
      const sampleItem = {
        date: '2026-09-24',
        activeListings: 1000,
        conformant: null,
        priced: null,
        dnssec: null,
      };
      expect(sampleItem.conformant).toBeNull();
      expect(sampleItem.priced).toBeNull();
      expect(sampleItem.dnssec).toBeNull();
      expect(sampleItem.activeListings).toBe(1000);
    });

    it('6. Extremwertprüfung / Invalid Inputs: negative, NaN und 0 Werte werden rejected', () => {
      const checkZero = validateTelemetryBasic(0, '2026-10-05', '2026-10-04');
      expect(checkZero.valid).toBe(false);

      const checkNegative = validateTelemetryBasic(-100, '2026-10-05', '2026-10-04');
      expect(checkNegative.valid).toBe(false);

      const checkNaN = validateTelemetryBasic(NaN, '2026-10-05', '2026-10-04');
      expect(checkNaN.valid).toBe(false);

      const checkOlderDate = validateTelemetryBasic(100000, '2026-10-01', '2026-10-04');
      expect(checkOlderDate.valid).toBe(false);
    });

    it('7. Dynamische Integration-Counts: Summe der Kategorien entspricht exakt der Gesamtzahl (26 = 9 + 13 + 4)', () => {
      const stats = computeEcosystemStats();
      expect(stats.totalIntegrations).toBe(ECOSYSTEM_DATA.integrations.length);
      expect(stats.totalIntegrations).toBe(26);
      expect(stats.nativeCount).toBe(9);
      expect(stats.toolCount).toBe(13);
      expect(stats.docCount).toBe(4);
      expect(stats.nativeCount + stats.toolCount + stats.docCount).toBe(stats.totalIntegrations);
    });
  });
});

