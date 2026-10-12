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
    // Must contain current KPI count
    const currentDm = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data/adoption-current.json'), 'utf-8')).sources.domainsMonitor;
    expect(html).toContain(currentDm.value.toLocaleString('de-DE'));
  });
});

describe('Adoption Chart Curated Event & Milestone Markers', () => {
  const mockForSale: ForSaleDnsPointData[] = [
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

  const mockDm = [
    { date: '2026-10-08', source: 'domainsMonitor', value: 1324387 },
    { date: '2026-10-09', source: 'domainsMonitor', value: 1325045 },
    { date: '2026-10-10', source: 'domainsMonitor', value: 1412678 },
  ];

  const mockTimeline = [
    {
      date: '2026-10-09',
      title: 'Plattform-Integration',
      titleEn: 'Platform Integration',
      category: 'Aftermarket',
      description: 'Test Beschreibung DE',
      descriptionEn: 'Test description EN',
      sourceUrl: 'https://example.com/integration',
      showOnAdoptionChart: true,
    },
    {
      date: '2026-10-10',
      title: 'Außergewöhnlicher Anstieg im Domains-Monitor-Datensatz',
      titleEn: 'Unusual increase in the Domains Monitor dataset',
      category: 'Telemetry',
      description: '+87.633 erkannte Domains gegenüber dem vorherigen Messpunkt. Die Ursache ist derzeit nicht eindeutig belegt.',
      descriptionEn: '+87,633 detected domains versus the previous observation. The cause has not been conclusively established.',
      sourceUrl: 'https://domains-monitor.com/for-sale-domains/',
      showOnAdoptionChart: true,
    },
    {
      date: '2026-10-08',
      title: 'Unmarkierter Eintrag',
      titleEn: 'Unmarked Entry',
      category: 'Documentation',
      description: 'Sollte nicht im Chart erscheinen',
      descriptionEn: 'Should not appear in chart',
      sourceUrl: 'https://example.com',
      // showOnAdoptionChart is omitted/false
    },
    {
      date: '2026-07-30',
      title: 'Früheres Ereignis vor Messbereich',
      titleEn: 'Early Event before chart range',
      category: 'RFC',
      description: 'Liegt vor 2026-10-08',
      descriptionEn: 'Precedes 2026-10-08',
      sourceUrl: 'https://example.com/rfc',
      showOnAdoptionChart: true,
    },
  ];

  it('filters events: only events with showOnAdoptionChart=true within visible range appear', () => {
    const result = prepareAdoptionChartData(mockForSale, mockDm, {
      svgWidth: 720,
      svgHeight: 200,
      paddingX: 55,
      paddingY: 25,
      timelineEvents: mockTimeline,
    });

    // Out of 4 events:
    // - 2026-10-09: has flag, in range -> APPARENT
    // - 2026-10-10: has flag, in range -> APPARENT
    // - 2026-10-08: NO flag -> EXCLUDED
    // - 2026-07-30: has flag, OUT OF RANGE (< 2026-10-08) -> EXCLUDED
    expect(result.chartEvents).toHaveLength(2);
    expect(result.chartEvents.map((e) => e.date)).toEqual(['2026-10-09', '2026-10-10']);
  });

  it('calculates correct X-position for event markers aligning with date axis', () => {
    const result = prepareAdoptionChartData(mockForSale, mockDm, {
      svgWidth: 720,
      svgHeight: 200,
      paddingX: 55,
      paddingY: 25,
      timelineEvents: mockTimeline,
    });

    // 3 dates: [2026-10-08, 2026-10-09, 2026-10-10]
    // usableWidth = 720 - 110 = 610
    // totalDateSpan = 2
    // 2026-10-09 has dateIdx = 1 -> x = 55 + (1/2)*610 = 360
    // 2026-10-10 has dateIdx = 2 -> x = 55 + (2/2)*610 = 665
    const evt1009 = result.chartEvents.find((e) => e.date === '2026-10-09')!;
    const evt1010 = result.chartEvents.find((e) => e.date === '2026-10-10')!;

    expect(evt1009.x).toBe(360);
    expect(evt1010.x).toBe(665);

    // Event on 2026-10-10 has exact same X-coordinate as telemetry point on 2026-10-10
    const fsOct10 = result.fsAllPoints.find((p) => p.date === '2026-10-10')!;
    const dmOct10 = result.dmOverlayPoints.find((p) => p.date === '2026-10-10')!;
    expect(evt1010.x).toBe(fsOct10.x);
    expect(evt1010.x).toBe(dmOct10.x);
  });

  it('event markers DO NOT alter Y-scaling or observed min/max values', () => {
    const withoutEvents = prepareAdoptionChartData(mockForSale, mockDm);
    const withEvents = prepareAdoptionChartData(mockForSale, mockDm, {
      timelineEvents: mockTimeline,
    });

    expect(withEvents.scale.minObserved).toBe(withoutEvents.scale.minObserved);
    expect(withEvents.scale.maxObserved).toBe(withoutEvents.scale.maxObserved);
    expect(withEvents.scale.minY).toBe(withoutEvents.scale.minY);
    expect(withEvents.scale.maxY).toBe(withoutEvents.scale.maxY);
    expect(withEvents.scale.gridLines).toEqual(withoutEvents.scale.gridLines);
  });

  it('event markers DO NOT alter telemetry time series or add synthetic points', () => {
    const withoutEvents = prepareAdoptionChartData(mockForSale, mockDm);
    const withEvents = prepareAdoptionChartData(mockForSale, mockDm, {
      timelineEvents: mockTimeline,
    });

    expect(withEvents.fsAllPoints).toEqual(withoutEvents.fsAllPoints);
    expect(withEvents.dmOverlayPoints).toEqual(withoutEvents.dmOverlayPoints);
    expect(withEvents.chartDates).toEqual(withoutEvents.chartDates);
    expect(withEvents.fsCompletePointsString).toBe(withoutEvents.fsCompletePointsString);
    expect(withEvents.dmOverlayLine).toBe(withoutEvents.dmOverlayLine);
  });

  it('verifies real data/timeline.json contains required curated entries with exact texts', async () => {
    const timelineData = (await import('../data/timeline.json')).default;

    // Must have RFC 10023 publication flagged
    const rfcEntry = timelineData.find((e: any) => e.date === '2026-07-30');
    expect(rfcEntry).toBeDefined();
    expect(rfcEntry.showOnAdoptionChart).toBe(true);

    // Must have ELITEDOMAINS flagged
    const eliteEntry = timelineData.find((e: any) => e.date === '2026-09-11');
    expect(eliteEntry).toBeDefined();
    expect(eliteEntry.showOnAdoptionChart).toBe(true);

    // Must have Atom rollout flagged
    const atomEntry = timelineData.find((e: any) => e.date === '2026-09-25');
    expect(atomEntry).toBeDefined();
    expect(atomEntry.showOnAdoptionChart).toBe(true);

    // Must have 10.10. curated telemetry jump entry with exact required strings
    const oct10Entry = timelineData.find((e: any) => e.date === '2026-10-10');
    expect(oct10Entry).toBeDefined();
    expect(oct10Entry.showOnAdoptionChart).toBe(true);
    expect(oct10Entry.title).toBe('Außergewöhnlicher Anstieg im Domains-Monitor-Datensatz');
    expect(oct10Entry.titleEn).toBe('Unusual increase in the Domains Monitor dataset');
    expect(oct10Entry.description).toBe(
      '+87.633 erkannte Domains gegenüber dem vorherigen Messpunkt. Die Ursache ist derzeit nicht eindeutig belegt.'
    );
    expect(oct10Entry.descriptionEn).toBe(
      '+87,633 detected domains versus the previous observation. The cause has not been conclusively established.'
    );
    expect(oct10Entry.category).toBe('Telemetry');
    expect(oct10Entry.sourceUrl).toBe('https://domains-monitor.com/for-sale-domains/');
  });

  it('integrates with real production data: exactly 3 curated markers in visible range', async () => {
    const fsData = (await import('../data/adoption-history-forsaledns.json')).default;
    const dmData = (await import('../data/adoption-history.json')).default;
    const timelineData = (await import('../data/timeline.json')).default;

    const result = prepareAdoptionChartData(fsData, dmData, {
      timelineEvents: timelineData,
    });

    // In the visible timeframe (2026-08-15 to current):
    // 3 markers: ELITEDOMAINS (2026-09-11), Atom (2026-09-25), Domains Monitor jump (2026-10-10)
    expect(result.chartEvents).toHaveLength(3);
    expect(result.chartEvents.map((e) => e.date)).toEqual([
      '2026-09-11',
      '2026-09-25',
      '2026-10-10',
    ]);
  });
});
