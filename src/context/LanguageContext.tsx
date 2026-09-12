import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'de' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  de: {
    // Navigation
    'nav.validator': 'Validator',
    'nav.generator': 'Generator',
    'nav.bulk': 'Bulk-Scan',
    'nav.badge': 'Trust-Badge',
    'nav.api': 'API Docs',
    'nav.legal': 'Recht & Steuern',
    'nav.matrix': 'Matrix',
    'nav.doh_test': 'DoH Test',
    'nav.mobile_validate': 'DNS Prüfen',
    'nav.mobile_generate': 'Record Bauen',

    // Hero Section
    'hero.badge': 'IETF RFC 10023 • DNS-Knoten: _for-sale',
    'hero.title_part1': 'Kein Parking.',
    'hero.title_part2': 'Keine Weiterleitung.',
    'hero.title_part3': 'Verkaufen direkt im DNS.',
    'hero.desc': 'Der Standard RFC 10023 definiert, wie Domainverkäufe direkt im Domain Name System hinterlegt werden. Statt Besucher auf Werbeseiten umzuleiten, tragen Inhaber Preis und Kontakt in einen TXT-Eintrag ein. Registrare und Kaufinteressenten lesen das Angebot automatisiert aus.',
    'hero.cta_validate': 'Domain live prüfen',
    'hero.cta_generate': 'Eintrag erstellen',
    'hero.cta_bulk': 'Bulk-Scan →',
    'hero.stat_commission': 'Provision',
    'hero.stat_record': 'Record-Typ',
    'hero.stat_mandatory': 'Pflichtfeld',

    // Terminal Hero Preview
    'hero.terminal_header': 'Terminal — DNS-Abfrage',
    'hero.terminal_comment': '# Abfrage der Verkaufsdaten einer Domain:',
    'hero.terminal_node': 'DNS-Knoten:',
    'hero.terminal_dnssec': 'DNSSEC:',
    'hero.terminal_dnssec_val': 'Signiert und authentifiziert',
    'hero.terminal_standard': 'Standard:',
    'hero.terminal_example': 'Praxisbeispiel: Registry SIDN (.nl)',
    'hero.terminal_spec_link': 'Spezifikation lesen →',

    // Feature Cards
    'feat.bulk_title': 'Portfolio Bulk-Scanner',
    'feat.bulk_desc': 'Bis zu 30 Domains parallel prüfen, DNSSEC abfragen und als CSV exportieren.',
    'feat.badge_title': 'Verifikations-Badge',
    'feat.badge_desc': 'Kopierbare Badges für Verkaufsseiten mit Direktlink zur Prüfung.',
    'feat.api_title': 'Öffentliche REST-API',
    'feat.api_desc': 'Kostenfreie Schnittstelle für Entwickler, Skripte und Abfrage-Tools.',
    'feat.legal_title': 'Recht und Steuern',
    'feat.legal_desc': 'Impressumspflicht nach § 5 DDG, Vertragsrecht und Preisangaben im DACH-Raum.',

    // Definition Box
    'def.badge': 'Definition',
    'def.text': 'RFC 10023 beschreibt einen DNS-TXT-Eintrag unter _for-sale.[domain]. Mit dem Pflichtfeld v=FORSALE1; sowie optionalen Angaben wie fval (Preis) und furi (Kontaktadresse) hinterlegen Inhaber ihre Verkaufsbereitschaft direkt in der DNS-Zone der Domain.',
    'def.spec_link': 'RFC 10023 Spezifikation →',

    // Bento / Comparison Grid
    'bento.bg_badge': 'Hintergrund',
    'bento.main_title': 'Warum DNS-Signale herkömmliches Parking ablösen',
    'bento.card1_badge': 'Ablauf',
    'bento.card1_title': 'Direkte Erkennung bei Whois- und Verfügbarkeitsprüfungen',
    'bento.card1_desc': 'Bisher sah ein Interessent erst beim Aufruf im Webbrowser, ob eine Domain zum Verkauf steht. RFC 10023 verlagert diese Information in das DNS:',
    'bento.step1': '1. Inhaber setzt TXT-Eintrag',
    'bento.step2': '2. Resolver liest v=FORSALE1 aus',
    'bento.step3': '3. Registrar zeigt Verkaufsoption',
    'bento.card1_footer': 'Keine Bindung an externe Parkingservices',
    'bento.card1_tech_link': 'Technische Details →',

    'bento.card2_badge': 'Vergleich',
    'bento.card2_title': 'Klassisches Parking versus RFC 10023',
    'bento.row_commission': 'Verkaufsprovision',
    'bento.row_commission_val': '0 % (beim Direktverkauf)',
    'bento.row_ns': 'Nameserver-Wechsel',
    'bento.row_ns_val': 'Nicht nötig',
    'bento.row_deindex': 'Deindexierungsrisiko',
    'bento.row_deindex_val': 'Keines',
    'bento.row_dnssec': 'DNSSEC-Signierung',
    'bento.row_dnssec_val': 'Voll unterstützt',
    'bento.row_machine': 'Maschinenlesbar',
    'bento.row_machine_val': 'Offizieller Standard',
    'bento.card2_note': '* Gilt für Direktverkäufe über den im DNS hinterlegten Kontaktlink.',

    'bento.card3_badge': 'Praxiseinsatz',
    'bento.card3_title': 'Registry SIDN (.nl) prüft RFC 10023 bei Domainabfragen',
    'bento.card3_desc': 'Die niederländische Vergabestelle SIDN fragt bei Verfügbarkeitsprüfungen automatisiert den Eintrag _for-sale ab. Steht eine .nl-Adresse zum Verkauf, erscheint der Hinweis samt Preis und Kontakt direkt im Suchergebnis.',
    'bento.card3_btn': 'SIDN.nl öffnen',

    // Quote
    'quote.text': '„RFC 10023 trennt das Verkaufsangebot von der eigentlichen Website. Eine Domain muss nicht brachliegen oder auf Werbebanner umgeleitet werden, um Kaufinteressenten zu signalisieren, dass Angebote willkommen sind.“',
    'quote.author': '— IETF DNSOP Working Group',

    // FAQs
    'faq.badge': 'Fragen und Antworten',
    'faq.title': 'Häufige Fragen zu RFC 10023',
    'faq.q1': 'Warum RFC 10023 statt klassischem Domainparking bei Sedo oder Afternic?',
    'faq.a1': 'Domainparking über externe Werbeseiten birgt handfeste Nachteile: Browser blockieren die Banner, Suchmaschinen strafen geparkte Adressen mit Deindexierung ab und bei einem Verkauf fallen 10 bis 15 Prozent Provision an. Mit RFC 10023 bleibt die Domain auf Ihren regulären Nameservern oder einer eigenen Webpräsenz erreichbar. Das Verkaufsangebot wird direkt im DNS signalisiert, lesbar für Registrare und Käufer ohne Zwischenhändler.',
    'faq.q2': 'Muss jede Tag-Angabe in einen separaten TXT-Eintrag?',
    'faq.a2': 'Nach RFC 10023 Abschnitt 2.1 lautet die Vorgabe der IETF: Jeder TXT-Eintrag enthält genau ein Tag-Wert-Paar (zum Beispiel Eintrag 1 mit "v=FORSALE1;fval=USD195000" und Eintrag 2 mit "v=FORSALE1;furi=https://..."). Unser Generator unterstützt sowohl dieses offizielle Verfahren als auch die einzeilige Variante für Nameserver mit einfacher Menüführung.',
    'faq.q3': 'Wie erkennen Registrare und Broker, dass eine Domain zum Verkauf steht?',
    'faq.a3': 'Registrare wie die niederländische Registry SIDN für .nl führen bei Verfügbarkeitsabfragen einen DNS-Query auf Typ 16 (TXT) am Knotennamen _for-sale durch. Findet das System den Eintrag "v=FORSALE1", zeigt der Registrar dem Interessenten direkt den Kaufpreis und den Kontakt an.',
    'faq.q4': 'Welche Kosten entstehen durch den DNS-Standard?',
    'faq.a4': 'Keine. RFC 10023 ist ein offener Standard der IETF. TXT-Einträge im DNS gehören bei praktisch allen Hostern zum kostenfreien Standardumfang einer Domain.',
    'faq.q5': 'Wie schützt man sich vor Spam auf die Kontaktdaten?',
    'faq.a5': 'Im Tag furi sollte man statt einer offenen Mailadresse besser einen Link zu einem geschützten Kontaktformular, einer Projektseite oder einem Treuhandkonto angeben. So bleibt die Domain maschinenlesbar, ohne Angriffsfläche für Adress-Sammler zu bieten.',

    // Widget Embed
    'widget.title': 'Widget zum Einbinden',
    'widget.desc': 'Binde den RFC 10023 Validator oder Generator direkt in deine Website, dein Blog oder ein Kundenportal ein.',
    'widget.copy_btn': 'Code kopieren',
    'widget.copied': 'Kopiert!',

    // Validator Page standalone
    'valpage.badge': 'DNS-Prüfung',
    'valpage.title': 'RFC 10023 DNS-Validator',
    'valpage.desc': 'Prüfen Sie Domains weltweit in Echtzeit auf vorhandene _for-sale TXT-Einträge und deren Konformität mit dem IETF-Standard.',
    'valpage.diag_title': 'Wie funktioniert die Prüfung?',
    'valpage.diag_text': 'Die Abfrage läuft direkt aus Ihrem Browser an öffentliche Anycast-Resolver von Cloudflare und Google. Dabei wird der TXT-Eintrag am Namen _for-sale.[domain] abgefragt. Das Skript prüft anschließend den Versionsheader v=FORSALE1; und die Felder fval, furi sowie ftxt.',

    // Generator Page standalone
    'genpage.badge': 'Generator',
    'genpage.title': 'RFC 10023 Generator',
    'genpage.desc': 'Erstellen Sie standardkonforme DNS-TXT-Einträge für Ihre Domains und exportieren Sie den fertigen Code für Cloudflare, BIND, Hetzner, INWX oder die Kommandozeile.',
    'genpage.guide_title': 'So hinterlegen Sie den Eintrag',
    'genpage.step1_title': '1. DNS öffnen',
    'genpage.step1_desc': 'Melden Sie sich bei Ihrem Registrar oder DNS-Anbieter an und öffnen Sie die DNS-Verwaltung der Domain.',
    'genpage.step2_title': '2. Typ und Name wählen',
    'genpage.step2_desc': 'Wählen Sie als Typ TXT und tragen Sie als Name _for-sale ein.',
    'genpage.step3_title': '3. Prüfen',
    'genpage.step3_desc': 'Fügen Sie den generierten Text als Wert ein. Nach wenigen Minuten können Sie den Eintrag mit unserem Prüftool testen.',

    // Validator Component
    'val.badge': 'Live DNS-Abfrage mit Hostprüfung',
    'val.title': 'RFC 10023 Prüftool',
    'val.node_prefix': 'Knoten: _for-sale.[domain]',
    'val.placeholder': 'beispieldomain.de',
    'val.btn_check': 'Prüfen',
    'val.btn_checking': 'Prüfe...',
    'val.examples': 'Beispiele:',
    'val.dig_btn': 'dig Befehl',
    'val.dig_copied': 'dig kopiert!',
    'val.esc_hint': '[Esc zum Leeren]',
    'val.copy_record': 'Eintrag kopieren',
    'val.record_copied': 'Kopiert!',
    'val.dnssec_confirmed': 'DNSSEC bestätigt',
    'val.detected_hoster': 'Erkannter Nameserver',
    'val.create_for_hoster': 'Eintrag für diesen Hoster erstellen',
    'val.raw_show': '[+] Raw TXT anzeigen',
    'val.raw_hide': '[-] Raw TXT verbergen',
    'val.inspector_show': '[+] DNS-Inspektor',
    'val.inspector_hide': '[-] DNS-Inspektor ausblenden',
    'val.share_title': 'Prüfergebnis für',
    'val.share_end': 'teilen:',

    // Generator Component
    'gen.badge': 'DNS-Eintrag erstellen',
    'gen.title': 'RFC 10023 Generator',
    'gen.rfc_conform': 'RFC 10023 konform',
    'gen.step1': '1. Domainname',
    'gen.step2': '2. Preisvorstellung (fval)',
    'gen.vhb': 'Verhandlungsbasis (VHB)',
    'gen.step3': '3. Kontaktadresse oder Link (furi)',
    'gen.step3_hint': 'Empfehlung: Link zu einem Treuhanddienst (z. B. Escrow.com), Sedo, Afternic oder einem geschützten Kontaktformular.',
    'gen.step4': '4. Notiz oder Zusatz (ftxt)',
    'gen.format': 'Format:',
    'gen.format_multi': 'Mehrere Zeilen (IETF Standard)',
    'gen.format_single': 'Einzeilig (Fallback)',
    'gen.copy_code': 'Code kopieren',
    'gen.copied': 'Kopiert!',
    'gen.share_link': 'Link teilen',

    // Footer Links
    'footer.claim': 'Das unabhängige DACH-Referenzportal und Entwickler-Toolkit zum IETF-Standard RFC 10023. Dezentrale, standardisierte Kennzeichnung von Domain-Verkaufsabsichten ohne proprietäre Plattform-Abhängigkeit.',
    'footer.disclaimer_title': 'Unabhängigkeitshinweis:',
    'footer.disclaimer': 'rfc10023.de ist ein freies Fach- und Informationsportal. Es besteht kein gesellschaftsrechtliches Verhältnis zur Internet Engineering Task Force (IETF) oder DENIC eG.',
    'footer.tools_title': 'Tools & Hub',
    'footer.link_validator': 'Live DNS-Validator',
    'footer.link_generator': 'Record Builder & Byte-Guard',
    'footer.link_bulk': 'Portfolio Bulk-Scanner',
    'footer.link_badge': 'Trust-Badge Generator',
    'footer.link_api': 'Öffentliche REST-API',
    'footer.link_matrix': 'Hoster-Kompatibilität',
    'footer.standards_title': 'Recht & Standards',
    'footer.link_legal': 'Rechtssicherheit & Steuern',
    'footer.link_spec': 'IETF Spezifikations-Guide',
    'footer.link_orig_rfc': 'IETF RFC 10023 Original',
    'footer.link_imprint': '→ Impressum (§ 5 DDG)',
    'footer.link_privacy': 'Datenschutzerklärung (DSGVO)',
    'footer.share_label': 'Fachportal weiterempfehlen:',
  },
  en: {
    // Navigation
    'nav.validator': 'Validator',
    'nav.generator': 'Generator',
    'nav.bulk': 'Bulk Scan',
    'nav.badge': 'Trust Badge',
    'nav.api': 'API Docs',
    'nav.legal': 'Legal & Taxes',
    'nav.matrix': 'DNS Providers',
    'nav.doh_test': 'DoH Test',
    'nav.mobile_validate': 'Check DNS',
    'nav.mobile_generate': 'Create Record',

    // Hero Section
    'hero.badge': 'IETF RFC 10023 • DNS Node: _for-sale',
    'hero.title_part1': 'No Parking.',
    'hero.title_part2': 'No Redirection.',
    'hero.title_part3': 'Sell directly inside the DNS.',
    'hero.desc': 'The IETF standard RFC 10023 defines how domain sale offers are published directly within the Domain Name System. Instead of redirecting visitors to parked advertising pages, owners place price and contact information in a TXT record. Registrars and buyers query the offer automatically.',
    'hero.cta_validate': 'Check domain live',
    'hero.cta_generate': 'Generate record',
    'hero.cta_bulk': 'Bulk Scan →',
    'hero.stat_commission': 'Commission',
    'hero.stat_record': 'Record Type',
    'hero.stat_mandatory': 'Required Tag',

    // Terminal Hero Preview
    'hero.terminal_header': 'Terminal — DNS Query',
    'hero.terminal_comment': '# Querying domain sale data directly via DNS:',
    'hero.terminal_node': 'DNS Node:',
    'hero.terminal_dnssec': 'DNSSEC:',
    'hero.terminal_dnssec_val': 'Signed and authenticated',
    'hero.terminal_standard': 'Standard:',
    'hero.terminal_example': 'Real-world deployment: Registry SIDN (.nl)',
    'hero.terminal_spec_link': 'Read specification →',

    // Feature Cards
    'feat.bulk_title': 'Portfolio Bulk Scanner',
    'feat.bulk_desc': 'Scan up to 30 domains simultaneously, check DNSSEC and export full results to CSV.',
    'feat.badge_title': 'Verification Badge',
    'feat.badge_desc': 'Embeddable verification badges for landing pages with instant 1-click lookup.',
    'feat.api_title': 'Public REST API',
    'feat.api_desc': 'Free, high-speed interface for developers, monitoring scripts, and automated bots.',
    'feat.legal_title': 'Legal & Regulations',
    'feat.legal_desc': 'Imprint compliance, tax handling, contract law, and price disclosure standards.',

    // Definition Box
    'def.badge': 'Definition',
    'def.text': 'RFC 10023 defines a DNS TXT record placed under _for-sale.[domain]. With the mandatory tag v=FORSALE1; and optional tags such as fval (asking price) and furi (contact URI), domain owners publish their intention to sell directly in their authoritative DNS zone.',
    'def.spec_link': 'RFC 10023 Specification →',

    // Bento / Comparison Grid
    'bento.bg_badge': 'Background',
    'bento.main_title': 'Why DNS-based signaling replaces conventional domain parking',
    'bento.card1_badge': 'Workflow',
    'bento.card1_title': 'Instant discovery during Whois and registrar availability queries',
    'bento.card1_desc': 'Previously, buyers had to visit a web browser to discover if a domain was for sale. RFC 10023 moves this discovery layer directly into DNS resolution:',
    'bento.step1': '1. Owner creates TXT record',
    'bento.step2': '2. Resolver reads v=FORSALE1',
    'bento.step3': '3. Registrar displays sale option',
    'bento.card1_footer': 'No dependency on third-party parking ad farms',
    'bento.card1_tech_link': 'Technical Details →',

    'bento.card2_badge': 'Comparison',
    'bento.card2_title': 'Traditional Parking vs. RFC 10023',
    'bento.row_commission': 'Sales Commission',
    'bento.row_commission_val': '0 % (on direct sales)',
    'bento.row_ns': 'Nameserver Switching',
    'bento.row_ns_val': 'Not required',
    'bento.row_deindex': 'Search Engine Deindexing',
    'bento.row_deindex_val': 'Zero risk',
    'bento.row_dnssec': 'DNSSEC Signatures',
    'bento.row_dnssec_val': 'Fully supported',
    'bento.row_machine': 'Machine-Readable',
    'bento.row_machine_val': 'Official IETF Standard',
    'bento.card2_note': '* Applies to direct peer-to-peer transactions initiated through the DNS contact URI.',

    'bento.card3_badge': 'Production Deployment',
    'bento.card3_title': 'Registry SIDN (.nl) checks RFC 10023 on availability lookups',
    'bento.card3_desc': 'The official .nl registry SIDN automatically queries the _for-sale TXT node during domain searches. If a .nl domain is listed for sale, the price and contact URI appear directly inside the registrar results.',
    'bento.card3_btn': 'Open SIDN.nl',

    // Quote
    'quote.text': '"RFC 10023 cleanly decouples the sale offer from the website content. A domain does not need to sit dormant or be pointed to spammy advertising banners just to signal to prospective buyers that acquisition offers are welcome."',
    'quote.author': '— IETF DNSOP Working Group',

    // FAQs
    'faq.badge': 'Frequently Asked Questions',
    'faq.title': 'Common Questions about RFC 10023',
    'faq.q1': 'Why RFC 10023 instead of classic domain parking at Sedo or Afternic?',
    'faq.a1': 'Classic parking pages carry significant disadvantages: ad blockers suppress banners, search engines penalize parked sites by deindexing them, and brokers charge 10% to 15% commissions. With RFC 10023, your domain stays on your regular nameservers or website. The sale signal is embedded right inside the DNS, accessible to registrars and buyers without intermediaries.',
    'faq.q2': 'Must each tag be placed in a separate TXT record?',
    'faq.a2': 'According to RFC 10023 Section 2.1, the IETF specification states that each TXT record should contain exactly one tag-value pair (e.g. record 1 with "v=FORSALE1;fval=USD195000" and record 2 with "v=FORSALE1;furi=https://..."). Our generator supports both this multi-line standard and a single-line fallback for limited DNS control panels.',
    'faq.q3': 'How do registrars and brokers discover that a domain is for sale?',
    'faq.a3': 'Registrars like SIDN for .nl perform a DNS query for Type 16 (TXT) at the node name _for-sale during domain availability checks. When the resolver finds "v=FORSALE1", the registrar immediately presents the asking price and contact URI to the buyer.',
    'faq.q4': 'What are the costs of using this DNS standard?',
    'faq.a4': 'Zero. RFC 10023 is an open IETF standard. Adding TXT records to your DNS zone is a standard, free feature included with virtually every domain registrar worldwide.',
    'faq.q5': 'How do domain owners protect themselves from email spam?',
    'faq.a5': 'In the furi tag, we strongly recommend pointing to a protected contact form, a project landing page, or an escrow service (e.g. Escrow.com) rather than exposing a plain mailto: address. This preserves full machine-readability while blocking spam harvesters.',

    // Widget Embed
    'widget.title': 'Embeddable Webmaster Widget',
    'widget.desc': 'Integrate the RFC 10023 Validator or Generator directly into your website, tech blog, or customer portal.',
    'widget.copy_btn': 'Copy Code',
    'widget.copied': 'Copied!',

    // Validator Page standalone
    'valpage.badge': 'DNS Lookup',
    'valpage.title': 'RFC 10023 DNS Validator',
    'valpage.desc': 'Inspect domains worldwide in real time for valid _for-sale TXT records and their compliance with the IETF standard.',
    'valpage.diag_title': 'How does this check work?',
    'valpage.diag_text': 'Queries run directly from your browser to public anycast resolvers from Cloudflare and Google. The DoH client queries the TXT record at _for-sale.[domain] and validates the mandatory v=FORSALE1; tag, price (fval), contact URI (furi), and notes (ftxt).',

    // Generator Page standalone
    'genpage.badge': 'Generator',
    'genpage.title': 'RFC 10023 Generator',
    'genpage.desc': 'Create standard-compliant DNS TXT records for your domains and export copy-paste configurations for Cloudflare, BIND, Hetzner, INWX, Terraform, and CLI.',
    'genpage.guide_title': 'How to publish the record',
    'genpage.step1_title': '1. Open DNS Panel',
    'genpage.step1_desc': 'Log in to your domain registrar or DNS provider and open the DNS management zone.',
    'genpage.step2_title': '2. Select Type and Name',
    'genpage.step2_desc': 'Choose TXT as record type and set _for-sale as the host or subdomain name.',
    'genpage.step3_title': '3. Verify',
    'genpage.step3_desc': 'Paste the generated text string as value. Within minutes you can verify propagation with our validator.',

    // Validator Component
    'val.badge': 'Live DNS lookup with host inspection',
    'val.title': 'RFC 10023 Validator',
    'val.node_prefix': 'Node: _for-sale.[domain]',
    'val.placeholder': 'exampledomain.com',
    'val.btn_check': 'Check',
    'val.btn_checking': 'Checking...',
    'val.examples': 'Examples:',
    'val.dig_btn': 'dig command',
    'val.dig_copied': 'dig copied!',
    'val.esc_hint': '[Esc to clear]',
    'val.copy_record': 'Copy record',
    'val.record_copied': 'Copied!',
    'val.dnssec_confirmed': 'DNSSEC confirmed',
    'val.detected_hoster': 'Detected Nameserver',
    'val.create_for_hoster': 'Create record for this provider',
    'val.raw_show': '[+] Show Raw TXT',
    'val.raw_hide': '[-] Hide Raw TXT',
    'val.inspector_show': '[+] DNS Inspector',
    'val.inspector_hide': '[-] Hide DNS Inspector',
    'val.share_title': 'Share test result for',
    'val.share_end': ':',

    // Generator Component
    'gen.badge': 'Create DNS record',
    'gen.title': 'RFC 10023 Generator',
    'gen.rfc_conform': 'RFC 10023 compliant',
    'gen.step1': '1. Domain Name',
    'gen.step2': '2. Asking Price (fval)',
    'gen.vhb': 'Negotiable (OBO)',
    'gen.step3': '3. Contact Address or URI (furi)',
    'gen.step3_hint': 'Recommendation: Link to an escrow provider (e.g. Escrow.com), Sedo, Afternic, or a protected contact form.',
    'gen.step4': '4. Note or Remarks (ftxt)',
    'gen.format': 'Format:',
    'gen.format_multi': 'Multi-line RRset (IETF Standard)',
    'gen.format_single': 'Single-line (Fallback)',
    'gen.copy_code': 'Copy Code',
    'gen.copied': 'Copied!',
    'gen.share_link': 'Share Link',

    // Footer Links
    'footer.claim': 'The independent reference portal and developer toolkit for the IETF standard RFC 10023. Decentralized, standardized signaling of domain sale intentions without proprietary platform lock-in.',
    'footer.disclaimer_title': 'Independence Notice:',
    'footer.disclaimer': 'rfc10023.de is an independent educational and technical portal. There is no corporate affiliation with the Internet Engineering Task Force (IETF) or DENIC eG.',
    'footer.tools_title': 'Tools & Hub',
    'footer.link_validator': 'Live DNS Validator',
    'footer.link_generator': 'Record Builder & Byte Guard',
    'footer.link_bulk': 'Portfolio Bulk Scanner',
    'footer.link_badge': 'Trust Badge Generator',
    'footer.link_api': 'Public REST API',
    'footer.link_matrix': 'DNS Providers',
    'footer.standards_title': 'Standards & Legal',
    'footer.link_legal': 'Legal & Taxes Guide',
    'footer.link_spec': 'IETF Specification Guide',
    'footer.link_orig_rfc': 'IETF RFC 10023 Original',
    'footer.link_imprint': '→ Imprint / Legal Notice',
    'footer.link_privacy': 'Privacy Policy (GDPR)',
    'footer.share_label': 'Share this portal:',
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'de',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('rfc10023_lang');
      if (saved === 'de' || saved === 'en') return saved;
      const browserLang = navigator.language || (navigator as any).userLanguage || '';
      if (browserLang.startsWith('en')) return 'en';
      if (!browserLang.startsWith('de')) return 'en';
    } catch {}
    return 'de';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('rfc10023_lang', lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations.de[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
