import { describe, it, expect } from 'vitest';
import {
  processAdoptionUpdate,
  validatePlausibility,
  recordHistoryEntry,
} from '../../scripts/update-adoption.mjs';

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
    expect(result.history[1]).toEqual({
      date: '2026-09-24',
      source: 'testFeed',
      value: 105000,
    });
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
});
