import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, ShieldCheck, Cpu, Database, Menu, X, BookOpen, Layers, Sparkles, Code2, Scale, HelpCircle, Search, ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);
  const location = useLocation();
  const { language, setIsSearchOpen } = useLanguage();
  const isEn = language === 'en';
  const langPrefix = isEn ? '/en' : '';
  const docsRef = useRef<HTMLDivElement>(null);

  const legalPath = isEn ? '/en/legal-guidelines' : '/recht-leitfaden';
  const docsPath = isEn ? '/en/documentation' : '/dokumentation';
  const specPath = isEn ? '/en/specification' : '/spezifikation';

  // Close docs dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (docsRef.current && !docsRef.current.contains(e.target as Node)) {
        setDocsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setMobileDocsOpen(false);
  }, [location.pathname]);

  const toolLinks = [
    { name: isEn ? 'Create Record' : 'Eintrag erstellen', path: `${langPrefix}/generator`, icon: Cpu },
    { name: isEn ? 'Verify Domain'  : 'Domain prüfen',    path: `${langPrefix}/validator`,  icon: ShieldCheck },
    { name: isEn ? 'Portfolio Scan' : 'Portfolio prüfen', path: `${langPrefix}/bulk-scan`,  icon: Layers },
  ];

  const docsLinks = [
    { name: isEn ? 'Specification (ABNF)' : 'Spezifikation (ABNF)', path: specPath,                       icon: BookOpen  },
    { name: isEn ? 'Hoster Guides'        : 'Hoster-Anleitungen',   path: `${langPrefix}/hoster-matrix`,  icon: Database  },
    { name: isEn ? 'REST API'             : 'REST API',             path: `${langPrefix}/api-docs`,       icon: Code2     },
    { name: isEn ? 'Badge Generator'      : 'Prüf-Badge',           path: `${langPrefix}/badge-generator`,icon: Sparkles  },
    { name: isEn ? 'Legal & Taxes'        : 'Recht & Praxis',       path: legalPath,                      icon: Scale     },
    { name: 'FAQ',                                                   path: `${langPrefix}/faq`,            icon: HelpCircle},
  ];

  const isDocsActive = docsLinks.some(l => location.pathname === l.path) || location.pathname === docsPath;
  const homePath = langPrefix || '/';

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">

          {/* Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link
              to={homePath}
              onClick={(e) => {
                if (location.pathname === homePath) e.preventDefault();
                window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group min-w-0"
            >
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                <Terminal className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 truncate">
                <span className="text-lg sm:text-xl font-black tracking-tight text-slate-900 block truncate">
                  RFC<span className="text-emerald-600">10023</span><span className="text-slate-400 text-xs sm:text-sm font-semibold">.de</span>
                </span>
                <span className="hidden md:block text-[10px] font-mono tracking-wider uppercase text-slate-500">
                  _for-sale DNS Toolkit
                </span>
              </div>
            </Link>

            {/* Desktop Language Toggle */}
            <div className="hidden lg:flex items-center pl-3 border-l border-slate-200">
              <LanguageToggle />
            </div>
          </div>

          {/* Desktop Primary Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5" aria-label={isEn ? 'Main navigation' : 'Hauptnavigation'}>
            {toolLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}

            {/* Dokumentation Dropdown */}
            <div className="relative" ref={docsRef}>
              <button
                onClick={() => setDocsOpen(prev => !prev)}
                aria-expanded={docsOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold transition-colors ${
                  isDocsActive
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${isDocsActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{isEn ? 'Documentation' : 'Dokumentation'}</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${docsOpen ? 'rotate-180' : ''} ${isDocsActive ? 'text-emerald-300' : 'text-slate-400'}`} />
              </button>

              {docsOpen && (
                <div className="absolute top-full right-0 mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50">
                  {docsLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setDocsOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-mono font-medium transition-colors ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Search Icon (Desktop) */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              aria-label={isEn ? 'Search (⌘K)' : 'Suche (⌘K)'}
              title={isEn ? 'Search (⌘K)' : 'Suche (⌘K)'}
            >
              <Search className="w-4 h-4 text-slate-500" />
              <kbd className="hidden lg:inline px-1 py-0.5 text-[9px] font-bold text-slate-400 bg-slate-50 rounded border border-slate-200">⌘K</kbd>
            </button>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1 sm:gap-2 md:hidden shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label={isEn ? 'Search' : 'Suche'}
            >
              <Search className="w-4 h-4" />
            </button>
            <LanguageToggle />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label={isOpen ? (isEn ? 'Close menu' : 'Menü schließen') : (isEn ? 'Open menu' : 'Menü öffnen')}
              aria-expanded={isOpen}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">

          {/* Main Tools */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
              {isEn ? 'Tools' : 'Werkzeuge'}
            </span>
            {toolLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold font-mono ${
                    isActive ? 'bg-slate-900 text-white' : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Dokumentation collapsible */}
          <div className="pt-2 border-t border-slate-100 space-y-0.5">
            <button
              onClick={() => setMobileDocsOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold font-mono text-slate-800 hover:bg-slate-100 transition-colors"
              aria-expanded={mobileDocsOpen}
            >
              <span className="flex items-center gap-2.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                {isEn ? 'Documentation' : 'Dokumentation'}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-150 ${mobileDocsOpen ? 'rotate-180' : ''}`} />
            </button>

            {mobileDocsOpen && (
              <div className="pl-3 space-y-0.5 pb-1">
                {docsLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono font-medium ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-slate-400" />
                      <span>{link.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
