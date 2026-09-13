// DNS Health & Email Routing Audit Engine
// Authoritative multi-query evaluator for RFC 10023, RFC 7505 (Null-MX), SMTP Fallback, SPF, DMARC & DNSSEC

export interface DnsAuditItem {
  id: 'rfc10023' | 'null_mx' | 'smtp_fallback' | 'spf' | 'dmarc' | 'dnssec';
  label: string;
  category: 'sale' | 'email' | 'security';
  status: 'pass' | 'warn' | 'fail' | 'info';
  value: string;
  summary: string;
  details: string;
}

export interface DomainHealthAudit {
  domain: string;
  score: number; // 0 - 100
  rating: 'optimal' | 'good' | 'warning' | 'critical';
  ratingLabel: string;
  summary: string;
  items: DnsAuditItem[];
  mxRecords: { exchange: string; preference: number }[];
  hasNullMx: boolean;
  hasFallbackA: boolean;
  aRecords: string[];
  aaaaRecords: string[];
  spfRecord: string | null;
  dmarcRecord: string | null;
  dnssecActive: boolean;
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
async function queryDoh(name: string, type: string): Promise<DoHResponse> {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/dns-json' } });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.warn(`Cloudflare DoH failed for ${name} (${type}), trying Google...`, e);
  }

  // Fallback to Google DoH
  const gUrl = `https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`;
  const gRes = await fetch(gUrl);
  if (gRes.ok) {
    return await gRes.json();
  }
  return { Status: 2 };
}

/**
 * Executes a comprehensive, parallel DNS health & security audit for the domain
 */
