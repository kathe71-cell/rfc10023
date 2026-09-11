import React, { useState } from 'react';
import { Cpu, Copy, Check, Share2, Sparkles, HelpCircle, Layers } from 'lucide-react';

interface RfcGeneratorProps {
  embedded?: boolean;
}

export default function RfcGenerator({ embedded = false }: RfcGeneratorProps) {
  const [domain, setDomain] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [amount, setAmount] = useState('2500');
  const [isVhb, setIsVhb] = useState(false);
  const [furi, setFuri] = useState('');
  const [ftxt, setFtxt] = useState('Inkl. Treuhandservice, Sofortübertragung');
  const [fcod, setFcod] = useState('');
  const [ttl, setTtl] = useState('3600');
  const [activeTab, setActiveTab] = useState<'bind' | 'cloudflare' | 'hetzner' | 'inwx' | 'cli'>('bind');
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Clean domain
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/^_for-sale\./, '').split('/')[0] || 'meinedomain.de';

  // Build the TXT record content
  const buildTxtContent = () => {
    const parts = ['v=FORSALE1'];
    
    if (isVhb) {
      parts.push('fval=VHB');
    } else if (amount) {
      parts.push(`fval=${currency}:${amount.trim()}`);
    }

    if (furi.trim()) {
      parts.push(`furi=${furi.trim()}`);
    }

    if (ftxt.trim()) {
      parts.push(`ftxt=${ftxt.trim()}`);
    }

    if (fcod.trim()) {
      parts.push(`fcod=${fcod.trim()}`);
    }

    return parts.join('; ');
  };

  const txtContent = buildTxtContent();

  const getExportCode = () => {
    switch (activeTab) {
      case 'bind':
        return `; RFC 10023 BIND Zonefile Entry\n_for-sale.${cleanDomain}. ${ttl} IN TXT "${txtContent}"`;
      case 'cloudflare':
        return `# Cloudflare DNS Dashboard:\nType: TXT\nName: _for-sale\nTTL: Auto (oder 2 min)\nContent: "${txtContent}"`;
      case 'hetzner':
        return `# Hetzner DNS Console:\nRecord Type: TXT\nName: _for-sale\nTTL: ${ttl}\nValue: "${txtContent}"`;
      case 'inwx':
        return `# INWX DNS-Verwaltung:\nTyp: TXT\nName: _for-sale\nWert / Destination: ${txtContent}\nTTL: ${ttl}`;
      case 'cli':
        return `# DNS Verification via Linux/macOS Terminal:\ndig TXT _for-sale.${cleanDomain} +short\n\n# Oder via curl (Cloudflare DoH):\ncurl -H "accept: application/dns-json" "https://cloudflare-dns.com/dns-query?name=_for-sale.${cleanDomain}&type=TXT"`;
      default:
        return txtContent;
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
    if (amount) params.set('amount', amount);
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
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700">
              IETF Record Builder
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            1-Click RFC 10023 Generator
          </h2>
        </div>
        <button
          type="button"
          onClick={copyShareLink}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-mono text-slate-700 transition-colors"
          title="Konfiguration als Link teilen"
        >
          {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
          <span>{shareCopied ? 'Link kopiert!' : 'Konfiguration teilen'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Form: 7 cols */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Domain Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Domainname <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="beispieldomain.de"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl font-mono text-slate-900 text-sm"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Der Record wird für den Knoten <code className="font-mono text-emerald-700">_for-sale.{cleanDomain}</code> generiert.
            </span>
          </div>

          {/* Price & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Verkaufspreis (fval)
              </label>
              <div className="flex">
                <select
                  disabled={isVhb}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-3 py-3 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl font-mono text-xs font-bold text-slate-700 disabled:opacity-50"
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-r-xl font-mono text-slate-900 text-sm disabled:opacity-50"
                />
              </div>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isVhb}
                  onChange={(e) => setIsVhb(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-800">
                  Verhandlungsbasis (VHB) ohne Festpreis
                </span>
              </label>
            </div>
          </div>

          {/* Contact URI (furi) */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Kontakt-URI / Zielseite (furi)
            </label>
            <input
              type="text"
              value={furi}
              onChange={(e) => setFuri(e.target.value)}
              placeholder="https://sedo.com/... oder mailto:kontakt@example.de"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl font-mono text-slate-900 text-sm"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Zieladresse für Kaufinteressenten (z. B. Marktplatz-Link, Escrow-Formular oder E-Mail).
            </span>
          </div>

          {/* Note / Human text (ftxt) */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Hinweistext / Notiz (ftxt)
            </label>
            <input
              type="text"
              value={ftxt}
              onChange={(e) => setFtxt(e.target.value)}
              placeholder="z. B. Inkl. MwSt., Übergabe per Sedo Escrow"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-slate-900 text-sm"
            />
          </div>

          {/* Advanced Accordion: TTL & fcod */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
                TTL (Sekunden)
              </label>
              <input
                type="text"
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1">
                Optionaler Code (fcod)
              </label>
              <input
                type="text"
                value={fcod}
                onChange={(e) => setFcod(e.target.value)}
                placeholder="z. B. SALE2026-X"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-xs text-slate-800"
              />
            </div>
          </div>

        </div>

        {/* Right Output: 5 cols */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 rounded-xl p-5 text-slate-100 shadow-md">
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
                    className={`px-2 py-1 rounded text-[11px] font-mono font-semibold transition-colors ${
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

            {/* Code preview block */}
            <div className="relative">
              <pre className="font-mono text-xs sm:text-[13px] text-emerald-300 leading-relaxed overflow-x-auto p-3.5 bg-slate-950/80 rounded-lg border border-slate-800 min-h-[160px] whitespace-pre-wrap select-all">
                {getExportCode()}
              </pre>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-400 font-mono">
              Syntax: IETF RFC 10023
            </span>
            <button
              type="button"
              onClick={copyExport}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-extrabold text-xs font-mono rounded-lg transition-all flex items-center gap-2 shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopiert!' : 'Record kopieren'}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
