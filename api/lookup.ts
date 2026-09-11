import type { VercelRequest, VercelResponse } from '@vercel/node';

// RFC 10023 Section 2.1 & 2.2 Tags definition
interface ParsedResult {
  domain: string;
  leafNode: string;
  status: 'valid' | 'warning' | 'not_found' | 'error';
  statusMessage: string;
  dnssec: boolean;
  rawRecords: string[];
  tags: Record<string, string>;
  detectedHoster?: string;
  nameservers: string[];
  timestamp: string;
  disclaimer: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS for external developer queries
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
  if (!rawDomain) {
    return res.status(400).json({
      error: 'Parameter "domain" oder "d" fehlt. Beispiel: /api/lookup?d=beispieldomain.de',
      status: 'error'
    });
  }

  // Clean domain
  let domain = rawDomain.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.replace(/^_for-sale\./, '');
  domain = domain.split('/')[0].split(':')[0];

  if (!domain.includes('.')) {
    return res.status(400).json({
      error: 'Ungültiger Domainname übergeben.',
      status: 'error'
    });
  }

  const leafNode = `_for-sale.${domain}`;
  let rawRecords: string[] = [];
  let isDnssec = false;
  const nameservers: string[] = [];

  try {
    // 1. Fetch authoritative Nameservers via Cloudflare DoH (NS query)
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

    // 2. Fetch TXT RRset on leaf node
    const txtPromise = fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(leafNode)}&type=TXT`, {
      headers: { Accept: 'application/dns-json' },
    }).then(async (r) => {
      if (r.ok) {
        const json = await r.json();
        if (json.AD) isDnssec = true;
        if (json.Answer && Array.isArray(json.Answer)) {
          rawRecords = json.Answer
            .filter((a: { type: number }) => a.type === 16)
            .map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
        }
      }
    });

    await Promise.all([nsPromise, txtPromise]);

    // Fallback to Google DNS if no TXT records via Cloudflare
    if (rawRecords.length === 0) {
      try {
        const gRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(leafNode)}&type=TXT`);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.AD) isDnssec = true;
          if (gData.Answer && Array.isArray(gData.Answer)) {
            rawRecords = gData.Answer
              .filter((a: { type: number }) => a.type === 16)
              .map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
          }
        }
      } catch {}
    }

    // Determine Hoster from NS
    let detectedHoster = 'Unbekannt / Eigener Nameserver';
    const nsString = nameservers.join(' ');
    if (/hetzner/i.test(nsString)) detectedHoster = 'Hetzner Online';
    else if (/inwx/i.test(nsString)) detectedHoster = 'INWX';
    else if (/cloudflare/i.test(nsString)) detectedHoster = 'Cloudflare';
    else if (/ionos|1und1|ui-dns/i.test(nsString)) detectedHoster = 'IONOS';
    else if (/strato/i.test(nsString)) detectedHoster = 'STRATO';
    else if (/netcup/i.test(nsString)) detectedHoster = 'netcup';
    else if (/awsdns/i.test(nsString)) detectedHoster = 'Amazon Route 53';
    else if (/ovh/i.test(nsString)) detectedHoster = 'OVHcloud';

    if (rawRecords.length === 0) {
      const responsePayload: ParsedResult = {
        domain,
        leafNode,
        status: 'not_found',
        statusMessage: `Kein TXT-Eintrag unter ${leafNode} gefunden.`,
        dnssec: isDnssec,
        rawRecords: [],
        tags: {},
        detectedHoster,
        nameservers,
        timestamp: new Date().toISOString(),
        disclaimer: 'rfc10023.de ist ein unabhängiges DACH-Referenzportal. Daten basieren auf Anycast DNS-Abfragen.'
      };
      return res.status(200).json(responsePayload);
    }

    // Parse Tags
    const tags: Record<string, string> = {};
    let hasVersionHeader = false;

    rawRecords.forEach((rec) => {
      const parts = rec.split(';').map((p) => p.trim()).filter(Boolean);
      parts.forEach((p) => {
        const eqIdx = p.indexOf('=');
        if (eqIdx !== -1) {
          const key = p.substring(0, eqIdx).trim();
          const val = p.substring(eqIdx + 1).trim();
          if (key === 'v' && val.toUpperCase() === 'FORSALE1') {
            hasVersionHeader = true;
          } else {
            tags[key] = val;
          }
        }
      });
    });

    const status: 'valid' | 'warning' = hasVersionHeader ? 'valid' : 'warning';
    const statusMessage = hasVersionHeader
      ? 'Gültiger RFC 10023 Record gefunden.'
      : 'Eintrag gefunden, jedoch fehlt der erforderliche Versions-Header "v=FORSALE1;".';

    const payload: ParsedResult = {
      domain,
      leafNode,
      status,
      statusMessage,
      dnssec: isDnssec,
      rawRecords,
      tags,
      detectedHoster,
      nameservers,
      timestamp: new Date().toISOString(),
      disclaimer: 'rfc10023.de ist ein unabhängiges DACH-Referenzportal. Daten basieren auf Anycast DNS-Abfragen.'
    };

    return res.status(200).json(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'DNS Lookup Error';
    return res.status(500).json({
      error: message,
      status: 'error'
    });
  }
}