export async function performDomainAudit(
  domain: string,
  rfc10023Status: 'valid' | 'warning' | 'not_found' | 'error',
  lang: 'de' | 'en' = 'de'
): Promise<DomainHealthAudit> {
  const isEn = lang === 'en';

  // Parallel queries: MX, A, AAAA, TXT (SPF), TXT (_dmarc)
  const [mxRes, aRes, aaaaRes, apexTxtRes, dmarcRes] = await Promise.all([
    queryDoh(domain, 'MX'),
    queryDoh(domain, 'A'),
    queryDoh(domain, 'AAAA'),
    queryDoh(domain, 'TXT'),
    queryDoh(`_dmarc.${domain}`, 'TXT'),
  ]);

  // Parse MX
  const mxRecords: { exchange: string; preference: number }[] = [];
  let hasNullMx = false;

  if (mxRes.Answer && Array.isArray(mxRes.Answer)) {
    for (const ans of mxRes.Answer) {
      if (ans.type === 15 && ans.data) {
        // format: "10 mail.example.com." or "0 ."
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

  // Parse A & AAAA
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

  // Parse SPF
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

  // Parse DMARC
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

  const dnssecActive = Boolean(mxRes.AD || aRes.AD || apexTxtRes.AD);

  // Scoring Logic (0 - 100)
  let score = 0;
  const items: DnsAuditItem[] = [];

  // 1. RFC 10023 Signal (Max 35 pts)
  if (rfc10023Status === 'valid') {
    score += 35;
    items.push({
      id: 'rfc10023',
      label: 'RFC 10023 Sale-Offer',
      category: 'sale',
      status: 'pass',
      value: 'v=FORSALE1 (Active)',
      summary: isEn ? 'Standard-compliant sale offer published' : 'IETF-konformes Verkaufsangebot im DNS aktiv',
      details: isEn
        ? 'Valid _for-sale TXT record is discoverable by automated registry lookups (e.g. SIDN) and prospective buyers.'
        : 'Gültiger _for-sale TXT-Knoten wird von Registrierungsstellen (z. B. SIDN) und Interessenten maschinenlesbar erkannt.',
    });
  } else if (rfc10023Status === 'warning') {
    score += 20;
    items.push({
      id: 'rfc10023',
      label: 'RFC 10023 Sale-Offer',
      category: 'sale',
      status: 'warn',
      value: 'Deviating Structure',
      summary: isEn ? 'Record found with format deviations' : 'Eintrag vorhanden, weicht jedoch vom Multi-Record-Standard ab',
      details: isEn
        ? 'The DNS record is functional, but uses single-line workarounds or contains minor syntax notices.'
        : 'Der Eintrag funktioniert, nutzt aber einen Single-Line Workaround oder weist kleinere Syntax-Abweichungen auf.',
    });
  } else {
    items.push({
      id: 'rfc10023',
      label: 'RFC 10023 Sale-Offer',
      category: 'sale',
      status: 'info',
      value: 'Inactive',
      summary: isEn ? 'No sale offer published at _for-sale' : 'Kein Verkaufsangebot unter _for-sale hinterlegt',
      details: isEn
        ? 'Domain does not publicly signal acquisition availability in the DNS.'
        : 'Für diese Domain ist aktuell kein standardisiertes Verkaufsangebot im weltweiten DNS eingetragen.',
    });
  }

  // 2. Email / Null-MX Check (Max 25 pts)
  if (hasNullMx) {
    score += 25;
    items.push({
      id: 'null_mx',
      label: 'RFC 7505 Null-MX',
      category: 'email',
      status: 'pass',
      value: '0 . (Protected)',
      summary: isEn ? 'Null-MX configured: Explicit mail rejection' : 'Null-MX aktiv: Mails werden sofort abgewiesen',
      details: isEn
        ? 'RFC 7505 Null-MX signals that this domain accepts zero email, eliminating backscatter, spam abuse and server load.'
        : 'Der Null-MX-Eintrag (0 .) signalisiert weltweit, dass die Domain keine E-Mails empfängt. Verhindert Bounce-Spam und Server-Last.',
    });
  } else if (mxRecords.length > 0) {
    score += 20;
    items.push({
      id: 'null_mx',
      label: 'Mail Exchange (MX)',
      category: 'email',
      status: 'info',
      value: `${mxRecords.length} MX Server`,
      summary: isEn ? 'Dedicated mail servers configured' : 'Reguläre Mailserver konfiguriert',
      details: isEn
        ? `Domain routes email to designated mail exchanges (${mxRecords.map((m) => m.exchange).join(', ')}).`
        : `Eingehende E-Mails werden regulär über Mailserver abgewickelt (${mxRecords.map((m) => m.exchange).join(', ')}).`,
    });
  } else if (hasFallbackA) {
    // CRITICAL: RFC 5321 Fallback
    items.push({
      id: 'smtp_fallback',
      label: 'SMTP Fallback Risk (RFC 5321)',
      category: 'email',
      status: 'fail',
      value: 'A/AAAA Fallback Exposed',
      summary: isEn
        ? 'Vulnerable: MTA fallbacks route emails directly to web server IP!'
        : 'Gefahr: Fehlender MX leitet Mails per Fallback direkt an Webserver-IP!',
      details: isEn
        ? `According to RFC 5321, mail servers attempt delivery to web host IPs (${aRecords.concat(aaaaRecords).slice(0, 2).join(', ')}) if no MX is defined. Setting RFC 7505 Null-MX is strongly recommended.`
        : `Gemäß RFC 5321 versuchen absendende Mailserver E-Mails an Ihre Webserver-IPs (${aRecords.concat(aaaaRecords).slice(0, 2).join(', ')}) zuzustellen, da kein MX existiert. Ein RFC 7505 Null-MX schließt diese Lücke.`,
    });
  } else {
    items.push({
      id: 'null_mx',
      label: 'Mail Exchange (MX)',
      category: 'email',
      status: 'warn',
      value: 'None',
      summary: isEn ? 'No MX records defined' : 'Kein MX-Record hinterlegt',
      details: isEn
        ? 'Domain has neither MX nor web IP records.'
        : 'Die Domain besitzt weder MX-Server noch A/AAAA-Web-Einträge.',
    });
  }

  // 3. SPF Check (Max 15 pts)
  if (spfRecord) {
    if (spfRecord.includes('-all')) {
      score += 15;
      items.push({
        id: 'spf',
        label: 'SPF Record (RFC 7208)',
        category: 'security',
        status: 'pass',
        value: 'Strict Hardfail (-all)',
        summary: isEn ? 'Spoofing strictly blocked' : 'E-Mail-Spoofing strikt blockiert (-all)',
        details: isEn ? `SPF record active: ${spfRecord}` : `Gültiger SPF-Schutz aktiv: ${spfRecord}`,
      });
    } else {
      score += 10;
      items.push({
        id: 'spf',
        label: 'SPF Record (RFC 7208)',
        category: 'security',
        status: 'warn',
        value: 'Softfail (~all / ?all)',
        summary: isEn ? 'Softfail active (recommendation: -all)' : 'Nur Softfail aktiv (Empfehlung: -all)',
        details: isEn ? `SPF found: ${spfRecord}` : `Hinterlegter SPF-Eintrag: ${spfRecord}`,
      });
    }
  } else {
    items.push({
      id: 'spf',
      label: 'SPF Record (RFC 7208)',
      category: 'security',
      status: hasNullMx ? 'warn' : 'info',
      value: 'Missing',
      summary: isEn ? 'No SPF policy configured' : 'Kein SPF-Eintrag hinterlegt',
      details: isEn
        ? 'Without SPF, unauthorized parties can forge emails using this domain name.'
        : 'Ohne SPF können fremde Server missbräuchlich E-Mails mit dieser Domain als Absender versenden.',
    });
  }

  // 4. DMARC Check (Max 15 pts)
  if (dmarcRecord) {
    if (dmarcRecord.includes('p=reject')) {
      score += 15;
      items.push({
        id: 'dmarc',
        label: 'DMARC Policy (RFC 7489)',
        category: 'security',
        status: 'pass',
        value: 'p=reject (Enforced)',
        summary: isEn ? 'Full spoofing rejection active' : 'Vollständige Abweisung aktiver Fälschungen (p=reject)',
        details: isEn ? `DMARC policy: ${dmarcRecord}` : `Aktive DMARC-Richtlinie: ${dmarcRecord}`,
      });
    } else {
      score += 10;
      items.push({
        id: 'dmarc',
        label: 'DMARC Policy (RFC 7489)',
        category: 'security',
        status: 'warn',
        value: 'Monitoring (p=none / quarantine)',
        summary: isEn ? 'DMARC monitoring active' : 'DMARC im Überwachungsmodus (p=none)',
        details: isEn ? `DMARC policy: ${dmarcRecord}` : `DMARC gefunden: ${dmarcRecord}`,
      });
    }
  } else {
    items.push({
      id: 'dmarc',
      label: 'DMARC Policy (RFC 7489)',
      category: 'security',
      status: 'info',
      value: 'Not configured',
      summary: isEn ? 'No DMARC record at _dmarc node' : 'Keine DMARC-Richtlinie unter _dmarc hinterlegt',
      details: isEn
        ? 'DMARC provides reporting and instructs receiving servers how to handle failed SPF/DKIM.'
        : 'DMARC schützt vor Phishing und steuert, wie Empfänger-Server bei gefälschten Absendern reagieren.',
    });
  }

  // 5. DNSSEC Check (Max 10 pts)
  if (dnssecActive) {
    score += 10;
    items.push({
      id: 'dnssec',
      label: 'DNSSEC Cryptographic Signature',
      category: 'security',
      status: 'pass',
      value: 'Validated (RRSIG)',
      summary: isEn ? 'DNS answers cryptographically signed' : 'DNS-Antworten kryptografisch signiert & manipulationssicher',
      details: isEn
        ? 'AD flag received. Zone is shielded against DNS spoofing and cache poisoning.'
        : 'AD-Flag bestätigt. Die DNS-Zone ist gegen Cache Poisoning und Manipulation geschützt.',
    });
  } else {
    items.push({
      id: 'dnssec',
      label: 'DNSSEC Cryptographic Signature',
      category: 'security',
      status: 'info',
      value: 'Unsigned',
      summary: isEn ? 'DNSSEC not activated' : 'DNSSEC nicht aktiv',
      details: isEn
        ? 'Cryptographic DNSSEC signatures are optional, but recommended for verified sale offers.'
        : 'DNSSEC ist optional, bietet aber bei hochwertigen Domains zusätzliche Sicherheit für Käufer.',
    });
  }

  // Determine overall rating
  let rating: 'optimal' | 'good' | 'warning' | 'critical' = 'optimal';
  let ratingLabel = isEn ? 'Optimal Setup' : 'Optimale Konfiguration';
  let summary = isEn
    ? 'Domain is thoroughly shielded, standard-compliant and optimally configured.'
    : 'Die Domain ist vorbildlich abgesichert, standardkonform und sauber konfiguriert.';

  if (hasFallbackA) {
    rating = 'critical';
    ratingLabel = isEn ? 'SMTP Fallback Vulnerability' : 'Kritische Fallback-Sicherheitslücke';
    summary = isEn
      ? 'Attention: Emails sent to this domain will hit your web server IPs due to missing MX records!'
      : 'Achtung: E-Mails an diese Domain versuchen ohne MX-Record direkt Ihren Webserver per SMTP zu kontaktieren!';
  } else if (score >= 80) {
    rating = 'optimal';
    ratingLabel = isEn ? 'IETF Excellence' : 'Exzellente IETF-Konfiguration';
  } else if (score >= 60) {
    rating = 'good';
    ratingLabel = isEn ? 'Good Setup' : 'Solide Konfiguration';
    summary = isEn
      ? 'Good baseline. Consider tightening email policies or adding RFC 7505 Null-MX.'
      : 'Gute Basis. Prüfen Sie, ob ein Null-MX oder schärfere E-Mail-Richtlinien ergänzt werden sollten.';
  } else {
    rating = 'warning';
    ratingLabel = isEn ? 'Basic / Needs Optimization' : 'Optimierungspotenzial';
    summary = isEn
      ? 'Domain configuration has several optimization opportunities regarding sale signals or email hygiene.'
      : 'Die Domain-Konfiguration bietet noch deutliche Optimierungsmöglichkeiten bei Verkaufs-Signal oder E-Mail-Schutz.';
  }

  return {
    domain,
    score,
    rating,
    ratingLabel,
    summary,
    items,
    mxRecords,
    hasNullMx,
    hasFallbackA,
    aRecords,
    aaaaRecords,
    spfRecord,
    dmarcRecord,
    dnssecActive,
  };
}
