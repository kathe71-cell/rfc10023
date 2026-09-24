import React, { useState } from 'react';
import { Quote, Copy, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface CitationBoxProps {
  title?: string;
  url?: string;
  date?: string;
  author?: string;
}

export default function CitationBox({
  title,
  url = 'https://www.rfc10023.de/',
  date = '2026-09-24',
  author,
}: CitationBoxProps) {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'apa' | 'harvard' | 'bibtex'>('apa');

  const effectiveTitle = title || t('citation.default_title');
  const dateParts = date.split('-');
  const year = dateParts[0] || '2026';
  const monthNum = parseInt(dateParts[1] || '9', 10);
  const day = parseInt(dateParts[2] || '24', 10);

  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsDe = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
  const monthName = language === 'en' ? (monthsEn[monthNum - 1] || 'September') : (monthsDe[monthNum - 1] || 'September');

  const effectiveAuthor = author || (language === 'en' ? 'RFC 10023 Editorial Board' : 'RFC 10023 Fachredaktion');

  const getCitationText = () => {
    const retrieved = language === 'en' ? `Retrieved on ${monthName} ${day}, ${year}, from ${url}` : `Abgerufen am ${day}. ${monthName} ${year}, von ${url}`;
    const available = language === 'en' ? `Available at: <${url}> [Accessed ${day} ${monthName} ${year}].` : `Verfügbar unter: <${url}> [Zugriff am ${day}. ${monthName} ${year}].`;

    switch (format) {
      case 'apa':
        return `${effectiveAuthor} (${year}). ${effectiveTitle}. rfc10023.de. ${retrieved}`;
      case 'harvard':
        return `${effectiveAuthor}, ${year}. ${effectiveTitle}. [online] rfc10023.de. ${available}`;
      case 'bibtex':
        return `@online{rfc10023_${year},\n  author = {${effectiveAuthor}},\n  title = {${effectiveTitle}},\n  year = {${year}},\n  url = {${url}},\n  urldate = {${date}}\n}`;
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
