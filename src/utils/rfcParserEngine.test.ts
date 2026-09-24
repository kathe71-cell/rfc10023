import { describe, it, expect } from 'vitest';
import {
  parseRfc10023Records,
  validateFvalTag,
  validateFuriTag,
  validateOctetTag,
  getUtf8ByteLength,
  mergeDnsTxtChunks,
  decodeDnsPresentationFormat,
  punycodeDecode,
  idnToUnicode,
  unicodeToPunycode,
  detectMixedScript,
} from './rfcParserEngine';
import { sanitizeCsvCell, toPunycodeHostname } from './dnsIntelligence';

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

describe('RFC 1035 Presentation Format & UTF-8 Escape Decoder', () => {
  it('decodes decimal escapes \\DDD into valid UTF-8 characters', () => {
    // cours-dns.fr vector: friqu\195\169 -> friqué (0xC3 0xA9)
    const rawCours = 'v=FORSALE1;ftxt=Make money fast / Soyez friqu\\195\\169 rapidement';
    const decoded = decodeDnsPresentationFormat(rawCours);
    expect(decoded).toBe('v=FORSALE1;ftxt=Make money fast / Soyez friqué rapidement');
  });

  it('decodes multi-byte UTF-8 emojis and non-Latin scripts from \\DDD escapes', () => {
    // example.nl test vector: \240\159\142\133 = 🎅, \240\159\142\132 = 🎄
    const rawEmoji = 'https://\\240\\159\\142\\133.\\240\\159\\142\\132.sidnlabs.nl';
    expect(decodeDnsPresentationFormat(rawEmoji)).toBe('https://🎅.🎄.sidnlabs.nl');

    // Chinese vector: \232\129\148\231\179\187\230\136\145\228\187\172 = 联系我们
    const rawChinese = '\\232\\129\\148\\231\\179\\187\\230\\136\\145\\228\\187\\172';
    expect(decodeDnsPresentationFormat(rawChinese)).toBe('联系我们');
  });

  it('decodes escaped punctuation \\X per RFC 1035 Section 5.1', () => {
    expect(decodeDnsPresentationFormat('hello\\;world\\"test')).toBe('hello;world"test');
    expect(decodeDnsPresentationFormat('path\\\\file')).toBe('path\\file');
  });

  it('merges multiple quoted strings within a single TXT RR', () => {
    const multi = '"v=FORSALE1;ftxt=first part " "second part"';
    expect(mergeDnsTxtChunks(multi)).toBe('v=FORSALE1;ftxt=first part second part');
  });
});

describe('IDN & Punycode Resolution Engine (RFC 3492 / RFC 5890)', () => {
  it('decodes Punycode A-labels (xn--) to Unicode U-labels', () => {
    expect(punycodeDecode('klteinsel-v2a')).toBe('kälteinsel');
    expect(idnToUnicode('xn--klteinsel-v2a.de')).toBe('kälteinsel.de');
    expect(idnToUnicode('xn--11b5bs3a9aj6g.testdns.nl')).toBe('परीक्षा.testdns.nl');
    expect(idnToUnicode('xn--7j8hb.sidnlabs.nl')).toBe('🎅🎄.sidnlabs.nl');
  });

  it('converts Unicode domains to canonical Punycode hostname for DNS queries', () => {
    expect(toPunycodeHostname('kälteinsel.de')).toBe('xn--klteinsel-v2a.de');
    expect(toPunycodeHostname('परीक्षा.testdns.nl')).toBe('xn--11b5bs3a9aj6g.testdns.nl');
    expect(unicodeToPunycode('example.com')).toBe('example.com');
  });
});

