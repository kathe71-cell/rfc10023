import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
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
import FaqPage from './pages/FaqPage';
import { ShieldCheck, Cpu } from 'lucide-react';

function RouteWatcher() {
  const location = useLocation();
  const { language, setLanguage } = useLanguage();

  React.useEffect(() => {
    const isEn = location.pathname === '/en' || location.pathname.startsWith('/en/');
    if (isEn && language !== 'en') {
      setLanguage('en');
    } else if (!isEn && language !== 'de') {
      // If navigating directly to a German route without /en, switch to German
      setLanguage('de');
    }
  }, [location.pathname]);

  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { t, language } = useLanguage();
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

      {/* Sticky Mobile Bottom Bar (Mobile-First Godmode Rule) */}
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

export default function App() {
  return (
    <BrowserRouter>
      <Analytics />
      <VercelAnalytics />
      <LanguageProvider>
        <RouteWatcher />
        <Layout>
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

            {/* English Routes (/en prefix for global SEO and international reach) */}
            <Route path="/en" element={<HomePage />} />
            <Route path="/en/validator" element={<ValidatorPage />} />
            <Route path="/en/generator" element={<GeneratorPage />} />
            <Route path="/en/bulk-scan" element={<BulkPage />} />
            <Route path="/en/badge-generator" element={<BadgePage />} />
            <Route path="/en/api-docs" element={<ApiDocsPage />} />
            <Route path="/en/recht-leitfaden" element={<RechtLeitfadenPage />} />
            <Route path="/en/legal-guide" element={<RechtLeitfadenPage />} />
            <Route path="/en/hoster-matrix" element={<MatrixPage />} />
            <Route path="/en/spezifikation" element={<SpezifikationPage />} />
            <Route path="/en/specification" element={<SpezifikationPage />} />
            <Route path="/en/faq" element={<FaqPage />} />
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
        </Layout>
      </LanguageProvider>
    </BrowserRouter>
  );
}

