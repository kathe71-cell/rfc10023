import React, { useState, useEffect } from 'react';
import { Search, CheckCircle2, AlertTriangle, XCircle, ArrowRight, Copy, Check, Terminal, ExternalLink, RefreshCw } from 'lucide-react';

interface ParsedTags {
  v?: string;
  furi?: string;
  fval?: string;
  ftxt?: string;
  fcod?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  domain: string;
  nodeName: string;
  status: 'valid' | 'warning' | 'not_found' | 'error';
  statusMessage: string;
  rawTxt: string[];
  parsed: ParsedTags;
  warnings: string[];
  dnsProvider: string;
}

interface RfcValidatorProps {
  initialDomain?: string;
  embedded?: boolean;
}

export default function RfcValidator({ initialDomain = '', embedded = false }: RfcValidatorProps) {
  const [domainInput, setDomainInput] = useState(initialDomain);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const cleanDomain = (raw: string) => {
    let d = raw.trim().toLowerCase();
    d = d.replace(/^https?:\/\//, '');
    d = d.replace(/^www\./, '');
    d = d.replace(/^_for-sale\./, '');
    d = d.split('/')[0];
    return d;
  };

  const handleValidate = async (targetDomain?: string) => {
    const d = cleanDomain(targetDomain || domainInput);
    if (!d || !d.includes('.')) {
      alert('Bitte gib einen gültigen Domainnamen ein (z. B. beispiel.de oder rfc10023.nl).');
      return;
    }

    setLoading(true);
    setResult(null);

    const nodeName = `_for-sale.${d}`;
    let rawTxtRecords: string[] = [];
    let providerUsed = 'Cloudflare 1.1.1.1 DoH';

    try {
      // 1. Attempt via Cloudflare DoH
      const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nodeName)}&type=TXT`;
      const cfRes = await fetch(cfUrl, {
        headers: { Accept: 'application/dns-json' },
      });

      if (cfRes.ok) {
        const data = await cfRes.json();
        if (data.Answer && Array.isArray(data.Answer)) {
          rawTxtRecords = data.Answer
            .filter((a: { type: number }) => a.type === 16)
            .map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
        }
      }

      // 2. Fallback to Google DoH if empty
      if (rawTxtRecords.length === 0) {
        providerUsed = 'Google 8.8.8.8 DoH';
        const googleUrl = `https://dns.google/resolve?name=${encodeURIComponent(nodeName)}&type=TXT`;
        const gRes = await fetch(googleUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.Answer && Array.isArray(gData.Answer)) {
            rawTxtRecords = gData.Answer
              .filter((a: { type: number }) => a.type === 16)
              .map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
          }
        }
      }

      // Analyze records
      if (rawTxtRecords.length === 0) {
        setResult({
          domain: d,
          nodeName,
          status: 'not_found',
          statusMessage: `Kein TXT-Eintrag unter '${nodeName}' gefunden.`,
          rawTxt: [],
          parsed: {},
          warnings: [
            'Es wurde kein _for-sale TXT-Record im globalen DNS propagiert.',
            'Beachte, dass neue DNS-Einträge je nach TTL bis zu 24 Stunden weltweite Propagierung benötigen können.',
          ],
          dnsProvider: providerUsed,
        });
        setLoading(false);
        return;
      }

      // Parse tags
      const combinedRecord = rawTxtRecords.join('; ');
      const parsed: ParsedTags = {};
      const warnings: string[] = [];

      // Split by semicolon
      const parts = combinedRecord.split(';').map((p) => p.trim()).filter(Boolean);

      parts.forEach((part) => {
        const eqIdx = part.indexOf('=');
        if (eqIdx !== -1) {
          const key = part.substring(0, eqIdx).trim().toLowerCase();
          const val = part.substring(eqIdx + 1).trim();
          parsed[key] = val;
        }
      });

      // RFC 10023 Compliance Validation
      let status: 'valid' | 'warning' | 'not_found' = 'valid';

      if (!parsed.v) {
        status = 'warning';
        warnings.push('Fehlender Versions-Tag: Der Record MUSS mit "v=FORSALE1;" beginnen.');
      } else if (parsed.v.toUpperCase() !== 'FORSALE1') {
        status = 'warning';
        warnings.push(`Ungültige Version: '${parsed.v}'. Gültig ist aktuell ausschließlich 'FORSALE1'.`);
      }

      if (!parsed.furi && !parsed.ftxt && !parsed.fval) {
        status = 'warning';
        warnings.push('Der Record enthält keine Inhalts-Tags (furi, fval oder ftxt).');
      }

      if (parsed.fval && !parsed.fval.includes(':') && !/^[A-Z]{3}:\d+/.test(parsed.fval)) {
        warnings.push('Preisangabe (fval): Empfohlenes Format nach ISO 4217 ist WÄHRUNG:BETRAG (z. B. EUR:2500 oder USD:5000).');
      }

      if (parsed.furi && !parsed.furi.startsWith('http://') && !parsed.furi.startsWith('https://') && !parsed.furi.startsWith('mailto:')) {
        warnings.push('Kontakt-URI (furi): Sollte eine vollständige URL (https://...) oder E-Mail (mailto:...) sein.');
      }

      setResult({
        domain: d,
        nodeName,
        status,
        statusMessage: status === 'valid'
          ? 'Valider RFC 10023 DNS-Record erkannt!'
          : 'Record gefunden, aber mit RFC-Syntax-Warnungen.',
        rawTxt: rawTxtRecords,
        parsed,
        warnings,
        dnsProvider: providerUsed,
      });
    } catch (err) {
      setResult({
        domain: d,
        nodeName,
        status: 'error',
        statusMessage: 'Fehler bei der DNS-über-HTTPS-Abfrage.',
        rawTxt: [],
        parsed: {},
        warnings: ['Netzwerk- oder CORS-Blockade beim Anfragen der DoH-Server.', String(err)],
        dnsProvider: providerUsed,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialDomain) {
      handleValidate(initialDomain);
    }
  }, [initialDomain]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm ${embedded ? 'p-4' : 'p-6 sm:p-8'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700">
              Live DNS-over-HTTPS Inspector
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            RFC 10023 DNS-Validator
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-600">
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>RFC Node: _for-sale.[domain]</span>
        </div>
      </div>

      {/* Input Group */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleValidate();
        }}
        className="space-y-4"
      >
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 font-mono text-sm pointer-events-none">
            _for-sale.
          </div>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="beispieldomain.de"
            className="w-full pl-24 pr-32 sm:pr-36 py-4 bg-slate-50 border-2 border-slate-200 focus:border-emerald-500 focus:bg-white focus:outline-none rounded-xl text-slate-900 font-mono text-base sm:text-lg transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-4 sm:px-6 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Prüfe...</span>
              </>
            ) : (
              <>
                <span>Prüfen</span>
                <ArrowRight className="w-4 h-4 text-emerald-400" />
              </>
            )}
          </button>
        </div>

        {/* Quick Test Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold">Beispiel-Domains:</span>
          {['rfc10023.nl', 'forsaledns.net'].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setDomainInput(example);
                handleValidate(example);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {/* Result Card */}
      {result && (
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-6 animate-fadeIn">
          
          {/* Status Badge */}
          <div className={`p-4 sm:p-5 rounded-xl border flex items-start sm:items-center justify-between gap-4 ${
            result.status === 'valid'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : result.status === 'warning'
              ? 'bg-amber-50/80 border-amber-200 text-amber-950'
              : result.status === 'not_found'
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-3">
              {result.status === 'valid' && <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />}
              {result.status === 'warning' && <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />}
              {result.status === 'not_found' && <XCircle className="w-6 h-6 text-slate-500 shrink-0" />}
              {result.status === 'error' && <XCircle className="w-6 h-6 text-rose-600 shrink-0" />}
              <div>
                <h4 className="font-extrabold text-base sm:text-lg">{result.statusMessage}</h4>
                <p className="text-xs font-mono opacity-80 mt-0.5">
                  Abgefragter Knoten: {result.nodeName} ({result.dnsProvider})
                </p>
              </div>
            </div>
            {result.rawTxt.length > 0 && (
              <button
                type="button"
                onClick={() => copyToClipboard(result.rawTxt.join(' '))}
                className="shrink-0 p-2 rounded-lg bg-white/80 hover:bg-white border text-xs font-mono font-medium flex items-center gap-1.5 shadow-xs"
                title="Raw TXT kopieren"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">Kopieren</span>
              </button>
            )}
          </div>

          {/* Parsed Tags Grid */}
          {result.status !== 'not_found' && result.status !== 'error' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              {/* Tag: v */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  v (Version)
                </span>
                <span className="font-mono text-sm font-extrabold text-slate-900">
                  {result.parsed.v || '–'}
                </span>
              </div>

              {/* Tag: fval */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  fval (Preis / Währung)
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-700">
                  {result.parsed.fval || 'Nicht angegeben'}
                </span>
              </div>

              {/* Tag: furi */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  furi (Kontakt / Landingpage)
                </span>
                {result.parsed.furi ? (
                  <a
                    href={result.parsed.furi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{result.parsed.furi}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="font-mono text-sm text-slate-400">Keine URI angegeben</span>
                )}
              </div>

              {/* Tag: ftxt */}
              {result.parsed.ftxt && (
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 sm:col-span-2 lg:col-span-4">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                    ftxt (Freitext / Notiz)
                  </span>
                  <p className="text-sm text-slate-800 italic">&ldquo;{result.parsed.ftxt}&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {/* Warnings list if any */}
          {result.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <strong className="block font-bold text-amber-950">Hinweise zur RFC-Konformität:</strong>
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw TXT Toggle */}
          {result.rawTxt.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1"
              >
                <span>{showRaw ? '[-] Raw DNS-Records ausblenden' : '[+] Raw DNS-Records einblenden'}</span>
              </button>
              {showRaw && (
                <pre className="mt-2 p-3 rounded-lg bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto">
                  {result.rawTxt.map((txt, idx) => `[Record #${idx + 1}] "${txt}"\n`)}
                </pre>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
