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

    // Validator
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

    // Generator
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

    // Footer
    'footer.claim': 'Das unabhängige DACH-Referenzportal und Entwickler-Toolkit zum IETF-Standard RFC 10023. Dezentrale, standardisierte Kennzeichnung von Domain-Verkaufsabsichten ohne proprietäre Plattform-Abhängigkeit.',
    'footer.disclaimer_title': 'Unabhängigkeitshinweis:',
    'footer.disclaimer': 'rfc10023.de ist ein freies Fach- und Informationsportal. Es besteht kein gesellschaftsrechtliches Verhältnis zur Internet Engineering Task Force (IETF) oder DENIC eG.',
    'footer.tools_title': 'Tools & Hub',
    'footer.standards_title': 'Recht & Standards',
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

    // Validator
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

    // Generator
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

    // Footer
    'footer.claim': 'The independent reference portal and developer toolkit for the IETF standard RFC 10023. Decentralized, standardized signaling of domain sale intentions without proprietary platform lock-in.',
    'footer.disclaimer_title': 'Independence Notice:',
    'footer.disclaimer': 'rfc10023.de is an independent educational and technical portal. There is no corporate affiliation with the Internet Engineering Task Force (IETF) or DENIC eG.',
    'footer.tools_title': 'Tools & Hub',
    'footer.standards_title': 'Standards & Legal',
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
