import React from 'react';
import BulkValidator from '../components/BulkValidator';
import { Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function BulkPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-emerald-700" />
          <span>{t('bulk.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          {t('bulk.title')}
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          {t('bulk.desc')}
        </p>
      </div>

      {/* Bulk Tool */}
      <BulkValidator />

      {/* Info Box */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-900 font-mono block text-sm">
          {t('bulk.privacy_title')}
        </strong>
        <p>
          {t('bulk.privacy_text1')}
        </p>
        <p>
          {t('bulk.privacy_legal')}
        </p>
      </div>

    </div>
  );
}
