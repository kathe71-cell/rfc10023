import rawProviders from '../../data/provider-compatibility.json';

export type CompatibilityStatus =
  | 'verified-supported'
  | 'verified-limited'
  | 'unclear'
  | 'not-supported'
  | 'not-retested';

export type VerificationType =
  | 'hands-on-test'
  | 'official-docs'
  | 'provider-statement'
  | 'community-report'
  | 'inferred';

export interface ProviderCompatibility {
  id: string;
  name: string;
  region: string;
  regionEn: string;
  status: CompatibilityStatus;
  verificationType: VerificationType;
  testedAt: string | null;
  lastVerified: string;
  sourceUrl: string;
  editorSyntax: string;
  sampleRecord: string;
  notes: string;
  notesEn: string;

  // Backward compatibility aliases
  country: string;
  countryEn: string;
  uiField: string;
  statusText: string;
}

export type HosterSupport = ProviderCompatibility;

const STATUS_TEXT_DE: Record<CompatibilityStatus, string> = {
  'verified-supported': 'Verifiziert unterstützt',
  'verified-limited': 'Verifiziert eingeschränkt',
  'unclear': 'Unklar / nicht eindeutig belegt',
  'not-supported': 'Nicht unterstützt',
  'not-retested': 'Nicht erneut geprüft',
};

export const HOSTERS_DATA: ProviderCompatibility[] = (
  rawProviders as Array<Omit<ProviderCompatibility, 'country' | 'countryEn' | 'uiField' | 'statusText'>>
).map((p) => ({
  ...p,
  country: p.region,
  countryEn: p.regionEn,
  uiField: p.editorSyntax,
  statusText: STATUS_TEXT_DE[p.status] || p.status,
}));

/**
 * Checks whether the last verification date is older than `maxDays` (default 180 days = ~6 months).
 */
export function isVerificationStale(lastVerified: string, maxDays = 180): boolean {
  if (!lastVerified) return true;
  const verifiedDate = new Date(lastVerified).getTime();
  if (isNaN(verifiedDate)) return true;
  const diffDays = (Date.now() - verifiedDate) / (1000 * 60 * 60 * 24);
  return diffDays > maxDays;
}

/**
 * Formats an ISO date string (YYYY-MM-DD) into locale-specific display format:
 * - DE: 24.09.2026
 * - EN: Sep 24, 2026
 */
export function formatVerificationDate(dateStr: string | null, language: 'de' | 'en'): string {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (language === 'de') {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(day)}.${pad(month)}.${year}`;
  }

  const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = MONTHS_EN[month - 1] || parts[1];
  return `${monthName} ${day}, ${year}`;
}
