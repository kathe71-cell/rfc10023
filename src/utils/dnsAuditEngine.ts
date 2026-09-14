// DNS Diagnostics Engine (Mail Routing & DNSSEC Transparency)
// Strictly separated from RFC 10023 sale indicator evaluation.
// No aggregated "security scores" or sale trustworthiness deductions.

export interface DnsDiagnosticItem {
  id: 'null_mx' | 'mx' | 'smtp_fallback' | 'spf' | 'dmarc' | 'dnssec';
  label: string;
  category: 'email' | 'dnssec';
  status: 'info' | 'notice';
  value: string;
  summary: string;
  details: string;
}

export interface DomainDiagnosticsReport {
  domain: string;
  timestamp: string;
  resolver: string;
  items: DnsDiagnosticItem[];
  mxRecords: { exchange: string; preference: number }[];
  hasNullMx: boolean;
  hasFallbackA: boolean;
  aRecords: string[];
  aaaaRecords: string[];
  spfRecord: string | null;
  dmarcRecord: string | null;
  dnssecAdFlag: boolean;
  dnssecMessage: string;
}

interface DoHAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

interface DoHResponse {
  Status: number;
  AD?: boolean;
  Answer?: DoHAnswer[];
}

/**
 * Fetch DoH query with fallback
 */
async function queryDoh(name: string, type: string): Promise<{ res: DoHResponse; resolver: string }> {
  const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  try {
    const res = await fetch(cfUrl, { headers: { Accept: 'application/dns-json' } });
    if (res.ok) {
      const data = await res.json();
      return { res: data, resolver: 'Cloudflare Anycast DoH (1.1.1.1)' };
    }
  } catch {
    // try fallback
  }

  // Fallback to Google DoH
  try {
    const gUrl = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
    const gRes = await fetch(gUrl);
    if (gRes.ok) {
      const gData = await gRes.json();
      return { res: gData, resolver: 'Google Public DNS DoH (8.8.8.8)' };
    }
  } catch {
    // failed
  }

  return { res: { Status: 2 }, resolver: 'Resolver unreachable' };
}

/**
 * Runs transparent DNS diagnostics for email routing and DNSSEC.
 * No arbitrary scoring or conflation with domain sales verification.
 */
