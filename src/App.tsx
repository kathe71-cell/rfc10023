import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import VercelAnalytics from './components/VercelAnalytics';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ValidatorPage from './pages/ValidatorPage';
import GeneratorPage from './pages/GeneratorPage';
import MatrixPage from './pages/MatrixPage';
import SpezifikationPage from './pages/SpezifikationPage';
import EmbedPage from './pages/EmbedPage';
import Impressum from './pages/Impressum';
import Datenschutz from './pages/Datenschutz';
import { ShieldCheck, Cpu } from 'lucide-react';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isEmbed = location.pathname.includes('-embed');

  if (isEmbed) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-16 md:pb-0">
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />

      {/* Sticky Mobile Bottom Bar (Mobile-First Godmode Rule) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 px-4 py-2.5 flex items-center justify-around gap-2 shadow-lg">
        <Link
          to="/validator"
          className="flex-1 py-2.5 px-3 rounded-lg bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>DNS Prüfen</span>
        </Link>
        <Link
          to="/generator"
          className="flex-1 py-2.5 px-3 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
        >
          <Cpu className="w-4 h-4 text-white" />
          <span>Record Bauen</span>
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <VercelAnalytics />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/validator" element={<ValidatorPage />} />
          <Route path="/generator" element={<GeneratorPage />} />
          <Route path="/hoster-matrix" element={<MatrixPage />} />
          <Route path="/spezifikation" element={<SpezifikationPage />} />
          <Route path="/rechner-embed" element={<EmbedPage />} />
          <Route path="/validator-embed" element={<EmbedPage />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
