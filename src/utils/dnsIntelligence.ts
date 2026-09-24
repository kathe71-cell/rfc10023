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

export interface DnsDomainValidation {
  valid: boolean;
  cleanDomain: string;
  punyHost: string;
  error?: string;
  errorEn?: string;
}

/**
 * Validates a domain name according to RFC 1035 / RFC 2181 / RFC 5890:
 * - Total length of normalized Punycode host must not exceed 253 octets.
 * - Each individual label must not exceed 63 octets after Punycode / IDNA conversion.
 * - Each label must follow valid DNS syntax (alphanumeric, hyphens not leading or trailing).
 */
export function validateDomainHostname(raw: string): DnsDomainValidation {
  if (!raw || typeof raw !== 'string') {
    return {
      valid: false,
      cleanDomain: '',
      punyHost: '',
      error: 'Parameter "domain" oder "d" fehlt oder ist ungültig.',
      errorEn: 'Missing or invalid domain parameter.',
    };
  }

  const trimmed = raw.trim();
  if (trimmed.length > 253) {
    return {
      valid: false,
      cleanDomain: '',
      punyHost: '',
      error: 'Ungültige Domain: Der Domainname darf maximal 253 Zeichen lang sein.',
      errorEn: 'Invalid domain: Domain name may not exceed 253 characters.',
    };
  }

  const clean = cleanDomainInput(trimmed);
  if (!clean || !clean.includes('.') || clean.length < 3 || clean.length > 253) {
    return {
      valid: false,
      cleanDomain: clean,
      punyHost: '',
      error: 'Ungültiger Domainname übergeben.',
      errorEn: 'Invalid domain syntax. Must contain a valid TLD.',
    };
  }

  let punyHost = '';
  try {
    punyHost = new URL(`https://${clean}`).hostname;
  } catch {
    punyHost = clean;
  }

  // Check Punycode ASCII octet length (RFC 1035: max 253 octets)
  const hostOctetLength = new TextEncoder().encode(punyHost).length;

  if (!punyHost || hostOctetLength > 253 || hostOctetLength < 3) {
    return {
      valid: false,
      cleanDomain: clean,
      punyHost,
      error: 'Ungültige Domain: Der Domainname darf maximal 253 Zeichen lang sein.',
      errorEn: 'Invalid domain: Domain name may not exceed 253 characters.',
    };
  }

  const labels = punyHost.split('.');
  if (labels.length < 2) {
    return {
      valid: false,
      cleanDomain: clean,
      punyHost,
      error: 'Ungültiger Domainname übergeben.',
      errorEn: 'Invalid domain syntax. Must contain a valid TLD.',
    };
  }

  for (const label of labels) {
    if (!label || label.length === 0) {
      return {
        valid: false,
        cleanDomain: clean,
        punyHost,
        error: 'Ungültige Domain: Leeres DNS-Label erkannt.',
        errorEn: 'Invalid domain: Empty DNS label detected.',
      };
    }

    const labelOctetLength = new TextEncoder().encode(label).length;

    if (labelOctetLength > 63) {
      return {
        valid: false,
        cleanDomain: clean,
        punyHost,
        error: 'Ungültige Domain: Ein DNS-Label darf maximal 63 Zeichen lang sein.',
        errorEn: 'Invalid domain: A DNS label may not exceed 63 characters.',
      };
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/i.test(label)) {
      return {
        valid: false,
        cleanDomain: clean,
        punyHost,
        error: 'Ungültige Domain: DNS-Label enthält ungültige Zeichen.',
        errorEn: 'Invalid domain: DNS label contains invalid characters.',
      };
    }
  }

  return {
    valid: true,
    cleanDomain: clean,
    punyHost,
  };
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