export async function performDomainDiagnostics(
  domain: string,
  lang: 'de' | 'en' = 'de'
): Promise<DomainDiagnosticsReport> {
  const isEn = lang === 'en';

  const [mxData, aData, aaaaData, apexTxtData, dmarcData] = await Promise.all([
    queryDoh(domain, 'MX'),
    queryDoh(domain, 'A'),
    queryDoh(domain, 'AAAA'),
    queryDoh(domain, 'TXT'),
    queryDoh(`_dmarc.${domain}`, 'TXT'),
  ]);

  const resolver = mxData.resolver;
  const mxRes = mxData.res;
  const aRes = aData.res;
  const aaaaRes = aaaaData.res;
  const apexTxtRes = apexTxtData.res;
  const dmarcRes = dmarcData.res;

  // 1. Parse MX
  const mxRecords: { exchange: string; preference: number }[] = [];
  let hasNullMx = false;

  if (mxRes.Answer && Array.isArray(mxRes.Answer)) {
    for (const ans of mxRes.Answer) {
      if (ans.type === 15 && ans.data) {
        const parts = ans.data.trim().split(/\s+/);
        if (parts.length >= 2) {
          const pref = parseInt(parts[0], 10);
          const host = parts[1].replace(/\.$/, '');
          mxRecords.push({ preference: pref, exchange: host });
          if (pref === 0 && (host === '' || host === '.')) {
            hasNullMx = true;
          }
        }
      }
    }
  }

  // 2. Parse A & AAAA
  const aRecords: string[] = [];
  if (aRes.Answer && Array.isArray(aRes.Answer)) {
    for (const ans of aRes.Answer) {
      if (ans.type === 1 && ans.data) aRecords.push(ans.data);
    }
  }

  const aaaaRecords: string[] = [];
  if (aaaaRes.Answer && Array.isArray(aaaaRes.Answer)) {
    for (const ans of aaaaRes.Answer) {
      if (ans.type === 28 && ans.data) aaaaRecords.push(ans.data);
    }
  }

  const hasFallbackA = (aRecords.length > 0 || aaaaRecords.length > 0) && mxRecords.length === 0;

  // 3. Parse SPF
  let spfRecord: string | null = null;
  if (apexTxtRes.Answer && Array.isArray(apexTxtRes.Answer)) {
    for (const ans of apexTxtRes.Answer) {
      if (ans.type === 16 && ans.data) {
        const cleaned = ans.data.replace(/^"|"$/g, '').trim();
        if (cleaned.startsWith('v=spf1')) {
          spfRecord = cleaned;
          break;
        }
      }
    }
  }

  // 4. Parse DMARC
  let dmarcRecord: string | null = null;
  if (dmarcRes.Answer && Array.isArray(dmarcRes.Answer)) {
    for (const ans of dmarcRes.Answer) {
      if (ans.type === 16 && ans.data) {
        const cleaned = ans.data.replace(/^"|"$/g, '').trim();
        if (cleaned.startsWith('v=DMARC1')) {
          dmarcRecord = cleaned;
          break;
        }
      }
    }
  }

  // 5. DNSSEC Check: Check AD (Authenticated Data) Flag
  const dnssecAdFlag = Boolean(mxRes.AD || aRes.AD || apexTxtRes.AD);
  const dnssecMessage = dnssecAdFlag
    ? (isEn
        ? 'DNSSEC response: Resolver validated responses (AD flag = true).'
        : 'DNSSEC-Antwort: Resolver hat Signaturen verifiziert (AD-Flag = true).')
    : (isEn
        ? 'AD flag not set by resolver. Authenticity was not validated in this query (does not prove unsigned without authoritative DS verification).'
        : 'AD-Flag nicht gesetzt. Authentizität wurde durch diesen Resolver nicht validiert (kein Beweis für fehlende Signierung ohne DS-Prüfung).');

  const items: DnsDiagnosticItem[] = [];

  // Item: DNSSEC
  items.push({
    id: 'dnssec',
    label: 'DNSSEC (AD-Flag)',
    category: 'dnssec',
    status: 'info',
    value: dnssecAdFlag ? 'AD=true' : 'AD=false',
    summary: dnssecMessage,
    details: isEn
      ? 'The Authenticated Data (AD) bit indicates whether the validating recursive resolver verified DNSSEC signatures.'
      : 'Das Authenticated Data (AD) Flag zeigt an, ob der rekursive Resolver DNSSEC-RRSIG-Signaturen bis zum Trust-Anchor verifiziert hat.',
  });

  // Item: Mail / Null-MX
  if (hasNullMx) {
    items.push({
      id: 'null_mx',
      label: 'RFC 7505 Null-MX',
      category: 'email',
      status: 'info',
      value: '0 . (Null-MX aktiv)',
      summary: isEn ? 'Null-MX configured: Explicit signal that domain does not accept email.' : 'Null-MX konfiguriert: Signalisiert, dass diese Domain keine E-Mails annimmt.',
      details: isEn
        ? 'RFC 7505 defines a single MX record "0 ." to stop MTAs from attempting mail delivery.'
        : 'RFC 7505 definiert "0 ." als expliziten Standard, damit fremde Mailserver gar nicht erst versuchen, Mails zuzustellen.',
    });
  } else if (mxRecords.length > 0) {
    items.push({
      id: 'mx',
      label: 'Mail Exchange (MX)',
      category: 'email',
      status: 'info',
      value: `${mxRecords.length} MX Server`,
      summary: isEn ? `Configured mail exchanges: ${mxRecords.map((m) => m.exchange).join(', ')}` : `Hinterlegte Mailserver: ${mxRecords.map((m) => m.exchange).join(', ')}`,
      details: isEn ? 'Domain routes incoming emails to designated mail hosts.' : 'Eingehende E-Mails werden über die angegebenen Nameserver-Routen abgewickelt.',
    });
  } else if (hasFallbackA) {
    items.push({
      id: 'smtp_fallback',
      label: 'SMTP Fallback (RFC 5321 § 5.1)',
      category: 'email',
      status: 'notice',
      value: 'A/AAAA Fallback möglich',
      summary: isEn
        ? 'No MX present: Mail servers may fall back to web server IP addresses (RFC 5321).'
        : 'Kein MX vorhanden: Mailserver dürfen gemäß RFC 5321 an die Webserver-IPs zustellen.',
      details: isEn
        ? `No MX record is configured, but A/AAAA records exist (${aRecords.concat(aaaaRecords).slice(0, 2).join(', ')}). Setting a Null-MX (0 .) avoids accidental delivery attempts if email is not desired.`
        : `Es ist kein MX hinterlegt, aber A/AAAA-Einträge sind vorhanden (${aRecords.concat(aaaaRecords).slice(0, 2).join(', ')}). Falls kein Mail-Empfang gewünscht ist, verhindert ein RFC 7505 Null-MX (0 .) Fehlzustellungen.`,
    });
  }

  // Item: SPF
  if (spfRecord) {
    items.push({
      id: 'spf',
      label: 'SPF Record (RFC 7208)',
      category: 'email',
      status: 'info',
      value: spfRecord,
      summary: isEn ? `SPF policy: ${spfRecord}` : `Hinterlegte SPF-Richtlinie: ${spfRecord}`,
      details: isEn
        ? 'Specifies which mail transfer agents are authorized to send email on behalf of the domain.'
        : 'Definiert, welche Mailserver autorisiert sind, E-Mails im Namen dieser Domain zu versenden.',
    });
  }

  // Item: DMARC
  if (dmarcRecord) {
    items.push({
      id: 'dmarc',
      label: 'DMARC Policy (RFC 7489)',
      category: 'email',
      status: 'info',
      value: dmarcRecord,
      summary: isEn ? `DMARC policy: ${dmarcRecord}` : `Hinterlegte DMARC-Richtlinie: ${dmarcRecord}`,
      details: isEn
        ? 'Provides sender authentication policies and reporting instructions for receiving mail servers.'
        : 'Gibt Richtlinien für den Umgang mit nicht authentifizierten Nachrichten vor.',
    });
  }

  return {
    domain,
    timestamp: new Date().toISOString(),
    resolver,
    items,
    mxRecords,
    hasNullMx,
    hasFallbackA,
    aRecords,
    aaaaRecords,
    spfRecord,
    dmarcRecord,
    dnssecAdFlag,
    dnssecMessage,
  };
}
