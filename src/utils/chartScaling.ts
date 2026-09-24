/**
 * RFC 10023 Dynamic Y-Scale Calculation Engine
 * 
 * Provides robust dynamic scaling for SVG adoption telemetry charts:
 * - Prevents out-of-bounds rendering when metrics exceed arbitrary fixed thresholds
 * - Handles identical values without division-by-zero
 * - Prevents artificial dramatization of minute daily variations
 * - Generates clean, proportional grid lines
 */

export interface DynamicYScaleResult {
  minObserved: number;
  maxObserved: number;
  minY: number;
  maxY: number;
  range: number;
  gridLines: number[];
}

export interface DynamicYScaleOptions {
  /** Minimum padding as a ratio of maxObserved to avoid dramatizing small changes (default: 0.02) */
  minPaddingRatio?: number;
  /** Padding factor relative to observed range (default: 0.15) */
  rangePaddingRatio?: number;
  /** Number of grid lines to compute (default: 3) */
  gridLineCount?: number;
}

/**
 * Computes robust dynamic Y-scale bounds for an array of numbers.
 * 
 * @param values Array of observed numeric metrics
 * @param options Configuration options
 * @returns DynamicYScaleResult
 */
export function computeDynamicYScale(
  values: number[],
  options: DynamicYScaleOptions = {}
): DynamicYScaleResult {
  if (!values || values.length === 0) {
    return {
      minObserved: 0,
      maxObserved: 100,
      minY: 0,
      maxY: 100,
      range: 100,
      gridLines: [25, 50, 75],
    };
  }

  const minPaddingRatio = options.minPaddingRatio ?? 0.02;
  const rangePaddingRatio = options.rangePaddingRatio ?? 0.15;
  const gridLineCount = options.gridLineCount ?? 3;

  const minObserved = Math.min(...values);
  const maxObserved = Math.max(...values);
  const observedRange = maxObserved - minObserved;

  let padding: number;
  if (observedRange === 0) {
    // Fall D: All values identical -> create a balanced 5% window around the value (min 10 units)
    padding = Math.max(Math.abs(maxObserved) * 0.05, 10);
  } else {
    // Fall E: Small differences -> enforce minimum padding (2% of max) so tiny changes aren't dramatized
    const minPadding = Math.max(maxObserved * minPaddingRatio, 10);
    padding = Math.max(observedRange * rangePaddingRatio, minPadding);
  }

  const rawMin = Math.max(0, Math.floor(minObserved - padding));
  const rawMax = Math.ceil(maxObserved + padding);
  const totalRange = rawMax - rawMin;

  // Generate evenly spaced grid lines within the range
  const gridLines: number[] = [];
  for (let i = 1; i <= gridLineCount; i++) {
    const fraction = i / (gridLineCount + 1);
    gridLines.push(Math.round(rawMin + totalRange * fraction));
  }

  return {
    minObserved,
    maxObserved,
    minY: rawMin,
    maxY: rawMax,
    range: totalRange,
    gridLines,
  };
}

/**
 * Helper to compute an SVG Y-coordinate safely.
 * 
 * @param value The value to position
 * @param scale The computed DynamicYScaleResult
 * @param svgHeight Total SVG canvas height
 * @param paddingY Vertical padding inside canvas
 * @returns Y coordinate in SVG space (0 at top, svgHeight at bottom)
 */
export function calculateSvgY(
  value: number,
  scale: DynamicYScaleResult,
  svgHeight: number,
  paddingY: number
): number {
  if (scale.range <= 0) {
    return svgHeight / 2;
  }
  const ratio = (value - scale.minY) / scale.range;
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  const usableHeight = svgHeight - paddingY * 2;
  return svgHeight - paddingY - clampedRatio * usableHeight;
}
