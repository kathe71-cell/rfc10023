// RFC 10023 Reference Parser & Validator Engine
// Conforming to IETF RFC 10023 (Informational, July 2026 - M. Davids, SIDN Labs)
// Formal ABNF:
// forsale-record  = forsale-version [forsale-content]
// forsale-version = %s"v=FORSALE1;"
// forsale-content = fcod-pair / ftxt-pair / furi-pair / fval-pair
// Only one tag-value pair per record. Multiple records in a single RRset.
// Max RDATA length: 255 octets per character-string.

export interface RfcTagItem {
  tag: 'fval' | 'furi' | 'ftxt' | 'fcod' | string;
  value: string;
  sourceRecordIndex: number;
  isStandard: boolean;
  isDuplicate?: boolean;
  isValid: boolean;
  validationMessage?: string;
  parsedDetails?: {
    currency?: string;
    amount?: number;
    scheme?: string;
  };
}

export type DnsQueryStatus = 'NOERROR' | 'NXDOMAIN' | 'NODATA' | 'SERVFAIL' | 'TIMEOUT' | 'ERROR';

export interface RfcRecordAnalysis {
  recordIndex: number;
  rawText: string;
  byteLength: number;
  exceeds255Bytes: boolean;
  hasVersionTag: boolean;
  isSingleLineMultiTag: boolean; // non-conformant deviation
  tags: RfcTagItem[];
  warnings: string[];
  errors: string[];
}

export interface RfcValidationReport {
  // 1. DNS Query Status
  dnsStatus: DnsQueryStatus;
  dnsStatusMessage: string;

  // 2. Sale Signal
  saleSignalFound: boolean;
  saleSignalMessage: string;

  // 3. Format & ABNF Compliance
  status: 'valid' | 'warning' | 'not_found' | 'nxdomain' | 'error';
  statusMessage: string;
  architecture: 'ietf_multi' | 'single_line_deviation' | 'empty_signal' | 'unknown';
  architectureLabel: string;

  // 4. Detailed Data
  rawRecords: string[];
  recordAnalyses: RfcRecordAnalysis[];
  tags: RfcTagItem[];
  parsedMap: {
    fval?: string;
    furi?: string;
    ftxt?: string;
    fcod?: string;
    [key: string]: string | undefined;
  };
  warnings: string[];
  errors: string[];
  extensionTags: string[];
  byteOverheadTotal: number;
}

export const STANDARD_CONTENT_TAGS = ['fval', 'furi', 'ftxt', 'fcod'] as const;
export type StandardContentTag = typeof STANDARD_CONTENT_TAGS[number];

// Common ISO 4217 fiat and top crypto currency symbols
export const KNOWN_CURRENCIES = new Set([
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL',
  'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS',
  'MXN', 'ZAR', 'TRY', 'AED', 'SAR', 'KRW', 'THB', 'IDR', 'MYR', 'PHP',
  'BTC', 'ETH', 'SOL', 'USDT', 'USDC'
]);

/**
 * Calculates exact UTF-8 byte length (RFC 1035 / RFC 10023 255-octet limit)
 */
export function getUtf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

/**
 * Validates fval tag according to RFC 10023 Section 2.1:
 * fval-value    = fval-currency fval-amount
 * fval-currency = 1*%x41-5A (uppercase A-Z)
 * fval-amount   = int-part [ %x2E frac-part ]
 * Total length: 2 to 239 characters
 */
export function validateFvalTag(value: string): {
  valid: boolean;
  currency?: string;
  amount?: number;
  rawAmount?: string;
  message?: string;
} {
  const clean = value.trim();
  if (clean.length < 2 || clean.length > 239) {
    return {
      valid: false,
      message: `fval length must be between 2 and 239 characters (was ${clean.length}).`,
    };
  }

  // Currency: 1 or more uppercase letters A-Z; Amount: digits with optional .digits
  const match = clean.match(/^([A-Z]+)(\d+(?:\.\d+)?)$/);
  if (!match) {
    return {
      valid: false,
      message: `Invalid fval syntax: "${clean}". Expected uppercase currency followed directly by amount (e.g. EUR2500 or USD99.50).`,
    };
  }

  const currency = match[1];
  const rawAmount = match[2];
  const amount = parseFloat(rawAmount);

  let message: string | undefined;
  if (!KNOWN_CURRENCIES.has(currency)) {
    message = `Currency code "${currency}" is syntactically valid (uppercase letters), but not in standard ISO 4217 / crypto list.`;
  }

  return { valid: true, currency, amount, rawAmount, message };
}

