// DNS & Hoster Identification Utility for RFC 10023 Toolkit

export interface HosterProfile {
  id: string;
  name: string;
  instructions: string;
  guideUrl?: string;
  multiRecordSupported: boolean;
  notes: string;
}

export const HOSTER_PATTERNS: { regex: RegExp; profile: HosterProfile }[] = [
  {
    regex: /hetzner\.(com|de)/i,
    profile: {
      id: 'hetzner',
      name: 'Hetzner DNS Console',
      instructions: 'In der Hetzner DNS Console (dns.hetzner.com) Zone öffnen, Record Typ "TXT", Name "_for-sale" und den generierten Wert eintragen.',
      multiRecordSupported: true,
      notes: 'Hetzner erlaubt führende Unterstriche (RFC 8552) ohne Warnung in der Web-Console sowie per DNS-API.',
    }
  },
  {
    regex: /inwx\.(de|com|net)/i,
    profile: {
      id: 'inwx',
      name: 'INWX (InterNetworX)',
      instructions: 'Im INWX Domain-Center im Tab DNS-Einträge einen neuen TXT-Eintrag anlegen mit Name "_for-sale" und dem Wert.',
      multiRecordSupported: true,
      notes: 'Multi-Record RRset und DNSSEC werden uneingeschränkt unterstützt.',
    }
  },
  {
    regex: /cloudflare\.com/i,
    profile: {
      id: 'cloudflare',
      name: 'Cloudflare DNS',
      instructions: 'Im Cloudflare Dashboard unter DNS -> Records: Add record -> Typ "TXT", Name "_for-sale", Content eintragen (Content ohne Anführungszeichen einfügen).',
      multiRecordSupported: true,
      notes: 'Anycast-DNS mit schneller weltweiter Propagierung. TTL Auto oder 300s.',
    }
  },
  {
    regex: /(ionos|1und1|ui-dns)\.(de|com|biz)/i,
    profile: {
      id: 'ionos',
      name: 'IONOS (1&1)',
      instructions: 'Im IONOS Kundencenter unter Domain -> DNS -> Eintrag hinzufügen: Typ "TXT", Hostname "_for-sale", Wert einfügen.',
      multiRecordSupported: true,
      notes: 'Falls der Standard-Editor Unterstriche blockiert, die IONOS DNS-API oder Expertenmodus nutzen.',
    }
  },
  {
    regex: /strato\.(de|com)/i,
    profile: {
      id: 'strato',
      name: 'STRATO',
      instructions: 'Im STRATO Kunden-Login: Domains -> Domainverwaltung -> DNS-Einstellungen -> TXT-Records -> Präfix "_for-sale" eintragen.',
      multiRecordSupported: true,
      notes: 'Einige ältere Strato-Pakete erfordern den DNS-Expertenmodus für führende Unterstriche.',
    }
  },
  {
    regex: /netcup\.(de|net)/i,
    profile: {
      id: 'netcup',
      name: 'Netcup CCP',
      instructions: 'Im Netcup Customer Control Panel (CCP) unter Domains -> DNS: Name/Host "_for-sale", Type "TXT", Destination eintragen.',
      multiRecordSupported: true,
      notes: 'Der CCP DNS-Editor akzeptiert Unterstriche für TXT-Records uneingeschränkt.',
    }
  },
  {
    regex: /awsdns/i,
    profile: {
      id: 'route53',
      name: 'AWS Route 53',
      instructions: 'In Route 53: Hosted Zone -> Create Record -> Name "_for-sale", Type "TXT", Value mit Anführungszeichen.',
      multiRecordSupported: true,
      notes: 'Bei mehreren Records jede Zeile in Anführungszeichen in das Textfeld setzen.',
    }
  },
  {
    regex: /ovh\.(net|de|com)/i,
    profile: {
      id: 'ovh',
      name: 'OVHcloud',
      instructions: 'Im OVH Manager unter Web Cloud -> Domains -> DNS-Zone -> Eintrag hinzufügen: TXT, Subdomain "_for-sale".',
      multiRecordSupported: true,
      notes: 'OVH Manager DNS-Zoneneditor unterstützt Multi-Record TXT-Einträge.',
    }
  }
];

export function detectHosterFromNameservers(nameservers: string[]): HosterProfile | null {
  for (const ns of nameservers) {
    for (const item of HOSTER_PATTERNS) {
      if (item.regex.test(ns)) {
        return item.profile;
      }
    }
  }
  return null;
}

export function calculateUtf8ByteLength(str: string): number {
  return new TextEncoder().encode(str).length;
}

export function cleanDomainInput(raw: string): string {
  let d = raw.trim().toLowerCase();
  d = d.replace(/\s+/g, '');
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/^_for-sale\./, '');
  d = d.split('/')[0];
  d = d.split(':')[0];
  return d;
}

/**
 * Converts a domain name (which may be Unicode or Punycode) to canonical Punycode hostname
 * for RFC 1035 DNS queries (DoH).
 */
export function toPunycodeHostname(domain: string): string {
  try {
    const clean = cleanDomainInput(domain);
    return new URL(`https://${clean}`).hostname;
  } catch {
    return cleanDomainInput(domain);
  }
}

/**
 * Sanitizes a string for CSV export to prevent formula injection attacks.
 * If the string starts with =, +, -, @, \t, or \r, prepend a single quote.
 */
export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  // Escape double quotes inside cell
  return `"${str.replace(/"/g, '""')}"`;
}

