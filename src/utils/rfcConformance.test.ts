import { describe, it, expect } from 'vitest';
import {
  parseRfc10023Records,
  countDnsTxtChunks,
  applyDnsContextChecks,
  isWildcardAnswer,
  buildWildcardProbeName,
} from './rfcParserEngine';

describe('RFC 10023 § 2.4 – single character-string', () => {
  it('counts character-strings', () => {
    expect(countDnsTxtChunks('"v=FORSALE1;"')).toBe(1);
    expect(countDnsTxtChunks('"v=FORSALE1;" "ftxt=foo"')).toBe(2);
    expect(countDnsTxtChunks('v=FORSALE1;')).toBe(1);
    expect(countDnsTxtChunks('"v=FORSALE1;ftxt=a \\"quoted\\" text"')).toBe(1);
  });

  it('flags a record split into several strings as non-conformant', () => {
    const r = parseRfc10023Records(['"v=FORSALE1;" "ftxt=foo"'], 'NOERROR', 'de');
    expect(r.status).toBe('warning');
    expect(r.recordAnalyses[0].characterStringCount).toBe(2);
    expect(r.warnings.join(' ')).toContain('§ 2.4');
  });

  it('keeps a correct single-string RRset valid', () => {
    const r = parseRfc10023Records(['"v=FORSALE1;furi=https://example.com/buy"', '"v=FORSALE1;fval=EUR999"'], 'NOERROR', 'de');
    expect(r.status).toBe('valid');
  });

  it('flags records over 255 octets as non-conformant', () => {
    const long = 'v=FORSALE1;ftxt=' + 'x'.repeat(260);
    const r = parseRfc10023Records([`"${long}"`], 'NOERROR', 'en');
    expect(r.status).toBe('warning');
  });
});

describe('Extension tags (§ 2.2.5)', () => {
  it('reports fmin as note without downgrading status', () => {
    const r = parseRfc10023Records(['"v=FORSALE1;fmin=EUR2000.00"'], 'NOERROR', 'de');
    expect(r.status).toBe('valid');
    expect(r.extensionTags).toContain('fmin');
    expect(r.warnings.some((w) => w.includes('fmin'))).toBe(true);
  });
});

describe('DNS context checks', () => {
  const base = parseRfc10023Records(['"v=FORSALE1;"'], 'NOERROR', 'de');

  it('adds a TTL note above 3600 s but keeps status', () => {
    const r = applyDnsContextChecks(base, { ttl: 86400 }, 'de');
    expect(r.status).toBe('valid');
    expect(r.warnings.some((w) => w.includes('86400'))).toBe(true);
  });

  it('no TTL note at 3600 s', () => {
    const r = applyDnsContextChecks(base, { ttl: 3600 }, 'de');
    expect(r.warnings.length).toBe(base.warnings.length);
  });

  it('wildcard detection downgrades status', () => {
    expect(isWildcardAnswer(['"v=FORSALE1;"'], ['"v=FORSALE1;"'])).toBe(true);
    expect(isWildcardAnswer(['"v=FORSALE1;"'], [])).toBe(false);
    expect(isWildcardAnswer(['"v=FORSALE1;"'], ['"something else"'])).toBe(false);
    const r = applyDnsContextChecks(base, { wildcardDetected: true }, 'en');
    expect(r.status).toBe('warning');
  });

  it('probe name is a random sibling label', () => {
    expect(buildWildcardProbeName('example.com')).toMatch(/^rfc10023-probe-[a-z0-9]+\.example\.com$/);
  });

  it('does nothing without a sale signal', () => {
    const none = parseRfc10023Records([], 'NODATA', 'de');
    expect(applyDnsContextChecks(none, { ttl: 99999, wildcardDetected: true }, 'de')).toBe(none);
  });
});
