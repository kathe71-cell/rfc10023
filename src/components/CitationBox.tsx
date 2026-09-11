import React, { useState } from 'react';
import { Quote, Copy, Check } from 'lucide-react';

interface CitationBoxProps {
  title?: string;
  url?: string;
}

export default function CitationBox({
  title = 'RFC 10023: Der IETF-Standard für Domain-Verkaufssignale im DNS',
  url = 'https://rfc10023.de/',
}: CitationBoxProps) {
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<'apa' | 'harvard' | 'bibtex'>('apa');

  const currentYear = 2026;
  const currentMonth = 'September';

  const getCitationText = () => {
    switch (format) {
      case 'apa':
        return `RFC 10023 Fachredaktion (${currentYear}). ${title}. rfc10023.de. Abgerufen am 11. ${currentMonth} ${currentYear}, von ${url}`;
      case 'harvard':
        return `RFC 10023 Fachredaktion, ${currentYear}. ${title}. [online] rfc10023.de. Verfügbar unter: <${url}> [Zugriff am 11. ${currentMonth} ${currentYear}].`;
      case 'bibtex':
        return `@online{rfc10023_${currentYear},\n  author = {RFC 10023 Fachredaktion},\n  title = {${title}},\n  year = {${currentYear}},\n  url = {${url}},\n  urldate = {${currentYear}-09-11}\n}`;
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
            Zitierhinweis für Fachmedien &amp; Publikationen
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
        <span>Stand: September 2026 · IETF Standards Track</span>
        <button
          type="button"
          onClick={copyCitation}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded font-semibold text-slate-800 transition-colors shadow-2xs"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Zitierung kopiert' : 'Zitierung kopieren'}</span>
        </button>
      </div>
    </div>
  );
}
