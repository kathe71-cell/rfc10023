// RFC 10023 Reference Parser Engine
// Authoritative IETF Standards Track RFC 10023 parsing and validation logic

export interface RfcTagItem {
  tag: string;
  value: string;
  sourceRecordIndex: number;
  isStandard: boolean;
  isDuplicate?: boolean;
}

export interface RfcValidationReport {
  status: 'valid' | 'warning' | 'not_found' | 'error';
  statusMessage: string;
  architecture: 'ietf_multi' | 'single_line' | 'unknown';
  architectureLabel: string;
  foundForsaleVersion: boolean;
  rawRecords: string[];
  tags: RfcTagItem[];
  parsedMap: Record<string, string>;
  warnings: string[];
  errors: string[];
  extensionTags: string[];
  byteOverheadTotal: number;
}

// Officially recognized tags under RFC 10023
export const STANDARD_TAGS = ['v', 'fval', 'furi', 'ftxt'] as const;
export type StandardTag = typeof STANDARD_TAGS[number];

// Common ISO 4217 currency codes
export const ISO_4217_CODES = new Set([
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL',
  'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS',
  'MXN', 'ZAR', 'TRY', 'AED', 'SAR', 'KRW', 'THB', 'IDR', 'MYR', 'PHP'
]);

/**
 * Validates price string according to RFC 10023 Section 2.2:
 * Must be 3-letter currency code (ISO 4217) followed immediately by positive integer.
 * Or special value 'VHB' (German aftermarket custom).
 */
export function validatePriceTag(value: string): { valid: boolean; currency?: string; amount?: number; message?: string } {
  const clean = value.trim();
  if (clean.toUpperCase() === 'VHB') {
    return { valid: true, message: 'Verhandlungsbasis (VHB)' };
  }

  const match = clean.match(/^([a-zA-Z]{3}):?(\d+)$/);
  if (!match) {
    return {
      valid: false,
      message: `Invalid format: "${clean}". Expected 3-letter currency code directly followed by integer (e.g. EUR2500 or USD100000).`
    };
  }

  const currency = match[1].toUpperCase();
  const amount = parseInt(match[2], 10);

  if (!ISO_4217_CODES.has(currency)) {
    return {
      valid: false,
      currency,
      amount,
      message: `"${currency}" is not a recognized ISO 4217 currency code.`
    };
  }

  return { valid: true, currency, amount };
}

/**
 * Validates URI according to RFC 3986.
 * Checks for permitted schemes (https, http, mailto, tel).
 */
export function validateUriTag(value: string): { valid: boolean; scheme?: string; message?: string } {
  const clean = value.trim();
  
  if (clean.startsWith('mailto:')) {
    const email = clean.substring(7);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    return {
      valid: validEmail,
      scheme: 'mailto',
      message: validEmail ? undefined : `Invalid email address in mailto URI: "${email}"`
    };
  }

  if (clean.startsWith('tel:')) {
    return { valid: true, scheme: 'tel' };
  }

  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return {
        valid: false,
        scheme: parsed.protocol,
        message: `Unsupported URI scheme "${parsed.protocol}". Expected https:// or mailto:.`
      };
    }
    return { valid: true, scheme: parsed.protocol.replace(':', '') };
  } catch {
    return {
      valid: false,
      message: `Invalid URI syntax: "${clean}". Must be an absolute URI (RFC 3986).`
    };
  }
}

/**
 * Full RFC 10023 Wire Parser & Validator.
 * Handles single-line, multi-line, duplicate detection, UTF-8 length checks, and extension tags.
 */
