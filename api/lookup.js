// src/utils/rfcParserEngine.ts
var STANDARD_CONTENT_TAGS = ["fval", "furi", "ftxt", "fcod"];
var KNOWN_CURRENCIES = /* @__PURE__ */ new Set([
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "CAD",
  "AUD",
  "JPY",
  "CNY",
  "INR",
  "BRL",
  "SGD",
  "HKD",
  "NZD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "ILS",
  "MXN",
  "ZAR",
  "TRY",
  "AED",
  "SAR",
  "KRW",
  "THB",
  "IDR",
  "MYR",
  "PHP",
  "BTC",
  "ETH",
  "SOL",
  "USDT",
  "USDC"
]);
function getUtf8ByteLength(str) {
  return new TextEncoder().encode(str).length;
}
function mergeDnsTxtChunks(rawTxt) {
  const trimmed = rawTxt.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const matches = [...trimmed.matchAll(/"((?:[^"\\]|\\.)*)"/g)];
    if (matches.length > 0) {
      return matches.map((m) => m[1]).join("");
    }
  }
  return trimmed;
}
function decodeDnsPresentationFormat(str) {
  const bytes = [];
  let i = 0;
  const encoder = new TextEncoder();
  while (i < str.length) {
    if (str[i] === "\\" && i + 1 < str.length) {
      if (i + 3 < str.length && /^\d{3}$/.test(str.substring(i + 1, i + 4))) {
        const byteVal = parseInt(str.substring(i + 1, i + 4), 10);
        if (byteVal <= 255) {
          bytes.push(byteVal);
          i += 4;
          continue;
        }
      }
      const nextChar = str[i + 1];
      const encoded = encoder.encode(nextChar);
      for (const b of encoded) bytes.push(b);
      i += 2;
    } else {
      const char = str[i];
      const encoded = encoder.encode(char);
      for (const b of encoded) bytes.push(b);
      i += 1;
    }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
}
function punycodeDecode(input) {
  const BASE = 36;
  const TMIN = 1;
  const TMAX = 26;
  const SKEW = 38;
  const DAMP = 700;
  const INITIAL_BIAS = 72;
  const INITIAL_N = 128;
  function adapt(delta, numpoints, firsttime) {
    let k = 0;
    delta = firsttime ? Math.floor(delta / DAMP) : Math.floor(delta / 2);
    delta += Math.floor(delta / numpoints);
    while (delta > Math.floor((BASE - TMIN) * TMAX / 2)) {
      delta = Math.floor(delta / (BASE - TMIN));
      k += BASE;
    }
    return k + Math.floor((BASE - TMIN + 1) * delta / (delta + SKEW));
  }
  const output = [];
  const basicMatch = input.lastIndexOf("-");
  let i = 0;
  let n = INITIAL_N;
  let bias = INITIAL_BIAS;
  const basic = basicMatch > 0 ? input.substring(0, basicMatch) : "";
  for (let j = 0; j < basic.length; j++) {
    output.push(basic.charCodeAt(j));
  }
  let index = basicMatch > 0 ? basicMatch + 1 : 0;
  while (index < input.length) {
    const oldi = i;
    let w = 1;
    let k = BASE;
    while (true) {
      if (index >= input.length) return input;
      const char = input.charCodeAt(index++);
      let digit;
      if (char >= 48 && char <= 57) digit = char - 22;
      else if (char >= 65 && char <= 90) digit = char - 65;
      else if (char >= 97 && char <= 122) digit = char - 97;
      else return input;
      i += digit * w;
      const t = k <= bias ? TMIN : k >= bias + TMAX ? TMAX : k - bias;
      if (digit < t) break;
      w *= BASE - t;
      k += BASE;
    }
    bias = adapt(i - oldi, output.length + 1, oldi === 0);
    n += Math.floor(i / (output.length + 1));
    i %= output.length + 1;
    output.splice(i, 0, n);
    i++;
  }
  return String.fromCodePoint(...output);
}
function idnToUnicode(domainOrHostname) {
  return domainOrHostname.split(".").map((part) => part.toLowerCase().startsWith("xn--") ? punycodeDecode(part.slice(4)) : part).join(".");
}
function unicodeToPunycode(domainOrHostname) {
  try {
    return new URL(`https://${domainOrHostname}`).hostname;
  } catch {
    return domainOrHostname;
  }
}
function detectMixedScript(str) {
  const hasLatin = /[a-zA-Z]/.test(str);
  const hasCyrillic = /[\u0400-\u04FF]/.test(str);
  const hasGreek = /[\u0370-\u03FF]/.test(str);
  const hasArabic = /[\u0600-\u06FF]/.test(str);
  const hasHebrew = /[\u0590-\u05FF]/.test(str);
  const scriptCount = [hasLatin, hasCyrillic, hasGreek, hasArabic, hasHebrew].filter(Boolean).length;
  if (scriptCount > 1) return true;
  if (/[\u200B-\u200D\uFEFF\u202A-\u202E]/.test(str)) return true;
  return false;
}
function validateFvalTag(value) {
  const clean = value.trim();
  if (clean.length < 2 || clean.length > 239) {
    return {
      valid: false,
      message: `fval length must be between 2 and 239 characters (was ${clean.length}).`
    };
  }
  const match = clean.match(/^([A-Z]+)(\d+(?:\.\d+)?)$/);
  if (!match) {
    return {
      valid: false,
      message: `Invalid fval syntax: "${clean}". Expected uppercase currency followed directly by amount (e.g. EUR2500 or USD99.50).`
    };
  }
  const currency = match[1];
  const rawAmount = match[2];
  const amount = parseFloat(rawAmount);
  let message;
  if (!KNOWN_CURRENCIES.has(currency)) {
    message = `Currency code "${currency}" is syntactically valid (uppercase letters), but not in standard ISO 4217 / crypto list.`;
  }
  return { valid: true, currency, amount, rawAmount, message };
}
function validateFuriTag(value) {
  const clean = value.trim();
  if (!clean) {
    return { valid: false, isRecommendedScheme: false, message: "Empty URI provided." };
  }
  if (clean.startsWith("mailto:")) {
    const email = clean.substring(7);
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const domainPart = email.split("@")[1] || "";
    const isIdn = domainPart.includes("xn--") || /[^\x00-\x7F]/.test(domainPart);
    const uLabel = isIdn ? idnToUnicode(domainPart) : void 0;
    const aLabel = isIdn ? unicodeToPunycode(domainPart) : void 0;
    const hasMixedScript = isIdn ? detectMixedScript(domainPart) : false;
    let message;
    if (!validEmail) {
      message = `Invalid email address in mailto URI: "${email}".`;
    } else if (hasMixedScript) {
      message = `Security Alert: Mixed-script IDN detected in mailto domain (${domainPart}). Potential homograph spoofing risk.`;
    }
    return {
      valid: validEmail,
      scheme: "mailto",
      isRecommendedScheme: true,
      uLabel,
      aLabel,
      isIdn,
      hasMixedScript,
      message
    };
  }
  if (clean.startsWith("tel:")) {
    const phone = clean.substring(4);
    const validPhone = /^\+?[0-9.\-\s()]{3,25}$/.test(phone);
    return {
      valid: validPhone,
      scheme: "tel",
      isRecommendedScheme: true,
      message: validPhone ? void 0 : `Invalid phone number in tel URI: "${phone}".`
    };
  }
  try {
    const parsed = new URL(clean);
    const scheme = parsed.protocol.replace(":", "").toLowerCase();
    const isRecommended = scheme === "https" || scheme === "http";
    const hostname = parsed.hostname;
    const isIdn = hostname.includes("xn--") || /[^\x00-\x7F]/.test(clean);
    const uLabel = isIdn ? idnToUnicode(hostname) : void 0;
    const aLabel = isIdn ? hostname : void 0;
    const hasMixedScript = isIdn ? detectMixedScript(uLabel || hostname) : false;
    let message;
    if (!isRecommended) {
      message = `URI scheme "${scheme}" is allowed by RFC 3986, but only https, http, mailto, and tel are recommended by RFC 10023.`;
    } else if (hasMixedScript) {
      message = `Security Alert: Mixed-script IDN detected (${uLabel}). Potential homograph spoofing risk. Canonical A-label: ${hostname}`;
    }
    return {
      valid: true,
      scheme,
      isRecommendedScheme: isRecommended,
      uLabel,
      aLabel,
      isIdn,
      hasMixedScript,
      message
    };
  } catch {
    return {
      valid: false,
      isRecommendedScheme: false,
      message: `Invalid URI syntax: "${clean}". Must be an absolute URI adhering to RFC 3986.`
    };
  }
}
function validateOctetTag(tag, value) {
  const byteLength = getUtf8ByteLength(value);
  if (byteLength < 1) {
    return { valid: false, byteLength, message: `Tag "${tag}" must contain at least 1 octet.` };
  }
  if (byteLength > 239) {
    return {
      valid: false,
      byteLength,
      message: `Tag "${tag}" exceeds 239 octets limit (${byteLength} bytes).`
    };
  }
  return { valid: true, byteLength };
}
function parseRfc10023Records(rawTxtRecords, dnsQueryStatus = "NOERROR", lang = "de") {
  const isEn = lang === "en";
  if (dnsQueryStatus === "NXDOMAIN") {
    return {
      dnsStatus: "NXDOMAIN",
      dnsStatusMessage: isEn ? "Domain does not exist in DNS (NXDOMAIN)." : "Domain existiert nicht im DNS (NXDOMAIN).",
      saleSignalFound: false,
      saleSignalMessage: isEn ? "No sale signal possible (NXDOMAIN)." : "Kein Verkaufssignal m\xF6glich (Domain existiert nicht).",
      status: "nxdomain",
      statusMessage: isEn ? "Domain does not exist (NXDOMAIN)." : "Domain existiert nicht (NXDOMAIN).",
      architecture: "unknown",
      architectureLabel: isEn ? "Not applicable" : "Nicht zutreffend",
      rawRecords: [],
      decodedRecords: [],
      hasPresentationEscapes: false,
      recordAnalyses: [],
      tags: [],
      parsedMap: {},
      warnings: [],
      errors: [isEn ? "DNS query returned NXDOMAIN." : "DNS-Abfrage ergab NXDOMAIN (Name existiert nicht)."],
      extensionTags: [],
      byteOverheadTotal: 0
    };
  }
  if (dnsQueryStatus === "SERVFAIL" || dnsQueryStatus === "TIMEOUT" || dnsQueryStatus === "ERROR") {
    return {
      dnsStatus: dnsQueryStatus,
      dnsStatusMessage: isEn ? `DNS lookup failed (${dnsQueryStatus}).` : `DNS-Abfrage fehlgeschlagen (${dnsQueryStatus}).`,
      saleSignalFound: false,
      saleSignalMessage: isEn ? "Query inconclusive due to DNS error." : "Ergebnis unbestimmt wegen DNS-Fehler.",
      status: "error",
      statusMessage: isEn ? `DNS resolver error (${dnsQueryStatus}).` : `DNS-Serverfehler (${dnsQueryStatus}).`,
      architecture: "unknown",
      architectureLabel: isEn ? "Query error" : "Abfragefehler",
      rawRecords: [],
      decodedRecords: [],
      hasPresentationEscapes: false,
      recordAnalyses: [],
      tags: [],
      parsedMap: {},
      warnings: [],
      errors: [isEn ? `Resolver reported ${dnsQueryStatus}.` : `Resolver meldete ${dnsQueryStatus}.`],
      extensionTags: [],
      byteOverheadTotal: 0
    };
  }
  if (!rawTxtRecords || rawTxtRecords.length === 0) {
    return {
      dnsStatus: "NODATA",
      dnsStatusMessage: isEn ? "Domain exists (NOERROR), but no TXT record found at _for-sale node." : "Domain existiert (NOERROR), aber kein TXT-Eintrag unter _for-sale vorhanden.",
      saleSignalFound: false,
      saleSignalMessage: isEn ? "No _for-sale record published. Domain is not signaling availability via DNS." : "Kein _for-sale Eintrag hinterlegt. Die Domain signalisiert im DNS keine Verkaufsabsicht.",
      status: "not_found",
      statusMessage: isEn ? "No _for-sale record found." : "Kein _for-sale-Eintrag gefunden.",
      architecture: "unknown",
      architectureLabel: isEn ? "No record" : "Kein Eintrag",
      rawRecords: [],
      decodedRecords: [],
      hasPresentationEscapes: false,
      recordAnalyses: [],
      tags: [],
      parsedMap: {},
      warnings: [],
      errors: [],
      extensionTags: [],
      byteOverheadTotal: 0
    };
  }
  const recordAnalyses = [];
  const allTags = [];
  const parsedMap = {};
  const seenTagValues = /* @__PURE__ */ new Set();
  const extensionTags = [];
  const globalWarnings = [];
  const globalErrors = [];
  let hasVersionTagOverall = false;
  let totalBytes = 0;
  let hasSingleLineMultiTagDeviation = false;
  rawTxtRecords.forEach((rawStr, recIdx) => {
    const mergedStr = mergeDnsTxtChunks(rawStr);
    const decodedStr = decodeDnsPresentationFormat(mergedStr);
    const hasDnsEscapes = decodedStr !== mergedStr;
    const cleanStr = decodedStr.trim();
    const byteLength = getUtf8ByteLength(cleanStr);
    totalBytes += byteLength;
    const exceeds255Bytes = byteLength > 255;
    const recWarnings = [];
    const recErrors = [];
    const recTags = [];
    if (hasDnsEscapes) {
      recWarnings.push(
        isEn ? "DNS presentation format escapes (RFC 1035 \xA7 5.1 \\DDD) decoded into UTF-8." : "DNS-Pr\xE4sentationsformat-Escapes (RFC 1035 \xA7 5.1 \\DDD) wurden in UTF-8 dekodiert."
      );
    }
    if (exceeds255Bytes) {
      recWarnings.push(
        isEn ? `Record exceeds DNS single character-string limit of 255 octets (${byteLength} bytes).` : `Eintrag \xFCberschreitet das DNS TXT-Limit von 255 Oktetten (${byteLength} Bytes).`
      );
    }
    const hasVersionTag = cleanStr.startsWith("v=FORSALE1;");
    if (hasVersionTag) {
      hasVersionTagOverall = true;
    } else if (cleanStr === "v=FORSALE1" || cleanStr.startsWith("v=FORSALE1")) {
      recWarnings.push(
        isEn ? 'Version tag is missing trailing semicolon. RFC 10023 requires %s"v=FORSALE1;".' : 'Dem Versions-Tag fehlt das schlie\xDFende Semikolon. RFC 10023 verlangt exakt %s"v=FORSALE1;".'
      );
      hasVersionTagOverall = true;
    } else {
      recWarnings.push(
        isEn ? 'Record does not start with mandatory version tag "v=FORSALE1;". Processors will ignore this line.' : 'Eintrag beginnt nicht mit dem Pflicht-Header "v=FORSALE1;". Dieser Eintrag wird von RFC-10023-Parsern ignoriert.'
      );
    }
    if (hasVersionTag) {
      const remainder = cleanStr.substring("v=FORSALE1;".length).trim();
      if (!remainder) {
      } else {
        const parts = remainder.split(";").map((p) => p.trim()).filter(Boolean);
        if (parts.length > 1) {
          hasSingleLineMultiTagDeviation = true;
          recWarnings.push(
            isEn ? "Non-conformant: Record contains multiple tag-value pairs in one line. RFC 10023 \xA7 2.1 permits only one tag-value pair per TXT record." : "Nicht konform: Eintrag enth\xE4lt mehrere Tags in einer Zeile. RFC 10023 \xA7 2.1 erlaubt nur genau ein Tag-Wert-Paar pro TXT-Eintrag."
          );
        }
        parts.forEach((part) => {
          const eqIdx = part.indexOf("=");
          if (eqIdx === -1) {
            recErrors.push(
              isEn ? `Malformed tag syntax: "${part}" (missing "=")` : `Fehlerhafte Tag-Syntax: "${part}" (kein "=" vorhanden)`
            );
            return;
          }
          const tagKey = part.substring(0, eqIdx).trim().toLowerCase();
          const tagVal = part.substring(eqIdx + 1).trim();
          const isStandard = STANDARD_CONTENT_TAGS.includes(tagKey);
          const tagValueKey = `${tagKey}=${tagVal}`;
          const isDuplicate = seenTagValues.has(tagValueKey);
          seenTagValues.add(tagValueKey);
          if (isDuplicate) {
            recWarnings.push(
              isEn ? `Duplicate tag-value pair "${tagValueKey}" in RRset.` : `Doppeltes Tag-Wert-Paar "${tagValueKey}" im RRset.`
            );
          }
          let isValid = true;
          let validationMessage;
          let parsedDetails = void 0;
          if (tagKey === "fval") {
            const res = validateFvalTag(tagVal);
            isValid = res.valid;
            validationMessage = res.message;
            parsedDetails = { currency: res.currency, amount: res.amount };
          } else if (tagKey === "furi") {
            const res = validateFuriTag(tagVal);
            isValid = res.valid;
            validationMessage = res.message;
            parsedDetails = {
              scheme: res.scheme,
              uLabel: res.uLabel,
              aLabel: res.aLabel,
              isIdn: res.isIdn,
              hasMixedScript: res.hasMixedScript
            };
            if (res.hasMixedScript) {
              recWarnings.push(
                isEn ? `Security warning: Mixed-script IDN detected in furi URI ("${tagVal}"). Potential homograph spoofing risk.` : `Sicherheitswarnung: Mixed-Script IDN in furi-URI erkannt ("${tagVal}"). M\xF6gliches Homograph-Angriffsrisiko.`
              );
            }
          } else if (tagKey === "ftxt" || tagKey === "fcod") {
            const res = validateOctetTag(tagKey, tagVal);
            isValid = res.valid;
            validationMessage = res.message;
          } else {
            if (!extensionTags.includes(tagKey)) {
              extensionTags.push(tagKey);
            }
            validationMessage = isEn ? `Non-standard extension tag "${tagKey}". Standard processors will ignore this.` : `Nicht standardisiertes Erweiterungs-Tag "${tagKey}". Standard-Resolver ignorieren diesen Tag.`;
          }
          const tagItem = {
            tag: tagKey,
            value: tagVal,
            sourceRecordIndex: recIdx,
            isStandard,
            isDuplicate,
            isValid,
            validationMessage,
            parsedDetails
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
      decodedText: decodedStr,
      byteLength,
      exceeds255Bytes,
      hasVersionTag,
      hasDnsEscapes,
      isSingleLineMultiTag: recWarnings.some((w) => w.includes("Multiple tag-value") || w.includes("mehrere Tags")),
      tags: recTags,
      warnings: recWarnings,
      errors: recErrors
    });
  });
  recordAnalyses.forEach((r) => {
    r.warnings.forEach((w) => globalWarnings.push(w));
    r.errors.forEach((e) => globalErrors.push(e));
  });
  const saleSignalFound = hasVersionTagOverall;
  let status = "valid";
  if (!saleSignalFound) {
    status = "not_found";
    globalErrors.push(
      isEn ? 'No valid RFC 10023 version tag ("v=FORSALE1;") found in RRset.' : 'Kein g\xFCltiger RFC 10023 Versions-Header ("v=FORSALE1;") im RRset gefunden.'
    );
  } else if (hasSingleLineMultiTagDeviation || globalErrors.length > 0 || allTags.some((t) => !t.isValid)) {
    status = "warning";
  }
  let architecture = "unknown";
  let architectureLabel = isEn ? "Unknown" : "Unbekannt";
  if (!saleSignalFound) {
    architecture = "unknown";
    architectureLabel = isEn ? "No Sale Signal" : "Kein Verkaufssignal";
  } else if (hasSingleLineMultiTagDeviation) {
    architecture = "single_line_deviation";
    architectureLabel = isEn ? "Single-line deviation (non-conformant)" : "Single-Line Abweichung (nicht normkonform)";
  } else if (allTags.length === 0) {
    architecture = "empty_signal";
    architectureLabel = isEn ? "Bare Signal (v=FORSALE1; only)" : "Reines Verkaufssignal (nur v=FORSALE1;)";
  } else {
    architecture = "ietf_multi";
    architectureLabel = isEn ? `Multi-Record RRset (${rawTxtRecords.length} lines, standard conformant)` : `Multi-Record RRset (${rawTxtRecords.length} Zeilen, IETF-konform)`;
  }
  const saleSignalMessage = saleSignalFound ? isEn ? "Sale signal discovered: Domain is offered for purchase." : "Verkaufssignal vorhanden: Domain steht zum Verkauf." : isEn ? "No sale signal discovered." : "Kein Verkaufssignal im DNS gefunden.";
  let statusMessage = "";
  if (status === "valid") {
    statusMessage = isEn ? "Fully conformant RFC 10023 sale offer in DNS." : "Vollst\xE4ndig IETF-konformes RFC 10023 Verkaufsangebot im DNS aktiv.";
  } else if (status === "warning") {
    statusMessage = isEn ? "Sale signal active, but format exhibits deviations or warnings." : "Verkaufssignal aktiv, aber Format weist Abweichungen oder Warnungen auf.";
  } else {
    statusMessage = isEn ? "No valid RFC 10023 indicator found." : "Kein g\xFCltiger RFC 10023 Indikator gefunden.";
  }
  const hasPresentationEscapes = recordAnalyses.some((r) => r.hasDnsEscapes);
  return {
    dnsStatus: "NOERROR",
    dnsStatusMessage: isEn ? "Query completed successfully (NOERROR)." : "DNS-Abfrage erfolgreich (NOERROR).",
    saleSignalFound,
    saleSignalMessage,
    status,
    statusMessage,
    architecture,
    architectureLabel,
    rawRecords: rawTxtRecords,
    decodedRecords: recordAnalyses.map((r) => r.decodedText),
    hasPresentationEscapes,
    recordAnalyses,
    tags: allTags,
    parsedMap,
    warnings: globalWarnings,
    errors: globalErrors,
    extensionTags,
    byteOverheadTotal: totalBytes
  };
}

// src/utils/dnsIntelligence.ts
var HOSTER_PATTERNS = [
  {
    regex: /hetzner\.(com|de)/i,
    profile: {
      id: "hetzner",
      name: "Hetzner DNS Console",
      instructions: 'In der Hetzner DNS Console (dns.hetzner.com) Zone \xF6ffnen, Record Typ "TXT", Name "_for-sale" und den generierten Wert eintragen.',
      multiRecordSupported: true,
      notes: "Hetzner erlaubt f\xFChrende Unterstriche (RFC 8552) ohne Warnung in der Web-Console sowie per DNS-API."
    }
  },
  {
    regex: /inwx\.(de|com|net)/i,
    profile: {
      id: "inwx",
      name: "INWX (InterNetworX)",
      instructions: 'Im INWX Domain-Center im Tab DNS-Eintr\xE4ge einen neuen TXT-Eintrag anlegen mit Name "_for-sale" und dem Wert.',
      multiRecordSupported: true,
      notes: "Multi-Record RRset und DNSSEC werden uneingeschr\xE4nkt unterst\xFCtzt."
    }
  },
  {
    regex: /cloudflare\.com/i,
    profile: {
      id: "cloudflare",
      name: "Cloudflare DNS",
      instructions: 'Im Cloudflare Dashboard unter DNS -> Records: Add record -> Typ "TXT", Name "_for-sale", Content eintragen (Content ohne Anf\xFChrungszeichen einf\xFCgen).',
      multiRecordSupported: true,
      notes: "Anycast-DNS mit schneller weltweiter Propagierung. TTL Auto oder 300s."
    }
  },
  {
    regex: /(ionos|1und1|ui-dns)\.(de|com|biz)/i,
    profile: {
      id: "ionos",
      name: "IONOS (1&1)",
      instructions: 'Im IONOS Kundencenter unter Domain -> DNS -> Eintrag hinzuf\xFCgen: Typ "TXT", Hostname "_for-sale", Wert einf\xFCgen.',
      multiRecordSupported: true,
      notes: "Falls der Standard-Editor Unterstriche blockiert, die IONOS DNS-API oder Expertenmodus nutzen."
    }
  },
  {
    regex: /strato\.(de|com)/i,
    profile: {
      id: "strato",
      name: "STRATO",
      instructions: 'Im STRATO Kunden-Login: Domains -> Domainverwaltung -> DNS-Einstellungen -> TXT-Records -> Pr\xE4fix "_for-sale" eintragen.',
      multiRecordSupported: true,
      notes: "Einige \xE4ltere Strato-Pakete erfordern den DNS-Expertenmodus f\xFCr f\xFChrende Unterstriche."
    }
  },
  {
    regex: /netcup\.(de|net)/i,
    profile: {
      id: "netcup",
      name: "Netcup CCP",
      instructions: 'Im Netcup Customer Control Panel (CCP) unter Domains -> DNS: Name/Host "_for-sale", Type "TXT", Destination eintragen.',
      multiRecordSupported: true,
      notes: "Der CCP DNS-Editor akzeptiert Unterstriche f\xFCr TXT-Records uneingeschr\xE4nkt."
    }
  },
  {
    regex: /awsdns/i,
    profile: {
      id: "route53",
      name: "AWS Route 53",
      instructions: 'In Route 53: Hosted Zone -> Create Record -> Name "_for-sale", Type "TXT", Value mit Anf\xFChrungszeichen.',
      multiRecordSupported: true,
      notes: "Bei mehreren Records jede Zeile in Anf\xFChrungszeichen in das Textfeld setzen."
    }
  },
  {
    regex: /ovh\.(net|de|com)/i,
    profile: {
      id: "ovh",
      name: "OVHcloud",
      instructions: 'Im OVH Manager unter Web Cloud -> Domains -> DNS-Zone -> Eintrag hinzuf\xFCgen: TXT, Subdomain "_for-sale".',
      multiRecordSupported: true,
      notes: "OVH Manager DNS-Zoneneditor unterst\xFCtzt Multi-Record TXT-Eintr\xE4ge."
    }
  }
];
function detectHosterFromNameservers(nameservers) {
  for (const ns of nameservers) {
    for (const item of HOSTER_PATTERNS) {
      if (item.regex.test(ns)) {
        return item.profile;
      }
    }
  }
  return null;
}
function cleanDomainInput(raw) {
  let d = raw.trim().toLowerCase();
  d = d.replace(/\s+/g, "");
  d = d.replace(/^https?:\/\//, "");
  d = d.replace(/^www\./, "");
  d = d.replace(/^_for-sale\./, "");
  d = d.split("/")[0];
  d = d.split(":")[0];
  return d;
}
function validateDomainHostname(raw) {
  if (!raw || typeof raw !== "string") {
    return {
      valid: false,
      cleanDomain: "",
      punyHost: "",
      error: 'Parameter "domain" oder "d" fehlt oder ist ung\xFCltig.',
      errorEn: "Missing or invalid domain parameter."
    };
  }
  const trimmed = raw.trim();
  if (trimmed.length > 253) {
    return {
      valid: false,
      cleanDomain: "",
      punyHost: "",
      error: "Ung\xFCltige Domain: Der Domainname darf maximal 253 Zeichen lang sein.",
      errorEn: "Invalid domain: Domain name may not exceed 253 characters."
    };
  }
  const clean = cleanDomainInput(trimmed);
  if (!clean || !clean.includes(".") || clean.length < 3 || clean.length > 253) {
    return {
      valid: false,
      cleanDomain: clean,
      punyHost: "",
      error: "Ung\xFCltiger Domainname \xFCbergeben.",
      errorEn: "Invalid domain syntax. Must contain a valid TLD."
    };
  }
  let punyHost = "";
  try {
    punyHost = new URL(`https://${clean}`).hostname;
  } catch {
    punyHost = clean;
  }
  const hostOctetLength = new TextEncoder().encode(punyHost).length;
  if (!punyHost || hostOctetLength > 253 || hostOctetLength < 3) {
    return {
      valid: false,
      cleanDomain: clean,
      punyHost,
      error: "Ung\xFCltige Domain: Der Domainname darf maximal 253 Zeichen lang sein.",
      errorEn: "Invalid domain: Domain name may not exceed 253 characters."
    };
  }
  const labels = punyHost.split(".");
  if (labels.length < 2) {
    return {
      valid: false,
      cleanDomain: clean,
      punyHost,
      error: "Ung\xFCltiger Domainname \xFCbergeben.",
      errorEn: "Invalid domain syntax. Must contain a valid TLD."
    };
  }
  for (const label of labels) {
    if (!label || label.length === 0) {
      return {
        valid: false,
        cleanDomain: clean,
        punyHost,
        error: "Ung\xFCltige Domain: Leeres DNS-Label erkannt.",
        errorEn: "Invalid domain: Empty DNS label detected."
      };
    }
    const labelOctetLength = new TextEncoder().encode(label).length;
    if (labelOctetLength > 63) {
      return {
        valid: false,
        cleanDomain: clean,
        punyHost,
        error: "Ung\xFCltige Domain: Ein DNS-Label darf maximal 63 Zeichen lang sein.",
        errorEn: "Invalid domain: A DNS label may not exceed 63 characters."
      };
    }
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)) {
      return {
        valid: false,
        cleanDomain: clean,
        punyHost,
        error: "Ung\xFCltige Domain: DNS-Label enth\xE4lt ung\xFCltige Zeichen.",
        errorEn: "Invalid domain: DNS label contains invalid characters."
      };
    }
  }
  return {
    valid: true,
    cleanDomain: clean,
    punyHost
  };
}

// api-src/lookup.ts
async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  const rawDomain = req.query.d || req.query.domain || "";
  if (!rawDomain) {
    return res.status(400).json({
      error: 'Parameter "domain" oder "d" fehlt. Beispiel: /api/lookup?d=beispieldomain.de',
      status: "error"
    });
  }
  const validation = validateDomainHostname(rawDomain);
  if (!validation.valid) {
    return res.status(400).json({
      error: validation.error || "Ung\xFCltiger Domainname \xFCbergeben.",
      status: "error"
    });
  }
  const domain = validation.cleanDomain;
  const punyHost = validation.punyHost;
  const leafNode = `_for-sale.${punyHost}`;
  let rawRecords = [];
  let isDnssec = false;
  let rcode = 0;
  const nameservers = [];
  try {
    const nsPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(punyHost)}&type=NS`, {
      headers: { Accept: "application/dns-json" }
    }).then(async (r) => {
      if (r.ok) {
        const json = await r.json();
        if (json.Answer && Array.isArray(json.Answer)) {
          json.Answer.forEach((a) => {
            if (a.type === 2 && a.data) {
              nameservers.push(a.data.replace(/\.$/, "").toLowerCase());
            }
          });
        }
      }
    }).catch(() => {
    });
    const txtPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(leafNode)}&type=TXT`, {
      headers: { Accept: "application/dns-json" }
    }).then(async (r) => {
      if (r.ok) {
        const json = await r.json();
        rcode = json.Status ?? 0;
        if (json.AD) isDnssec = true;
        if (json.Answer && Array.isArray(json.Answer)) {
          const txtAnswers = json.Answer.filter((a) => a.type === 16);
          rawRecords = txtAnswers.map((a) => a.data);
        }
      }
    });
    await Promise.all([nsPromise, txtPromise]);
    const hosterProfile = detectHosterFromNameservers(nameservers);
    const detectedHoster = hosterProfile ? hosterProfile.name : "Unbekannt / Eigener Nameserver";
    let dnsStatus = "NOERROR";
    if (rcode === 3) dnsStatus = "NXDOMAIN";
    else if (rcode === 2) dnsStatus = "SERVFAIL";
    else if (rawRecords.length === 0) dnsStatus = "NODATA";
    const report = parseRfc10023Records(rawRecords, dnsStatus, "de");
    const cleanParsedMap = {};
    for (const [k, v] of Object.entries(report.parsedMap)) {
      if (v !== void 0) cleanParsedMap[k] = v;
    }
    const payload = {
      domain,
      aLabel: punyHost !== domain ? punyHost : void 0,
      leafNode,
      status: report.status,
      dnsStatus: report.dnsStatus,
      statusMessage: report.statusMessage,
      dnssec: isDnssec,
      rawRecords: report.rawRecords,
      decodedRecords: report.decodedRecords,
      hasPresentationEscapes: report.hasPresentationEscapes,
      tags: cleanParsedMap,
      warnings: report.warnings,
      errors: report.errors,
      detectedHoster,
      nameservers,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      disclaimer: "rfc10023.de ist ein unabh\xE4ngiges Referenzportal. Daten basieren auf Anycast DNS-Abfragen (RFC 10023 Informational)."
    };
    return res.status(200).json(payload);
  } catch (_err) {
    return res.status(500).json({
      error: "DNS-Abfrage fehlgeschlagen. Bitte versuchen Sie es sp\xE4ter erneut.",
      status: "error"
    });
  }
}
export {
  handler as default
};
