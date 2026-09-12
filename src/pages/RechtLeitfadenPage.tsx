import React from 'react';
import { Scale, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function RechtLeitfadenPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-950 font-mono text-xs font-bold">
          <Scale className="w-3.5 h-3.5 text-amber-800" />
          <span>{t('legal.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          {t('legal.title')}
        </h1>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
          {t('legal.desc')}
        </p>
      </div>

      {/* Hinweis: Keine Rechtsberatung */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{t('legal.disclaimer_title')}</span>
        </div>
        <p>
          {t('legal.disclaimer_text')}
        </p>
      </div>

      {/* Chapters */}
      <div className="space-y-10 text-slate-800">
        
        {/* Chapter 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">1</span>
            <span>{t('legal.c1_title')}</span>
          </h2>
          <p className="leading-relaxed">
            {t('legal.c1_text1')}
          </p>
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm space-y-2">
            <strong className="text-slate-900 block font-mono">{t('legal.c1_box_title')}</strong>
            <p>
              {t('legal.c1_box_text')}
            </p>
          </div>
        </section>

        {/* Chapter 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">2</span>
            <span>{t('legal.c2_title')}</span>
          </h2>
          <p className="leading-relaxed">
            {t('legal.c2_text1')}
          </p>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2">
            <strong className="text-emerald-900 block font-mono">{t('legal.c2_box_title')}</strong>
            <p>
              {t('legal.c2_box_text')}
            </p>
          </div>
        </section>

        {/* Chapter 3 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">3</span>
            <span>{t('legal.c3_title')}</span>
          </h2>
          <p className="leading-relaxed">
            {t('legal.c3_text1')}
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            <li>
              {t('legal.c3_b2b')}
            </li>
            <li>
              {t('legal.c3_rec')}
            </li>
          </ul>
        </section>

        {/* Chapter 4 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">4</span>
            <span>{t('legal.c4_title')}</span>
          </h2>
          <p className="leading-relaxed">
            {t('legal.c4_text1')}
          </p>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-950">
            {t('legal.c4_box')}
          </div>
        </section>

      </div>

      {/* Action CTA */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold">{t('legal.cta_title')}</h3>
          <p className="text-xs text-slate-400 mt-1">
            {t('legal.cta_desc')}
          </p>
        </div>
        <Link
          to="/generator"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-mono font-bold text-xs rounded-xl text-white transition-colors"
        >
          {t('legal.cta_btn')}
        </Link>
      </div>

    </div>
  );
}
