import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, ExternalLink, GitBranch, ArrowUpRight, Scale, Code2, Layers, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & Statement */}
          <div className="md:col-span-2 space-y-4">
            <Link
              to="/"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                }
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                document.documentElement.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
                document.body.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-3 group"
            >
              <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                RFC10023<span className="text-emerald-400">.de</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              {t('footer.claim')}
            </p>
            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block mb-1">{t('footer.disclaimer_title')}</strong>
              {t('footer.disclaimer')}
            </div>
          </div>

          {/* Col 2: Navigation & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              {t('footer.tools_title')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/validator" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_validator')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/generator" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_generator')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/bulk-scan" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_bulk')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/badge-generator" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_badge')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/api-docs" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_api')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/hoster-matrix" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_matrix')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Recht & Spezifikation */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              {t('footer.standards_title')}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/recht-leitfaden" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_legal')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/spezifikation" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  {t('footer.link_spec')} <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <a
                  href="https://www.rfc-editor.org/info/rfc10023"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  {t('footer.link_orig_rfc')} <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <Link to="/impressum" className="text-slate-300 hover:text-white transition-colors">
                  {t('footer.link_imprint')}
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-slate-300 hover:text-white transition-colors">
                  {t('footer.link_privacy')}
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Social Share Strip (100% DSGVO-konform ohne externe Tracker) */}
        <div className="mt-8 pt-4 border-t border-slate-800/60 flex flex-wrap items-center gap-3">
          <div className="text-xs text-slate-400 font-mono shrink-0">
            {t('footer.share_label')}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <a
              href="https://www.linkedin.com/sharing/share-offsite/?url=https%3A%2F%2Frfc10023.de"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              LinkedIn
            </a>
            <a
              href="https://twitter.com/intent/tweet?text=RFC%2010023%20DACH%20Portal%20%E2%80%93%20Domain-Verk%C3%A4ufe%20direkt%20im%20DNS%20signalisieren%3A%20https%3A%2F%2Frfc10023.de"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              X (Twitter)
            </a>
            <a
              href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Frfc10023.de"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              Facebook
            </a>
            <a
              href="https://api.whatsapp.com/send?text=RFC%2010023%20DACH%20Portal%20%E2%80%93%20Domain-Verk%C3%A4ufe%20direkt%20im%20DNS%3A%20https%3A%2F%2Frfc10023.de"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>

        {/* Bottom Facts Strip */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>IETF RFC 10023 · Status: Informational · Stand: Sept. 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Zero-CDN</span>
            <span>•</span>
            <span>100 % DSGVO-konform</span>
            <span>•</span>
            <span>Cookielose Vercel Analytics</span>
            <span>•</span>
            <Link to="/impressum" className="text-slate-300 hover:underline">
              Impressum
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
