import React, { useState } from 'react';
import RfcValidator from '../components/RfcValidator';
import RfcGenerator from '../components/RfcGenerator';
import { ShieldCheck, Cpu, Terminal } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggle from '../components/LanguageToggle';

export default function EmbedPage() {
  const [mode, setMode] = useState<'validator' | 'generator'>('validator');
  const { t, language } = useLanguage();
  const langPrefix = language === 'en' ? '/en' : '';

  return (
    <div className="p-3 sm:p-4 bg-slate-50 min-h-screen">
      
      {/* Switcher Bar */}
      <div className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
            <button
              type="button"
              onClick={() => setMode('validator')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-colors flex items-center gap-1.5 ${
                mode === 'validator'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('nav.validator')}</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('generator')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold font-mono transition-colors flex items-center gap-1.5 ${
                mode === 'generator'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('nav.generator')}</span>
            </button>
          </div>
          <LanguageToggle />
        </div>

        <a
          href={`https://rfc10023.de${langPrefix}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-mono font-bold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
        >
          <Terminal className="w-3 h-3 text-emerald-600" />
          <span>rfc10023.de{langPrefix}</span>
        </a>
      </div>

      {/* Component */}
      <div className="max-w-4xl mx-auto">
        {mode === 'validator' ? (
          <RfcValidator embedded />
        ) : (
          <RfcGenerator embedded />
        )}
      </div>

    </div>
  );
}
