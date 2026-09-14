import type { VercelRequest, VercelResponse } from '@vercel/node';

// Officially recognized tags under RFC 10023
const STANDARD_TAGS = ['v', 'fval', 'furi', 'ftxt'] as const;
const ISO_4217_CODES = new Set([
  'EUR', 'USD', 'GBP', 'CHF', 'CAD', 'AUD', 'JPY', 'CNY', 'INR', 'BRL',
  'SGD', 'HKD', 'NZD', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'ILS',
  'MXN', 'ZAR', 'TRY', 'AED', 'SAR', 'KRW', 'THB', 'IDR', 'MYR', 'PHP'
]);

interface TagItem {
  tag: string;
  value: string;
  sourceRecordIndex: number;
  isStandard: boolean;
  isDuplicate?: boolean;
}

interface ApiResponseV1 {
  apiVersion: '1.0';
  standard: 'IETF RFC 10023';
  domain: string;
  leafNode: string;
  status: 'valid' | 'warning' | 'not_found' | 'error';
  statusMessage: string;
  architecture: 'ietf_multi' | 'single_line' | 'unknown';
  dnssec: {
    authenticated: boolean;
    adFlag: boolean;
  };
  wire: {
    rawRecords: string[];
    recordCount: number;
    byteOverhead: number;
    ttl: number | null;
  };
  tags: {
    parsed: Record<string, string>;
    items: TagItem[];
    extensions: string[];
  };
  compliance: {
    hasVersionHeader: boolean;
    validPrice: boolean;
    validUri: boolean;
    warnings: string[];
    errors: string[];
  };
  infrastructure: {
    detectedHoster: string;
    nameservers: string[];
    resolver: string;
    latencyMs: number;
  };
  meta: {
    timestamp: string;
    documentation: string;
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Robots-Tag', 'noindex');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = performance.now();
  const rawDomain = (req.query.d || req.query.domain || '') as string;

  if (!rawDomain) {
    return res.status(400).json({
      apiVersion: '1.0',
      error: 'Missing domain parameter. Usage: /api/v1/validate?domain=example.com',
      status: 'error',
    });
  }

  let domain = rawDomain.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^_for-sale\./, '');
  domain = domain.split('/')[0].split(':')[0];

  if (!domain.includes('.')) {
    return res.status(400).json({
      apiVersion: '1.0',
      error: 'Invalid domain syntax. Must contain a valid TLD.',
      status: 'error',
    });
  }

  const leafNode = `_for-sale.${domain}`;
  let rawRecords: string[] = [];
  let isDnssec = false;
  let ttl: number | null = null;
  let rcode = 0;
  const nameservers: string[] = [];
  let resolverUsed = 'Cloudflare 1.1.1.1 Anycast';

