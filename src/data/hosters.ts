export interface HosterSupport {
  id: string;
  name: string;
  country: string;
  status: 'supported' | 'partial' | 'workaround';
  statusText: string;
  uiField: string;
  sampleRecord: string;
  notes: string;
  docsUrl?: string;
}

export const HOSTERS_DATA: HosterSupport[] = [
  {
    id: 'hetzner',
    name: 'Hetzner DNS Console',
    country: '🇩🇪 Deutschland',
    status: 'supported',
    statusText: 'Voll unterstützt',
    uiField: 'Name: _for-sale | Typ: TXT | Wert: v=FORSALE1;fval=EUR2500',
    sampleRecord: '_for-sale  3600  IN  TXT  "v=FORSALE1;fval=EUR2500"',
    notes: 'Hetzner erlaubt führende Unterstriche (RFC 8552) ohne Warnung in der Web-Console sowie per DNS-API.',
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare DNS',
    country: '🌐 Global',
    status: 'supported',
    statusText: 'Voll unterstützt',
    uiField: 'Type: TXT | Name: _for-sale | Content: v=FORSALE1;fval=EUR2500',
    sampleRecord: '_for-sale  300  IN  TXT  "v=FORSALE1;fval=EUR2500"',
    notes: 'Exzellente DoH-Verbreitung. Content ohne Anführungszeichen in die Weboberfläche eintragen. TTL Auto oder 300s.',
  },
  {
    id: 'inwx',
    name: 'INWX (InterNetworX)',
    country: '🇩🇪 Deutschland',
    status: 'supported',
    statusText: 'Voll unterstützt',
    uiField: 'Name: _for-sale | Typ: TXT | Wert: v=FORSALE1;fval=EUR2500',
    sampleRecord: '_for-sale  3600  IN  TXT  "v=FORSALE1;fval=EUR2500"',
    notes: 'Im INWX Domain-Center im Tab DNS-Einträge ohne Einschränkung hinterlegbar. Multi-Record RRset voll unterstützt.',
  },
  {
    id: 'netcup',
    name: 'Netcup CCP / DNS-Editor',
    country: '🇩🇪 Deutschland',
    status: 'supported',
    statusText: 'Voll unterstützt',
    uiField: 'Host: _for-sale | Type: TXT | Destination: v=FORSALE1;fval=EUR2500',
    sampleRecord: '_for-sale  3600  IN  TXT  "v=FORSALE1;fval=EUR2500"',
    notes: 'Der Netcup Customer Control Panel DNS-Editor akzeptiert Unterstriche für TXT-Records uneingeschränkt.',
  },
  {
    id: 'desec',
    name: 'deSEC.io',
    country: '🇩🇪 Deutschland (Open Source)',
    status: 'supported',
    statusText: 'Voll unterstützt (DNSSEC nativ)',
    uiField: 'Subname: _for-sale | Type: TXT | Value: "v=FORSALE1;fval=EUR2500"',
    sampleRecord: '_for-sale  3600  IN  TXT  "\"v=FORSALE1;fval=EUR2500\""',
    notes: 'Kostenfreier Non-Profit DNS-Provider mit automatischer DNSSEC-Signierung des RFC 10023 Records.',
  },
  {
    id: 'strato',
    name: 'Strato',
    country: '🇩🇪 Deutschland',
    status: 'partial',
    statusText: 'Eingeschränkt / Tarifabhängig',
    uiField: 'TXT-Präfix: _for-sale',
    sampleRecord: '_for-sale  TXT  "v=FORSALE1;fval=EUR2500"',
    notes: 'Einige ältere Strato-Pakete validieren Hostnamen strikt nach Hostname-Syntax (RFC 1035) und lehnen "_" ab. Lösung: Strato DNS-Expertenmodus oder Nameserver-Delegierung.',
  },
  {
    id: 'ionos',
    name: 'IONOS (1&1)',
    country: '🇩🇪 Deutschland',
    status: 'partial',
    statusText: 'Eingeschränkt / UI-Prüfung',
    uiField: 'Subdomain: _for-sale | Record: TXT',
    sampleRecord: '_for-sale  TXT  "v=FORSALE1;fval=EUR2500"',
    notes: 'Im Standard-Dashboard blockiert IONOS gelegentlich Unterstriche bei manuellen Subdomains. Über die IONOS DNS-API oder mit externen Nameservern funktioniert es.',
  },
  {
    id: 'ovh',
    name: 'OVHcloud',
    country: '🇫🇷 / 🇩🇪 Europa',
    status: 'supported',
    statusText: 'Voll unterstützt',
    uiField: 'Subdomaine: _for-sale | Type: TXT | Valeur: "v=FORSALE1;fval=EUR2500"',
    sampleRecord: '_for-sale  3600  IN  TXT  "v=FORSALE1;fval=EUR2500"',
    notes: 'OVH Manager DNS-Zoneneditor unterstützt RFC 10023 Records ohne Restriktionen.',
  }
];
