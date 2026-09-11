import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Copy, Check, Terminal, ExternalLink, RefreshCw, ShieldCheck } from 'lucide-react';

interface TagItem {
  tag: string;
  value: string;
  sourceRecordIndex: number;
}

interface ValidationResult {
  domain: string;
  nodeName: string;
  status: 'valid' | 'warning' | 'not_found' | 'error';
  statusMessage: string;
  architecture: 'ietf_multi' | 'single_line' | 'unknown';
  architectureLabel: string;
  dnssec: boolean;
  rawTxt: string[];
  tags: TagItem[];
  parsedMap: Record<string, string>;
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
      alert('Bitte gib einen gültigen Domainnamen ein (z. B. forsaledns.net oder beispiel.de).');
      return;
    }

    setLoading(true);
    setResult(null);

    const nodeName = `_for-sale.${d}`;
    let rawTxtRecords: string[] = [];
    let isDnssec = false;
    let providerUsed = 'Cloudflare 1.1.1.1 Anycast DoH';

    try {
      // 1. Query Cloudflare DoH
      const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nodeName)}&type=TXT`;
      const cfRes = await fetch(cfUrl, {
        headers: { Accept: 'application/dns-json' },
      });

      if (cfRes.ok) {
        const data = await cfRes.json();
        isDnssec = Boolean(data.AD); // Authentic Data flag indicates DNSSEC validation
        if (data.Answer && Array.isArray(data.Answer)) {
          rawTxtRecords = data.Answer
            .filter((a: { type: number }) => a.type === 16)
            .map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
        }
      }

      // 2. Fallback to Google DoH if no records found
      if (rawTxtRecords.length === 0) {
        providerUsed = 'Google 8.8.8.8 Anycast DoH';
        const googleUrl = `https://dns.google/resolve?name=${encodeURIComponent(nodeName)}&type=TXT`;
        const gRes = await fetch(googleUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.AD) isDnssec = true;
          if (gData.Answer && Array.isArray(gData.Answer)) {
            rawTxtRecords = gData.Answer
              .filter((a: { type: number }) => a.type === 16)
              .map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
          }
        }
      }

      // No records returned
      if (rawTxtRecords.length === 0) {
        setResult({
          domain: d,
          nodeName,
          status: 'not_found',
          statusMessage: `Kein TXT-Eintrag unter '${nodeName}' hinterlegt.`,
          architecture: 'unknown',
          architectureLabel: 'Kein Eintrag',
          dnssec: false,
          rawTxt: [],
          tags: [],
          parsedMap: {},
          warnings: [
            'Im weltweiten DNS existiert derzeit kein RRset für diesen Leaf-Node.',
            'Neu eingerichtete DNS-Einträge können je nach Nameserver-TTL einige Minuten bis Stunden für die globale Propagierung benötigen.',
          ],
          dnsProvider: providerUsed,
        });
        setLoading(false);
        return;
      }

      // RFC 10023 Deep Syntax Analysis
      const parsedTags: TagItem[] = [];
      const parsedMap: Record<string, string> = {};
      const warnings: string[] = [];
      let foundForsaleVersion = false;
      let multiRecordCount = 0;

      rawTxtRecords.forEach((recordStr, recIdx) => {
        const cleanRec = recordStr.trim();

        // Check if starts with v=FORSALE1; or v=FORSALE1
        if (cleanRec.startsWith('v=FORSALE1;') || cleanRec === 'v=FORSALE1' || cleanRec.startsWith('v=FORSALE1')) {
          foundForsaleVersion = true;
        }

        // Split tags by semicolon
        const segments = cleanRec.split(';').map((s) => s.trim()).filter(Boolean);

        if (segments.length > 2) {
          // More than version tag + 1 content tag in a single record
          // (RFC 10023 Section 2.1 recommends max 1 content tag per record)
        } else if (segments.length > 0) {
          multiRecordCount++;
        }

        segments.forEach((seg) => {
          const eqIdx = seg.indexOf('=');
          if (eqIdx !== -1) {
            const key = seg.substring(0, eqIdx).trim().toLowerCase();
            const val = seg.substring(eqIdx + 1).trim();
            parsedTags.push({ tag: key, value: val, sourceRecordIndex: recIdx });
            if (!parsedMap[key]) {
              parsedMap[key] = val;
            }
          }
        });
      });

      const isMulti = rawTxtRecords.length > 1;
      const architecture: 'ietf_multi' | 'single_line' | 'unknown' = isMulti ? 'ietf_multi' : 'single_line';
      const architectureLabel = isMulti
        ? `IETF RFC 10023 Multi-Record RRset (${rawTxtRecords.length} TXT Records)`
        : 'Single-Line Kompakt-Record (1 TXT Record)';

      let status: 'valid' | 'warning' = 'valid';

      if (!foundForsaleVersion) {
        status = 'warning';
        warnings.push('Der Versionsheader "v=FORSALE1;" fehlt oder ist ungültig.');
      }

      if (!parsedMap.fval && !parsedMap.furi && !parsedMap.ftxt) {
        status = 'warning';
        warnings.push('Das RRset enthält keine Verkaufs-Tags (weder fval, furi noch ftxt).');
      }

      if (parsedMap.fval) {
        // Test currency format: e.g. EUR2500, USD1000 or EUR:2500 or VHB
        const val = parsedMap.fval.toUpperCase();
        if (val !== 'VHB' && !/^[A-Z]{3}:?\d+/.test(val)) {
          warnings.push(`Preisformat "${parsedMap.fval}": IETF RFC 10023 empfiehlt Währungscode + Betrag ohne Leerzeichen (z. B. EUR2500 oder USD1000).`);
        }
      }

      if (parsedMap.furi) {
        if (!parsedMap.furi.startsWith('http://') && !parsedMap.furi.startsWith('https://') && !parsedMap.furi.startsWith('mailto:') && !parsedMap.furi.startsWith('tel:')) {
          warnings.push(`Kontakt-URI "${parsedMap.furi}": Sollte ein standardisiertes Schema nutzen (https://, mailto: oder tel:).`);
        }
      }

      setResult({
        domain: d,
        nodeName,
        status,
        statusMessage: status === 'valid'
          ? 'Gültiges RFC 10023 Verkaufs-Signal im DNS verifiziert!'
          : 'Record im DNS gefunden, entspricht jedoch nicht vollständig dem RFC-Standard.',
        architecture,
        architectureLabel,
        dnssec: isDnssec,
        rawTxt: rawTxtRecords,
        tags: parsedTags,
        parsedMap,
        warnings,
        dnsProvider: providerUsed,
      });
    } catch (err) {
      setResult({
        domain: d,
        nodeName,
        status: 'error',
        statusMessage: 'DoH-Anfrage fehlgeschlagen (Netzwerk- oder DNS-Timeout).',
        architecture: 'unknown',
        architectureLabel: 'Fehler',
        dnssec: false,
        rawTxt: [],
        tags: [],
        parsedMap: {},
        warnings: [String(err)],
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Live DNS-over-HTTPS Inspector
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            RFC 10023 DoH-Validator
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>Knoten: _for-sale.[domain]</span>
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleValidate();
        }}
        className="space-y-4"
      >
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 font-mono text-sm pointer-events-none select-none">
            _for-sale.
          </div>
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="beispieldomain.de"
            className="w-full pl-24 pr-28 sm:pr-36 py-3.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none rounded-xl text-slate-900 font-mono text-base transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-4 sm:px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Abfrage...</span>
              </>
            ) : (
              <>
                <span>Prüfen</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </>
            )}
          </button>
        </div>

        {/* Quick test buttons */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-mono">Referenz-Domains:</span>
          {['forsaledns.net', 'meinedomain.de'].map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => {
                setDomainInput(example);
                handleValidate(example);
              }}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-medium transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
          
          {/* Status Alert */}
          <div className={`p-4 sm:p-5 rounded-xl border flex items-start sm:items-center justify-between gap-4 ${
            result.status === 'valid'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : result.status === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : result.status === 'not_found'
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-start gap-3">
              {result.status === 'valid' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {result.status === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />}
              {result.status === 'not_found' && <XCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />}
              {result.status === 'error' && <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">{result.statusMessage}</h4>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono opacity-80 mt-1">
                  <span>Resolver: {result.dnsProvider}</span>
                  {result.dnssec && (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> DNSSEC Validiert
                    </span>
                  )}
                  <span>Format: {result.architectureLabel}</span>
                </div>
              </div>
            </div>

            {result.rawTxt.length > 0 && (
              <button
                type="button"
                onClick={() => copyToClipboard(result.rawTxt.join('\n'))}
                className="shrink-0 p-2 rounded-lg bg-white border border-slate-200 text-xs font-mono font-semibold flex items-center gap-1.5 shadow-2xs hover:bg-slate-50"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">RRset Kopieren</span>
              </button>
            )}
          </div>

          {/* Parsed Tag Breakdown Cards */}
          {result.status !== 'not_found' && result.status !== 'error' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  Version (<code className="text-slate-800 font-bold">v</code>)
                </span>
                <span className="font-mono text-sm font-black text-slate-900">
                  {result.parsedMap.v || 'FORSALE1'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  Preis / Kondition (<code className="text-emerald-700 font-bold">fval</code>)
                </span>
                <span className="font-mono text-sm font-black text-emerald-700">
                  {result.parsedMap.fval || 'Nicht hinterlegt'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  Kontakt-Link (<code className="text-emerald-700 font-bold">furi</code>)
                </span>
                {result.parsedMap.furi ? (
                  <a
                    href={result.parsedMap.furi}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-blue-600 hover:underline flex items-center gap-1 truncate"
                  >
                    <span className="truncate">{result.parsedMap.furi}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="font-mono text-xs text-slate-400">Keine URI hinterlegt</span>
                )}
              </div>

              {result.parsedMap.ftxt && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2 lg:col-span-4">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                    Notiz / Freitext (<code className="text-slate-800 font-bold">ftxt</code>)
                  </span>
                  <p className="text-xs text-slate-800 font-mono italic">
                    &bdquo;{result.parsedMap.ftxt}&ldquo;
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Warnings list if any */}
          {result.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <strong className="block font-bold text-amber-950 font-mono">RFC 10023 Konformitäts-Diagnose:</strong>
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw RRset Viewer */}
          {result.rawTxt.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowRaw(!showRaw)}
                className="text-xs font-mono font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <span>{showRaw ? '[-] DNS Resource Records verbergen' : '[+] DNS Resource Records anzeigen (Raw TXT)'}</span>
              </button>
              {showRaw && (
                <div className="mt-2 p-3.5 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs space-y-1 overflow-x-auto">
                  {result.rawTxt.map((txt, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-500 select-none">[{idx + 1}]</span>
                      <span className="text-emerald-400">&quot;{txt}&quot;</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
}
