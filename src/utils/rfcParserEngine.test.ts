import { describe, it, expect } from 'vitest';
import {
  parseRfc10023Records,
  validateFvalTag,
  validateFuriTag,
  validateOctetTag,
  getUtf8ByteLength,
} from './rfcParserEngine';
import { sanitizeCsvCell } from './dnsIntelligence';

describe('RFC 10023 Parser & Validator Engine', () => {
  it('correctly parses a fully valid multi-record RRset', () => {
    const raw = [
      'v=FORSALE1;fval=EUR2500',
      'v=FORSALE1;furi=https://example.com/buy',
      'v=FORSALE1;ftxt=Direct seller inquiry welcome',
      'v=FORSALE1;fcod=EXCO-12345'
    ];
    const report = parseRfc10023Records(raw);

    expect(report.dnsStatus).toBe('NOERROR');
    expect(report.saleSignalFound).toBe(true);
    expect(report.status).toBe('valid');
    expect(report.architecture).toBe('ietf_multi');
    expect(report.parsedMap.fval).toBe('EUR2500');
    expect(report.parsedMap.furi).toBe('https://example.com/buy');
    expect(report.parsedMap.ftxt).toBe('Direct seller inquiry welcome');
    expect(report.parsedMap.fcod).toBe('EXCO-12345');
    expect(report.errors.length).toBe(0);
  });

  it('validates decimal prices and crypto in fval', () => {
    expect(validateFvalTag('USD99.50').valid).toBe(true);
    expect(validateFvalTag('USD99.50').amount).toBe(99.5);
    expect(validateFvalTag('BTC0.05').valid).toBe(true);
    expect(validateFvalTag('BTC0.05').amount).toBe(0.05);
    expect(validateFvalTag('EUR2500').valid).toBe(true);
    expect(validateFvalTag('ETH10').valid).toBe(true);

    // Invalid formats
    expect(validateFvalTag('2500EUR').valid).toBe(false);
    expect(validateFvalTag('EUR').valid).toBe(false);
    expect(validateFvalTag('eur2500').valid).toBe(false); // must be uppercase
    expect(validateFvalTag('VHB').valid).toBe(false); // VHB is not ABNF compliant
  });

  it('validates URIs with recommended schemes according to RFC 10023 § 2.2.3', () => {
    expect(validateFuriTag('https://example.com').valid).toBe(true);
    expect(validateFuriTag('https://example.com').isRecommendedScheme).toBe(true);
    expect(validateFuriTag('mailto:owner@example.com').valid).toBe(true);
    expect(validateFuriTag('mailto:owner@example.com').scheme).toBe('mailto');
    expect(validateFuriTag('tel:+4917866526230').valid).toBe(true);
    expect(validateFuriTag('tel:+4917866526230').scheme).toBe('tel');

    // Unsupported scheme or invalid syntax
    expect(validateFuriTag('ftp://example.com').isRecommendedScheme).toBe(false);
    expect(validateFuriTag('not-a-uri').valid).toBe(false);
  });

  it('handles bare sale signal without content (RFC 10023 § 2.1)', () => {
    const raw = ['v=FORSALE1;'];
    const report = parseRfc10023Records(raw);

    expect(report.saleSignalFound).toBe(true);
    expect(report.status).toBe('valid');
    expect(report.architecture).toBe('empty_signal');
    expect(report.errors.length).toBe(0);
  });

  it('detects and flags single-line multi-tag deviation as non-conformant warning', () => {
    const raw = ['v=FORSALE1; fval=EUR2500; furi=https://example.com; ftxt=test'];
    const report = parseRfc10023Records(raw);

    expect(report.saleSignalFound).toBe(true);
    expect(report.status).toBe('warning');
    expect(report.architecture).toBe('single_line_deviation');
    expect(report.warnings.some((w) => w.includes('RFC 10023 § 2.1'))).toBe(true);
  });

  it('enforces 255-octet byte limits on UTF-8 character strings', () => {
    const shortString = 'v=FORSALE1;ftxt=Hello World';
    expect(getUtf8ByteLength(shortString)).toBe(27);

    const longAscii = 'v=FORSALE1;ftxt=' + 'a'.repeat(245);
    expect(getUtf8ByteLength(longAscii)).toBe(261);

    const report = parseRfc10023Records([longAscii]);
    expect(report.warnings.some((w) => w.includes('255'))).toBe(true);
  });

  it('correctly handles NXDOMAIN without claiming domain is for sale', () => {
    const report = parseRfc10023Records([], 'NXDOMAIN');
    expect(report.dnsStatus).toBe('NXDOMAIN');
    expect(report.saleSignalFound).toBe(false);
    expect(report.status).toBe('nxdomain');
  });

  it('correctly handles NODATA when domain exists but no _for-sale record', () => {
    const report = parseRfc10023Records([], 'NOERROR');
    expect(report.dnsStatus).toBe('NODATA');
    expect(report.saleSignalFound).toBe(false);
    expect(report.status).toBe('not_found');
  });

  it('correctly handles SERVFAIL and TIMEOUT errors', () => {
    const report = parseRfc10023Records([], 'SERVFAIL');
    expect(report.dnsStatus).toBe('SERVFAIL');
    expect(report.saleSignalFound).toBe(false);
    expect(report.status).toBe('error');
  });
});

describe('CSV Formula Injection Defense', () => {
  it('prepends single quote to dangerous leading characters', () => {
    expect(sanitizeCsvCell('=1+1')).toBe(`"'=1+1"`);
    expect(sanitizeCsvCell('+cmd|')).toBe(`"'+cmd|"`);
    expect(sanitizeCsvCell('-5')).toBe(`"'-5"`);
    expect(sanitizeCsvCell('@IMPORT')).toBe(`"'@IMPORT"`);
    expect(sanitizeCsvCell('Safe Domain Name')).toBe(`"Safe Domain Name"`);
    expect(sanitizeCsvCell('quotes "inside" string')).toBe(`"quotes ""inside"" string"`);
  });
});
