import React from 'react';
import { BookOpen, ExternalLink, AlertTriangle } from 'lucide-react';
import CitationBox from '../components/CitationBox';
import { useLanguage } from '../context/LanguageContext';

export default function SpezifikationPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('spec.badge')}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
          {t('spec.title')}
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
          {t('spec.desc')}
        </p>
        <div className="mt-6 flex items-center gap-4 text-xs font-mono text-slate-500">
          <span>{t('spec.cat')}</span>
          <span>&bull;</span>
          <span>ISSN: 2070-1721</span>
          <span>&bull;</span>
          <a
            href="https://www.rfc-editor.org/info/rfc10023"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
          >
            {t('spec.orig_link')} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Section 1: Abstract & Problemstellung */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          {t('spec.s1_title')}
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          {t('spec.s1_text1')}
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          {t('spec.s1_text2')}
        </p>
      </section>

      {/* Section 2: Der DNS Leaf Node */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          {t('spec.s2_title')}
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          {t('spec.s2_text')}
        </p>
        <div className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto space-y-1">
          <p className="text-slate-500">{t('spec.s2_comment')}</p>
          <p>_for-sale.&lt;domain-name&gt;.  3600  IN  TXT  &quot;v=FORSALE1;fval=EUR2500&quot;</p>
          <p>_for-sale.&lt;domain-name&gt;.  3600  IN  TXT  &quot;v=FORSALE1;furi=https://&lt;domain-name&gt;/kontakt&quot;</p>
        </div>
      </section>

      {/* Section 3: Tag-Spezifikation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          {t('spec.s3_title')}
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          {t('spec.s3_text')}
        </p>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4 font-bold">{t('spec.th_tag')}</th>
                <th className="py-3 px-4 font-bold">{t('spec.th_required')}</th>
                <th className="py-3 px-4 font-bold">{t('spec.th_meaning')}</th>
                <th className="py-3 px-4 font-bold">{t('spec.th_example')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">v</td>
                <td className="py-3 px-4 text-emerald-700 font-bold">{t('api.param_yes')}</td>
                <td className="py-3 px-4 text-slate-700">{t('spec.tag_v_desc')}</td>
                <td className="py-3 px-4 font-mono text-slate-950 font-semibold">v=FORSALE1;</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">fval</td>
                <td className="py-3 px-4 text-slate-500">{t('bulk.dnssec_no')}</td>
                <td className="py-3 px-4 text-slate-700">{t('spec.tag_fval_desc')}</td>
                <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">fval=EUR2500</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">furi</td>
                <td className="py-3 px-4 text-slate-500">{t('bulk.dnssec_no')}</td>
                <td className="py-3 px-4 text-slate-700">{t('spec.tag_furi_desc')}</td>
                <td className="py-3 px-4 font-mono text-blue-600 font-semibold">furi=https://sedo.com/...</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">ftxt</td>
                <td className="py-3 px-4 text-slate-500">{t('bulk.dnssec_no')}</td>
                <td className="py-3 px-4 text-slate-700">{t('spec.tag_ftxt_desc')}</td>
                <td className="py-3 px-4 font-mono text-slate-800">ftxt=Inkl. Treuhand</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">fcod</td>
                <td className="py-3 px-4 text-slate-500">{t('bulk.dnssec_no')}</td>
                <td className="py-3 px-4 text-slate-700">{t('spec.tag_fcod_desc')}</td>
                <td className="py-3 px-4 font-mono text-slate-800">fcod=AUTH-84920</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Fallstudie SIDN */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          {t('spec.s4_title')}
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          {t('spec.s4_text')}
        </p>
      </section>

      {/* Section 5: Sicherheits- und Missbrauchshinweise */}
      <section className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
        <div className="flex items-center gap-2 text-amber-950 font-bold">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3>{t('spec.s5_title')}</h3>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          {t('spec.s5_text')}
        </p>
      </section>

      {/* Citation Box */}
      <CitationBox title={t('spec.citation_title')} url="https://rfc10023.de/spezifikation" />

    </div>
  );
}
