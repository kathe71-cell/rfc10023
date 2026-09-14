import type { VercelRequest, VercelResponse } from '@vercel/node';

// RFC 10023 Section 2.1 & 2.2 Tags definition
interface ParsedResult {
  domain: string;
  leafNode: string;
  status: 'valid' | 'warning' | 'not_found' | 'error';
  dnsStatus: 'NOERROR' | 'NXDOMAIN' | 'NODATA' | 'SERVFAIL' | 'TIMEOUT' | 'ERROR';
  statusMessage: string;
  dnssec: boolean;
  rawRecords: string[];
  tags: Record<string, string>;
  warnings: string[];
  errors: string[];
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
  let rcode = 0;
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
        rcode = json.Status ?? 0;
        if (json.AD) isDnssec = true;
        if (json.Answer && Array.isArray(json.Answer)) {
          rawRecords = json.Answer
            .filter((a: { type: number }) => a.type === 16)
            .map((a: { data: string }) => {
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

    // Differentiate DNS Status
    let dnsStatus: ParsedResult['dnsStatus'] = 'NOERROR';
    if (rcode === 3) dnsStatus = 'NXDOMAIN';
    else if (rcode === 2) dnsStatus = 'SERVFAIL';
    else if (rawRecords.length === 0) dnsStatus = 'NODATA';

    if (dnsStatus !== 'NOERROR' || rawRecords.length === 0) {
      let statusMessage = `Kein TXT-Eintrag unter ${leafNode} gefunden (NODATA).`;
      if (dnsStatus === 'NXDOMAIN') {
        statusMessage = `DNS-Knoten ${leafNode} existiert nicht (NXDOMAIN).`;
      } else if (dnsStatus === 'SERVFAIL') {
        statusMessage = `Nameserver-Fehler bei der Auflösung von ${leafNode} (SERVFAIL).`;
      }

      const responsePayload: ParsedResult = {
        domain,
        leafNode,
        status: dnsStatus === 'SERVFAIL' ? 'error' : 'not_found',
        dnsStatus,
        statusMessage,
        dnssec: isDnssec,
        rawRecords: [],
        tags: {},
        warnings: [],
        errors: dnsStatus === 'SERVFAIL' ? ['SERVFAIL: Nameserver antwortete mit Serverfehler.'] : [],
        detectedHoster,
        nameservers,
        timestamp: new Date().toISOString(),
        disclaimer: 'rfc10023.de ist ein unabhängiges DACH-Referenzportal. Daten basieren auf Anycast DNS-Abfragen (RFC 10023 Informational).'
      };
      return res.status(200).json(responsePayload);
    }

    // Parse Tags according to RFC 10023
    const tags: Record<string, string> = {};
    const warnings: string[] = [];
    const errors: string[] = [];
    let hasVersion = false;

    rawRecords.forEach((rec) => {
      const clean = rec.trim();
      const parts = clean.split(';').map((p) => p.trim()).filter(Boolean);
      
      if (parts.length > 2) {
        warnings.push(`Record "${clean}" bündelt mehrere Tags in einer Zeile. RFC 10023 § 2.1 spezifiziert einen Tag pro TXT-Record.`);
      }

      parts.forEach((p) => {
        const eqIdx = p.indexOf('=');
        if (eqIdx !== -1) {
          const key = p.substring(0, eqIdx).trim().toLowerCase();
          const val = p.substring(eqIdx + 1).trim();
          if (key === 'v') {
            if (val.toUpperCase() === 'FORSALE1') {
              hasVersion = true;
            } else {
              errors.push(`Ungültige Version: v=${val} (erwartet: FORSALE1)`);
            }
          } else {
            if (!tags[key]) {
              tags[key] = val;
            } else {
              warnings.push(`Mehrfaches Vorkommen von Tag "${key}". RFC 10023: Resolver nutzen das erste Vorkommen.`);
            }
          }
        }
      });
    });

    if (!hasVersion) {
      errors.push('Pflicht-Header "v=FORSALE1;" fehlt.');
    }

    const status: 'valid' | 'warning' = (hasVersion && errors.length === 0) ? 'valid' : 'warning';
    const statusMessage = status === 'valid'
      ? 'Gültiger RFC 10023 Verkaufseintrag gefunden.'
      : 'Eintrag gefunden, jedoch mit Abweichungen oder fehlendem Versions-Header.';

    const payload: ParsedResult = {
      domain,
      leafNode,
      status,
      dnsStatus: 'NOERROR',
      statusMessage,
      dnssec: isDnssec,
      rawRecords,
      tags,
      warnings,
      errors,
      detectedHoster,
      nameservers,
      timestamp: new Date().toISOString(),
      disclaimer: 'rfc10023.de ist ein unabhängiges DACH-Referenzportal. Daten basieren auf Anycast DNS-Abfragen (RFC 10023 Informational).'
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
