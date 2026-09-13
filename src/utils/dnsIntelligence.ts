// DNS & Hoster Identification Utility for RFC 10023 DACH Hub

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
      name: 'Hetzner DNS',
      instructions: 'In der Hetzner DNS Console (dns.hetzner.com) Zone öffnen, Record Typ "TXT", Name "_for-sale" und den generierten String als Wert eintragen.',
      multiRecordSupported: true,
      notes: 'Unterstützt vollwertige Multi-Record RRsets problemlos.',
    }
  },
  {
    regex: /inwx\.(de|com|net)/i,
    profile: {
      id: 'inwx',
      name: 'INWX Domän-Center',
      instructions: 'Im INWX Kundenbereich unter Nameserver die Domain auswählen, neuen TXT-Eintrag anlegen mit Name "_for-sale" und dem Wert.',
      multiRecordSupported: true,
      notes: 'Hervorragende DNS-Engine mit DNSSEC-Unterstützung.',
    }
  },
  {
    regex: /cloudflare\.com/i,
    profile: {
      id: 'cloudflare',
      name: 'Cloudflare DNS',
      instructions: 'Im Cloudflare Dashboard unter DNS -> Records: Add record -> Typ "TXT", Name "_for-sale", Content eintragen. Anführungszeichen weglassen!',
      multiRecordSupported: true,
      notes: 'Sehr schnelle Anycast-Aktualisierung (unter 5 Sekunden).',
    }
  },
  {
    regex: /(ionos|1und1|ui-dns)\.(de|com|biz)/i,
    profile: {
      id: 'ionos',
      name: 'IONOS by 1&1',
      instructions: 'Im IONOS Kundencenter unter Domain -> DNS -> Eintrag hinzufügen: Typ "TXT", Hostname "_for-sale", Wert einfügen.',
      multiRecordSupported: true,
      notes: 'TTL steht standardmäßig auf 1h.',
    }
  },
  {
    regex: /strato\.(de|com)/i,
    profile: {
      id: 'strato',
      name: 'STRATO',
      instructions: 'Im STRATO Kunden-Login: Domains -> Domainverwaltung -> DNS-Einstellungen -> TXT-Records -> Präfix "_for-sale" eintragen.',
      multiRecordSupported: true,
      notes: 'Benötigt meist 15-30 Minuten Propagierungszeit.',
    }
  },
  {
    regex: /netcup\.(de|net)/i,
    profile: {
      id: 'netcup',
      name: 'netcup CCP',
      instructions: 'Im netcup Customer Control Panel (CCP) unter Domains -> DNS: Name "_for-sale", Type "TXT", Destination eintragen.',
      multiRecordSupported: true,
      notes: 'Multi-Record RRsets voll unterstützt.',
    }
  },
  {
    regex: /awsdns/i,
    profile: {
      id: 'route53',
      name: 'AWS Route 53',
      instructions: 'In der AWS Route 53 Management Console: Hosted Zone wählen, Create Record -> Record name "_for-sale", Record type "TXT", Value mit Anführungszeichen.',
      multiRecordSupported: true,
      notes: 'Bei mehreren Records jede Zeile in Anführungszeichen in das Textfeld setzen.',
    }
  },
  {
    regex: /ovh\.(net|de|com)/i,
    profile: {
      id: 'ovh',
      name: 'OVHcloud DNS',
      instructions: 'Im OVH Manager unter Web Cloud -> Domains -> DNS-Zone -> Eintrag hinzufügen: TXT, Subdomain "_for-sale".',
      multiRecordSupported: true,
      notes: 'Europäischer Cloud-Hoster mit DNSSEC-Option.',
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
  d = d.replace(/\s+/g, '');          // strip all internal whitespace (e.g. "rfc 10023.de" → "rfc10023.de")
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/^_for-sale\./, '');
  d = d.split('/')[0];
  d = d.split(':')[0];
  return d;
}
