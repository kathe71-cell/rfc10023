import { describe, it, expect } from 'vitest';
import {
  prepareAdoptionChartData,
  formatYAxisCompact,
  ChartSeriesKey,
} from '../src/utils/chartScaling';
import { ADOPTION_HISTORY, ADOPTION_HISTORY_FORSALEDNS } from '../src/data/ecosystem';

describe('GSC Modernization Regression Tests', () => {
  const fsPoints = ADOPTION_HISTORY_FORSALEDNS;
  const dmPoints = ADOPTION_HISTORY.filter((p) => p.date >= '2026-10-03');

  describe('Series Toggle & Dynamic Y-Scale', () => {
    it('scales solely to ForSaleDNS when only forSale series is active', () => {
      const activeSeries = new Set<ChartSeriesKey>(['forSale']);
      const data = prepareAdoptionChartData(fsPoints, dmPoints, { activeSeries });

      const fsMax = Math.max(...fsPoints.map((p) => p.activeListings));
      const fsMin = Math.min(...fsPoints.map((p) => p.activeListings));

      // Scale maxY must accommodate fsMax but not jump to Domains Monitor scale (which is ~1.5M+)
      expect(data.scale.maxY).toBeGreaterThanOrEqual(fsMax);
      expect(data.scale.maxY).toBeLessThan(1000000);
      expect(data.scale.minY).toBeLessThanOrEqual(fsMin);
      expect(data.fsCompletePointsString).not.toBe('');
    });

    it('scales solely to Domains Monitor when only domainsMonitor series is active', () => {
      const activeSeries = new Set<ChartSeriesKey>(['domainsMonitor']);
      const data = prepareAdoptionChartData(fsPoints, dmPoints, { activeSeries });

      const dmMax = Math.max(...dmPoints.map((p) => p.value));
      const dmMin = Math.min(...dmPoints.map((p) => p.value));

      expect(data.scale.maxY).toBeGreaterThanOrEqual(dmMax);
      expect(data.scale.minY).toBeLessThanOrEqual(dmMin);
      expect(data.dmOverlayLine).not.toBe('');
    });

    it('scales jointly when both forSale and domainsMonitor are active', () => {
      const activeSeries = new Set<ChartSeriesKey>(['forSale', 'domainsMonitor']);
      const data = prepareAdoptionChartData(fsPoints, dmPoints, { activeSeries });

      const dmMax = Math.max(...dmPoints.map((p) => p.value));
      const fsMin = Math.min(...fsPoints.map((p) => p.activeListings));

      expect(data.scale.maxY).toBeGreaterThanOrEqual(dmMax);
      expect(data.scale.minY).toBeLessThanOrEqual(fsMin);
    });

    it('scales strictly to secondary metric conformant or priced when active', () => {
      const activeSeries = new Set<ChartSeriesKey>(['priced']);
      const data = prepareAdoptionChartData(fsPoints, dmPoints, { activeSeries });

      const pricedMax = Math.max(...fsPoints.map((p) => p.priced));
      expect(data.scale.maxY).toBeGreaterThanOrEqual(pricedMax);
      expect(data.scale.maxY).toBeLessThan(600000); // Much smaller than full activeListings or DM (~1.5M+)
      expect(data.fsPricedPointsString).not.toBe('');
    });
  });

  describe('Compact Y-Axis Formatting (formatYAxisCompact)', () => {
    it('formats thousands in DE and EN correctly', () => {
      expect(formatYAxisCompact(250000, false)).toBe('250k');
      expect(formatYAxisCompact(250000, true)).toBe('250k');
      expect(formatYAxisCompact(50000, false)).toBe('50k');
    });

    it('formats millions with proper comma / period localization', () => {
      expect(formatYAxisCompact(1000000, false)).toBe('1,0 Mio.');
      expect(formatYAxisCompact(1500000, false)).toBe('1,5 Mio.');
      expect(formatYAxisCompact(1000000, true)).toBe('1.0M');
      expect(formatYAxisCompact(1500000, true)).toBe('1.5M');
    });

    it('formats small values as integers', () => {
      expect(formatYAxisCompact(500, false)).toBe('500');
      expect(formatYAxisCompact(0, false)).toBe('0');
    });
  });

  describe('Time Range Filtering & True Calendar Points', () => {
    it('slices cleanly to 7 days without creating artificial data points', () => {
      const last7 = fsPoints.slice(-7);
      expect(last7.length).toBe(7);

      const activeSeries = new Set<ChartSeriesKey>(['forSale']);
      const data = prepareAdoptionChartData(last7, dmPoints, { activeSeries });

      expect(data.chartDates.length).toBeGreaterThanOrEqual(7);
      expect(data.fsAllPoints.length).toBe(7);
    });

    it('slices cleanly to 28 days without data corruption', () => {
      const last28 = fsPoints.slice(-28);
      expect(last28.length).toBe(28);

      const activeSeries = new Set<ChartSeriesKey>(['forSale']);
      const data = prepareAdoptionChartData(last28, dmPoints, { activeSeries });

      expect(data.fsAllPoints.length).toBe(28);
    });

    it('preserves natural timeline when one series terminates earlier without carry-forward or fake 0', () => {
      const data = prepareAdoptionChartData(fsPoints, dmPoints);
      // Both lines exist independently
      expect(data.fsAllPoints.length).toBe(fsPoints.length);
      expect(data.dmOverlayPoints.length).toBe(dmPoints.length);

      // Verify no point has activeListings = 0 or synthetic carry-forward
      data.fsAllPoints.forEach((pt) => {
        expect(pt.activeListings).toBeGreaterThan(0);
      });
      data.dmOverlayPoints.forEach((pt) => {
        expect(pt.value).toBeGreaterThan(0);
      });
    });
  });
});
