import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Check, ShieldCheck, Sparkles, ExternalLink, Code2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface BadgeGeneratorProps {
  initialDomain?: string;
}

export default function BadgeGenerator({ initialDomain = 'deinedomain.de' }: BadgeGeneratorProps) {
  const { t, language } = useLanguage();
  const isEn = language === 'en';
  const langPrefix = isEn ? '/en' : '';
  const [searchParams] = useSearchParams();
  const queryDomain = searchParams.get('d') || searchParams.get('domain') || '';
  const effectiveInitial = queryDomain || (initialDomain === 'deinedomain.de' && isEn ? 'yourdomain.com' : initialDomain);

  const [domain, setDomain] = useState(effectiveInitial);
  const [theme, setTheme] = useState<'dark' | 'light' | 'emerald'>('dark');
  const [badgeText, setBadgeText] = useState(isEn ? 'Verify DNS For-Sale Record' : 'DNS-Verkaufseintrag prüfen');
  const [copiedHtml, setCopiedHtml] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  useEffect(() => {
    if (queryDomain) {
      setDomain(queryDomain);
    }
  }, [queryDomain]);

  const clean = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^_for-sale\./, '')
    .split('/')[0] || (isEn ? 'yourdomain.com' : 'deinedomain.de');

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

  const lookupUrl = `https://www.rfc10023.de${langPrefix}/validator?d=${encodeURIComponent(clean)}`;

  // Safe, self-contained HTML/CSS Badge (Zero external requests)
  const safeBadgeText = escapeHtml(badgeText);
  const badgeHtml = `<a href="${lookupUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex; align-items:center; gap:8px; padding:6px 12px; background:${
    theme === 'dark' ? '#0f172a' : theme === 'emerald' ? '#065f46' : '#ffffff'
  }; color:${
    theme === 'light' ? '#0f172a' : '#ffffff'
  }; border:1px solid ${
    theme === 'light' ? '#e2e8f0' : 'rgba(255,255,255,0.15)'
  }; border-radius:8px; font-family:-apple-system,BlinkMacSystemFont,sans-serif; font-size:12px; font-weight:600; text-decoration:none; box-shadow:0 1px 3px rgba(0,0,0,0.08);">
  <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#10b981;"></span>
  <span>${safeBadgeText}</span>
</a>`;

  // Markdown variant with Shields.io external image
  const encodedLabel = encodeURIComponent(isEn ? 'RFC 10023' : 'RFC 10023');
  const encodedMessage = encodeURIComponent(isEn ? 'Check DNS Record' : 'DNS-Eintrag prüfen');
  const safeMdText = badgeText.replace(/[[\]]/g, '');
  const badgeMarkdown = `[![${safeMdText}](https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-10b981?style=flat-square)](${lookupUrl})`;

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
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              {isEn ? 'Badge Generator' : 'Badge-Generator'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Generate Neutral Verification Badge' : 'Prüf-Badge für Verkaufsseiten erstellen'}
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <span>{isEn ? 'Neutral Status Link' : 'Neutraler Prüf-Link'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        
        {/* Settings */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {isEn ? 'Domain Name' : 'Domainname'}
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={isEn ? 'yourdomain.com' : 'meinedomain.de'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {isEn ? 'Badge Label (Neutral by default)' : 'Badge-Beschriftung (standardmäßig neutral)'}
            </label>
            <input
              type="text"
              value={badgeText}
              onChange={(e) => setBadgeText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              {isEn ? 'Color Theme' : 'Farb-Design'}
            </label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono focus:bg-white focus:outline-none focus:border-slate-900"
            >
              <option value="dark">{isEn ? 'Dark Theme (Slate 900)' : 'Dunkel (Slate 900)'}</option>
              <option value="emerald">{isEn ? 'Emerald Green' : 'Smaragdgrün (Emerald)'}</option>
              <option value="light">{isEn ? 'Light Theme (White)' : 'Hell (Weiß)'}</option>
            </select>
          </div>

          {/* Neutrality & Transparency Disclaimer */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 font-mono">
              <AlertCircle className="w-4 h-4 text-slate-600" />
              <span>{isEn ? 'Transparency & Legal Notice:' : 'Transparenz- & Haftungshinweis:'}</span>
            </div>
            <p className="leading-relaxed">
              {isEn
                ? <>The badge links to an independent live check confirming whether an RFC 10023 DNS for-sale record exists. It does <strong>not</strong> constitute proof of seller identity, domain ownership, or authorization to sell.</>
                : <>Das Badge verlinkt zur neutralen Prüfung, ob ein RFC 10023 DNS-Verkaufseintrag vorhanden ist. Es stellt <strong>keinen</strong> Identitäts-, Eigentums- oder Berechtigungsnachweis des Verkäufers dar.</>}
            </p>
          </div>

        </div>

        {/* Live Preview & Code Outputs */}
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-2">
              {isEn ? 'Live Preview:' : 'Live-Vorschau:'}
            </label>
            <div className="p-6 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center min-h-[90px]">
              <a
                href={lookupUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  background: theme === 'dark' ? '#0f172a' : theme === 'emerald' ? '#065f46' : '#ffffff',
                  color: theme === 'light' ? '#0f172a' : '#ffffff',
                  border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  fontFamily: '-apple-system,BlinkMacSystemFont,sans-serif',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                <span>{badgeText}</span>
              </a>
            </div>
          </div>

          {/* HTML Code Box */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isEn ? 'HTML / CSS (100% GDPR compliant, zero external requests)' : 'HTML / CSS (100% DSGVO-konform, kein externer Request)'}</span>
              </span>
              <button
                type="button"
                onClick={copyHtml}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs flex items-center gap-1 transition-colors"
              >
                {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedHtml ? (isEn ? 'Copied!' : 'Kopiert!') : (isEn ? 'Copy HTML' : 'HTML kopieren')}</span>
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] text-emerald-300/90 whitespace-pre-wrap select-all">
              <code>{badgeHtml}</code>
            </pre>
          </div>

          {/* Markdown Code Box */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-[11px] text-slate-400">{isEn ? 'Markdown (uses external Shields.io badge service)' : 'Markdown (nutzt externen Bilddienst Shields.io)'}</span>
              <button
                type="button"
                onClick={copyMd}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs flex items-center gap-1 transition-colors"
              >
                {copiedMd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedMd ? (isEn ? 'Copied!' : 'Kopiert!') : (isEn ? 'Copy Markdown' : 'Markdown kopieren')}</span>
              </button>
            </div>
            <pre className="overflow-x-auto text-[11px] text-emerald-300/90 whitespace-pre-wrap select-all">
              <code>{badgeMarkdown}</code>
            </pre>
          </div>

        </div>

      </div>

    </div>
  );
}
