import { describe, it, expect } from 'vitest';
import {
  computePointDetails,
  ForSaleDnsPointData,
} from '../src/utils/chartScaling';
import { ADOPTION_HISTORY_FORSALEDNS } from '../src/data/ecosystem';

describe('Interactive Chart Telemetry Engine (computePointDetails)', () => {
  it('correctly handles the very first observation (index 0) without predecessor', () => {
    const pt0 = ADOPTION_HISTORY_FORSALEDNS[0];
    const detailsDe = computePointDetails(pt0, null, false);
    const detailsEn = computePointDetails(pt0, null, true);

    expect(detailsDe.delta).toBeNull();
    expect(detailsDe.deltaPct).toBeNull();
    expect(detailsDe.deltaFormatted).toBe('Erster Messpunkt');
    expect(detailsDe.deltaVsPreviousLabel).toBe('Erster Messpunkt im Datensatz');
    expect(detailsDe.sweepComplete).toBe(false);
    expect(detailsDe.sweepLabel).toContain('Teilscan');
    expect(detailsDe.sweepLabel).toContain('72,2 %');
    expect(detailsDe.formattedDate).toBe('15.08.2026');
    expect(detailsDe.ariaLabel).toContain('Erster Messpunkt');

    expect(detailsEn.deltaFormatted).toBe('First observation');
    expect(detailsEn.deltaVsPreviousLabel).toBe('First observation in dataset');
    expect(detailsEn.sweepLabel).toContain('Partial scan');
    expect(detailsEn.formattedDate).toBe('15 Aug 2026');
    expect(detailsEn.ariaLabel).toContain('First observation');
  });

  it('correctly computes positive delta and percentage on observation point 1', () => {
    const pt0 = ADOPTION_HISTORY_FORSALEDNS[0];
    const pt1 = ADOPTION_HISTORY_FORSALEDNS[1];

    const detailsDe = computePointDetails(pt1, pt0, false);
    const detailsEn = computePointDetails(pt1, pt0, true);

    expect(detailsDe.delta).toBe(28214);
    expect(detailsDe.deltaPct).toBeCloseTo(9.25, 1);
    expect(detailsDe.deltaFormatted).toBe('+28.214 (+9,25 %)');
    expect(detailsDe.deltaVsPreviousLabel).toBe('+28.214 zum vorherigen Messpunkt (+9,25 %)');
    expect(detailsDe.ariaLabel).toContain('plus 28.214 zum vorherigen Messpunkt');

    expect(detailsEn.deltaFormatted).toBe('+28,214 (+9.25%)');
    expect(detailsEn.deltaVsPreviousLabel).toBe('+28,214 vs previous observation (+9.25%)');
    expect(detailsEn.ariaLabel).toContain('plus 28,214 compared to previous observation');
  });

  it('correctly formats negative delta with proper minus symbol and percent', () => {
    const mockPrev: ForSaleDnsPointData = {
      date: '2026-09-24',
      activeListings: 335780,
      conformant: 335769,
      priced: 75200,
      dnssec: 162100,
      inventoryCompleted: 343800000,
      inventoryTotal: 343800000,
      baselineComplete: true,
      sweepComplete: true,
    };
    const mockCurr: ForSaleDnsPointData = {
      date: '2026-09-25',
      activeListings: 334576,
      conformant: 334565,
      priced: 75054,
      dnssec: 161897,
      inventoryCompleted: 343800000,
      inventoryTotal: 343800000,
      baselineComplete: true,
      sweepComplete: true,
    };

    const detailsDe = computePointDetails(mockCurr, mockPrev, false);
    const detailsEn = computePointDetails(mockCurr, mockPrev, true);

    expect(detailsDe.delta).toBe(-1204);
    expect(detailsDe.deltaFormatted).toBe('−1.204 (−0,36 %)');
    expect(detailsDe.deltaVsPreviousLabel).toBe('−1.204 zum vorherigen Messpunkt (−0,36 %)');
    expect(detailsDe.conformantFormatted).toBe('334.565');
    expect(detailsDe.conformantPct).toBe('100,00 %');
    expect(detailsDe.dnssecFormatted).toBe('161.897');
    expect(detailsDe.dnssecPct).toBe('48,4 %');
    expect(detailsDe.pricedFormatted).toBe('75.054');
    expect(detailsDe.pricedPct).toBe('22,4 %');
    expect(detailsDe.sweepLabel).toBe('Vollständiger Sweep · 100 %');

    expect(detailsEn.deltaFormatted).toBe('−1,204 (−0.36%)');
    expect(detailsEn.deltaVsPreviousLabel).toBe('−1,204 vs previous observation (−0.36%)');
    expect(detailsEn.conformantFormatted).toBe('334,565');
    expect(detailsEn.conformantPct).toBe('100.00%');
    expect(detailsEn.dnssecFormatted).toBe('161,897');
    expect(detailsEn.dnssecPct).toBe('48.4%');
    expect(detailsEn.pricedFormatted).toBe('75,054');
    expect(detailsEn.pricedPct).toBe('22.4%');
    expect(detailsEn.sweepLabel).toBe('Full sweep · 100%');
  });

  it('correctly formats zero delta when consecutive active listings are unchanged', () => {
    const mockPoint: ForSaleDnsPointData = {
      date: '2026-09-20',
      activeListings: 335000,
      conformant: 335000,
      priced: 75000,
      dnssec: 160000,
      inventoryCompleted: 343800000,
      inventoryTotal: 343800000,
      baselineComplete: true,
      sweepComplete: true,
    };

    const detailsDe = computePointDetails(mockPoint, mockPoint, false);
    const detailsEn = computePointDetails(mockPoint, mockPoint, true);

    expect(detailsDe.delta).toBe(0);
    expect(detailsDe.deltaFormatted).toBe('0 (0,00 %)');
    expect(detailsDe.deltaVsPreviousLabel).toBe('0 zum vorherigen Messpunkt (0,00 %)');
    expect(detailsDe.ariaLabel).toContain('unverändert');

    expect(detailsEn.deltaFormatted).toBe('0 (0.00%)');
    expect(detailsEn.deltaVsPreviousLabel).toBe('0 vs previous observation (0.00%)');
    expect(detailsEn.ariaLabel).toContain('unchanged');
  });

  it('verifies all 42 entries in ADOPTION_HISTORY_FORSALEDNS have valid computePointDetails', () => {
    for (let i = 0; i < ADOPTION_HISTORY_FORSALEDNS.length; i++) {
      const curr = ADOPTION_HISTORY_FORSALEDNS[i];
      const prev = i > 0 ? ADOPTION_HISTORY_FORSALEDNS[i - 1] : null;

      const detailsDe = computePointDetails(curr, prev, false);
      const detailsEn = computePointDetails(curr, prev, true);

      expect(detailsDe.formattedDate).toBeTruthy();
      expect(detailsDe.formattedActiveListings).toBeTruthy();
      expect(detailsDe.conformantFormatted).toBeTruthy();
      expect(detailsDe.dnssecFormatted).toBeTruthy();
      expect(detailsDe.pricedFormatted).toBeTruthy();
      expect(detailsDe.ariaLabel).toBeTruthy();

      expect(detailsEn.formattedDate).toBeTruthy();
      expect(detailsEn.formattedActiveListings).toBeTruthy();
      expect(detailsEn.conformantFormatted).toBeTruthy();
      expect(detailsEn.dnssecFormatted).toBeTruthy();
      expect(detailsEn.pricedFormatted).toBeTruthy();
      expect(detailsEn.ariaLabel).toBeTruthy();
    }
  });
});
