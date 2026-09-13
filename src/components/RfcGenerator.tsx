import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Check, Share2, Layers, AlertCircle, CheckCircle2, Sliders, Info, ShieldAlert, Terminal, Code2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateUtf8ByteLength, cleanDomainInput } from '../utils/dnsIntelligence';

interface RfcGeneratorProps {
  embedded?: boolean;
}

export default function RfcGenerator({ embedded = false }: RfcGeneratorProps) {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const urlDomain = searchParams.get('domain') || searchParams.get('d') || '';

  const defaultDomain = t('gen.default_domain');
  const defaultFtxt = t('gen.default_ftxt');

  const [domain, setDomain] = useState(urlDomain);
  const [currency, setCurrency] = useState(language === 'en' ? 'USD' : 'EUR');
  const [amount, setAmount] = useState('2500');
  const [isVhb, setIsVhb] = useState(false);
  const [furi, setFuri] = useState('');
  const [ftxt, setFtxt] = useState(defaultFtxt);
  const [hasUserEditedFtxt, setHasUserEditedFtxt] = useState(false);
  const [fcod, setFcod] = useState('');
  const [ttl, setTtl] = useState('3600');
  const [recordFormat, setRecordFormat] = useState<'multi' | 'single'>('multi');
  const [activeTab, setActiveTab] = useState<'bind' | 'cloudflare' | 'hetzner' | 'inwx' | 'terraform' | 'dnscontrol' | 'cli'>('bind');
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (urlDomain) {
      setDomain(urlDomain);
    }
  }, [urlDomain]);

  // Update default ftxt when language changes if user hasn't typed their own text
  useEffect(() => {
    if (!hasUserEditedFtxt) {
      setFtxt(t('gen.default_ftxt'));
    }
  }, [language, hasUserEditedFtxt, t]);

  // Clean domain name
  const cleanDomain = cleanDomainInput(domain) || defaultDomain;

  // Sanitize numeric amount
  const cleanAmount = amount.replace(',', '.').replace(/[^0-9.]/g, '');

  // Build the tags
  const buildTags = () => {
    const tags: { key: string; val: string }[] = [];

    // fval: Asking price. If VHB, omit fval and place note in ftxt
    if (!isVhb && cleanAmount) {
      tags.push({ key: 'fval', val: `${currency}${cleanAmount}` });
    }

    if (furi.trim()) {
      tags.push({ key: 'furi', val: furi.trim() });
    }

    if (isVhb) {
      const note = ftxt.trim();
      const vhbTag = t('gen.vhb_tag');
      if (note && !note.toLowerCase().includes('vhb') && !note.toLowerCase().includes('verhandlung') && !note.toLowerCase().includes('obo') && !note.toLowerCase().includes('negotiable')) {
        tags.push({ key: 'ftxt', val: `${note} (${language === 'en' ? 'OBO' : 'VHB'})` });
      } else {
        tags.push({ key: 'ftxt', val: note || vhbTag });
      }
    } else if (ftxt.trim()) {
      tags.push({ key: 'ftxt', val: ftxt.trim() });
    }

    if (fcod.trim()) {
      tags.push({ key: 'fcod', val: fcod.trim() });
    }

    return tags;
  };

  const tags = buildTags();

  // Generate records
  const getRecordStrings = (): string[] => {
    if (recordFormat === 'multi') {
      if (tags.length === 0) {
        return ['v=FORSALE1;'];
      }
      return tags.map((t) => `v=FORSALE1;${t.key}=${t.val}`);
    } else {
      const joined = tags.map((t) => `${t.key}=${t.val}`).join('; ');
      return [`v=FORSALE1; ${joined}`];
    }
  };

  const recordStrings = getRecordStrings();

  // Calculate Byte-Length Guard for RFC 1035 (Max 255 Octets per character-string)
  const byteLengths = recordStrings.map((r) => calculateUtf8ByteLength(r));
  const maxBytes = Math.max(...byteLengths, 0);
  const exceeds255Limit = maxBytes > 255;

  // Provider-specific output formats
  const getExportCode = () => {
    switch (activeTab) {
      case 'bind':
        return [
          `${t('gen.comment_bind_zone')} ${cleanDomain}`,
          `${t('gen.comment_bind_node')}${cleanDomain}. ${t('gen.comment_bind_type')}`,
          ...recordStrings.map((rec) => `_for-sale.${cleanDomain}. ${ttl} IN TXT "${rec}"`),
        ].join('\n');

      case 'cloudflare':
        return [
          t('gen.comment_cf_dash'),
          t('gen.comment_cf_hint'),
          ``,
          ...recordStrings.map((rec, idx) => 
            `[${t('gen.entry_label')} #${idx + 1}]\n${t('gen.type_label')}:     TXT\n${t('gen.name_label')}:    _for-sale\nTTL:     Auto\n${t('gen.content_label')}:  ${rec}\n`
          ),
        ].join('\n');

      case 'hetzner':
        return [
          t('gen.comment_hetzner_dash'),
          t('gen.comment_hetzner_hint'),
          ``,
          ...recordStrings.map((rec, idx) => 
            `[${t('gen.entry_label')} #${idx + 1}]\n${t('gen.type_label')}:   TXT\n${t('gen.name_label')}:  _for-sale\nTTL:   ${ttl}\n${t('gen.value_label')}:  ${rec}\n`
          ),
        ].join('\n');

      case 'inwx':
        return [
          t('gen.comment_inwx_dash'),
          ...recordStrings.map((rec, idx) => 
            `[${t('gen.entry_label')} ${idx + 1}] ${t('gen.name_label')}: _for-sale | ${t('gen.type_label')}: TXT | ${t('gen.value_label')}: ${rec} | TTL: ${ttl}`
          ),
        ].join('\n');

      case 'terraform':
        return [
          t('gen.comment_tf_def'),
          ...recordStrings.map((rec, idx) => 
`resource "cloudflare_record" "forsale_${idx + 1}" {
  zone_id = var.cloudflare_zone_id
  name    = "_for-sale"
  type    = "TXT"
  content = "${rec}"
  ttl     = 3600
}`
          ),
        ].join('\n\n');

      case 'dnscontrol':
        return [
          `// DNSControl (dnsconfig.js)`,
          `D("${cleanDomain}", REGISTRAR, DnsProvider(PROVIDER),`,
          ...recordStrings.map((rec) => `  TXT("_for-sale", "${rec}", TTL(3600)),`),
          `);`
        ].join('\n');

      case 'cli':
        return [
          t('gen.comment_cli_dig'),
          `dig TXT _for-sale.${cleanDomain} +short`,
          ``,
          t('gen.comment_cli_doh'),
          `curl -sH "accept: application/dns-json" "https://cloudflare-dns.com/dns-query?name=_for-sale.${cleanDomain}&type=TXT"`,
          ``,
          t('gen.comment_cli_api'),
          `curl -s "https://rfc10023.de/api/lookup?d=${cleanDomain}"`,
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
    const langPrefix = language === 'en' ? '/en' : '';
    const url = `${window.location.origin}${langPrefix}/validator?d=${encodeURIComponent(cleanDomain)}`;
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
              {t('gen.badge')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('gen.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{t('gen.rfc_conform')}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Config Inputs */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Domain Input */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('gen.step1')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder={defaultDomain}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
              />
              <span className="absolute right-3 top-2.5 text-xs font-mono text-slate-400 select-none">
                {t('gen.node_label')}{cleanDomain}
              </span>
            </div>
          </div>

          {/* Pricing & VHB */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                {t('gen.step2')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={isVhb}
                  onChange={(e) => setIsVhb(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>{t('gen.vhb')}</span>
              </label>
            </div>

            {!isVhb ? (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="CHF">CHF (CHF)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="2500"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-900">
                ✓ {t('gen.vhb_note')}
              </div>
            )}
          </div>

          {/* Contact URI */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {t('gen.step3')}
            </label>
            <input
              type="text"
              value={furi}
              onChange={(e) => setFuri(e.target.value)}
              placeholder={t('gen.furi_placeholder')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {t('gen.step3_hint')}
            </span>
          </div>

          {/* Free Text Note */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                {t('gen.step4')}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {calculateUtf8ByteLength(ftxt)} Bytes
              </span>
            </div>
            <input
              type="text"
              value={ftxt}
              onChange={(e) => {
                setFtxt(e.target.value);
                setHasUserEditedFtxt(true);
              }}
              placeholder={t('gen.ftxt_placeholder')}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            />
          </div>

          {/* Format Switcher */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-600">{t('gen.format')}</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-mono">
                <button
                  type="button"
                  onClick={() => setRecordFormat('multi')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    recordFormat === 'multi'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('gen.format_multi')}
                </button>
                <button
                  type="button"
                  onClick={() => setRecordFormat('single')}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    recordFormat === 'single'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t('gen.format_single')}
                </button>
              </div>
            </div>

            {/* TTL */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="font-bold text-slate-600">TTL:</span>
              <select
                value={ttl}
                onChange={(e) => setTtl(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
              >
                <option value="300">300 s (5 min)</option>
                <option value="3600">3600 s (1 h)</option>
                <option value="86400">86400 s (24 h)</option>
              </select>
            </div>

          </div>

          {/* Byte Limit Guard */}
          {exceeds255Limit ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>{t('gen.byte_warn_title')} ({maxBytes} Bytes)!</strong>
                <p className="mt-0.5 opacity-90">
                  {t('gen.byte_warn_text')}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('gen.size_label')} {maxBytes} / 255 {t('gen.size_rfc')}</span>
            </div>
          )}

        </div>

        {/* Right Col: Code Export */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 flex-grow flex flex-col">
            
            {/* Tabs Header */}
            <div className="flex flex-wrap items-center gap-1 pb-3 mb-3 border-b border-slate-800 text-[11px]">
              {[
                { id: 'bind', label: t('gen.tab_zonefile') },
                { id: 'cloudflare', label: t('gen.tab_cf') },
                { id: 'hetzner', label: t('gen.tab_hetzner') },
                { id: 'inwx', label: t('gen.tab_inwx') },
                { id: 'terraform', label: t('gen.tab_tf') },
                { id: 'dnscontrol', label: t('gen.tab_dnscontrol') },
                { id: 'cli', label: t('gen.tab_cli') },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2 py-1 rounded transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Output */}
            <pre className="overflow-x-auto flex-grow text-emerald-300 whitespace-pre leading-relaxed select-all">
              <code>{getExportCode()}</code>
            </pre>

            {/* Bottom Actions inside code card */}
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                {recordStrings.length} {recordStrings.length === 1 ? 'Record' : 'Records'}
              </span>
              <button
                type="button"
                onClick={copyExport}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                <span>{copied ? t('gen.copied') : t('gen.copy_code')}</span>
              </button>
            </div>

          </div>

          {/* Share Link */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-600 truncate">
              {t('gen.share_label')} rfc10023.de{language === 'en' ? '/en' : ''}/validator?d={cleanDomain}
            </span>
            <button
              type="button"
              onClick={copyShareLink}
              className="shrink-0 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono font-medium flex items-center gap-1 text-slate-800"
            >
              {shareCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-slate-500" />}
              <span>{shareCopied ? t('gen.copied') : t('gen.share_link')}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
