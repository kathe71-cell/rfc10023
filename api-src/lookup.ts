import type { VercelRequest, VercelResponse } from '@vercel/node';
import { parseRfc10023Records, type DnsQueryStatus } from '../src/utils/rfcParserEngine';
import { toPunycodeHostname, detectHosterFromNameservers } from '../src/utils/dnsIntelligence';

interface ParsedResult {
  domain: string;
  aLabel?: string;
  leafNode: string;
  status: 'valid' | 'warning' | 'not_found' | 'error';
  dnsStatus: 'NOERROR' | 'NXDOMAIN' | 'NODATA' | 'SERVFAIL' | 'TIMEOUT' | 'ERROR';
  statusMessage: string;
  dnssec: boolean;
  rawRecords: string[];
  decodedRecords: string[];
  hasPresentationEscapes: boolean;
  tags: Record<string, string>;
  warnings: string[];
  errors: string[];
  detectedHoster?: string;
  nameservers: string[];
  timestamp: string;
  disclaimer: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const rawDomain = (req.query.d || req.query.domain || '') as string;
  if (!rawDomain || rawDomain.length > 253) {
    return res.status(400).json({
      error: 'Parameter "domain" oder "d" fehlt oder ist ungültig (max. 253 Zeichen).',
      status: 'error',
    });
  }

  let domain = rawDomain.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.replace(/^_for-sale\./, '');
  domain = domain.split('/')[0].split(':')[0];

  if (!domain.includes('.') || domain.length > 253 || domain.length < 3) {
    return res.status(400).json({
      error: 'Ungültiger Domainname übergeben.',
      status: 'error',
    });
  }

  const punyHost = toPunycodeHostname(domain);
  if (!punyHost || punyHost.length > 253) {
    return res.status(400).json({
      error: 'Ungültiger Domainname übergeben.',
      status: 'error',
    });
  }
  const leafNode = `_for-sale.${punyHost}`;
  let rawRecords: string[] = [];
  let isDnssec = false;
  let rcode = 0;
  const nameservers: string[] = [];

  try {
    // 1. Fetch authoritative Nameservers via Cloudflare DoH (NS query)
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

    // 2. Fetch TXT RRset on leaf node
    const txtPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(leafNode)}&type=TXT`, {
      headers: { Accept: 'application/dns-json' },
    }).then(async (r) => {
      if (r.ok) {
        const json = await r.json();
        rcode = json.Status ?? 0;
        if (json.AD) isDnssec = true;
        if (json.Answer && Array.isArray(json.Answer)) {
          const txtAnswers = json.Answer.filter((a: { type: number }) => a.type === 16);
          rawRecords = txtAnswers.map((a: { data: string }) => a.data);
        }
      }
    });

    await Promise.all([nsPromise, txtPromise]);

    const hosterProfile = detectHosterFromNameservers(nameservers);
    const detectedHoster = hosterProfile ? hosterProfile.name : 'Unbekannt / Eigener Nameserver';

    let dnsStatus: DnsQueryStatus = 'NOERROR';
    if (rcode === 3) dnsStatus = 'NXDOMAIN';
    else if (rcode === 2) dnsStatus = 'SERVFAIL';
    else if (rawRecords.length === 0) dnsStatus = 'NODATA';

    // Canonical Engine Analysis (with chunk merging, \DDD decoding, and IDN resolution)
    const report = parseRfc10023Records(rawRecords, dnsStatus, 'de');

    const cleanParsedMap: Record<string, string> = {};
    for (const [k, v] of Object.entries(report.parsedMap)) {
      if (v !== undefined) cleanParsedMap[k] = v;
    }

    const payload: ParsedResult = {
      domain,
      aLabel: punyHost !== domain ? punyHost : undefined,
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
      timestamp: new Date().toISOString(),
      disclaimer: 'rfc10023.de ist ein unabhängiges Referenzportal. Daten basieren auf Anycast DNS-Abfragen (RFC 10023 Informational).',
    };

    return res.status(200).json(payload);
  } catch (_err: unknown) {
    return res.status(500).json({
      error: 'DNS-Abfrage fehlgeschlagen. Bitte versuchen Sie es später erneut.',
      status: 'error',
    });
  }
}
