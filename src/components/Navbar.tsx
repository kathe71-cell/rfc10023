import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, ShieldCheck, Cpu, Database, Menu, X, BookOpen, Layers, Sparkles, Code2, Scale, HelpCircle, Search } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from './LanguageToggle';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { language, setIsSearchOpen } = useLanguage();
  const isEn = language === 'en';
  const langPrefix = isEn ? '/en' : '';

  const legalPath = isEn ? '/en/legal-guidelines' : '/recht-leitfaden';
  const docsPath = isEn ? '/en/documentation' : '/dokumentation';

  // 4 Primary Navigation Links (per specification)
  const primaryNavLinks = [
    { name: isEn ? 'Create Record' : 'Eintrag erstellen', path: `${langPrefix}/generator`, icon: Cpu },
    { name: isEn ? 'Verify Domain' : 'Domain prüfen', path: `${langPrefix}/validator`, icon: ShieldCheck },
    { name: isEn ? 'Portfolio Check' : 'Portfolio prüfen', path: `${langPrefix}/bulk-scan`, icon: Layers },
    { name: isEn ? 'Documentation' : 'Dokumentation', path: docsPath, icon: BookOpen },
  ];

  const subLinks = [
    { name: isEn ? 'Specification' : 'Spezifikation (ABNF)', path: `${langPrefix}/spezifikation`, icon: BookOpen },
    { name: isEn ? 'DNS Providers' : 'DNS-Anbieter Matrix', path: `${langPrefix}/hoster-matrix`, icon: Database },
    { name: isEn ? 'REST API' : 'REST API-Docs', path: `${langPrefix}/api-docs`, icon: Code2 },
    { name: isEn ? 'Legal & Taxes' : 'Recht & Praxis', path: legalPath, icon: Scale },
    { name: isEn ? 'Verification Badge' : 'Prüf-Badge', path: `${langPrefix}/badge-generator`, icon: Sparkles },
    { name: 'FAQ', path: `${langPrefix}/faq`, icon: HelpCircle },
  ];

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
                if (location.pathname === homePath) {
                  e.preventDefault();
                }
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
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {primaryNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path || (link.path === docsPath && location.pathname.startsWith(`${langPrefix}/spezifikation`));
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
          </nav>

          {/* Quick Action & Search (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 px-3 py-2 text-xs font-mono text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
              title={isEn ? 'Search (⌘K)' : 'Suche (⌘K)'}
            >
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'Search' : 'Suche'}</span>
              <kbd className="px-1 py-0.5 text-[9px] font-bold text-slate-500 bg-white rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>
            <Link
              to={`${langPrefix}/generator`}
              className="inline-flex items-center justify-center px-3.5 py-2 text-xs font-bold font-mono tracking-wider uppercase rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-sm"
            >
              {isEn ? '+ Record' : '+ Erstellen'}
            </Link>
          </div>

          {/* Mobile Right Controls - Compact to prevent 360px / 390px overflow */}
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
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
            >
              {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {isOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto">
          
          {/* Main Navigation Section */}
          <div className="space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
              {isEn ? 'Main Functions' : 'Hauptfunktionen'}
            </span>
            {primaryNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold font-mono ${
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Subordinate Resources */}
          <div className="pt-2 border-t border-slate-100 space-y-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 px-3">
              {isEn ? 'Guides & Resources' : 'Ressourcen & Anleitungen'}
            </span>
            {subLinks.map((link) => {
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
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

        </div>
      )}
    </header>
  );
}
