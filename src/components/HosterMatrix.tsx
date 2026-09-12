import React, { useState } from 'react';
import { HOSTERS_DATA } from '../data/hosters';
import { CheckCircle2, AlertTriangle, HelpCircle, Search, Database } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HosterMatrix() {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'supported' | 'partial'>('all');

  const filteredHosters = HOSTERS_DATA.filter((h) => {
    const notesText = language === 'en' && h.notesEn ? h.notesEn : h.notes;
    const matchesSearch = h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          notesText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || h.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700">
              {t('matrix.subbadge')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('matrix.subtitle')}
          </h2>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('matrix.search_placeholder')}
              className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'supported' | 'partial')}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="all">{t('matrix.filter_all')}</option>
            <option value="supported">{t('matrix.filter_supported')}</option>
            <option value="partial">{t('matrix.filter_partial')}</option>
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="py-3 px-4 font-bold">{t('matrix.col_provider')}</th>
              <th className="py-3 px-4 font-bold">{t('matrix.col_origin')}</th>
              <th className="py-3 px-4 font-bold">{t('matrix.col_status')}</th>
              <th className="py-3 px-4 font-bold">{t('matrix.col_syntax')}</th>
              <th className="py-3 px-4 font-bold">{t('matrix.col_notes')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredHosters.map((hoster) => {
              const country = language === 'en' && hoster.countryEn ? hoster.countryEn : hoster.country;
              const notes = language === 'en' && hoster.notesEn ? hoster.notesEn : hoster.notes;

              return (
                <tr key={hoster.id} className="hover:bg-slate-50/80 transition-colors">
                  
                  {/* Name */}
                  <td className="py-3.5 px-4 font-extrabold text-slate-900 whitespace-nowrap">
                    {hoster.name}
                  </td>

                  {/* Country */}
                  <td className="py-3.5 px-4 text-slate-600 text-xs whitespace-nowrap">
                    {country}
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {hoster.status === 'supported' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-100 text-emerald-900 border border-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        {t('matrix.status_supported')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-100 text-amber-950 border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        {t('matrix.status_partial')}
                      </span>
                    )}
                  </td>

                  {/* UI Field */}
                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                    <code className="px-2 py-1 bg-slate-100 rounded border border-slate-200 block max-w-xs truncate">
                      {hoster.uiField}
                    </code>
                  </td>

                  {/* Notes */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 leading-relaxed max-w-sm">
                    {notes}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Tech Background Accordion */}
      <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-600" />
          {t('matrix.tech_bg_title')}
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          {t('matrix.tech_bg_text')}
        </p>
      </div>

    </div>
  );
}