describe('Section 5 Security Defense: Mixed-Script Homograph Detection', () => {
  it('detects mixed-script homograph spoofing attempts', () => {
    // Cyrillic small 'а' (\u0430) mixed with Latin 'pple.com'
    const spoofedApple = 'аpple.com';
    expect(detectMixedScript(spoofedApple)).toBe(true);

    // Standard single-script Latin domain
    expect(detectMixedScript('apple.com')).toBe(false);

    // Single-script Hindi IDN
    expect(detectMixedScript('परीक्षा')).toBe(false);

    // Zero-width characters (invisible spoofing)
    expect(detectMixedScript('test\u200Bdomain.com')).toBe(true);
  });

  it('flags mixed-script homographs with security alert in validateFuriTag', () => {
    const res = validateFuriTag('https://аpple.com/buy');
    expect(res.valid).toBe(true);
    expect(res.hasMixedScript).toBe(true);
    expect(res.message).toContain('Security Alert');
    expect(res.aLabel).toBe('xn--pple-43d.com');
  });
});

describe('Real-World RFC 10023 Test Vectors by Author (Marco Davids)', () => {
  it('parses cours-dns.fr with presentation escapes and decodes French accents', () => {
    const coursDnsRrset = [
      '"v=FORSALE1;fcod=42"',
      '"v=FORSALE1;fval=BTC1000"',
      '"Read RFC 10023 to learn more"',
      '"v=FORSALE1;ftxt=Make money fast / Soyez friqu\\195\\169 rapidement"',
      '"v=FORSALE1;furi=https://www.afnic.fr/en/products-and-services/training/"',
    ];

    const report = parseRfc10023Records(coursDnsRrset);
    expect(report.saleSignalFound).toBe(true);
    expect(report.hasPresentationEscapes).toBe(true);
    expect(report.parsedMap.fval).toBe('BTC1000');
    expect(report.parsedMap.fcod).toBe('42');
    expect(report.parsedMap.ftxt).toBe('Make money fast / Soyez friqué rapidement');
    expect(report.parsedMap.furi).toBe('https://www.afnic.fr/en/products-and-services/training/');
  });

  it('parses परीक्षा.testdns.nl Hindi IDN test record', () => {
    const parikshaRrset = [
      '"v=FORSALE1;fcod=TEST-testing123-please-ignore"',
      '"v=FORSALE1;fval=EUR100000000"',
      '"v=FORSALE1;ftxt=Punycode test"',
      '"v=FORSALE1;furi=https://www.sidn.nl/en/landing-page-buying-and-selling-example"',
    ];

    const report = parseRfc10023Records(parikshaRrset);
    expect(report.saleSignalFound).toBe(true);
    expect(report.parsedMap.fval).toBe('EUR100000000');
    expect(report.parsedMap.fcod).toBe('TEST-testing123-please-ignore');
    expect(report.parsedMap.ftxt).toBe('Punycode test');
  });

  it('parses example.nl edge-case suite with emojis, IDN URIs, and escaped scripts', () => {
    const exampleRrset = [
      '"v=FORSALE1;fval=EUR300000"',
      '"v=FORSALE1;ftxt=\\232\\129\\148\\231\\179\\187\\230\\136\\145\\228\\187\\172"',
      '"v=FORSALE1;furi=https://\\240\\159\\142\\133.\\240\\159\\142\\132.sidnlabs.nl"',
      '"v=FORSALE1;furi=https://xn--7j8hb.sidnlabs.nl/"',
    ];

    const report = parseRfc10023Records(exampleRrset);
    expect(report.saleSignalFound).toBe(true);
    expect(report.hasPresentationEscapes).toBe(true);
    expect(report.parsedMap.fval).toBe('EUR300000');
    expect(report.parsedMap.ftxt).toBe('联系我们');
    // First furi decoded from emoji escapes
    expect(report.tags.some((t) => t.tag === 'furi' && t.value === 'https://🎅.🎄.sidnlabs.nl')).toBe(true);
    // Second furi has U-label parsed details
    const punyFuri = report.tags.find((t) => t.value === 'https://xn--7j8hb.sidnlabs.nl/');
    expect(punyFuri?.parsedDetails?.uLabel).toBe('🎅🎄.sidnlabs.nl');
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
