import { describe, it, expect } from 'vitest';
import {
  prepareAdoptionChartData,
  ForSaleDnsPointData,
} from '../src/utils/chartScaling';

describe('Adoption Chart Dual Time Series Regression Tests', () => {
  // Mock dataset where ForSaleDNS ends on 2026-10-10 (388.161)
  // and Domains Monitor already has data for 2026-10-11 (1.413.797).
  const mockForSaleUntilOct10: ForSaleDnsPointData[] = [
    {
      date: '2026-10-08',
      activeListings: 378438,
      conformant: 199090,
      priced: 121460,
      dnssec: 162596,
      inventoryCompleted: 343818996,
      inventoryTotal: 343818996,
      baselineComplete: false,
      sweepComplete: true,
    },
    {
      date: '2026-10-09',
      activeListings: 384547,
      conformant: 204407,
      priced: 126491,
      dnssec: 162696,
      inventoryCompleted: 343818996,
      inventoryTotal: 343818996,
      baselineComplete: false,
      sweepComplete: true,
    },
    {
      date: '2026-10-10',
      activeListings: 388161,
      conformant: 207568,
      priced: 129564,
      dnssec: 162740,
      inventoryCompleted: 343818996,
      inventoryTotal: 343818996,
      baselineComplete: false,
      sweepComplete: true,
    },
  ];

  const mockDmUntilOct11 = [
    { date: '2026-10-08', source: 'domainsMonitor', value: 1324387 },
    { date: '2026-10-09', source: 'domainsMonitor', value: 1325045 },
    { date: '2026-10-10', source: 'domainsMonitor', value: 1412678 },
    { date: '2026-10-11', source: 'domainsMonitor', value: 1413797 },
  ];

  it('REGRESSION TEST: Domains Monitor point on 11.10 is rendered when ForSaleDNS ends at 10.10', () => {
    const result = prepareAdoptionChartData(mockForSaleUntilOct10, mockDmUntilOct11, {
      svgWidth: 720,
      svgHeight: 200,
      paddingX: 55,
      paddingY: 25,
    });

    // 1. Common X-axis must span until the latest date of either series (2026-10-11)
    expect(result.chartDates).toEqual([
      '2026-10-08',
      '2026-10-09',
      '2026-10-10',
      '2026-10-11',
    ]);
    expect(result.latestChartDate).toBe('2026-10-11');
    expect(result.isDmExtendingPastForSale).toBe(true);

    // 2. Domains Monitor must have all 4 points, including 2026-10-11
    expect(result.dmOverlayPoints).toHaveLength(4);
    const dmOct11 = result.dmOverlayPoints.find((p) => p.date === '2026-10-11');
    expect(dmOct11).toBeDefined();
    expect(dmOct11!.value).toBe(1413797);
    // At the very right edge of the chart (idx = 3 / 3 -> paddingX + usableWidth = 720 - 55 = 665)
    expect(dmOct11!.x).toBe(665);

    // 3. ForSaleDNS must NOT contain any artificial 11.10 point (no fake zeros, no projections)
    expect(result.fsAllPoints).toHaveLength(3);
    const fsOct11 = result.fsAllPoints.find((p) => p.date === '2026-10-11');
    expect(fsOct11).toBeUndefined();

    // 4. ForSaleDNS ends cleanly at 2026-10-10
    const lastFsPoint = result.fsAllPoints[result.fsAllPoints.length - 1];
    expect(lastFsPoint.date).toBe('2026-10-10');
    expect(lastFsPoint.activeListings).toBe(388161);
    // Its X-coordinate corresponds strictly to index 2 / 3 -> 55 + (2/3) * 610 = 461.7
    expect(lastFsPoint.x).toBeLessThan(665);
    expect(lastFsPoint.x).toBeCloseTo(461.7, 0);

    // 5. Y-scale encapsulates both series without clipping
    expect(result.scale.maxObserved).toBe(1413797);
    expect(result.scale.minObserved).toBe(378438);
    expect(result.scale.maxY).toBeGreaterThan(1413797);
    expect(result.scale.minY).toBeLessThan(378438);

    // 6. Polylines
    expect(result.dmOverlayLine).toContain('665'); // Reaches the right edge
    expect(result.fsCompletePointsString).not.toContain('665'); // Ends before the right edge
  });

  it('handles reverse situation where ForSaleDNS is newer than Domains Monitor without clipping', () => {
    const fsNewer: ForSaleDnsPointData[] = [
      ...mockForSaleUntilOct10,
      {
        date: '2026-10-11',
        activeListings: 409435,
        conformant: 227496,
        priced: 146704,
        dnssec: 163084,
        inventoryCompleted: 343818996,
        inventoryTotal: 343818996,
        baselineComplete: false,
        sweepComplete: true,
      },
    ];
    const dmOlder = mockDmUntilOct11.slice(0, 3); // only until 2026-10-10

    const result = prepareAdoptionChartData(fsNewer, dmOlder);

    expect(result.chartDates).toEqual(['2026-10-08', '2026-10-09', '2026-10-10', '2026-10-11']);
    expect(result.isDmExtendingPastForSale).toBe(false);
    expect(result.fsAllPoints).toHaveLength(4);
    expect(result.fsAllPoints[3].date).toBe('2026-10-11');
    expect(result.fsAllPoints[3].x).toBe(665);

    expect(result.dmOverlayPoints).toHaveLength(3);
    expect(result.dmOverlayPoints.find((p) => p.date === '2026-10-11')).toBeUndefined();
    expect(result.dmOverlayPoints[2].date).toBe('2026-10-10');
  });

  it('handles identical dates on both series with synchronized end point', () => {
    const fsBoth: ForSaleDnsPointData[] = [
      ...mockForSaleUntilOct10,
      {
        date: '2026-10-11',
        activeListings: 409435,
        conformant: 227496,
        priced: 146704,
        dnssec: 163084,
        inventoryCompleted: 343818996,
        inventoryTotal: 343818996,
        baselineComplete: false,
        sweepComplete: true,
      },
    ];

    const result = prepareAdoptionChartData(fsBoth, mockDmUntilOct11);

    expect(result.chartDates[result.chartDates.length - 1]).toBe('2026-10-11');
    expect(result.isDmExtendingPastForSale).toBe(false);
    expect(result.fsAllPoints[result.fsAllPoints.length - 1].x).toBe(665);
    expect(result.dmOverlayPoints[result.dmOverlayPoints.length - 1].x).toBe(665);
  });

  it('SSG Pre-Rendering Integrity: dist/oekosystem/index.html includes 11.10 on the chart', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const htmlPath = path.resolve(process.cwd(), 'dist/oekosystem/index.html');
    if (!fs.existsSync(htmlPath)) return; // Skip if dist not yet generated

    const html = fs.readFileSync(htmlPath, 'utf-8');
    // Chart SVG must contain the unified X-axis date label for 11.10.
    expect(html).toContain('11.10.');
    // Must contain both KPI counts
    expect(html).toContain('1.413.797');
  });
});
