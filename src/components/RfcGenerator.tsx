import React, { useState } from 'react';
import { Copy, Check, Share2, Layers, AlertCircle, CheckCircle2, Sliders } from 'lucide-react';

interface RfcGeneratorProps {
  embedded?: boolean;
}

export default function RfcGenerator({ embedded = false }: RfcGeneratorProps) {
  const [domain, setDomain] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [amount, setAmount] = useState('2500');
  const [isVhb, setIsVhb] = useState(false);
  const [furi, setFuri] = useState('');
  const [ftxt, setFtxt] = useState('Inkl. Treuhandabwicklung');
  const [fcod, setFcod] = useState('');
  const [ttl, setTtl] = useState('3600');
  const [recordFormat, setRecordFormat] = useState<'multi' | 'single'>('multi');
  const [activeTab, setActiveTab] = useState<'bind' | 'cloudflare' | 'hetzner' | 'inwx' | 'cli'>('bind');
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Clean domain name
  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/^_for-sale\./, '')
    .split('/')[0] || 'beispieldomain.de';

  // Sanitize numeric amount (remove commas, trim)
  const cleanAmount = amount.replace(',', '.').replace(/[^0-9.]/g, '');

  // Build the tags
  const buildTags = () => {
    const tags: { key: string; val: string }[] = [];

    if (isVhb) {
      tags.push({ key: 'fval', val: 'VHB' });
    } else if (cleanAmount) {
      // RFC 10023 Section 2.2: currency code followed directly by amount (e.g. EUR2500 or USD1000)
      tags.push({ key: 'fval', val: `${currency}${cleanAmount}` });
    }

    if (furi.trim()) {
      tags.push({ key: 'furi', val: furi.trim() });
    }

    if (ftxt.trim()) {
      tags.push({ key: 'ftxt', val: ftxt.trim() });
    }

    if (fcod.trim()) {
      tags.push({ key: 'fcod', val: fcod.trim() });
    }

    return tags;
  };

  const tags = buildTags();

  // Generate output records according to RFC 10023 Section 2.1:
  // "Each '_for-sale' TXT record MUST NOT contain more than one tag-value pair, but multiple TXT records MAY be present in a single RRset."
  const getRecordStrings = (): string[] => {
    if (recordFormat === 'multi') {
      if (tags.length === 0) {
        return ['v=FORSALE1;'];
      }
      return tags.map((t) => `v=FORSALE1;${t.key}=${t.val}`);
    } else {
      // Fallback single combined string
      const joined = tags.map((t) => `${t.key}=${t.val}`).join('; ');
      return [`v=FORSALE1; ${joined}`];
    }
  };

  const recordStrings = getRecordStrings();

  // Provider-specific output formats
  const getExportCode = () => {
    switch (activeTab) {
      case 'bind':
        return [
          `; RFC 10023 RRset für ${cleanDomain}`,
          `; DNS Leaf Node: _for-sale.${cleanDomain}.`,
          ...recordStrings.map((rec) => `_for-sale.${cleanDomain}. ${ttl} IN TXT "${rec}"`),
        ].join('\n');

      case 'cloudflare':
        return [
          `# Cloudflare DNS Konfiguration für ${cleanDomain}:`,
          `# Lege folgende TXT-Records im Dashboard an:`,
          ...recordStrings.map((rec, idx) => `[Eintrag ${idx + 1}] Typ: TXT | Name: _for-sale | TTL: Auto | Content: "${rec}"`),
        ].join('\n\n');

      case 'hetzner':
        return [
          `# Hetzner DNS Console für ${cleanDomain}:`,
          ...recordStrings.map((rec, idx) => `[Record #${idx + 1}] Type: TXT | Name: _for-sale | TTL: ${ttl} | Value: "${rec}"`),
        ].join('\n\n');

      case 'inwx':
        return [
          `# INWX Domain-Center (DNS-Verwaltung):`,
          ...recordStrings.map((rec, idx) => `[Eintrag ${idx + 1}] Name: _for-sale | Typ: TXT | Wert: ${rec} | TTL: ${ttl}`),
        ].join('\n');

      case 'cli':
        return [
          `# 1. DNS-Status mit dig abfragen:`,
          `dig TXT _for-sale.${cleanDomain} +short`,
          ``,
          `# 2. DNS-over-HTTPS Test via curl (Cloudflare Anycast):`,
          `curl -sH "accept: application/dns-json" "https://cloudflare-dns.com/dns-query?name=_for-sale.${cleanDomain}&type=TXT"`,
        ].join('\n');

      default:
        return recordStrings.join('\n');
    }
  };

  const copyExport = () => {
    navigator.clipboard.writeText(getExportCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyShareLink = () => {
    const params = new URLSearchParams();
    if (domain) params.set('d', cleanDomain);
    if (amount && !isVhb) params.set('val', cleanAmount);
    if (isVhb) params.set('vhb', '1');
    if (currency) params.set('cur', currency);
    if (furi) params.set('uri', furi);
    const url = `${window.location.origin}/generator?${params.toString()}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm ${embedded ? 'p-4' : 'p-6 sm:p-8'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              IETF RFC 10023 Section 2.1 Compiler
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            _for-sale DNS-Record Generator
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-mono font-semibold text-slate-700 transition-colors"
          >
            {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
            <span>{shareCopied ? 'Link kopiert!' : 'Konfiguration teilen'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Domain Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Domainname <span className="text-emerald-600">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="meinedomain.de"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none rounded-xl font-mono text-slate-900 text-sm"
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>DNS Leaf Node: <code className="text-slate-800 font-bold">_for-sale.{cleanDomain}</code></span>
              <span>Record-Typ: <code className="text-emerald-700 font-bold">TXT (Typ 16)</code></span>
            </div>
          </div>

          {/* Price & Currency (fval) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Verkaufspreis (<code className="text-emerald-700">fval</code>)
              </label>
              <div className="flex">
                <select
                  disabled={isVhb}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl font-mono text-xs font-bold text-slate-800 disabled:opacity-40"
                >
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="CHF">CHF</option>
                  <option value="GBP">GBP (£)</option>
                </select>
                <input
                  type="text"
                  disabled={isVhb}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="2500"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none rounded-r-xl font-mono text-slate-900 text-sm disabled:opacity-40"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors h-[46px]">
                <input
                  type="checkbox"
                  checked={isVhb}
                  onChange={(e) => setIsVhb(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-slate-900"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Verhandlungsbasis (<code className="font-mono text-emerald-700">fval=VHB</code>)
                </span>
              </label>
            </div>
          </div>

          {/* Contact URI (furi) */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Kontakt-URI (<code className="text-emerald-700">furi</code>)
            </label>
            <input
              type="text"
              value={furi}
              onChange={(e) => setFuri(e.target.value)}
              placeholder="https://sedo.com/... oder mailto:kontakt@inhaber.de"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none rounded-xl font-mono text-slate-900 text-sm"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Erlaubte URI-Schemata: <code className="font-mono">https://</code>, <code className="font-mono">http://</code>, <code className="font-mono">mailto:</code> oder <code className="font-mono">tel:</code>.
            </span>
          </div>

          {/* Note / Human text (ftxt) */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Zusatznotiz (<code className="text-emerald-700">ftxt</code>)
            </label>
            <input
              type="text"
              value={ftxt}
              onChange={(e) => setFtxt(e.target.value)}
              placeholder="z. B. Inkl. Treuhandservice, Sofortübertrag"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none rounded-xl text-slate-900 text-sm"
            />
          </div>

          {/* Mode Switcher: Multi-Record vs Single-Line */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase text-slate-700 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                Architektur-Modus
              </span>
              <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setRecordFormat('multi')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    recordFormat === 'multi'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  IETF Multi-Record (RFC 10023)
                </button>
                <button
                  type="button"
                  onClick={() => setRecordFormat('single')}
                  className={`px-2.5 py-1 rounded font-bold transition-colors ${
                    recordFormat === 'single'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Single-Line Fallback
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {recordFormat === 'multi' ? (
                <span>
                  <strong>IETF-Standard:</strong> Gemäß RFC 10023 Section 2.1 enthält jeder TXT-Record genau ein Tag-Wert-Paar und beginnt mit <code>v=FORSALE1;</code>. Dies garantiert maximale Parser-Kompatibilität bei Registraren (wie SIDN).
                </span>
              ) : (
                <span>
                  <strong>Kompaktmodus:</strong> Kombiniert alle Tags in einem einzelnen TXT-Record. Empfohlen, falls dein Hoster nur einen TXT-Eintrag pro Subdomain zulässt.
                </span>
              )}
            </p>
          </div>

        </div>

        {/* Right Output: 5 cols */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-950 rounded-xl p-5 text-slate-100 shadow-md">
          <div>
            {/* Tab navigation */}
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                DNS Export
              </span>
              <div className="flex flex-wrap gap-1">
                {(['bind', 'cloudflare', 'hetzner', 'inwx', 'cli'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors ${
                      activeTab === tab
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Code preview */}
            <div className="relative">
              <pre className="font-mono text-xs sm:text-[13px] text-emerald-300 leading-relaxed overflow-x-auto p-3.5 bg-slate-900/90 rounded-lg border border-slate-800 min-h-[220px] whitespace-pre-wrap select-all">
                {getExportCode()}
              </pre>
            </div>

            {/* Compliance Badge */}
            <div className="mt-3 flex items-center gap-2 text-xs font-mono text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                {recordFormat === 'multi'
                  ? 'IETF RFC 10023 Standardkonform (Multi-Record RRset)'
                  : 'Single-Line Fallback (Breite Hoster-Unterstützung)'}
              </span>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-mono">
              TTL: {ttl}s &bull; TXT Records: {recordStrings.length}
            </span>
            <button
              type="button"
              onClick={copyExport}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-mono font-black text-xs rounded-lg transition-all flex items-center gap-2 shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopiert!' : 'Code kopieren'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
