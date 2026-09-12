import React, { useState } from 'react';
import { Quote, Copy, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CitationBoxProps {
  title?: string;
  url?: string;
}

export default function CitationBox({
  title,
  url = 'https://rfc10023.de/',
}: CitationBoxProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'apa' | 'harvard' | 'bibtex'>('apa');

  const effectiveTitle = title || t('citation.default_title');
  const currentYear = 2026;
  const currentMonth = language === 'en' ? 'September' : 'September';

  const getCitationText = () => {
    const author = language === 'en' ? 'RFC 10023 Editorial Board' : 'RFC 10023 Fachredaktion';
    const retrieved = language === 'en' ? `Retrieved on September 11, ${currentYear}, from ${url}` : `Abgerufen am 11. ${currentMonth} ${currentYear}, von ${url}`;
    const available = language === 'en' ? `Available at: <${url}> [Accessed 11 September ${currentYear}].` : `Verfügbar unter: <${url}> [Zugriff am 11. ${currentMonth} ${currentYear}].`;

    switch (format) {
      case 'apa':
        return `${author} (${currentYear}). ${effectiveTitle}. rfc10023.de. ${retrieved}`;
      case 'harvard':
        return `${author}, ${currentYear}. ${effectiveTitle}. [online] rfc10023.de. ${available}`;
      case 'bibtex':
        return `@online{rfc10023_${currentYear},\n  author = {${author}},\n  title = {${effectiveTitle}},\n  year = {${currentYear}},\n  url = {${url}},\n  urldate = {${currentYear}-09-11}\n}`;
      default:
        return '';
    }
  };

  const copyCitation = () => {
    navigator.clipboard.writeText(getCitationText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Quote className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            {t('citation.title')}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(['apa', 'harvard', 'bibtex'] as const).map((fmt) => (
            <button
              key={fmt}
              type="button"
              onClick={() => setFormat(fmt)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase transition-colors ${
                format === fmt
                  ? 'bg-slate-900 text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 bg-white rounded-lg border border-slate-200 font-mono text-xs text-slate-800 leading-relaxed overflow-x-auto select-all">
        {getCitationText()}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{t('citation.status')}</span>
        <button
          type="button"
          onClick={copyCitation}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded font-semibold text-slate-800 transition-colors shadow-2xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? t('citation.copied') : t('citation.copy')}</span>
        </button>
      </div>
    </div>
  );
}
