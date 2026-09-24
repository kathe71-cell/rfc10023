export interface SearchItem {
  id: string;
  titleDe: string;
  titleEn: string;
  descDe: string;
  descEn: string;
  category: 'tools' | 'standards' | 'hoster' | 'faq' | 'legal';
  pathDe: string;
  pathEn: string;
  keywordsDe: string[];
  keywordsEn: string[];
}

export const SEARCH_INDEX: SearchItem[] = [
  // Tools
  {
    id: 'tool-validator',
    titleDe: 'Live DNS-Validator & Audit',
    titleEn: 'Live DNS Validator & Audit',
    descDe: 'Echtzeit-DoH-Prüfung für _for-sale TXT-Records, Null-MX (RFC 7505), SPF, DMARC und DNSSEC.',
    descEn: 'Realtime DoH check for _for-sale TXT records, Null-MX (RFC 7505), SPF, DMARC and DNSSEC.',
    category: 'tools',
    pathDe: '/validator',
    pathEn: '/en/validator',
    keywordsDe: ['validator', 'prüfen', 'audit', 'check', 'dns', 'score', 'readiness', 'mx', 'spf', 'dmarc', 'txt', 'test'],
    keywordsEn: ['validator', 'audit', 'check', 'dns', 'score', 'readiness', 'mx', 'spf', 'dmarc', 'txt', 'test', 'lookup'],
  },
  {
    id: 'tool-generator',
    titleDe: 'RFC 10023 Record Generator',
    titleEn: 'RFC 10023 Record Generator',
    descDe: 'Erzeuge IETF-konforme Multi-Record RRsets oder Single-Line TXT für Cloudflare, Hetzner, INWX, BIND und Terraform.',
    descEn: 'Generate IETF-compliant multi-record RRsets or single-line TXT for Cloudflare, Hetzner, INWX, BIND and Terraform.',
    category: 'tools',
    pathDe: '/generator',
    pathEn: '/en/generator',
    keywordsDe: ['generator', 'erstellen', 'rrset', 'bind', 'zonefile', 'cloudflare', 'hetzner', 'inwx', 'fval', 'furi', 'ftxt'],
    keywordsEn: ['generator', 'create', 'rrset', 'bind', 'zonefile', 'cloudflare', 'hetzner', 'inwx', 'fval', 'furi', 'ftxt', 'builder'],
  },
  {
    id: 'tool-bulk',
    titleDe: 'Bulk Portfolio Scanner',
    titleEn: 'Bulk Portfolio Scanner',
    descDe: 'Gleichzeitige Prüfung von bis zu 50 Domain-Namen auf RFC 10023 Signale und E-Mail-Sicherheit.',
    descEn: 'Scan up to 50 domains simultaneously for RFC 10023 signals and email hygiene status.',
    category: 'tools',
    pathDe: '/bulk-scan',
    pathEn: '/en/bulk-scan',
    keywordsDe: ['bulk', 'stapel', 'portfolio', 'liste', 'csv', 'massenprüfung', 'domainer'],
    keywordsEn: ['bulk', 'portfolio', 'list', 'csv', 'batch', 'domainer', 'mass-check'],
  },
  {
    id: 'tool-badge',
    titleDe: 'Trust-Badge Generator',
    titleEn: 'Trust Badge Generator',
    descDe: 'Interaktive SVG- & HTML-Badges für Verkaufs-Landingpages, Marktplätze oder GitHub-Repositories.',
    descEn: 'Interactive SVG & HTML badges for domain landing pages, marketplaces or GitHub repos.',
    category: 'tools',
    pathDe: '/badge-generator',
    pathEn: '/en/badge-generator',
    keywordsDe: ['badge', 'siegel', 'svg', 'embed', 'verkaufsseite', 'sedo', 'dan', 'afternic'],
    keywordsEn: ['badge', 'shield', 'svg', 'embed', 'landingpage', 'sedo', 'dan', 'afternic'],
  },
  {
    id: 'tool-ecosystem',
    titleDe: 'Ökosystem & Adoption Tracker',
    titleEn: 'Ecosystem & Adoption Tracker',
    descDe: 'Transparente Übersicht zu Registries, Registraren, Scannern, KI/MCP-Tools und globalen Adoptions-Zahlen.',
    descEn: 'Transparent directory of registries, registrars, scanners, AI/MCP tools and global telemetry metrics.',
    category: 'standards',
    pathDe: '/oekosystem',
    pathEn: '/en/ecosystem',
    keywordsDe: ['oekosystem', 'ökosystem', 'ecosystem', 'adoption', 'tracker', 'verbreitung', 'tools', 'inwx', 'sidn', 'forsaledns', 'statistik', 'telemetrie'],
    keywordsEn: ['ecosystem', 'adoption', 'tracker', 'telemetry', 'tools', 'inwx', 'sidn', 'forsaledns', 'statistics', 'directory'],
  },
  {
    id: 'tool-api',
    titleDe: 'REST API v1 Dokumentation',
    titleEn: 'REST API v1 Documentation',
    descDe: 'Programmatische DNS-Validierung via JSON-Endpunkt /api/v1/validate mit CORS und TTL-Reporting.',
    descEn: 'Programmatic DNS validation via JSON endpoint /api/v1/validate with CORS and TTL reporting.',
    category: 'tools',
    pathDe: '/api-docs',
    pathEn: '/en/api-docs',
    keywordsDe: ['api', 'rest', 'json', 'developer', 'curl', 'python', 'endpoint', 'entwickler'],
    keywordsEn: ['api', 'rest', 'json', 'developer', 'curl', 'python', 'endpoint', 'sdk'],
  },

  // Standards & Specs
  {
    id: 'spec-overview',
    titleDe: 'RFC 10023 Spezifikation',
    titleEn: 'RFC 10023 Specification',
    descDe: 'Vollständige deutsche Analyse des IETF RFC 10023 Standards, Leaf-Node-Architektur und RDATA-Tags.',
    descEn: 'Complete analysis of the IETF RFC 10023 standard, leaf node architecture, and RDATA tags.',
    category: 'standards',
    pathDe: '/spezifikation',
    pathEn: '/en/specification',
    keywordsDe: ['spezifikation', 'rfc', 'ietf', 'standard', 'leaf node', '_for-sale', 'norm', 'architektur'],
    keywordsEn: ['specification', 'rfc', 'ietf', 'standard', 'leaf node', '_for-sale', 'architecture', 'docs'],
  },
  {
    id: 'spec-tag-v',
    titleDe: 'Tag v= (Version Header)',
    titleEn: 'Tag v= (Version Header)',
    descDe: 'Verpflichtender Versions-Header. Muss genau v=FORSALE1; lauten (RFC 10023 §2.1).',
    descEn: 'Mandatory version header. Must be exactly v=FORSALE1; (RFC 10023 §2.1).',
    category: 'standards',
    pathDe: '/spezifikation',
    pathEn: '/en/specification',
    keywordsDe: ['tag v', 'forsale1', 'version', 'header', 'syntax'],
    keywordsEn: ['tag v', 'forsale1', 'version', 'header', 'syntax'],
  },
  {
    id: 'spec-tag-fval',
    titleDe: 'Tag fval= (Preisangabe)',
    titleEn: 'Tag fval= (Asking Price)',
    descDe: 'Preisangabe nach ISO-4217 (z. B. EUR2500, USD50000). Fehlt bei Verhandlungsbasis (VHB).',
    descEn: 'Asking price format per ISO-4217 (e.g. EUR2500, USD50000). Omitted for negotiable offers.',
    category: 'standards',
    pathDe: '/spezifikation',
    pathEn: '/en/specification',
    keywordsDe: ['fval', 'preis', 'iso-4217', 'eur', 'usd', 'kosten', 'vhb', 'festpreis'],
    keywordsEn: ['fval', 'price', 'iso-4217', 'eur', 'usd', 'cost', 'negotiable', 'fixed-price'],
  },
  {
    id: 'spec-tag-furi',
    titleDe: 'Tag furi= (Kontakt-URI)',
    titleEn: 'Tag furi= (Contact URI)',
    descDe: 'Zieladresse für Käufer: https:// Verkaufsseite oder mailto: Direktkontakt (RFC 3986).',
    descEn: 'Target URI for prospective buyers: https:// landing page or mailto: contact (RFC 3986).',
    category: 'standards',
    pathDe: '/spezifikation',
    pathEn: '/en/specification',
    keywordsDe: ['furi', 'uri', 'url', 'kontakt', 'mailto', 'escrow', 'treuhand', 'link'],
    keywordsEn: ['furi', 'uri', 'url', 'contact', 'mailto', 'escrow', 'link'],
  },
  {
    id: 'spec-tag-ftxt',
    titleDe: 'Tag ftxt= (Freitext & Notiz)',
    titleEn: 'Tag ftxt= (Free Text / Notes)',
    descDe: 'Menschenlesbare Zusatznotiz im DNS-TXT-Eintrag (z. B. MwSt.-Hinweis, Leasing-Option).',
    descEn: 'Human-readable remarks in the DNS TXT record (e.g. VAT notice, lease option).',
    category: 'standards',
    pathDe: '/spezifikation',
    pathEn: '/en/specification',
    keywordsDe: ['ftxt', 'notiz', 'text', 'hinweis', 'leasing', 'mwst', 'freitext'],
    keywordsEn: ['ftxt', 'note', 'text', 'remarks', 'leasing', 'vat', 'comment'],
  },

  // Hoster
  {
    id: 'hoster-matrix',
    titleDe: 'Hoster-Kompatibilitätsmatrix',
    titleEn: 'Provider Compatibility Matrix',
    descDe: 'Vergleich deutscher & internationaler DNS-Editoren: Hetzner, Cloudflare, INWX, Netcup, Strato, IONOS.',
    descEn: 'Comparison of DNS management panels: Hetzner, Cloudflare, INWX, Netcup, Strato, IONOS.',
    category: 'hoster',
    pathDe: '/hoster-matrix',
    pathEn: '/en/hoster-matrix',
    keywordsDe: ['hoster', 'matrix', 'provider', 'nameserver', 'dns-editor', 'hetzner', 'cloudflare', 'inwx', 'netcup', 'strato', 'ionos', 'ovh', 'desec'],
    keywordsEn: ['hoster', 'matrix', 'provider', 'nameserver', 'dns-editor', 'hetzner', 'cloudflare', 'inwx', 'netcup', 'strato', 'ionos', 'ovh', 'desec'],
  },

  // Legal
  {
    id: 'legal-guide',
    titleDe: 'Rechts- & Compliance-Leitfaden',
    titleEn: 'Legal & Compliance Guidelines',
    descDe: 'UWG-Rechtssicherheit, BGB-Bindungswirkung von fval-Preisen, Impressumspflicht und Markenschutz im DACH-Raum.',
    descEn: 'UWG compliance, BGB binding effects of fval prices, imprint duties and trademark safety in DACH.',
    category: 'legal',
    pathDe: '/recht-leitfaden',
    pathEn: '/en/legal-guidelines',
    keywordsDe: ['recht', 'uwg', 'abmahnung', 'preisangabe', 'bgb', 'invitatio ad offerendum', 'markenrecht', 'compliance', 'leitfaden'],
    keywordsEn: ['legal', 'law', 'compliance', 'guidelines', 'pricing', 'trademark', 'liability', 'imprint'],
  },

  // FAQ
  {
    id: 'faq-overview',
    titleDe: 'Häufige Fragen (FAQ)',
    titleEn: 'Frequently Asked Questions (FAQ)',
    descDe: 'Antworten zu Kosten, DNSSEC, Null-MX (RFC 7505), TXT-TTL und Multi-Record-Konfiguration.',
    descEn: 'Answers regarding pricing, DNSSEC, Null-MX (RFC 7505), TXT TTL and multi-record setups.',
    category: 'faq',
    pathDe: '/faq',
    pathEn: '/en/faq',
    keywordsDe: ['faq', 'fragen', 'antworten', 'null-mx', '7505', 'ttl', 'dnssec', 'kosten', 'wie funktioniert'],
    keywordsEn: ['faq', 'questions', 'answers', 'null-mx', '7505', 'ttl', 'dnssec', 'cost', 'how it works'],
  }
];
