import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import RfcValidator from '../components/RfcValidator';
import CitationBox from '../components/CitationBox';
import { ShieldCheck, Info } from 'lucide-react';

export default function ValidatorPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const domainParam = searchParams.get('d') || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-bold uppercase mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('valpage.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          {t('valpage.title')}
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
          {t('valpage.desc')}
        </p>
      </div>

      {/* Validator Component */}
      <RfcValidator initialDomain={domainParam} />

      {/* Diagnostic Info */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          {t('valpage.diag_title')}
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          {t('valpage.diag_text')}
        </p>
      </div>

      {/* Citation Box */}
      <CitationBox title={t('citation.val_title')} url="https://rfc10023.de/validator" />

    </div>
  );
}