/**
 * Validates furi tag according to RFC 10023 Section 2.2.3:
 * furi-value = URI / IRI (RFC 3986 / RFC 3987)
 * Recommended schemes: http, https, mailto, tel. Exactly one URI.
 */
export function validateFuriTag(value: string): {
  valid: boolean;
  scheme?: string;
  isRecommendedScheme: boolean;
  message?: string;
} {
  const clean = value.trim();
  if (!clean) {
    return { valid: false, isRecommendedScheme: false, message: 'Empty URI provided.' };
  }

  // mailto:
  if (clean.startsWith('mailto:')) {
    const email = clean.substring(7);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return {
      valid: validEmail,
      scheme: 'mailto',
      isRecommendedScheme: true,
      message: validEmail ? undefined : `Invalid email address in mailto URI: "${email}".`,
    };
  }

  // tel:
  if (clean.startsWith('tel:')) {
    const phone = clean.substring(4);
    const validPhone = /^\+?[0-9.\-\s()]{3,25}$/.test(phone);
    return {
      valid: validPhone,
      scheme: 'tel',
      isRecommendedScheme: true,
      message: validPhone ? undefined : `Invalid phone number in tel URI: "${phone}".`,
    };
  }

  try {
    const parsed = new URL(clean);
    const scheme = parsed.protocol.replace(':', '').toLowerCase();
    const isRecommended = scheme === 'https' || scheme === 'http';
    return {
      valid: true,
      scheme,
      isRecommendedScheme: isRecommended,
      message: isRecommended
        ? undefined
        : `URI scheme "${scheme}" is allowed by RFC 3986, but only https, http, mailto, and tel are recommended by RFC 10023.`,
    };
  } catch {
    return {
      valid: false,
      isRecommendedScheme: false,
      message: `Invalid URI syntax: "${clean}". Must be an absolute URI adhering to RFC 3986.`,
    };
  }
}

/**
 * Validates ftxt / fcod tags (1*239 OCTET)
 */
export function validateOctetTag(tag: 'ftxt' | 'fcod', value: string): { valid: boolean; byteLength: number; message?: string } {
  const byteLength = getUtf8ByteLength(value);
  if (byteLength < 1) {
    return { valid: false, byteLength, message: `Tag "${tag}" must contain at least 1 octet.` };
  }
  if (byteLength > 239) {
    return {
      valid: false,
      byteLength,
      message: `Tag "${tag}" exceeds 239 octets limit (${byteLength} bytes).`,
    };
  }
  return { valid: true, byteLength };
}

/**
 * Comprehensive parser for RFC 10023 DNS TXT records.
 * Adheres strictly to RFC 10023:
 * - One tag-value pair per record
 * - Multiple records in a single RRset
 * - Distinguishes between:
 *   1. DNS Query Status (NOERROR, NXDOMAIN, NODATA, etc.)
 *   2. Sale signal (v=FORSALE1; present)
 *   3. Content validity (ABNF syntax)
 */
