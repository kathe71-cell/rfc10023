import React from 'react';
import BadgeGenerator from '../components/BadgeGenerator';
import { Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BadgePage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>{t('badge.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {t('badge.title')}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          {t('badge.desc')}
        </p>
      </div>

      {/* Component */}
      <BadgeGenerator />

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-bold text-slate-900 text-base">{t('badge.benefit1_title')}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('badge.benefit1_desc')}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-slate-900 text-base">{t('badge.benefit2_title')}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('badge.benefit2_desc')}
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-slate-900 text-base">{t('badge.benefit3_title')}</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t('badge.benefit3_desc')}
          </p>
        </div>
      </div>

    </div>
  );
}
