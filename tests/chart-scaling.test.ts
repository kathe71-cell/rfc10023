import { describe, it, expect } from 'vitest';
import {
  computeDynamicYScale,
  calculateSvgY,
} from '../src/utils/chartScaling';

describe('Dynamic Y-Scale Engine Tests (Cases A - F)', () => {
  const svgHeight = 200;
  const paddingY = 25;

  it('Fall A: Values within old range (392683, 394100, 397250) -> correctly scaled and fully visible', () => {
    const values = [392683, 394100, 397250];
    const scale = computeDynamicYScale(values);

    expect(scale.minObserved).toBe(392683);
    expect(scale.maxObserved).toBe(397250);
    // Dynamic bounds must fully encapsulate the values with visual breathing room
    expect(scale.minY).toBeLessThan(392683);
    expect(scale.maxY).toBeGreaterThan(397250);
    expect(scale.range).toBeGreaterThan(0);

    // All computed SVG Y-coordinates must lie strictly within [paddingY, svgHeight - paddingY]
    values.forEach((v) => {
      const y = calculateSvgY(v, scale, svgHeight, paddingY);
      expect(y).toBeGreaterThanOrEqual(paddingY);
      expect(y).toBeLessThanOrEqual(svgHeight - paddingY);
    });
  });

  it('Fall B: Values exceeding previous upper limit of 420000 (418000, 425000, 432000) -> completely within SVG without clipping', () => {
    const values = [418000, 425000, 432000];
    const scale = computeDynamicYScale(values);

    expect(scale.maxObserved).toBe(432000);
    // The previous hardcoded limit of 420000 would have clipped these values.
    // The dynamic scale must exceed 432000.
    expect(scale.maxY).toBeGreaterThan(432000);

    values.forEach((v) => {
      const y = calculateSvgY(v, scale, svgHeight, paddingY);
      expect(y).toBeGreaterThanOrEqual(paddingY);
      expect(y).toBeLessThanOrEqual(svgHeight - paddingY);
    });
  });

  it('Fall C: Significantly higher values (600000, 620000, 650000) -> correctly scaled and proportioned', () => {
    const values = [600000, 620000, 650000];
    const scale = computeDynamicYScale(values);

    expect(scale.minObserved).toBe(600000);
    expect(scale.maxObserved).toBe(650000);
    expect(scale.minY).toBeLessThan(600000);
    expect(scale.maxY).toBeGreaterThan(650000);

    const yMin = calculateSvgY(600000, scale, svgHeight, paddingY);
    const yMid = calculateSvgY(620000, scale, svgHeight, paddingY);
    const yMax = calculateSvgY(650000, scale, svgHeight, paddingY);

    // Higher value has smaller SVG Y coordinate (closer to top)
    expect(yMax).toBeLessThan(yMid);
    expect(yMid).toBeLessThan(yMin);
  });

  it('Fall D: Identical values (400000, 400000, 400000) -> no division-by-zero, clean centered horizontal line', () => {
    const values = [400000, 400000, 400000];
    const scale = computeDynamicYScale(values);

    expect(scale.minObserved).toBe(400000);
    expect(scale.maxObserved).toBe(400000);
    expect(scale.range).toBeGreaterThan(0); // Zero-division is prevented!
    expect(scale.minY).toBeLessThan(400000);
    expect(scale.maxY).toBeGreaterThan(400000);

    const y = calculateSvgY(400000, scale, svgHeight, paddingY);
    expect(Number.isFinite(y)).toBe(true);
    expect(isNaN(y)).toBe(false);

    // Should be centered exactly at the vertical midpoint of the plotting area
    const expectedCenter = paddingY + (svgHeight - paddingY * 2) / 2;
    expect(Math.abs(y - expectedCenter)).toBeLessThan(1);
  });

  it('Fall E: Small difference (400000, 400100, 400200) -> readable without artificial dramatization', () => {
    const values = [400000, 400100, 400200];
    const scale = computeDynamicYScale(values);

    const observedDiff = scale.maxObserved - scale.minObserved; // 200
    expect(observedDiff).toBe(200);

    // Total range must be significantly wider than 200 (enforced minPadding of 2% of max = 8004)
    // so that a 200-domain jitter does not stretch from top to bottom
    expect(scale.range).toBeGreaterThan(8000);

    const yMin = calculateSvgY(400000, scale, svgHeight, paddingY);
    const yMax = calculateSvgY(400200, scale, svgHeight, paddingY);
    const verticalSpan = Math.abs(yMax - yMin);

    // The 200 difference should only occupy a modest fraction of the 150px usable canvas height
    expect(verticalSpan).toBeLessThan(15);
    expect(verticalSpan).toBeGreaterThan(1);
  });

  it('Fall F: ForSaleDNS dataset scaling check (41 historical observations)', () => {
    // Range roughly 304945 to 341520
    const fsValues = [304945, 333159, 339896, 340115, 341520, 334576];
    const scale = computeDynamicYScale(fsValues);

    expect(scale.minY).toBeLessThanOrEqual(304945);
    expect(scale.maxY).toBeGreaterThanOrEqual(341520);
    expect(scale.gridLines).toHaveLength(3);

    fsValues.forEach((v) => {
      const y = calculateSvgY(v, scale, svgHeight, paddingY);
      expect(y).toBeGreaterThanOrEqual(paddingY);
      expect(y).toBeLessThanOrEqual(svgHeight - paddingY);
    });
  });
});