export function parseRfc10023Records(
  rawTxtRecords: string[],
  dnsQueryStatus: DnsQueryStatus = 'NOERROR',
  lang: 'de' | 'en' = 'de'
): RfcValidationReport {
  const isEn = lang === 'en';

  // 1. Handle DNS query errors
  if (dnsQueryStatus === 'NXDOMAIN') {
    return {
      dnsStatus: 'NXDOMAIN',
      dnsStatusMessage: isEn
        ? 'Domain does not exist in DNS (NXDOMAIN).'
        : 'Domain existiert nicht im DNS (NXDOMAIN).',
      saleSignalFound: false,
      saleSignalMessage: isEn ? 'No sale signal possible (NXDOMAIN).' : 'Kein Verkaufssignal möglich (Domain existiert nicht).',
      status: 'nxdomain',
      statusMessage: isEn ? 'Domain does not exist (NXDOMAIN).' : 'Domain existiert nicht (NXDOMAIN).',
      architecture: 'unknown',
      architectureLabel: isEn ? 'Not applicable' : 'Nicht zutreffend',
      rawRecords: [],
      recordAnalyses: [],
      tags: [],
      parsedMap: {},
      warnings: [],
      errors: [isEn ? 'DNS query returned NXDOMAIN.' : 'DNS-Abfrage ergab NXDOMAIN (Name existiert nicht).'],
      extensionTags: [],
      byteOverheadTotal: 0,
    };
  }

  if (dnsQueryStatus === 'SERVFAIL' || dnsQueryStatus === 'TIMEOUT' || dnsQueryStatus === 'ERROR') {
    return {
      dnsStatus: dnsQueryStatus,
      dnsStatusMessage: isEn
        ? `DNS lookup failed (${dnsQueryStatus}).`
        : `DNS-Abfrage fehlgeschlagen (${dnsQueryStatus}).`,
      saleSignalFound: false,
      saleSignalMessage: isEn ? 'Query inconclusive due to DNS error.' : 'Ergebnis unbestimmt wegen DNS-Fehler.',
      status: 'error',
      statusMessage: isEn ? `DNS resolver error (${dnsQueryStatus}).` : `DNS-Serverfehler (${dnsQueryStatus}).`,
      architecture: 'unknown',
      architectureLabel: isEn ? 'Query error' : 'Abfragefehler',
      rawRecords: [],
      recordAnalyses: [],
      tags: [],
      parsedMap: {},
      warnings: [],
      errors: [isEn ? `Resolver reported ${dnsQueryStatus}.` : `Resolver meldete ${dnsQueryStatus}.`],
      extensionTags: [],
      byteOverheadTotal: 0,
    };
  }

  // 2. Handle NODATA / Empty TXT RRset
  if (!rawTxtRecords || rawTxtRecords.length === 0) {
    return {
      dnsStatus: 'NODATA',
      dnsStatusMessage: isEn
        ? 'Domain exists (NOERROR), but no TXT record found at _for-sale node.'
        : 'Domain existiert (NOERROR), aber kein TXT-Eintrag unter _for-sale vorhanden.',
      saleSignalFound: false,
      saleSignalMessage: isEn
        ? 'No _for-sale record published. Domain is not signaling availability via DNS.'
        : 'Kein _for-sale Eintrag hinterlegt. Die Domain signalisiert im DNS keine Verkaufsabsicht.',
      status: 'not_found',
      statusMessage: isEn ? 'No _for-sale record found.' : 'Kein _for-sale-Eintrag gefunden.',
      architecture: 'unknown',
      architectureLabel: isEn ? 'No record' : 'Kein Eintrag',
      rawRecords: [],
      recordAnalyses: [],
      tags: [],
      parsedMap: {},
      warnings: [],
      errors: [],
      extensionTags: [],
      byteOverheadTotal: 0,
    };
  }

  // 3. Process records
  const recordAnalyses: RfcRecordAnalysis[] = [];
  const allTags: RfcTagItem[] = [];
  const parsedMap: Record<string, string> = {};
  const seenTagValues = new Set<string>();
  const extensionTags: string[] = [];
  const globalWarnings: string[] = [];
  const globalErrors: string[] = [];

  let hasVersionTagOverall = false;
  let totalBytes = 0;
  let hasSingleLineMultiTagDeviation = false;

  rawTxtRecords.forEach((rawStr, recIdx) => {
    const cleanStr = rawStr.trim();
    const byteLength = getUtf8ByteLength(cleanStr);
    totalBytes += byteLength;
    const exceeds255Bytes = byteLength > 255;

    const recWarnings: string[] = [];
    const recErrors: string[] = [];
    const recTags: RfcTagItem[] = [];

    if (exceeds255Bytes) {
      recWarnings.push(
        isEn
          ? `Record exceeds DNS single character-string limit of 255 octets (${byteLength} bytes).`
          : `Eintrag überschreitet das DNS TXT-Limit von 255 Oktetten (${byteLength} Bytes).`
      );
    }

    // Check version prefix
    const hasVersionTag = cleanStr.startsWith('v=FORSALE1;');
    if (hasVersionTag) {
      hasVersionTagOverall = true;
    } else if (cleanStr === 'v=FORSALE1' || cleanStr.startsWith('v=FORSALE1')) {
      recWarnings.push(
        isEn
          ? 'Version tag is missing trailing semicolon. RFC 10023 requires %s"v=FORSALE1;".'
          : 'Dem Versions-Tag fehlt das schließende Semikolon. RFC 10023 verlangt exakt %s"v=FORSALE1;".'
      );
      hasVersionTagOverall = true;
    } else {
      recWarnings.push(
        isEn
          ? 'Record does not start with mandatory version tag "v=FORSALE1;". Processors will ignore this line.'
          : 'Eintrag beginnt nicht mit dem Pflicht-Header "v=FORSALE1;". Dieser Eintrag wird von RFC-10023-Parsern ignoriert.'
      );
    }

    // Parse content after "v=FORSALE1;"
    if (hasVersionTag) {
      const remainder = cleanStr.substring('v=FORSALE1;'.length).trim();
      if (!remainder) {
        // Bare version tag, valid per RFC 10023 Section 2.1
      } else {
        // Check if there are multiple semicolons (Single-line multi-tag non-conformant construct)
        const parts = remainder.split(';').map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          hasSingleLineMultiTagDeviation = true;
          recWarnings.push(
            isEn
              ? 'Non-conformant: Record contains multiple tag-value pairs in one line. RFC 10023 § 2.1 permits only one tag-value pair per TXT record.'
              : 'Nicht konform: Eintrag enthält mehrere Tags in einer Zeile. RFC 10023 § 2.1 erlaubt nur genau ein Tag-Wert-Paar pro TXT-Eintrag.'
          );
        }

        parts.forEach((part) => {
          const eqIdx = part.indexOf('=');
          if (eqIdx === -1) {
            recErrors.push(
              isEn ? `Malformed tag syntax: "${part}" (missing "=")` : `Fehlerhafte Tag-Syntax: "${part}" (kein "=" vorhanden)`
            );
            return;
          }

          const tagKey = part.substring(0, eqIdx).trim().toLowerCase();
          const tagVal = part.substring(eqIdx + 1).trim();
          const isStandard = (STANDARD_CONTENT_TAGS as readonly string[]).includes(tagKey as StandardContentTag);

          const tagValueKey = `${tagKey}=${tagVal}`;
          const isDuplicate = seenTagValues.has(tagValueKey);
          seenTagValues.add(tagValueKey);

          if (isDuplicate) {
            recWarnings.push(
              isEn
                ? `Duplicate tag-value pair "${tagValueKey}" in RRset.`
                : `Doppeltes Tag-Wert-Paar "${tagValueKey}" im RRset.`
            );
          }

          let isValid = true;
          let validationMessage: string | undefined;
          let parsedDetails: RfcTagItem['parsedDetails'] = undefined;

          if (tagKey === 'fval') {
            const res = validateFvalTag(tagVal);
            isValid = res.valid;
            validationMessage = res.message;
            parsedDetails = { currency: res.currency, amount: res.amount };
          } else if (tagKey === 'furi') {
            const res = validateFuriTag(tagVal);
            isValid = res.valid;
            validationMessage = res.message;
            parsedDetails = { scheme: res.scheme };
          } else if (tagKey === 'ftxt' || tagKey === 'fcod') {
            const res = validateOctetTag(tagKey, tagVal);
            isValid = res.valid;
            validationMessage = res.message;
          } else {
            // Extension tag
            if (!extensionTags.includes(tagKey)) {
              extensionTags.push(tagKey);
            }
            validationMessage = isEn
              ? `Non-standard extension tag "${tagKey}". Standard processors will ignore this.`
              : `Nicht standardisiertes Erweiterungs-Tag "${tagKey}". Standard-Resolver ignorieren diesen Tag.`;
          }

          const tagItem: RfcTagItem = {
            tag: tagKey,
            value: tagVal,
            sourceRecordIndex: recIdx,
            isStandard,
            isDuplicate,
            isValid,
            validationMessage,
            parsedDetails,
          };

          recTags.push(tagItem);
          allTags.push(tagItem);

          if (!parsedMap[tagKey]) {
            parsedMap[tagKey] = tagVal;
          }
        });
      }
    }

    recordAnalyses.push({
      recordIndex: recIdx,
      rawText: rawStr,
      byteLength,
      exceeds255Bytes,
      hasVersionTag,
      isSingleLineMultiTag: recWarnings.some((w) => w.includes('Multiple tag-value') || w.includes('mehrere Tags')),
      tags: recTags,
      warnings: recWarnings,
      errors: recErrors,
    });
  });

  // Collect all warnings and errors
  recordAnalyses.forEach((r) => {
    r.warnings.forEach((w) => globalWarnings.push(w));
    r.errors.forEach((e) => globalErrors.push(e));
  });

  // Determine overall status
  const saleSignalFound = hasVersionTagOverall;
  let status: 'valid' | 'warning' | 'not_found' | 'error' = 'valid';

  if (!saleSignalFound) {
    status = 'not_found';
    globalErrors.push(
      isEn
        ? 'No valid RFC 10023 version tag ("v=FORSALE1;") found in RRset.'
        : 'Kein gültiger RFC 10023 Versions-Header ("v=FORSALE1;") im RRset gefunden.'
    );
  } else if (hasSingleLineMultiTagDeviation || globalErrors.length > 0 || allTags.some((t) => !t.isValid)) {
    status = 'warning';
  }

  let architecture: RfcValidationReport['architecture'] = 'unknown';
  let architectureLabel = isEn ? 'Unknown' : 'Unbekannt';

  if (!saleSignalFound) {
    architecture = 'unknown';
    architectureLabel = isEn ? 'No Sale Signal' : 'Kein Verkaufssignal';
  } else if (hasSingleLineMultiTagDeviation) {
    architecture = 'single_line_deviation';
    architectureLabel = isEn ? 'Single-line deviation (non-conformant)' : 'Single-Line Abweichung (nicht normkonform)';
  } else if (allTags.length === 0) {
    architecture = 'empty_signal';
    architectureLabel = isEn ? 'Bare Signal (v=FORSALE1; only)' : 'Reines Verkaufssignal (nur v=FORSALE1;)';
  } else {
    architecture = 'ietf_multi';
    architectureLabel = isEn
      ? `Multi-Record RRset (${rawTxtRecords.length} lines, standard conformant)`
      : `Multi-Record RRset (${rawTxtRecords.length} Zeilen, IETF-konform)`;
  }

  const saleSignalMessage = saleSignalFound
    ? (isEn ? 'Sale signal discovered: Domain is offered for purchase.' : 'Verkaufssignal vorhanden: Domain steht zum Verkauf.')
    : (isEn ? 'No sale signal discovered.' : 'Kein Verkaufssignal im DNS gefunden.');

  let statusMessage = '';
  if (status === 'valid') {
    statusMessage = isEn
      ? 'Fully conformant RFC 10023 sale offer in DNS.'
      : 'Vollständig IETF-konformes RFC 10023 Verkaufsangebot im DNS aktiv.';
  } else if (status === 'warning') {
    statusMessage = isEn
      ? 'Sale signal active, but format exhibits deviations or warnings.'
      : 'Verkaufssignal aktiv, aber Format weist Abweichungen oder Warnungen auf.';
  } else {
    statusMessage = isEn
      ? 'No valid RFC 10023 indicator found.'
      : 'Kein gültiger RFC 10023 Indikator gefunden.';
  }

  return {
    dnsStatus: 'NOERROR',
    dnsStatusMessage: isEn ? 'Query completed successfully (NOERROR).' : 'DNS-Abfrage erfolgreich (NOERROR).',
    saleSignalFound,
    saleSignalMessage,
    status,
    statusMessage,
    architecture,
    architectureLabel,
    rawRecords: rawTxtRecords,
    recordAnalyses,
    tags: allTags,
    parsedMap,
    warnings: globalWarnings,
    errors: globalErrors,
    extensionTags,
    byteOverheadTotal: totalBytes,
  };
}
