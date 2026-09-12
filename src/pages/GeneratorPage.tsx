import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import RfcGenerator from '../components/RfcGenerator';
import CitationBox from '../components/CitationBox';
import { Cpu, Terminal, CheckCircle } from 'lucide-react';

export default function GeneratorPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('genpage.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          {t('genpage.title')}
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
          {t('genpage.desc')}
        </p>
      </div>

      {/* Generator Component */}
      <RfcGenerator />

      {/* Quick Setup Checklist */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-600" />
          {t('genpage.guide_title')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">{t('genpage.step1_title')}</strong>
            <p>{t('genpage.step1_desc')}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">{t('genpage.step2_title')}</strong>
            <p>{t('genpage.step2_desc')}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">{t('genpage.step3_title')}</strong>
            <p>{t('genpage.step3_desc')}</p>
          </div>
        </div>
      </div>

      {/* Citation Box */}
      <CitationBox title={t('citation.gen_title')} url="https://rfc10023.de/generator" />

    </div>
  );
}
