import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs font-mono font-bold select-none">
      <button
        type="button"
        onClick={() => setLanguage('de')}
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
        onClick={() => setLanguage('en')}
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
