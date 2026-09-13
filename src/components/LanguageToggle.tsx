import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSwitch = (targetLang: 'de' | 'en') => {
    if (language === targetLang) return;
    setLanguage(targetLang);

    const currentPath = location.pathname;
    const search = location.search;
    const hash = location.hash;

    if (targetLang === 'en') {
      if (!currentPath.startsWith('/en')) {
        const newPath = currentPath === '/' ? '/en' : `/en${currentPath}`;
        navigate(`${newPath}${search}${hash}`, { replace: true });
      }
    } else {
      if (currentPath === '/en' || currentPath === '/en/') {
        navigate(`/${search}${hash}`, { replace: true });
      } else if (currentPath.startsWith('/en/')) {
        const newPath = currentPath.replace(/^\/en/, '');
        navigate(`${newPath}${search}${hash}`, { replace: true });
      }
    }
  };

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-300/80 bg-slate-100/90 hover:border-slate-400 p-1 text-xs font-mono font-bold shadow-2xs transition-all">
      <div className="pl-1.5 pr-0.5 text-slate-500 flex items-center">
        <Globe className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
      </div>

      <button
        type="button"
        onClick={() => handleSwitch('de')}
        className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
          language === 'de'
            ? 'bg-slate-900 text-white shadow-xs scale-100'
            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
        }`}
        aria-label="Auf Deutsch umschalten"
      >
        <span>🇩🇪</span>
        <span>DE</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={`px-2.5 py-1 rounded-full transition-all flex items-center gap-1 ${
          language === 'en'
            ? 'bg-emerald-700 text-white shadow-xs scale-100'
            : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
        }`}
        aria-label="Switch to English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
}

