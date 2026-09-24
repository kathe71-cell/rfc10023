import { describe, it, expect } from 'vitest';
import providersData from '../data/provider-compatibility.json';
import {
  HOSTERS_DATA,
  formatVerificationDate,
  isVerificationStale,
  CompatibilityStatus,
  VerificationType,
} from '../src/data/hosters';

describe('RFC 10023 Provider Compatibility Data Model', () => {
  const VALID_STATUSES: CompatibilityStatus[] = [
    'verified-supported',
    'verified-limited',
    'unclear',
    'not-supported',
    'not-retested',
  ];

  const VALID_VERIFICATION_TYPES: VerificationType[] = [
    'hands-on-test',
    'official-docs',
    'provider-statement',
    'community-report',
    'inferred',
  ];

  const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

  it('contains at least 8 evaluated DACH/global providers', () => {
    expect(providersData.length).toBeGreaterThanOrEqual(8);
    const ids = providersData.map((p) => p.id);
    expect(ids).toContain('hetzner');
    expect(ids).toContain('cloudflare');
    expect(ids).toContain('inwx');
    expect(ids).toContain('netcup');
    expect(ids).toContain('desec');
    expect(ids).toContain('strato');
    expect(ids).toContain('ionos');
    expect(ids).toContain('ovh');
  });

  it('validates that every provider has complete and valid fields', () => {
    for (const p of providersData) {
      expect(typeof p.id).toBe('string');
      expect(p.id.length).toBeGreaterThan(0);

      expect(typeof p.name).toBe('string');
      expect(p.name.length).toBeGreaterThan(0);

      expect(typeof p.region).toBe('string');
      expect(typeof p.regionEn).toBe('string');

      expect(VALID_STATUSES).toContain(p.status);
      expect(VALID_VERIFICATION_TYPES).toContain(p.verificationType);

      // lastVerified must be valid YYYY-MM-DD
      expect(p.lastVerified).toMatch(ISO_DATE_REGEX);
      const parsedDate = new Date(p.lastVerified);
      expect(isNaN(parsedDate.getTime())).toBe(false);

      // testedAt must be null or valid YYYY-MM-DD
      if (p.testedAt !== null) {
        expect(p.testedAt).toMatch(ISO_DATE_REGEX);
      }

      // sourceUrl must be a valid URL
      expect(typeof p.sourceUrl).toBe('string');
      expect(() => new URL(p.sourceUrl)).not.toThrow();

      // editorSyntax and sampleRecord
      expect(typeof p.editorSyntax).toBe('string');
      expect(p.editorSyntax.length).toBeGreaterThan(0);
      expect(typeof p.sampleRecord).toBe('string');
      expect(p.sampleRecord.length).toBeGreaterThan(0);

      // bilingual notes
      expect(typeof p.notes).toBe('string');
      expect(p.notes.length).toBeGreaterThan(10);
      expect(typeof p.notesEn).toBe('string');
      expect(p.notesEn.length).toBeGreaterThan(10);
    }
  });

  it('enforces that inferred status is NEVER classified as verified', () => {
    for (const p of providersData) {
      if (p.verificationType === 'inferred') {
        expect(p.status).not.toBe('verified-supported');
        expect(p.status).not.toBe('verified-limited');
      }
    }
  });

  it('re-evaluates IONOS and Strato conservatively as unclear without unsubstantiated claims', () => {
    const ionos = providersData.find((p) => p.id === 'ionos');
    expect(ionos).toBeDefined();
    expect(ionos?.status).toBe('unclear');
    expect(ionos?.testedAt).toBeNull();
    expect(ionos?.verificationType).toBe('official-docs');
    expect(ionos?.dnsSyntaxSupported).toBe(true);
    expect(ionos?.rfc10023Tested).toBe(false);
    expect(ionos?.nativeRfc10023Integration).toBe(false);
    expect(ionos?.notes).toContain('_dmarc');

    const strato = providersData.find((p) => p.id === 'strato');
    expect(strato).toBeDefined();
    expect(strato?.status).toBe('unclear');
    expect(strato?.testedAt).toBeNull();
    expect(strato?.verificationType).toBe('official-docs');
    expect(strato?.dnsSyntaxSupported).toBe(true);
    expect(strato?.rfc10023Tested).toBe(false);
  });

  it('verifies INWX distinguishes DNS protocol support from marketplace features', () => {
    const inwx = providersData.find((p) => p.id === 'inwx');
    expect(inwx).toBeDefined();
    expect(inwx?.status).toBe('verified-supported');
    expect(inwx?.notes).toContain('DNS');
  });

  it('exports HOSTERS_DATA with backward compatibility aliases', () => {
    expect(HOSTERS_DATA.length).toBe(providersData.length);
    for (const h of HOSTERS_DATA) {
      expect(h.country).toBe(h.region);
      expect(h.countryEn).toBe(h.regionEn);
      expect(h.uiField).toBe(h.editorSyntax);
      expect(typeof h.statusText).toBe('string');
    }
  });

  it('formats verification dates correctly for German and English', () => {
    expect(formatVerificationDate('2026-09-24', 'de')).toBe('24.09.2026');
    expect(formatVerificationDate('2026-09-24', 'en')).toBe('Sep 24, 2026');
    expect(formatVerificationDate(null, 'de')).toBe('—');
  });

  it('identifies stale verification dates correctly', () => {
    // Today's verification is fresh
    expect(isVerificationStale('2026-09-24', 180)).toBe(false);

    // Old verification (> 180 days ago) is stale
    expect(isVerificationStale('2025-01-01', 180)).toBe(true);

    // Empty string is considered stale
    expect(isVerificationStale('', 180)).toBe(true);
  });
});
