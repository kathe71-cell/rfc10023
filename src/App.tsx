import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import VercelAnalytics from './components/VercelAnalytics';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import ValidatorPage from './pages/ValidatorPage';
import GeneratorPage from './pages/GeneratorPage';
import MatrixPage from './pages/MatrixPage';
import SpezifikationPage from './pages/SpezifikationPage';
import BulkPage from './pages/BulkPage';
import BadgePage from './pages/BadgePage';
import ApiDocsPage from './pages/ApiDocsPage';
import RechtLeitfadenPage from './pages/RechtLeitfadenPage';
import EmbedPage from './pages/EmbedPage';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import DokumentationPage from './pages/DokumentationPage';
import FaqPage from './pages/FaqPage';
import EcosystemPage from './pages/EcosystemPage';
import SearchModal from './components/SearchModal';
import { ShieldCheck, Cpu } from 'lucide-react';

function RouteWatcher() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  React.useEffect(() => {
    const pathname = location.pathname;
    const isEn = pathname === '/en' || pathname.startsWith('/en/');
    if (isEn && language !== 'en') {
      setLanguage('en');
    } else if (!isEn && language !== 'de') {
      setLanguage('de');
    }

    // Dynamic Canonical & OpenGraph URL per route
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    const twitterUrl = document.querySelector('meta[name="twitter:url"]');
    
    // Normalize path (ensure leading slash, strip trailing slash except root)
    let cleanPath = pathname;
    if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
      cleanPath = cleanPath.slice(0, -1);
    }

    const fullUrl = `https://www.rfc10023.de${cleanPath === '/' ? '' : cleanPath}`;
    if (canonicalLink) canonicalLink.setAttribute('href', fullUrl);
    if (ogUrl) ogUrl.setAttribute('content', fullUrl);
    if (twitterUrl) twitterUrl.setAttribute('content', fullUrl);

    const metaDesc = document.querySelector('meta[name="description"]');

    // Page titles & meta descriptions per route
    if (isEn) {
      if (pathname.includes('/generator')) {
        document.title = 'RFC 10023 Record Generator | DNS for-sale RRset Builder';
        if (metaDesc) metaDesc.setAttribute('content', 'Build specification-compliant RFC 10023 multi-record RRsets for Cloudflare, Hetzner, INWX, BIND and Terraform.');
      } else if (pathname.includes('/validator')) {
        document.title = 'RFC 10023 DNS Validator | Live _for-sale Inspection';
        if (metaDesc) metaDesc.setAttribute('content', 'Inspect live _for-sale TXT records with DNS error taxonomy, DNSSEC AD-flag check and isolated mail routing diagnostics.');
      } else if (pathname.includes('/bulk-scan')) {
        document.title = 'RFC 10023 Bulk Portfolio Auditor | Multi-Domain Scan';
        if (metaDesc) metaDesc.setAttribute('content', 'Audit multiple domain names simultaneously for RFC 10023 for-sale TXT records with throttled DoH requests.');
      } else if (pathname.includes('/dokumentation') || pathname.includes('/documentation')) {
        document.title = 'RFC 10023 Documentation & Specification Hub';
        if (metaDesc) metaDesc.setAttribute('content', 'Comprehensive technical documentation for IETF RFC 10023 (Informational), hoster compatibility matrix and developer API.');
      } else if (pathname.includes('/badge')) {
        document.title = 'RFC 10023 Status Badge Generator';
        if (metaDesc) metaDesc.setAttribute('content', 'Generate neutral DNS verification links and privacy-compliant HTML/CSS badges for domain sales pages.');
      } else if (pathname.includes('/ecosystem')) {
        document.title = 'RFC 10023 Adoption & Ecosystem – Tools, Integrations and Statistics';
        if (metaDesc) metaDesc.setAttribute('content', 'Comprehensive overview of RFC 10023 and _for-sale DNS record adoption: implementations, tools, registrars, datasets and verified telemetry.');
      } else {
        document.title = 'RFC 10023 | Signal Domain Sales Directly in the DNS';
        if (metaDesc) metaDesc.setAttribute('content', 'Independent reference portal & developer toolkit for IETF RFC 10023 (Informational). Live DNS validator and multi-record builder.');
      }
    } else {
      if (pathname.includes('/generator')) {
        document.title = 'RFC 10023 Generator | DNS-Verkaufseinträge erstellen';
        if (metaDesc) metaDesc.setAttribute('content', 'Erstelle standardkonforme RFC 10023 Multi-Record RRsets für Cloudflare, Hetzner, INWX, Netcup, BIND und Terraform.');
      } else if (pathname.includes('/validator')) {
        document.title = 'RFC 10023 DNS-Validator | Live-Prüfung von _for-sale Einträgen';
        if (metaDesc) metaDesc.setAttribute('content', 'Prüfe _for-sale TXT-Einträge live im DNS mit genauer Fehlerdifferenzierung, DNSSEC-Transparenz und E-Mail-Routing-Diagnose.');
      } else if (pathname.includes('/bulk-scan')) {
        document.title = 'RFC 10023 Portfolio-Prüfung | Massenabfrage';
        if (metaDesc) metaDesc.setAttribute('content', 'Gleichzeitige Prüfung ganzer Domain-Portfolios auf RFC 10023 Verkaufssignale mit DoH-Ratenbegrenzung und CSV-Export.');
      } else if (pathname.includes('/dokumentation')) {
        document.title = 'RFC 10023 Dokumentation | Spezifikation & Leitfäden';
        if (metaDesc) metaDesc.setAttribute('content', 'Zentrale Dokumentation zu IETF RFC 10023 (Informational): ABNF-Syntax, Anbieter-Konfigurationen, REST-API und Rechtsfragen.');
      } else if (pathname.includes('/badge')) {
        document.title = 'RFC 10023 Badge Generator | DNS-Verkaufsstatus einbinden';
        if (metaDesc) metaDesc.setAttribute('content', 'Erstelle neutrale Prüf-Links und 100% datenschutzkonforme HTML/CSS-Badges für Domain-Verkaufsseiten.');
      } else if (pathname.includes('/oekosystem') || pathname.includes('/ecosystem')) {
        document.title = 'RFC 10023 Adoption & Ökosystem – Tools, Integrationen und Statistiken';
        if (metaDesc) metaDesc.setAttribute('content', 'Aktuelle Übersicht zur Verbreitung von RFC 10023 und dem _for-sale DNS Record: Implementierungen, Tools, Registrare, Datensätze und Adoption.');
      } else {
        document.title = 'RFC 10023 | Zeige im DNS, dass deine Domain zum Verkauf steht';
        if (metaDesc) metaDesc.setAttribute('content', 'Unabhängiges Referenz-Portal und Entwickler-Toolkit für IETF RFC 10023 (Informational). Live DNS-Validator und Record-Generator.');
      }
    }
  }, [location.pathname, language, setLanguage]);

  return null;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t, language, isSearchOpen, setIsSearchOpen } = useLanguage();
  const isEmbed = location.pathname.includes('-embed');
  const langPrefix = language === 'en' ? '/en' : '';

  if (isEmbed) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-16 md:pb-0">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <ScrollToTop />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Sticky Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-2.5 flex items-center justify-around gap-2 shadow-lg">
        <Link
          to={`${langPrefix}/validator`}
          className="flex-1 py-2.5 px-3 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{t('nav.mobile_validate')}</span>
        </Link>
        <Link
          to={`${langPrefix}/generator`}
          className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <Cpu className="w-4 h-4 text-white" />
          <span>{t('nav.mobile_generate')}</span>
        </Link>
      </div>
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* German Routes (Default) */}
      <Route path="/" element={<HomePage />} />
      <Route path="/validator" element={<ValidatorPage />} />
      <Route path="/generator" element={<GeneratorPage />} />
      <Route path="/bulk-scan" element={<BulkPage />} />
      <Route path="/badge-generator" element={<BadgePage />} />
      <Route path="/api-docs" element={<ApiDocsPage />} />
      <Route path="/recht-leitfaden" element={<RechtLeitfadenPage />} />
      <Route path="/hoster-matrix" element={<MatrixPage />} />
      <Route path="/spezifikation" element={<SpezifikationPage />} />
      <Route path="/widget-embed" element={<EmbedPage />} />
      <Route path="/rechner-embed" element={<EmbedPage />} />
      <Route path="/validator-embed" element={<EmbedPage />} />
      <Route path="/impressum" element={<Impressum />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/dokumentation" element={<DokumentationPage />} />
      <Route path="/oekosystem" element={<EcosystemPage />} />
      <Route path="/ecosystem" element={<Navigate to="/oekosystem" replace />} />

      {/* English Routes (/en prefix for global SEO and international reach) */}
      <Route path="/en" element={<HomePage />} />
      <Route path="/en/validator" element={<ValidatorPage />} />
      <Route path="/en/generator" element={<GeneratorPage />} />
      <Route path="/en/bulk-scan" element={<BulkPage />} />
      <Route path="/en/badge-generator" element={<BadgePage />} />
      <Route path="/en/api-docs" element={<ApiDocsPage />} />
      <Route path="/en/recht-leitfaden" element={<RechtLeitfadenPage />} />
      <Route path="/en/legal-guidelines" element={<RechtLeitfadenPage />} />
      <Route path="/en/legal-guide" element={<RechtLeitfadenPage />} />
      <Route path="/en/hoster-matrix" element={<MatrixPage />} />
      <Route path="/en/spezifikation" element={<SpezifikationPage />} />
      <Route path="/en/specification" element={<SpezifikationPage />} />
      <Route path="/en/faq" element={<FaqPage />} />
      <Route path="/en/dokumentation" element={<DokumentationPage />} />
      <Route path="/en/documentation" element={<DokumentationPage />} />
      <Route path="/en/ecosystem" element={<EcosystemPage />} />
      <Route path="/en/widget-embed" element={<EmbedPage />} />
      <Route path="/en/rechner-embed" element={<EmbedPage />} />
      <Route path="/en/validator-embed" element={<EmbedPage />} />
      <Route path="/en/impressum" element={<Impressum />} />
      <Route path="/en/imprint" element={<Impressum />} />
      <Route path="/en/datenschutz" element={<Datenschutz />} />
      <Route path="/en/privacy" element={<Datenschutz />} />

      {/* Fallback */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <VercelAnalytics />
      <LanguageProvider>
        <RouteWatcher />
        <Layout>
          <AppRoutes />
        </Layout>
      </LanguageProvider>
    </BrowserRouter>
  );
}


