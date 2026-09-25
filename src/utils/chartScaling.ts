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

export interface ForSaleDnsPointData {
  date: string;
  activeListings: number;
  conformant: number;
  priced: number;
  dnssec: number;
  inventoryCompleted: number;
  inventoryTotal: number;
  baselineComplete: boolean;
  sweepComplete: boolean;
}

export interface PointDetailStats {
  date: string;
  formattedDate: string;
  activeListings: number;
  formattedActiveListings: string;
  delta: number | null;
  deltaPct: number | null;
  deltaFormatted: string;
  deltaVsPreviousLabel: string;
  conformant: number;
  conformantFormatted: string;
  conformantPct: string;
  dnssec: number;
  dnssecFormatted: string;
  dnssecPct: string;
  priced: number;
  pricedFormatted: string;
  pricedPct: string;
  sweepComplete: boolean;
  sweepPct: string;
  sweepLabel: string;
  ariaLabel: string;
}

/**
 * Computes comprehensive interactive telemetry stats for an adoption observation point.
 */
export function computePointDetails(
  current: ForSaleDnsPointData,
  previous: ForSaleDnsPointData | null,
  isEn: boolean
): PointDetailStats {
  const parts = current.date.split('-');
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formattedDate = parts.length === 3
    ? (!isEn
        ? `${parts[2]}.${parts[1]}.${parts[0]}`
        : `${parseInt(parts[2], 10)} ${monthsEn[parseInt(parts[1], 10) - 1] || parts[1]} ${parts[0]}`)
    : current.date;

  const formattedActiveListings = current.activeListings.toLocaleString(isEn ? 'en-US' : 'de-DE');
  const conformantFormatted = current.conformant.toLocaleString(isEn ? 'en-US' : 'de-DE');
  const dnssecFormatted = current.dnssec.toLocaleString(isEn ? 'en-US' : 'de-DE');
  const pricedFormatted = current.priced.toLocaleString(isEn ? 'en-US' : 'de-DE');

  let delta: number | null = null;
  let deltaPct: number | null = null;
  let deltaFormatted: string;
  let deltaVsPreviousLabel: string;

  if (previous && previous.activeListings > 0) {
    delta = current.activeListings - previous.activeListings;
    deltaPct = (delta / previous.activeListings) * 100;

    if (delta > 0) {
      const absFormatted = delta.toLocaleString(isEn ? 'en-US' : 'de-DE');
      const pctFormatted = isEn ? `${deltaPct.toFixed(2)}%` : `${deltaPct.toFixed(2).replace('.', ',')} %`;
      deltaFormatted = `+${absFormatted} (+${pctFormatted})`;
      deltaVsPreviousLabel = isEn
        ? `+${absFormatted} vs previous observation (+${pctFormatted})`
        : `+${absFormatted} zum vorherigen Messpunkt (+${pctFormatted})`;
    } else if (delta < 0) {
      const absFormatted = Math.abs(delta).toLocaleString(isEn ? 'en-US' : 'de-DE');
      const pctFormatted = isEn ? `${Math.abs(deltaPct).toFixed(2)}%` : `${Math.abs(deltaPct).toFixed(2).replace('.', ',')} %`;
      deltaFormatted = `−${absFormatted} (−${pctFormatted})`;
      deltaVsPreviousLabel = isEn
        ? `−${absFormatted} vs previous observation (−${pctFormatted})`
        : `−${absFormatted} zum vorherigen Messpunkt (−${pctFormatted})`;
    } else {
      deltaFormatted = isEn ? '0 (0.00%)' : '0 (0,00 %)';
      deltaVsPreviousLabel = isEn ? '0 vs previous observation (0.00%)' : '0 zum vorherigen Messpunkt (0,00 %)';
    }
  } else {
    deltaFormatted = isEn ? 'First observation' : 'Erster Messpunkt';
    deltaVsPreviousLabel = isEn ? 'First observation in dataset' : 'Erster Messpunkt im Datensatz';
  }

  const conformantPct = current.activeListings > 0
    ? `${((current.conformant / current.activeListings) * 100).toFixed(2).replace('.', isEn ? '.' : ',')}${isEn ? '%' : ' %'}`
    : '100%';

  const dnssecPct = current.activeListings > 0
    ? `${((current.dnssec / current.activeListings) * 100).toFixed(1).replace('.', isEn ? '.' : ',')}${isEn ? '%' : ' %'}`
    : '0%';

  const pricedPct = current.activeListings > 0
    ? `${((current.priced / current.activeListings) * 100).toFixed(1).replace('.', isEn ? '.' : ',')}${isEn ? '%' : ' %'}`
    : '0%';

  const sweepPctNum = current.inventoryTotal > 0
    ? ((current.inventoryCompleted / current.inventoryTotal) * 100).toFixed(1)
    : '100.0';
  const sweepPct = isEn ? `${sweepPctNum}%` : `${sweepPctNum.replace('.', ',')} %`;

  const sweepLabel = current.sweepComplete
    ? (isEn ? 'Full sweep · 100%' : 'Vollständiger Sweep · 100 %')
    : (isEn ? `Partial scan · ${sweepPct} of observed inventory` : `Teilscan · ${sweepPct} des beobachteten Inventars`);

  const deltaSpeech = delta === null
    ? (isEn ? 'First observation' : 'Erster Messpunkt')
    : delta > 0
      ? (isEn ? `plus ${delta.toLocaleString('en-US')}` : `plus ${delta.toLocaleString('de-DE')}`)
      : delta < 0
        ? (isEn ? `minus ${Math.abs(delta).toLocaleString('en-US')}` : `minus ${Math.abs(delta).toLocaleString('de-DE')}`)
        : (isEn ? 'unchanged' : 'unverändert');

  const ariaLabel = isEn
    ? `${formattedDate}, ${formattedActiveListings} active listings${delta !== null ? `, ${deltaSpeech} compared to previous observation` : ', First observation'}`
    : `${formattedDate}, ${formattedActiveListings} aktive Listings${delta !== null ? `, ${deltaSpeech} zum vorherigen Messpunkt` : ', Erster Messpunkt'}`;

  return {
    date: current.date,
    formattedDate,
    activeListings: current.activeListings,
    formattedActiveListings,
    delta,
    deltaPct,
    deltaFormatted,
    deltaVsPreviousLabel,
    conformant: current.conformant,
    conformantFormatted,
    conformantPct,
    dnssec: current.dnssec,
    dnssecFormatted,
    dnssecPct,
    priced: current.priced,
    pricedFormatted,
    pricedPct,
    sweepComplete: current.sweepComplete,
    sweepPct,
    sweepLabel,
    ariaLabel,
  };
}

