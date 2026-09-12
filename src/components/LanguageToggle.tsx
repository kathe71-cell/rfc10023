import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
      // Switch to English: prepend /en if not already present
      if (!currentPath.startsWith('/en')) {
        const newPath = currentPath === '/' ? '/en' : `/en${currentPath}`;
        navigate(`${newPath}${search}${hash}`, { replace: true });
      }
    } else {
      // Switch to German: strip /en prefix
      if (currentPath === '/en' || currentPath === '/en/') {
        navigate(`/${search}${hash}`, { replace: true });
      } else if (currentPath.startsWith('/en/')) {
        const newPath = currentPath.replace(/^\/en/, '');
        navigate(`${newPath}${search}${hash}`, { replace: true });
      }
    }
  };

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-mono font-bold select-none">
      <button
        type="button"
        onClick={() => handleSwitch('de')}
        className={`px-2 py-1 rounded-md transition-all ${
          language === 'de'
            ? 'bg-white text-slate-950 shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-label="Auf Deutsch umschalten"
      >
        DE
      </button>
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        className={`px-2 py-1 rounded-md transition-all ${
          language === 'en'
            ? 'bg-slate-900 text-white shadow-xs'
            : 'text-slate-500 hover:text-slate-900'
        }`}
        aria-label="Switch to English"
      >
        EN
      </button>
    </div>
  );
}

