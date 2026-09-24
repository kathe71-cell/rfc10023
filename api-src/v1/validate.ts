import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseRfc10023Records, type DnsQueryStatus } from '../../src/utils/rfcParserEngine';
import { toPunycodeHostname, detectHosterFromNameservers } from '../../src/utils/dnsIntelligence';

interface TagItem {
  tag: string;
  value: string;
  rawValue?: string;
  sourceRecordIndex: number;
  isStandard: boolean;
  isDuplicate?: boolean;
  isValid?: boolean;
  parsedDetails?: {
    currency?: string;
    amount?: number;
    scheme?: string;
    uLabel?: string;
    aLabel?: string;
    isIdn?: boolean;
    hasMixedScript?: boolean;
  };
}

interface ApiResponseV1 {
  apiVersion: '1.0';
  standard: 'IETF RFC 10023';
  domain: string;
  aLabel?: string;
  leafNode: string;
  status: 'valid' | 'warning' | 'not_found' | 'error';
  statusMessage: string;
  architecture: 'ietf_multi' | 'single_line_deviation' | 'empty_signal' | 'unknown';
  dnssec: {
    authenticated: boolean;
    adFlag: boolean;
  };
  wire: {
    rawRecords: string[];
    decodedRecords: string[];
    hasPresentationEscapes: boolean;
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

  if (!rawDomain || rawDomain.length > 253) {
    return res.status(400).json({
      apiVersion: '1.0',
      error: 'Missing or invalid domain parameter (max 253 chars). Usage: /api/v1/validate?domain=example.com',
      status: 'error',
    });
  }

  let domain = rawDomain.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^_for-sale\./, '');
  domain = domain.split('/')[0].split(':')[0];

  if (!domain.includes('.') || domain.length > 253 || domain.length < 3) {
    return res.status(400).json({
      apiVersion: '1.0',
      error: 'Invalid domain syntax. Must contain a valid TLD.',
      status: 'error',
    });
  }

  const punyHost = toPunycodeHostname(domain);
  if (!punyHost || punyHost.length > 253) {
    return res.status(400).json({
      apiVersion: '1.0',
      error: 'Invalid domain syntax.',
      status: 'error',
    });
  }
  const leafNode = `_for-sale.${punyHost}`;
  let rawRecords: string[] = [];
  let isDnssec = false;
  let ttl: number | null = null;
  let rcode = 0;
  const nameservers: string[] = [];
  const resolverUsed = 'Cloudflare 1.1.1.1 Anycast';

  try {
    // 1. Query NS
    const nsPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(punyHost)}&type=NS`, {
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
          rawRecords = txtAnswers.map((a: { data: string }) => a.data);
        }
      }
    });

    await Promise.all([nsPromise, txtPromise]);

    const latencyMs = Math.round(performance.now() - startTime);

    // Hoster detection
    const hosterProfile = detectHosterFromNameservers(nameservers);
    const detectedHoster = hosterProfile ? hosterProfile.name : 'Generic / Self-Hosted Nameserver';

    let dnsStatus: DnsQueryStatus = 'NOERROR';
    if (rcode === 3) dnsStatus = 'NXDOMAIN';
    else if (rcode === 2) dnsStatus = 'SERVFAIL';
    else if (rawRecords.length === 0) dnsStatus = 'NODATA';

    // Canonical Engine Analysis (with chunk merging, \DDD decoding, and IDN resolution)
    const report = parseRfc10023Records(rawRecords, dnsStatus, 'en');

    // Build standard compliance summary
    const fvalTag = report.tags.find((t) => t.tag === 'fval');
    const furiTag = report.tags.find((t) => t.tag === 'furi');

    const cleanParsedMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(report.parsedMap)) {
      if (v !== undefined) cleanParsedMap[k] = v;
    }

    const response: ApiResponseV1 = {
      apiVersion: '1.0',
      standard: 'IETF RFC 10023',
      domain,
      aLabel: punyHost !== domain ? punyHost : undefined,
      leafNode,
      status: report.status,
      statusMessage: report.statusMessage,
      architecture: report.architecture,
      dnssec: { authenticated: isDnssec, adFlag: isDnssec },
      wire: {
        rawRecords: report.rawRecords,
        decodedRecords: report.decodedRecords,
        hasPresentationEscapes: report.hasPresentationEscapes,
        recordCount: report.rawRecords.length,
        byteOverhead: report.byteOverheadTotal,
        ttl,
      },
      tags: {
        parsed: cleanParsedMap,
        items: report.tags.map((t) => ({
          tag: t.tag,
          value: t.value,
          rawValue: t.rawValue,
          sourceRecordIndex: t.sourceRecordIndex,
          isStandard: t.isStandard,
          isDuplicate: t.isDuplicate,
          isValid: t.isValid,
          parsedDetails: t.parsedDetails,
        })),
        extensions: report.extensionTags,
      },
      compliance: {
        hasVersionHeader: report.saleSignalFound,
        validPrice: fvalTag ? fvalTag.isValid : false,
        validUri: furiTag ? furiTag.isValid : false,
        warnings: report.warnings,
        errors: report.errors,
      },
      infrastructure: { detectedHoster, nameservers, resolver: resolverUsed, latencyMs },
      meta: { timestamp: new Date().toISOString(), documentation: 'https://rfc10023.de/api-docs' },
    };

    return res.status(200).json(response);
  } catch (_err: unknown) {
    return res.status(500).json({
      apiVersion: '1.0',
      error: 'DNS lookup failed. Please try again later.',
      status: 'error',
    });
  }
}
