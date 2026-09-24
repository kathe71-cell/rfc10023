import React from 'react';
import { Link } from 'react-router-dom';
import HosterMatrix from '../components/HosterMatrix';
import CitationBox from '../components/CitationBox';
import { Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function MatrixPage() {
  const { t, language } = useLanguage();
  const isEn = language === 'en';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('matrix.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          {t('matrix.title')}
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
          {t('matrix.desc')}
        </p>
      </div>

      {/* Matrix Component */}
      <HosterMatrix />

      {/* Recommendations & Workarounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">{t('matrix.rec_title')}</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('matrix.rec_text')}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">{t('matrix.workaround_title')}</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('matrix.workaround_text')}
          </p>
        </div>
      </div>

      {/* Ecosystem Reference */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
        <span>
          {isEn
            ? 'Find additional RFC 10023 implementations and providers in the Ecosystem Tracker.'
            : 'Weitere RFC-10023-Implementierungen und Anbieter findest du im Ökosystem-Tracker.'}
        </span>
        <Link
          to={isEn ? '/en/ecosystem' : '/oekosystem'}
          className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
        >
          {isEn ? 'Ecosystem Tracker →' : 'Ökosystem-Tracker →'}
        </Link>
      </div>

      {/* Citation Box */}
      <CitationBox title={t('matrix.citation_title')} url="https://www.rfc10023.de/hoster-matrix" />

    </div>
  );
}
