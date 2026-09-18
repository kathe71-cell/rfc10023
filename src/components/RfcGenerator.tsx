import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Copy, Check, Share2, AlertCircle, CheckCircle2, ShieldAlert, ArrowRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateUtf8ByteLength, cleanDomainInput } from '../utils/dnsIntelligence';

interface RfcGeneratorProps {
  embedded?: boolean;
}

export default function RfcGenerator({ embedded = false }: RfcGeneratorProps) {
  const { t, language } = useLanguage();
  const langPrefix = language === 'en' ? '/en' : '';
  const [searchParams] = useSearchParams();
  const urlDomain = searchParams.get('domain') || searchParams.get('d') || '';
  const urlHoster = searchParams.get('hoster') || '';
  const urlFval = searchParams.get('fval') || '';
  const urlFuri = searchParams.get('furi') || '';
  const urlFtxt = searchParams.get('ftxt') || '';
  const urlFcod = searchParams.get('fcod') || '';

  const defaultDomain = language === 'en' ? 'example.com' : 'beispieldomain.de';

  // Helper to split fval into currency + amount
  const parseInitialFval = (raw: string) => {
    const clean = raw.trim();
    if (!clean) {
      return { curr: language === 'en' ? 'USD' : 'EUR', amt: '2500' };
    }
    const match = clean.match(/^([A-Za-z]+)([\d.,]+)$/);
    if (match) {
      return { curr: match[1].toUpperCase(), amt: match[2] };
    }
    return { curr: language === 'en' ? 'USD' : 'EUR', amt: clean };
  };

  const initialPricing = parseInitialFval(urlFval);

  const [domain, setDomain] = useState(urlDomain);
  const [currency, setCurrency] = useState(initialPricing.curr);
  const [amount, setAmount] = useState(urlFval ? initialPricing.amt : '2500');
  const [isVhb, setIsVhb] = useState(false);
  const [furi, setFuri] = useState(urlFuri);
  const [ftxt, setFtxt] = useState(urlFtxt); // Default is empty or passed parameter
  const [fcod, setFcod] = useState(urlFcod);
  const [ttl, setTtl] = useState('3600');
  const [activeTab, setActiveTab] = useState<'bind' | 'cloudflare' | 'hetzner' | 'inwx' | 'netcup' | 'terraform' | 'cli'>('bind');
  const [copied, setCopied] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  useEffect(() => {
    if (urlDomain) setDomain(urlDomain);
    if (urlFuri) setFuri(urlFuri);
    if (urlFtxt) setFtxt(urlFtxt);
    if (urlFcod) setFcod(urlFcod);
    if (urlFval) {
      const p = parseInitialFval(urlFval);
      setCurrency(p.curr);
      setAmount(p.amt);
    }
  }, [urlDomain, urlFval, urlFuri, urlFtxt, urlFcod]);

  useEffect(() => {
    if (urlHoster && ['bind', 'cloudflare', 'hetzner', 'inwx', 'netcup', 'terraform', 'cli'].includes(urlHoster)) {
      setActiveTab(urlHoster as any);
    }
  }, [urlHoster]);

  // Clean domain name
  const cleanDomain = cleanDomainInput(domain) || defaultDomain;

  // Sanitize numeric amount (allow decimal dot)
  const cleanAmount = amount.replace(',', '.').replace(/[^0-9.]/g, '');

  // Sanitize text inputs against newlines / DNS injection
  const sanitizeText = (val: string) => val.replace(/[\r\n]+/g, ' ').replace(/"/g, '\\"').trim();

  // Build the tags (RFC 10023 ABNF)
  const buildTags = () => {
    const tags: { key: string; val: string }[] = [];

    // fval: Asking price. If VHB, fval is omitted as VHB is not valid RFC 10023 ABNF
    if (!isVhb && cleanAmount) {
      tags.push({ key: 'fval', val: `${currency.toUpperCase()}${cleanAmount}` });
    }

    if (furi.trim()) {
      tags.push({ key: 'furi', val: furi.trim() });
    }

    if (isVhb) {
      const note = sanitizeText(ftxt);
      const vhbNote = language === 'en' ? 'Negotiable (OBO)' : 'Verhandlungsbasis (VHB)';
      if (note) {
        tags.push({ key: 'ftxt', val: `${note} (${vhbNote})` });
      } else {
        tags.push({ key: 'ftxt', val: vhbNote });
      }
    } else if (ftxt.trim()) {
      tags.push({ key: 'ftxt', val: sanitizeText(ftxt) });
    }

    if (fcod.trim()) {
      tags.push({ key: 'fcod', val: sanitizeText(fcod) });
    }

    return tags;
  };

  const tags = buildTags();

  // Standard compliant Multi-Record RRset: Each TXT record contains exactly ONE tag-value pair
  const getRecordStrings = (): string[] => {
    if (tags.length === 0) {
      return ['v=FORSALE1;'];
    }
    return tags.map((t) => `v=FORSALE1;${t.key}=${t.val}`);
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
          `; RFC 10023 Zonefile für ${cleanDomain}`,
          `; Knotennamen: _for-sale.${cleanDomain}. | Typ: TXT | TTL: ${ttl}`,
          ...recordStrings.map((rec) => `_for-sale.${cleanDomain}. ${ttl} IN TXT "${rec.replace(/"/g, '\\"')}"`),
        ].join('\n');

      case 'cloudflare':
        return [
          `# Cloudflare Dashboard (DNS -> Records -> Add Record)`,
          `# Hinweis: Content genau wie angegeben ohne äußere Anführungszeichen einfügen`,
          ``,
          ...recordStrings.map((rec, idx) => 
            `[Record #${idx + 1}]\nType:    TXT\nName:    _for-sale\nTTL:     Auto\nContent: ${rec}\n`
          ),
        ].join('\n');

      case 'hetzner':
        return [
          `# Hetzner DNS Console (dns.hetzner.com)`,
          `# Hetzner unterstützt führende Unterstriche (RFC 8552) uneingeschränkt`,
          ``,
          ...recordStrings.map((rec, idx) => 
            `[Eintrag #${idx + 1}]\nTyp:   TXT\nName:  _for-sale\nTTL:   ${ttl}\nWert:  ${rec}\n`
          ),
        ].join('\n');

      case 'inwx':
        return [
          `# INWX Domain-Center (Tab: DNS-Einträge)`,
          `# Mehrzeiliges RRset im INWX Domain-Center anlegen`,
          ``,
          ...recordStrings.map((rec, idx) => 
            `[Eintrag #${idx + 1}]\nTyp:  TXT\nName: _for-sale\nTTL:  ${ttl}\nWert: ${rec}\n`
          ),
        ].join('\n');

      case 'netcup':
        return [
          `# Netcup CCP (Customer Control Panel -> DNS)`,
          `# Netcup akzeptiert Unterstriche für TXT-Records ohne Warnung`,
          ``,
          ...recordStrings.map((rec, idx) => 
            `[Eintrag #${idx + 1}]\nHost:        _for-sale\nType:        TXT\nDestination: ${rec}\n`
          ),
        ].join('\n');

      case 'terraform':
        return [
          `# Terraform HCL (Cloudflare / DNS Provider)`,
          ...recordStrings.map((rec, idx) => 
`resource "cloudflare_record" "forsale_${idx + 1}" {
  zone_id = var.cloudflare_zone_id
  name    = "_for-sale"
  type    = "TXT"
  content = "${rec.replace(/"/g, '\\"')}"
  ttl     = ${ttl}
}`
          ),
        ].join('\n\n');

      case 'cli':
        return [
          `# 1. DNS-Einträge abfragen (nach Hinterlegung)`,
          `dig TXT _for-sale.${cleanDomain} +short`,
          ``,
          `# 2. DNS-over-HTTPS (DoH) JSON-Abfrage`,
          `curl -sH "accept: application/dns-json" "https://cloudflare-dns.com/dns-query?name=_for-sale.${cleanDomain}&type=TXT"`,
          ``,
          `# 3. RFC10023.de API-Validator`,
          `curl -s "https://www.rfc10023.de/api/lookup?d=${cleanDomain}"`,
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
    const url = `${window.location.origin}${langPrefix}/validator?d=${encodeURIComponent(cleanDomain)}&hoster=${activeTab}`;
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
              {language === 'en' ? 'RFC 10023 Generator' : 'RFC 10023 Generator'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {language === 'en' ? 'Generate DNS For-Sale TXT Records' : 'DNS-Verkaufseinträge erstellen'}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'en' ? 'IETF RFC 10023 Compliant' : 'IETF RFC 10023 Konform'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Col: Config Inputs */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Domain Input - Clean, collision-free layout */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {language === 'en' ? '1. Domain Name' : '1. Domainname'}
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder={defaultDomain}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900 transition-colors"
            />
            <div className="mt-1.5 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>{language === 'en' ? 'DNS Leaf Node:' : 'DNS-Knoten:'} <strong className="text-slate-800">_for-sale.{cleanDomain}</strong></span>
              <span className="text-[11px] text-slate-400">RFC 8552 Underscore</span>
            </div>
          </div>

          {/* Pricing & VHB */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                {language === 'en' ? '2. Price (fval)' : '2. Kaufpreis (fval)'}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-mono text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={isVhb}
                  onChange={(e) => setIsVhb(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <span>{language === 'en' ? 'Negotiable (OBO)' : 'Verhandlungsbasis (VHB)'}</span>
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
                    <option value="BTC">BTC (₿)</option>
                    <option value="ETH">ETH (Ξ)</option>
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
                ✓ {language === 'en' 
                    ? 'Negotiable: fval is omitted (RFC 10023 ABNF requires numeric amount). Note is stored in ftxt.' 
                    : 'Verhandlungsbasis: fval wird weggelassen (RFC 10023 ABNF verlangt Zahlenwert). Vermerk erfolgt in ftxt.'}
              </div>
            )}
            <p className="text-[11px] text-slate-500 leading-normal">
              {language === 'en'
                ? 'RFC 10023 Section 2.2.4: Price is indicative and non-binding. Conforms to currency + amount syntax.'
                : 'RFC 10023 § 2.2.4: Preisangabe ist unverbindlich. Format: Währung + Betrag (z. B. EUR2500).'}
            </p>
          </div>

          {/* Contact URI (furi) */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {language === 'en' ? '3. Contact or Marketplace URI (furi)' : '3. Kontakt- oder Marktplatz-Link (furi)'}
            </label>
            <input
              type="text"
              value={furi}
              onChange={(e) => setFuri(e.target.value)}
              placeholder={language === 'en' ? 'https://dan.com/buy-domain/example.com or mailto:contact@...' : 'https://dan.com/buy-domain/example.com oder mailto:kontakt@...'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {language === 'en'
                ? 'Recommended schemes: https://, http://, mailto:, tel:'
                : 'Empfohlene Schemata nach RFC 10023: https://, http://, mailto:, tel:'}
            </span>
          </div>

          {/* Optional Note (ftxt) - Default EMPTY per guidelines */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                {language === 'en' ? '4. Optional Note (ftxt)' : '4. Optionale Notiz (ftxt)'}
              </label>
              <span className="text-[11px] font-mono text-slate-400">
                {calculateUtf8ByteLength(ftxt)} / 239 Bytes
              </span>
            </div>
            <input
              type="text"
              value={ftxt}
              onChange={(e) => setFtxt(e.target.value)}
              placeholder={language === 'en' ? 'e.g. Escrow transfer available, direct sale (leave empty if not needed)' : 'z. B. Treuhandservice möglich, Direktverkauf (leer lassen falls nicht benötigt)'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {language === 'en'
                ? 'Standard default is empty. Example text is only an illustration and not exported automatically.'
                : 'Standardmäßig leer. Beispieltexte dienen nur zur Veranschaulichung und werden nicht ungefragt exportiert.'}
            </span>
          </div>

          {/* Optional System Code (fcod) */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              {language === 'en' ? '5. Optional System Code (fcod)' : '5. Optionaler Registrar-Systemcode (fcod)'}
            </label>
            <input
              type="text"
              value={fcod}
              onChange={(e) => setFcod(e.target.value)}
              placeholder={language === 'en' ? 'e.g. EXCO-S2lscm95IHdhcyBoZXJl' : 'z. B. EXCO-S2lscm95IHdhcyBoZXJl'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-slate-900"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              {language === 'en'
                ? 'RFC 10023 § 2.2.1: Machine code negotiated between cooperating registrars/brokers.'
                : 'RFC 10023 § 2.2.1: Spezifischer Code für kooperierende Registrare oder Broker.'}
            </span>
          </div>

          {/* TTL Selection */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <span className="font-bold text-slate-600 shrink-0">Empfohlene TTL:</span>
            <select
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              className="w-full sm:w-auto max-w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none font-mono text-xs truncate"
            >
              <option value="300">300 s (5 min – empfohlen für Verkaufs-Records)</option>
              <option value="3600">3600 s (1 h – Standard-Hosting)</option>
              <option value="86400">86400 s (24 h)</option>
            </select>
          </div>

          {/* Byte Limit Guard */}
          {exceeds255Limit ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-mono text-rose-900 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>{language === 'en' ? `Limit exceeded (${maxBytes} bytes)!` : `Limit überschritten (${maxBytes} Bytes)!`}</strong>
                <p className="mt-0.5 opacity-90">
                  {language === 'en'
                    ? 'A DNS TXT string may contain at most 255 octets per RFC 1035. Please shorten the value.'
                    : 'Ein DNS-TXT-String darf gemäß RFC 1035 maximal 255 Oktette enthalten. Bitte kürzen.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{language === 'en' ? `Max. RDATA length: ${maxBytes} / 255 octets (RFC 1035 compliant)` : `Max. RDATA-Länge: ${maxBytes} / 255 Oktette (RFC 1035 konform)`}</span>
            </div>
          )}

          {/* Important Installation Notice */}
          <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold font-mono text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <span>{language === 'en' ? 'Important activation note:' : 'Wichtiger Hinweis zur Aktivierung:'}</span>
            </div>
            <p className="leading-relaxed">
              {language === 'en'
                ? 'Copying these records only generates the DNS syntax. The record becomes active only after you add it as a TXT record in your registrar\'s or DNS provider\'s zone editor.'
                : 'Das Kopieren dieser Einträge generiert lediglich die DNS-Syntax. Der Eintrag wird erst aktiv, wenn du ihn im Zoneneditor deines Registrars/DNS-Hosters als TXT-Eintrag hinterlegst.'}
            </p>
            <div className="pt-2">
              <Link
                to={`${langPrefix}/validator?d=${encodeURIComponent(cleanDomain)}&hoster=${activeTab}`}
                className="inline-flex items-center gap-1.5 font-mono font-bold text-xs text-emerald-800 hover:text-emerald-950 underline underline-offset-4"
              >
                <span>{language === 'en' ? `After saving: verify record for ${cleanDomain} in Validator` : `Nach dem Speichern: Eintrag für ${cleanDomain} im Validator prüfen`}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

        </div>

        {/* Right Col: Code Export */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
          
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 flex-grow flex flex-col">
            
            {/* Tabs Header */}
            <div className="flex flex-wrap items-center gap-1 pb-3 mb-3 border-b border-slate-800 text-[11px]">
              {[
                { id: 'bind', label: 'BIND Zonefile' },
                { id: 'cloudflare', label: 'Cloudflare' },
                { id: 'hetzner', label: 'Hetzner' },
                { id: 'inwx', label: 'INWX' },
                { id: 'netcup', label: 'Netcup' },
                { id: 'terraform', label: 'Terraform' },
                { id: 'cli', label: 'CLI / dig' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-2.5 py-1 rounded transition-colors ${
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
            <pre className="overflow-x-auto flex-grow text-emerald-300 whitespace-pre leading-relaxed select-all font-mono text-xs p-2 bg-slate-900/60 rounded-lg border border-slate-800/80">
              <code>{getExportCode()}</code>
            </pre>

            {/* Bottom Actions inside code card */}
            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 truncate">
                {recordStrings.length} {language === 'en' ? (recordStrings.length === 1 ? 'TXT Record' : 'TXT Records (Multi-Record RRset)') : (recordStrings.length === 1 ? 'TXT-Eintrag' : 'TXT-Einträge (Multi-Record RRset)')}
              </span>
              <button
                type="button"
                onClick={copyExport}
                disabled={exceeds255Limit}
                className={`px-3.5 py-2 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shrink-0 ${
                  exceeds255Limit
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
                }`}
                title={exceeds255Limit ? (language === 'en' ? 'Export locked: At least one TXT record exceeds the 255 byte limit (RFC 1035).' : 'Export gesperrt: Mindestens ein TXT-Record überschreitet das 255-Byte-Limit (RFC 1035).') : ''}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (language === 'en' ? 'Copied!' : 'Kopiert!') : exceeds255Limit ? (language === 'en' ? 'Limit exceeded' : 'Limit überschritten') : (language === 'en' ? 'Copy values' : 'Werte kopieren')}</span>
              </button>
            </div>

          </div>

          {/* Share / Verification Link */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-mono text-slate-600 truncate">
              {language === 'en' ? 'Verification link:' : 'Link zum Prüfen:'} rfc10023.de{langPrefix}/validator?d={cleanDomain}
            </span>
            <button
              type="button"
              onClick={copyShareLink}
              className="shrink-0 px-2.5 py-1 rounded bg-white hover:bg-slate-100 border border-slate-200 text-xs font-mono font-medium flex items-center gap-1 text-slate-800"
            >
              {shareCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Share2 className="w-3 h-3 text-slate-500" />}
              <span>{shareCopied ? (language === 'en' ? 'Copied!' : 'Kopiert!') : (language === 'en' ? 'Copy link' : 'Link kopieren')}</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
