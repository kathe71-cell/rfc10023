import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  // Slug mapping between German and English canonical routes
  const slugMapDeToEn: Record<string, string> = {
    '/recht-leitfaden': '/en/legal-guidelines',
    '/spezifikation': '/en/specification',
    '/impressum': '/en/imprint',
    '/datenschutz': '/en/privacy',
  };

  const slugMapEnToDe: Record<string, string> = {
    '/en/legal-guidelines': '/recht-leitfaden',
    '/en/legal-guide': '/recht-leitfaden',
    '/en/recht-leitfaden': '/recht-leitfaden',
    '/en/specification': '/spezifikation',
    '/en/spezifikation': '/spezifikation',
    '/en/imprint': '/impressum',
    '/en/impressum': '/impressum',
    '/en/privacy': '/datenschutz',
    '/en/datenschutz': '/datenschutz',
  };

  const handleSwitch = (targetLang: 'de' | 'en') => {
    if (language === targetLang) return;
    setLanguage(targetLang);

    const currentPath = location.pathname;
    const search = location.search;
    const hash = location.hash;

    if (targetLang === 'en') {
      if (slugMapDeToEn[currentPath]) {
        navigate(`${slugMapDeToEn[currentPath]}${search}${hash}`, { replace: true });
      } else if (!currentPath.startsWith('/en')) {
        const newPath = currentPath === '/' ? '/en' : `/en${currentPath}`;
        navigate(`${newPath}${search}${hash}`, { replace: true });
      }
    } else {
      if (slugMapEnToDe[currentPath]) {
        navigate(`${slugMapEnToDe[currentPath]}${search}${hash}`, { replace: true });
      } else if (currentPath === '/en' || currentPath === '/en/') {
        navigate(`/${search}${hash}`, { replace: true });
      } else if (currentPath.startsWith('/en/')) {
        const newPath = currentPath.replace(/^\/en/, '');
        navigate(`${newPath}${search}${hash}`, { replace: true });
      }
    }
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white p-1 text-xs font-mono font-bold shadow-xs transition-all hover:border-slate-400">
      <div className="pl-2 pr-1 text-slate-500 flex items-center">
        <Globe className="w-3.5 h-3.5 text-emerald-600" />
      </div>

      <button
        type="button"
        onClick={() => handleSwitch('de')}
        className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
          language === 'de'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
        }`}
        aria-label="Auf Deutsch umschalten"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${language === 'de' ? 'bg-emerald-400' : 'bg-transparent'}`}></span>
        <span>DE</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1.5 ${
          language === 'en'
            ? 'bg-emerald-700 text-white shadow-xs'
            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
        }`}
        aria-label="Switch to English"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${language === 'en' ? 'bg-emerald-300' : 'bg-transparent'}`}></span>
        <span>EN</span>
      </button>
    </div>
  );
}