  try {
    // 1. Query NS
    const nsPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=NS`, {
      headers: { Accept: 'application/dns-json' },
    }).then(async (r) => {
      if (r.ok) {
        const json = await r.json();
        if (json.Answer && Array.isArray(json.Answer)) {
          json.Answer.forEach((a: { type: number; data: string }) => {
            if (a.type === 2 && a.data) {
              nameservers.push(a.data.replace(/\.$/, '').toLowerCase());
            }
          });
        }
      }
    }).catch(() => {});

    // 2. Query Leaf TXT
    const txtPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(leafNode)}&type=TXT`, {
      headers: { Accept: 'application/dns-json' },
    }).then(async (r) => {
      if (r.ok) {
        const json = await r.json();
        rcode = json.Status ?? 0;
        if (json.AD) isDnssec = true;
        if (json.Answer && Array.isArray(json.Answer)) {
          const txtAnswers = json.Answer.filter((a: { type: number }) => a.type === 16);
          if (txtAnswers.length > 0 && txtAnswers[0].TTL !== undefined) {
            ttl = txtAnswers[0].TTL;
          }
          rawRecords = txtAnswers.map((a: { data: string }) => {
            let str = a.data.trim();
            if (str.startsWith('"') && str.endsWith('"')) {
              str = str.slice(1, -1);
            }
            return str.replace(/\\"/g, '"');
          });
        }
      }
    });

    await Promise.all([nsPromise, txtPromise]);

    const latencyMs = Math.round(performance.now() - startTime);

    // Hoster detection
    let detectedHoster = 'Generic / Self-Hosted Nameserver';
    const nsStr = nameservers.join(' ');
    if (/hetzner/i.test(nsStr)) detectedHoster = 'Hetzner Online';
    else if (/inwx/i.test(nsStr)) detectedHoster = 'INWX';
    else if (/cloudflare/i.test(nsStr)) detectedHoster = 'Cloudflare';
    else if (/ionos|1und1|ui-dns/i.test(nsStr)) detectedHoster = 'IONOS';
    else if (/strato/i.test(nsStr)) detectedHoster = 'STRATO';
    else if (/netcup/i.test(nsStr)) detectedHoster = 'netcup';
    else if (/awsdns/i.test(nsStr)) detectedHoster = 'Amazon Route 53';
    else if (/ovh/i.test(nsStr)) detectedHoster = 'OVHcloud';

    // Check DNS status
    const isNxDomain = rcode === 3;
    const isServFail = rcode === 2;

    if (rawRecords.length === 0 || isNxDomain || isServFail) {
      const dnsErrorStatus = isNxDomain ? 'NXDOMAIN' : isServFail ? 'SERVFAIL' : 'NODATA';
      const notFoundPayload: ApiResponseV1 = {
        apiVersion: '1.0',
        standard: 'IETF RFC 10023',
        domain,
        leafNode,
        status: isServFail ? 'error' : 'not_found',
        statusMessage: isNxDomain
          ? `Domain node "${leafNode}" does not exist (NXDOMAIN).`
          : isServFail
          ? `Nameserver returned server failure (SERVFAIL) for "${leafNode}".`
          : `No TXT records present under node "${leafNode}" (NODATA).`,
        architecture: 'unknown',
        dnssec: { authenticated: isDnssec, adFlag: isDnssec },
        wire: { rawRecords: [], recordCount: 0, byteOverhead: 0, ttl: null },
        tags: { parsed: {}, items: [], extensions: [] },
        compliance: {
          hasVersionHeader: false,
          validPrice: false,
          validUri: false,
          warnings: isNxDomain || isServFail ? [`DNS resolver status: ${dnsErrorStatus}`] : ['No _for-sale record published.'],
          errors: isServFail ? ['DNS SERVFAIL encountered.'] : [isNxDomain ? 'NXDOMAIN at leaf node.' : 'NODATA at leaf node.'],
        },
        infrastructure: { detectedHoster, nameservers, resolver: resolverUsed, latencyMs },
        meta: { timestamp: new Date().toISOString(), documentation: 'https://rfc10023.de/api-docs' },
      };
      return res.status(200).json(notFoundPayload);
    }

    // Parse Records
    const items: TagItem[] = [];
    const parsed: Record<string, string> = {};
    const tagCounts: Record<string, number> = {};
    const warnings: string[] = [];
    const errors: string[] = [];
    const extensions: string[] = [];
    let hasVersionHeader = false;
    let byteOverhead = 0;

    rawRecords.forEach((rec, recIdx) => {
      const clean = rec.trim();
      byteOverhead += new TextEncoder().encode(clean).length;

      if (clean.startsWith('v=FORSALE1;') || clean === 'v=FORSALE1' || clean.startsWith('v=FORSALE1')) {
        hasVersionHeader = true;
      }

      const parts = clean.split(';').map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        const eq = p.indexOf('=');
        if (eq !== -1) {
          const k = p.substring(0, eq).trim().toLowerCase();
          const v = p.substring(eq + 1).trim();
          const isStd = (STANDARD_TAGS as readonly string[]).includes(k);

          tagCounts[k] = (tagCounts[k] || 0) + 1;
          const isDuplicate = tagCounts[k] > 1;

          items.push({ tag: k, value: v, sourceRecordIndex: recIdx, isStandard: isStd, isDuplicate });

          if (!isStd && !extensions.includes(k)) {
            extensions.push(k);
          }

          if (!parsed[k]) {
            parsed[k] = v;
          } else if (isDuplicate && k !== 'v') {
            warnings.push(`Duplicate tag "${k}" detected. Resolvers adhere to the first occurrence.`);
          }
        }
      });
    });

    if (!hasVersionHeader) {
      errors.push('Mandatory version tag "v=FORSALE1;" is missing.');
    }

    let validPrice = false;
    if (parsed.fval) {
      const cleanVal = parsed.fval.trim().toUpperCase();
      if (cleanVal === 'VHB') {
        validPrice = true;
      } else {
        const pMatch = cleanVal.match(/^([A-Z]{3}):?(\d+)$/);
        if (pMatch && ISO_4217_CODES.has(pMatch[1])) {
          validPrice = true;
        } else {
          warnings.push(`Price "${parsed.fval}" does not conform to ISO 4217 integer format (e.g. EUR2500).`);
        }
      }
    }

    let validUri = false;
    if (parsed.furi) {
      const u = parsed.furi.trim();
      if (u.startsWith('mailto:') || u.startsWith('https://') || u.startsWith('http://') || u.startsWith('tel:')) {
        validUri = true;
      } else {
        warnings.push(`Contact URI "${parsed.furi}" is not an absolute RFC 3986 URI.`);
      }
    }

    const isMulti = rawRecords.length > 1;
    const architecture = isMulti ? 'ietf_multi' : 'single_line';
    const status: 'valid' | 'warning' = (hasVersionHeader && errors.length === 0) ? 'valid' : 'warning';
    const statusMessage = status === 'valid'
      ? 'Valid RFC 10023 sale offer confirmed.'
      : 'Record discovered, but contains validation warnings or missing version header.';

    const response: ApiResponseV1 = {
      apiVersion: '1.0',
      standard: 'IETF RFC 10023',
      domain,
      leafNode,
      status,
      statusMessage,
      architecture,
      dnssec: { authenticated: isDnssec, adFlag: isDnssec },
      wire: { rawRecords, recordCount: rawRecords.length, byteOverhead, ttl },
      tags: { parsed, items, extensions },
      compliance: { hasVersionHeader, validPrice, validUri, warnings, errors },
      infrastructure: { detectedHoster, nameservers, resolver: resolverUsed, latencyMs },
      meta: { timestamp: new Date().toISOString(), documentation: 'https://rfc10023.de/api-docs' },
    };

    return res.status(200).json(response);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lookup failed';
    return res.status(500).json({
      apiVersion: '1.0',
      error: message,
      status: 'error',
    });
  }
}
