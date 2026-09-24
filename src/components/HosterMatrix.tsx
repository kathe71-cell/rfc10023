import React, { useState } from 'react';
import {
  HOSTERS_DATA,
  ProviderCompatibility,
  CompatibilityStatus,
  formatVerificationDate,
  isVerificationStale,
} from '../data/hosters';
import {
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
  Database,
  ExternalLink,
  ShieldCheck,
  FileText,
  Clock,
  FlaskConical,
  MessageSquare,
  Users,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HosterMatrix() {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | CompatibilityStatus>('all');

  const filteredHosters = HOSTERS_DATA.filter((h) => {
    const notesText = isEn ? h.notesEn : h.notes;
    const regionText = isEn ? h.regionEn : h.region;
    const term = searchTerm.toLowerCase();

    const matchesSearch =
      h.name.toLowerCase().includes(term) ||
      notesText.toLowerCase().includes(term) ||
      regionText.toLowerCase().includes(term) ||
      h.editorSyntax.toLowerCase().includes(term);

    const matchesStatus = filterStatus === 'all' || h.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderStatusBadge = (h: ProviderCompatibility) => {
    // Specifically when DNS syntax is confirmed via docs, but RFC-10023 specific hands-on test is not yet performed:
    if (h.id === 'ionos' || (h.dnsSyntaxSupported && !h.rfc10023Tested && h.status === 'unclear')) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-sky-50 text-sky-950 border border-sky-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-sky-700 shrink-0" />
          <span>{t('matrix.status_dns_syntax_supported')}</span>
        </span>
      );
    }

    switch (h.status) {
      case 'verified-supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{t('matrix.status_verified_supported')}</span>
          </span>
        );
      case 'verified-limited':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-amber-50 text-amber-950 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>{t('matrix.status_verified_limited')}</span>
          </span>
        );
      case 'unclear':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-800 border border-slate-300">
            <HelpCircle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span>{t('matrix.status_unclear')}</span>
          </span>
        );
      case 'not-supported':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-rose-50 text-rose-900 border border-rose-300">
            <AlertCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
            <span>{t('matrix.status_not_supported')}</span>
          </span>
        );
      case 'not-retested':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-slate-100 text-slate-700 border border-slate-300">
            <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <span>{t('matrix.status_not_retested')}</span>
          </span>
        );
    }
  };

  const renderVerificationDetails = (h: ProviderCompatibility) => {
    let typeIcon = <FileText className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
    let typeLabel = t('matrix.vtype_official_docs');

    if (h.verificationType === 'hands-on-test') {
      typeIcon = <FlaskConical className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      typeLabel = t('matrix.vtype_hands_on_test');
    } else if (h.verificationType === 'provider-statement') {
      typeIcon = <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      typeLabel = t('matrix.vtype_provider_statement');
    } else if (h.verificationType === 'community-report') {
      typeIcon = <Users className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
      typeLabel = t('matrix.vtype_community_report');
    } else if (h.verificationType === 'inferred') {
      typeIcon = <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />;
      typeLabel = t('matrix.vtype_inferred');
    }

    const isStale = isVerificationStale(h.lastVerified, 180);

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-800">
          {typeIcon}
          <span>{typeLabel}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 font-mono">
          <span>{t('matrix.last_verified')}: {formatVerificationDate(h.lastVerified, isEn ? 'en' : 'de')}</span>
          {h.testedAt && (
            <span>· {t('matrix.tested_at')}: {formatVerificationDate(h.testedAt, isEn ? 'en' : 'de')}</span>
          )}
        </div>
        {!h.rfc10023Tested && (
          <div className="flex flex-col gap-0.5 text-[10px] font-mono text-slate-500 pt-0.5">
            <span className="text-slate-600">· {t('matrix.test_not_performed')}</span>
            <span className="text-slate-500">· {t('matrix.native_integration_unconfirmed')}</span>
          </div>
        )}
        {isStale && (
          <div
            className="inline-flex items-center gap-1 text-[10px] text-amber-800 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200"
            title={t('matrix.stale_tooltip')}
          >
            <AlertTriangle className="w-2.5 h-2.5 shrink-0 text-amber-600" />
            <span>{t('matrix.stale_warning')}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-6 overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('matrix.search_placeholder')}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | CompatibilityStatus)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">{t('matrix.filter_all')}</option>
            <option value="verified-supported">{t('matrix.filter_supported')}</option>
            <option value="verified-limited">{t('matrix.filter_limited')}</option>
            <option value="unclear">{t('matrix.filter_unclear')}</option>
            <option value="not-retested">{t('matrix.filter_not_retested')}</option>
          </select>
        </div>
      </div>

      {/* Mandatory Transparency Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3 text-xs text-slate-700 leading-relaxed">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p>{t('matrix.transparency_note')}</p>
      </div>

      {/* Fixed Desktop Table View (>= md) - Strictly 100% width with table-fixed, zero horizontal overflow */}
      <div className="hidden md:block w-full border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full table-fixed text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs font-mono uppercase text-slate-500">
              <th className="py-3 px-4 font-bold w-[23%]">{t('matrix.col_provider_origin')}</th>
              <th className="py-3 px-4 font-bold w-[24%]">{t('matrix.col_status_verification')}</th>
              <th className="py-3 px-4 font-bold w-[23%]">{t('matrix.col_syntax')}</th>
              <th className="py-3 px-4 font-bold w-[30%]">{t('matrix.col_notes')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {filteredHosters.map((hoster) => {
              const country = isEn ? hoster.regionEn : hoster.region;
              const notes = isEn ? hoster.notesEn : hoster.notes;

              return (
                <tr key={hoster.id} className="hover:bg-slate-50/70 transition-colors align-top">
                  
                  {/* Column 1: Provider, Region & Source Link */}
                  <td className="py-3.5 px-4 space-y-1.5">
                    <div>
                      <span className="block font-extrabold text-slate-900 leading-snug">
                        {hoster.name}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {country}
                      </span>
                    </div>
                    <div>
                      <a
                        href={hoster.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
                        title={hoster.sourceUrl}
                      >
                        <span>{t('matrix.view_source')}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    </div>
                  </td>

                  {/* Column 2: Status & Verification Meta */}
                  <td className="py-3.5 px-4 space-y-2">
                    <div>
                      {renderStatusBadge(hoster)}
                    </div>
                    {renderVerificationDetails(hoster)}
                  </td>

                  {/* Column 3: Zone Editor Syntax */}
                  <td className="py-3.5 px-4">
                    <code className="p-2 bg-slate-100 rounded-lg border border-slate-200 block text-xs font-mono text-slate-800 break-words leading-relaxed">
                      {hoster.editorSyntax}
                    </code>
                  </td>

                  {/* Column 4: Notes */}
                  <td className="py-3.5 px-4 text-xs text-slate-600 leading-relaxed break-words">
                    {notes}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (< md) - Full width cards, zero horizontal overflow */}
      <div className="block md:hidden space-y-4">
        {filteredHosters.map((hoster) => {
          const country = isEn ? hoster.regionEn : hoster.region;
          const notes = isEn ? hoster.notesEn : hoster.notes;

          return (
            <div
              key={hoster.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
            >
              {/* Card Header: Name + Status */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    {hoster.name}
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    {country}
                  </span>
                </div>
                <div className="shrink-0">
                  {renderStatusBadge(hoster)}
                </div>
              </div>

              {/* Verification & Last Verified */}
              <div className="pt-2 border-t border-slate-200">
                <span className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  {t('matrix.col_status_verification')}
                </span>
                {renderVerificationDetails(hoster)}
              </div>

              {/* Editor Syntax */}
              <div>
                <span className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  {t('matrix.col_syntax')}
                </span>
                <code className="p-2 bg-slate-100 rounded-md border border-slate-200 block text-xs font-mono text-slate-800 break-words">
                  {hoster.editorSyntax}
                </code>
              </div>

              {/* Notes */}
              <div>
                <span className="block text-[10px] font-mono uppercase text-slate-400 font-bold mb-1">
                  {t('matrix.col_notes')}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed break-words">
                  {notes}
                </p>
              </div>

              {/* Source Button */}
              <div className="pt-2 border-t border-slate-200 flex justify-end">
                <a
                  href={hoster.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-slate-800 border border-slate-300 hover:border-emerald-500 hover:text-emerald-800 shadow-2xs transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  <span>{t('matrix.view_source')}</span>
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tech Background Accordion */}
      <div className="p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200">
        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 mb-2 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{t('matrix.tech_bg_title')}</span>
        </h4>
        <p className="text-xs text-slate-600 leading-relaxed">
          {t('matrix.tech_bg_text')}
        </p>
      </div>

    </div>
  );
}