export function parseRfc10023Records(
  rawTxtRecords: string[],
  lang: 'de' | 'en' = 'de'
): RfcValidationReport {
  if (!rawTxtRecords || rawTxtRecords.length === 0) {
    return {
      status: 'not_found',
      statusMessage: lang === 'en' ? 'No TXT records found.' : 'Keine TXT-Einträge gefunden.',
      architecture: 'unknown',
      architectureLabel: lang === 'en' ? 'None' : 'Keine',
      foundForsaleVersion: false,
      rawRecords: [],
      tags: [],
      parsedMap: {},
      warnings: [],
      errors: [lang === 'en' ? 'No DNS resource record present at leaf node.' : 'Kein DNS-Eintrag am Knotennamen vorhanden.'],
      extensionTags: [],
      byteOverheadTotal: 0,
    };
  }

  const tags: RfcTagItem[] = [];
  const parsedMap: Record<string, string> = {};
  const tagCounts: Record<string, number> = {};
  const warnings: string[] = [];
  const errors: string[] = [];
  const extensionTags: string[] = [];
  let foundForsaleVersion = false;
  let totalBytes = 0;

  rawTxtRecords.forEach((rawStr, recIdx) => {
    const cleanStr = rawStr.trim();
    const byteLen = new TextEncoder().encode(cleanStr).length;
    totalBytes += byteLen;

    // Check 255 byte DNS TXT character string limit
    if (byteLen > 255) {
      warnings.push(
        lang === 'en'
          ? `Record #${recIdx + 1} exceeds standard DNS TXT single-string limit of 255 bytes (${byteLen} bytes). Ensure DNS server chunks it properly.`
          : `Eintrag #${recIdx + 1} überschreitet das reguläre DNS TXT 255-Byte-Limit (${byteLen} Bytes). Der Nameserver muss dies in Chunks aufteilen.`
      );
    }

    if (cleanStr.startsWith('v=FORSALE1;') || cleanStr === 'v=FORSALE1' || cleanStr.startsWith('v=FORSALE1')) {
      foundForsaleVersion = true;
    }

    const segments = cleanStr.split(';').map((s) => s.trim()).filter(Boolean);

    segments.forEach((seg) => {
      const eqIdx = seg.indexOf('=');
      if (eqIdx !== -1) {
        const key = seg.substring(0, eqIdx).trim().toLowerCase();
        const val = seg.substring(eqIdx + 1).trim();
        const isStd = (STANDARD_TAGS as readonly string[]).includes(key);

        tagCounts[key] = (tagCounts[key] || 0) + 1;
        const isDuplicate = tagCounts[key] > 1;

        tags.push({
          tag: key,
          value: val,
          sourceRecordIndex: recIdx,
          isStandard: isStd,
          isDuplicate,
        });

        if (!isStd && !extensionTags.includes(key)) {
          extensionTags.push(key);
        }

        if (!parsedMap[key]) {
          parsedMap[key] = val;
        } else if (isDuplicate && key !== 'v') {
          warnings.push(
            lang === 'en'
              ? `Duplicate tag detected: "${key}" defined multiple times with conflicting values ("${parsedMap[key]}" vs "${val}"). Resolvers will pick the first entry.`
              : `Doppelter Tag erkannt: "${key}" wurde mehrfach vergeben ("${parsedMap[key]}" vs "${val}"). Resolver werten den ersten Eintrag aus.`
          );
        }
      }
    });
  });

  // Evaluate Version Tag
  if (!foundForsaleVersion) {
    errors.push(
      lang === 'en'
        ? 'Missing mandatory protocol header "v=FORSALE1;". Records without this prefix are ignored by RFC 10023 parsers.'
        : 'Der erforderliche Versions-Header "v=FORSALE1;" fehlt. Einträge ohne dieses Tag werden von RFC-10023-Parsern ignoriert.'
    );
  }

  // Evaluate Content completeness
  if (!parsedMap.fval && !parsedMap.furi && !parsedMap.ftxt) {
    warnings.push(
      lang === 'en'
        ? 'No actionable tags: Record contains neither price (fval), contact (furi), nor comments (ftxt).'
        : 'Keine Aktionsdaten: Der Eintrag enthält weder Preis (fval), Kontakt (furi) noch Notiz (ftxt).'
    );
  }

  // Validate Price tag (fval)
  if (parsedMap.fval) {
    const priceCheck = validatePriceTag(parsedMap.fval);
    if (!priceCheck.valid && priceCheck.message) {
      warnings.push(
        lang === 'en'
          ? `Price tag (fval): ${priceCheck.message}`
          : `Preisangabe (fval): ${priceCheck.message}`
      );
    }
  }

  // Validate Contact tag (furi)
  if (parsedMap.furi) {
    const uriCheck = validateUriTag(parsedMap.furi);
    if (!uriCheck.valid && uriCheck.message) {
      warnings.push(
        lang === 'en'
          ? `Contact URI (furi): ${uriCheck.message}`
          : `Kontakt-URI (furi): ${uriCheck.message}`
      );
    }
  }

  // Extension tags informative warning
  if (extensionTags.length > 0) {
    warnings.push(
      lang === 'en'
        ? `Non-standard extension tag(s) discovered: ${extensionTags.join(', ')}. Standard resolvers will safely ignore these.`
        : `Zusätzliche Erweiterungs-Tags erkannt: ${extensionTags.join(', ')}. Standard-Resolver ignorieren diese tolerant.`
    );
  }

  const isMulti = rawTxtRecords.length > 1;
  const architecture: 'ietf_multi' | 'single_line' = isMulti ? 'ietf_multi' : 'single_line';
  const architectureLabel = isMulti
    ? (lang === 'en' ? `Multi-record RRset (${rawTxtRecords.length} TXT lines)` : `Mehrzeiliger IETF-Standard (${rawTxtRecords.length} TXT-Zeilen)`)
    : (lang === 'en' ? 'Single-line Record (1 TXT line)' : 'Einzeiliger Eintrag (1 TXT-Zeile)');

  let status: 'valid' | 'warning' = 'valid';
  if (!foundForsaleVersion) {
    status = 'warning';
  } else if (errors.length > 0) {
    status = 'warning';
  }

  const statusMessage = status === 'valid'
    ? (lang === 'en' ? 'Valid RFC 10023 sale offer discovered in DNS.' : 'Gültiges RFC 10023 Angebot im DNS gefunden.')
    : (lang === 'en' ? 'Record discovered, but exhibits deviations from the IETF standard.' : 'Eintrag im DNS gefunden, weicht aber teilweise vom IETF-Standard ab.');

  return {
    status,
    statusMessage,
    architecture,
    architectureLabel,
    foundForsaleVersion,
    rawRecords: rawTxtRecords,
    tags,
    parsedMap,
    warnings,
    errors,
    extensionTags,
    byteOverheadTotal: totalBytes,
  };
}
