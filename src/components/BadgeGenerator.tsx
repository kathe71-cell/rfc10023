import React, { useState } from 'react';
import { Copy, Check, ShieldCheck, Sparkles, ExternalLink, Code2 } from 'lucide-react';

interface BadgeGeneratorProps {
  initialDomain?: string;
}

export default function BadgeGenerator({ initialDomain = 'deinedomain.de' }: BadgeGeneratorProps) {
  const [domain, setDomain] = useState(initialDomain);
  const [theme, setTheme] = useState<'dark' | 'light' | 'emerald'>('dark');
  const [showPrice, setShowPrice] = useState(true);
  const [priceText, setPriceText] = useState('2.500 €');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const clean = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^_for-sale\./, '')
    .split('/')[0] || 'deinedomain.de';

  const lookupUrl = `https://rfc10023.de/validator?d=${encodeURIComponent(clean)}`;

  const badgeHtml = `<a href="${lookupUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:8px; padding:6px 12px; background:${
    theme === 'dark' ? '#0f172a' : theme === 'emerald' ? '#065f46' : '#ffffff'
  }; color:${
    theme === 'light' ? '#0f172a' : '#ffffff'
  }; border:1px solid ${
    theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.15)'
  }; border-radius:8px; font-family:-apple-system,BlinkMacSystemFont,sans-serif; font-size:12px; font-weight:600; text-decoration:none; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
  <span>RFC 10023 Verified</span>
  ${showPrice && priceText ? `<span style="opacity:0.6;">|</span><span style="color:${theme === 'light' ? '#059669' : '#34d399'}; font-weight:700;">${priceText}</span>` : ''}
</a>`;

  const badgeMarkdown = `[![RFC 10023 DNS Verified](https://img.shields.io/badge/RFC_10023-DNS_Verified-10b981?style=flat-square&logo=cloudflare)](${lookupUrl})`;

  const copyHtml = () => {
    navigator.clipboard.writeText(badgeHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
  };

  const copyMd = () => {
    navigator.clipboard.writeText(badgeMarkdown);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Prüfsiegel für Websites und Portfolios
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Badge Generator
          </h2>
        </div>
        <div className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          ✓ DNS geprüft
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Domainname
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="meinedomain.de"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Farbvariante
              </label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none"
              >
                <option value="dark">Dunkel (Slate)</option>
                <option value="emerald">Grün (Emerald)</option>
                <option value="light">Hell (Weiß)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Preis zeigen
              </label>
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="checkbox"
                  id="showPriceCheck"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <label htmlFor="showPriceCheck" className="text-xs text-slate-700 font-medium cursor-pointer">
                  Preis im Badge
                </label>
              </div>
            </div>
          </div>

          {showPrice && (
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Preis oder Notiz
              </label>
              <input
                type="text"
                value={priceText}
                onChange={(e) => setPriceText(e.target.value)}
                placeholder="2.500 € oder VHB"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono focus:bg-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Live Preview Box */}
        <div className="p-6 rounded-xl bg-slate-100 border border-slate-200 space-y-4">
          <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider block">
            Vorschau (Klickbar zur Prüfung):
          </span>
          
          <div className="py-6 flex items-center justify-center bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
            <a
              href={lookupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-sans text-xs font-semibold shadow-xs transition-transform hover:scale-105 active:scale-95 ${
                theme === 'dark'
                  ? 'bg-slate-900 text-white border border-slate-800'
                  : theme === 'emerald'
                  ? 'bg-emerald-800 text-white border border-emerald-700'
                  : 'bg-white text-slate-900 border border-slate-200'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>RFC 10023 Verified</span>
              {showPrice && priceText && (
                <>
                  <span className="opacity-40">|</span>
                  <span className={theme === 'light' ? 'text-emerald-700 font-bold' : 'text-emerald-300 font-bold'}>
                    {priceText}
                  </span>
                </>
              )}
            </a>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            Interessenten gelangen per Klick direkt zum Prüfergebnis auf <strong>rfc10023.de</strong>, 
            das den DNS-Eintrag unabhängig bestätigt.
          </p>
        </div>
      </div>

      {/* Code Snippets */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Code2 className="w-4 h-4 text-emerald-600" />
            <span>Code für eigene Websites und Portale</span>
          </span>
          <button
            type="button"
            onClick={copyHtml}
            className="px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-mono font-bold flex items-center gap-1.5"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>HTML kopieren</span>
          </button>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl text-emerald-300 font-mono text-xs overflow-x-auto">
          <code>{badgeHtml}</code>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            Markdown für GitHub oder Readme
          </span>
          <button
            type="button"
            onClick={copyMd}
            className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-mono font-semibold flex items-center gap-1.5"
          >
            {copiedMd ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>Markdown kopieren</span>
          </button>
        </div>
        <div className="p-3 bg-slate-950 rounded-xl text-slate-300 font-mono text-xs overflow-x-auto">
          <code>{badgeMarkdown}</code>
        </div>
      </div>
    </div>
  );
}
