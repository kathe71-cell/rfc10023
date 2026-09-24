import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Copy,
  Check,
  Terminal,
  ExternalLink,
  RefreshCw,
  Server,
  Share2,
  FileCode,
  Info,
  Cpu,
  Trash2,
  Clock,
  Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cleanDomainInput, detectHosterFromNameservers, toPunycodeHostname, HosterProfile } from '../utils/dnsIntelligence';
import { parseRfc10023Records, RfcValidationReport, DnsQueryStatus, idnToUnicode } from '../utils/rfcParserEngine';
import { performDomainDiagnostics, DomainDiagnosticsReport } from '../utils/dnsAuditEngine';

interface HistoryEntry {
  domain: string;
  dnsStatus: DnsQueryStatus;
  saleSignalFound: boolean;
  status: 'valid' | 'warning' | 'not_found' | 'nxdomain' | 'error';
  timestamp: string;
}

interface ValidationFullResult {
  domain: string;
  nodeName: string;
  report: RfcValidationReport;
  dnssecAdFlag: boolean;
  nameservers: string[];
  hosterProfile: HosterProfile | null;
  detectedHoster: HosterProfile | null;
  resolver: string;
  ttl: number | null;
  timestamp: string;
  diagnostics: DomainDiagnosticsReport;
  latencyMs: number;
}

interface RfcValidatorProps {
  initialDomain?: string;
  embedded?: boolean;
  autoFocus?: boolean;
}

const LOCAL_STORAGE_KEY = 'rfc10023_recent_domains_v2';

export default function RfcValidator({ initialDomain = '', embedded = false, autoFocus = false }: RfcValidatorProps) {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const langPrefix = isEn ? '/en' : '';
  const [searchParams] = useSearchParams();
  const queryDomain = searchParams.get('d') || searchParams.get('domain') || '';
  const effectiveInitial = cleanDomainInput(queryDomain || initialDomain);

  const [domainInput, setDomainInput] = useState(effectiveInitial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationFullResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [digCopied, setDigCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showWireEscapes, setShowWireEscapes] = useState(false);
  const [recentHistory, setRecentHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const saveToHistory = (entry: HistoryEntry) => {
    try {
      setRecentHistory((prev) => {
        const updated = [entry, ...prev.filter((h) => h.domain !== entry.domain)].slice(0, 5);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    } catch {
      // ignore
    }
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setRecentHistory([]);
    } catch {
      // ignore
    }
  };

  const handleValidate = useCallback(async (targetDomain?: string) => {
    const d = cleanDomainInput(targetDomain || domainInput);
    if (!d || !d.includes('.')) {
      alert(isEn ? 'Please enter a valid domain name (e.g. example.com).' : 'Bitte gib einen gültigen Domainnamen ein (z. B. beispieldomain.de).');
      return;
    }

    setLoading(true);
    setResult(null);

    const startTime = performance.now();
    const punyHost = toPunycodeHostname(d);
    const nodeName = `_for-sale.${punyHost}`;
    let rawTxtRecords: string[] = [];
    let resolverUsed = 'Cloudflare Anycast DoH (1.1.1.1)';
    let dnsStatus: DnsQueryStatus = 'NOERROR';
    const nameservers: string[] = [];
    let detectedHoster: HosterProfile | null = null;
    let ttl: number | null = null;

    try {
      // 1. Fetch Authoritative Nameservers
      try {
        const nsRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(punyHost)}&type=NS`,
          { headers: { Accept: 'application/dns-json' } }
        );
        if (nsRes.ok) {
          const nsData = await nsRes.json();
          if (nsData.Answer && Array.isArray(nsData.Answer)) {
            nsData.Answer.forEach((a: { type: number; data: string }) => {
              if (a.type === 2 && a.data) {
                nameservers.push(a.data.replace(/\.$/, '').toLowerCase());
              }
            });
            detectedHoster = detectHosterFromNameservers(nameservers);
          }
        }
      } catch (e) {
        console.warn('NS query notice', e);
      }

      // 2. Query Leaf Node TXT via Cloudflare DoH
      let cfData: any = null;
      try {
        const cfRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nodeName)}&type=TXT`,
          { headers: { Accept: 'application/dns-json' } }
        );
        if (cfRes.ok) {
          cfData = await cfRes.json();
        }
      } catch {
        // Fallback to Google
      }

      if (cfData) {
        if (cfData.Status === 3) {
          dnsStatus = 'NXDOMAIN';
        } else if (cfData.Status === 2) {
          dnsStatus = 'SERVFAIL';
        } else if (cfData.Status === 0) {
          dnsStatus = cfData.Answer && cfData.Answer.length > 0 ? 'NOERROR' : 'NODATA';
        }

        if (cfData.Answer && Array.isArray(cfData.Answer)) {
          const txtAnswers = cfData.Answer.filter((a: { type: number }) => a.type === 16);
          if (txtAnswers.length > 0 && txtAnswers[0].TTL !== undefined) {
            ttl = txtAnswers[0].TTL;
          }
          rawTxtRecords = txtAnswers.map((a: { data: string }) => a.data);
        }
      } else {
        // Fallback to Google DoH
        resolverUsed = 'Google Public DNS (8.8.8.8)';
        try {
          const gRes = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(nodeName)}&type=TXT`);
          if (gRes.ok) {
            const gData = await gRes.json();
            if (gData.Status === 3) {
              dnsStatus = 'NXDOMAIN';
            } else if (gData.Status === 2) {
              dnsStatus = 'SERVFAIL';
            } else if (gData.Status === 0) {
              dnsStatus = gData.Answer && gData.Answer.length > 0 ? 'NOERROR' : 'NODATA';
            }
            if (gData.Answer && Array.isArray(gData.Answer)) {
              const txtAnswers = gData.Answer.filter((a: { type: number }) => a.type === 16);
              if (txtAnswers.length > 0 && txtAnswers[0].TTL !== undefined) {
                ttl = txtAnswers[0].TTL;
              }
              rawTxtRecords = txtAnswers.map((a: { data: string }) => a.data);
            }
          } else {
            dnsStatus = 'ERROR';
          }
        } catch {
          dnsStatus = 'TIMEOUT';
        }
      }

      const latencyMs = Math.round(performance.now() - startTime);

      // 3. Parse and evaluate records using RFC 10023 engine
      const report = parseRfc10023Records(rawTxtRecords, dnsStatus, isEn ? 'en' : 'de');

      // 4. Run isolated diagnostics (Email & DNSSEC) in parallel
      let diagResult: DomainDiagnosticsReport | null = null;
      try {
        diagResult = await performDomainDiagnostics(d, isEn ? 'en' : 'de');
      } catch (e) {
        console.warn('Diagnostics notice', e);
      }

      const fullResult: ValidationFullResult = {
        domain: d,
        nodeName,
        report,
        dnssecAdFlag: Boolean(cfData?.AD),
        diagnostics: diagResult ?? {
          domain: d,
          timestamp: new Date().toISOString(),
          resolver: resolverUsed,
          items: [],
          mxRecords: [],
          hasNullMx: false,
          hasFallbackA: false,
          aRecords: [],
          aaaaRecords: [],
          spfRecord: null,
          dmarcRecord: null,
          dnssecAdFlag: false,
          dnssecMessage: '',
        },
        hosterProfile: detectedHoster,
        detectedHoster,
        nameservers,
        resolver: resolverUsed,
        ttl,
        timestamp: new Date().toISOString(),
        latencyMs,
      };

      setResult(fullResult);

      saveToHistory({
        domain: d,
        dnsStatus: report.dnsStatus,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: report.status,
        saleSignalFound: report.saleSignalFound,
      });
    } catch {
      const latencyMs = Math.round(performance.now() - startTime);
      const report = parseRfc10023Records([], 'ERROR', isEn ? 'en' : 'de');
      setResult({
        domain: d,
        nodeName,
        report,
        dnssecAdFlag: false,
        diagnostics: {
          domain: d,
          timestamp: new Date().toISOString(),
          resolver: resolverUsed,
          items: [],
          mxRecords: [],
          hasNullMx: false,
          hasFallbackA: false,
          aRecords: [],
          aaaaRecords: [],
          spfRecord: null,
          dmarcRecord: null,
          dnssecAdFlag: false,
          dnssecMessage: '',
        },
        hosterProfile: null,
        detectedHoster: null,
        nameservers: [],
        resolver: resolverUsed,
        ttl: null,
        timestamp: new Date().toISOString(),
        latencyMs,
      });
    } finally {
      setLoading(false);
    }
  }, [domainInput, isEn]);

  useEffect(() => {
    if (autoFocus && inputRef.current && !effectiveInitial) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [autoFocus, effectiveInitial]);

  useEffect(() => {
    if (effectiveInitial) {
      handleValidate(effectiveInitial);
    }
  }, [effectiveInitial, handleValidate]);

  const copyDigCommand = (targetDomain?: string) => {
    const d = cleanDomainInput(targetDomain || domainInput || 'example.com');
    const cmd = `dig TXT _for-sale.${d} +short`;
    navigator.clipboard.writeText(cmd);
    setDigCopied(true);
    setTimeout(() => setDigCopied(false), 2000);
  };

  const copyJsonResult = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const copyShareLink = () => {
    if (!result) return;
    const shareUrl = `${window.location.origin}${langPrefix}/validator?d=${encodeURIComponent(result.domain)}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Safe URI Link rendering with IDN and Homograph Security Protection (RFC 10023 Section 5)
  const renderSafeUri = (uri: string) => {
    const clean = uri.trim();
    const isSafeScheme = clean.startsWith('https://') || clean.startsWith('http://') || clean.startsWith('mailto:') || clean.startsWith('tel:');
    if (!isSafeScheme) {
      return <span className="font-mono text-slate-800 break-all select-all">{clean}</span>;
    }

    const furiItem = result?.report.tags.find((t) => t.tag === 'furi');
    const uLabel = furiItem?.parsedDetails?.uLabel;
    const aLabel = furiItem?.parsedDetails?.aLabel;
    const hasMixedScript = furiItem?.parsedDetails?.hasMixedScript;
    const isIdn = furiItem?.parsedDetails?.isIdn;

    // Display Unicode U-label if available, keeping the href safe
    const displayLabel = uLabel && aLabel ? clean.replace(aLabel, uLabel) : clean;

    return (
      <div className="space-y-1.5">
        <a
          href={clean}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 underline font-mono text-xs break-all font-medium"
        >
          <span>{displayLabel}</span>
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>

        {isIdn && aLabel && (
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-slate-500">
            <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
              Kanonisches A-Label: <strong className="select-all">{aLabel}</strong>
            </span>
          </div>
        )}

        {hasMixedScript && (
          <div className="flex items-center gap-1.5 p-2 rounded bg-amber-50 border border-amber-200 text-[11px] font-mono text-amber-900">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              {isEn
                ? 'Homograph warning: Mixed scripts detected. Verify canonical A-label before navigating.'
                : 'Homograph-Warnung: Gemischte Zeichensätze erkannt. Vor Aufruf kanonisches A-Label prüfen.'}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm ${embedded ? 'p-4' : 'p-6 sm:p-8'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              {isEn ? 'RFC 10023 Validator' : 'RFC 10023 Validator'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {isEn ? 'Inspect DNS For-Sale Status' : 'DNS-Verkaufseintrag prüfen'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            {isEn
              ? 'Real-time DNS query and format validation according to RFC 10023 standards.'
              : 'Echtzeit-Abfrage und Konformitätsprüfung nach RFC-10023-Standard.'}
          </p>
        </div>

        {/* Action badges */}
        <div className="flex items-center gap-2">
          {result && (
            <>
              <button
                type="button"
                onClick={copyShareLink}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                title={isEn ? 'Copy shareable URL' : 'Link zum Teilen kopieren'}
              >
                <Share2 className="w-3.5 h-3.5 text-slate-600" />
                <span>{linkCopied ? (isEn ? 'Copied!' : 'Kopiert!') : (isEn ? 'Share link' : 'Teilen')}</span>
              </button>
              <button
                type="button"
                onClick={copyJsonResult}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
                title={isEn ? 'Export result as JSON' : 'Ergebnis als JSON exportieren'}
              >
                <FileCode className="w-3.5 h-3.5 text-slate-600" />
                <span>{jsonCopied ? (isEn ? 'Copied!' : 'Kopiert!') : 'JSON'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleValidate(); }} className="space-y-3">
        <div className="relative flex items-center">
          <span className="absolute left-4 font-mono text-xs text-slate-400 font-semibold hidden sm:inline select-none">
            _for-sale.
          </span>
          <input
            ref={inputRef}
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setDomainInput('');
                setResult(null);
              }
            }}
            placeholder={isEn ? 'e.g. example.com or forsaledns.net' : 'z. B. beispieldomain.de oder forsaledns.net'}
            className="w-full pl-4 sm:pl-24 pr-28 sm:pr-40 py-3.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none rounded-xl text-slate-900 font-mono text-sm sm:text-base transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-4 sm:px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">Prüfe...</span>
              </>
            ) : (
              <>
                <span>{isEn ? 'Check' : 'Prüfen'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </>
            )}
          </button>
        </div>

        {/* Quick test buttons & CLI dig shortcut */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-slate-400">{isEn ? 'Examples:' : 'Beispiele:'}</span>
            {['forsaledns.net', 'cours-dns.fr', 'example.nl', 'परीक्षा.testdns.nl', 'beispieldomain.de'].map((example) => (
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyDigCommand()}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Terminal className="w-3 h-3 text-emerald-600" />
              <span>{digCopied ? 'Kopiert!' : 'dig Befehl'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Local Storage History */}
      {recentHistory.length > 0 && !result && (
        <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono font-bold text-slate-700 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{isEn ? 'Recently checked domains (stored locally in browser):' : 'Zuletzt geprüfte Domains (nur lokal im Browser gespeichert):'}</span>
            </span>
            <button
              type="button"
              onClick={clearHistory}
              className="text-[11px] font-mono text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
              title={isEn ? 'Clear local history' : 'Lokalen Verlauf löschen'}
            >
              <Trash2 className="w-3 h-3" />
              <span>{isEn ? 'Clear history' : 'Historie leeren'}</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentHistory.map((item) => (
              <button
                key={item.domain}
                type="button"
                onClick={() => {
                  setDomainInput(item.domain);
                  handleValidate(item.domain);
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-xs font-mono flex items-center gap-2 transition-all shadow-2xs"
              >
                <span className={`w-2 h-2 rounded-full ${item.saleSignalFound ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                <span className="font-bold text-slate-800">{item.domain}</span>
                <span className="text-[10px] text-slate-400">({item.timestamp})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Validation Results */}
      {result && (
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
          
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{result.domain}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{result.latencyMs} ms</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{result.resolver}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyShareLink}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>{linkCopied ? 'Kopiert!' : 'Link'}</span>
              </button>
              <button
                type="button"
                onClick={copyJsonResult}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5 text-slate-500" />}
                <span>{jsonCopied ? 'Kopiert!' : 'JSON'}</span>
              </button>
            </div>
          </div>

          {/* 1. Primary Status Banner */}
          <div className={`p-5 rounded-2xl border ${
            result.report.saleSignalFound
              ? result.report.status === 'valid'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
              : result.report.dnsStatus === 'NXDOMAIN'
                ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                : result.report.dnsStatus === 'SERVFAIL' || result.report.dnsStatus === 'TIMEOUT' || result.report.dnsStatus === 'ERROR'
                  ? 'bg-amber-50/80 border-amber-300 text-amber-950'
                  : 'bg-slate-100 border-slate-300 text-slate-900'
          }`}>
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 mt-0.5">
                {result.report.saleSignalFound ? (
                  result.report.status === 'valid' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  )
                ) : result.report.dnsStatus === 'NXDOMAIN' ? (
                  <XCircle className="w-6 h-6 text-rose-600" />
                ) : result.report.dnsStatus === 'SERVFAIL' || result.report.dnsStatus === 'TIMEOUT' ? (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                ) : (
                  <Info className="w-6 h-6 text-slate-500" />
                )}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base sm:text-lg font-black tracking-tight">
                    {result.report.saleSignalFound
                      ? 'Verkaufssignal im DNS aktiv (v=FORSALE1;)'
                      : result.report.dnsStatus === 'NXDOMAIN'
                        ? 'Domain existiert nicht im DNS (NXDOMAIN)'
                        : result.report.dnsStatus === 'SERVFAIL' || result.report.dnsStatus === 'TIMEOUT'
                          ? `DNS-Serverfehler (${result.report.dnsStatus})`
                          : 'Kein Verkaufseintrag im DNS hinterlegt'}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-white/70 border border-current/20">
                    {result.report.architectureLabel}
                  </span>
                </div>
                <p className="text-xs sm:text-sm opacity-90 leading-relaxed font-sans">
                  {result.report.statusMessage}
                </p>
                <div className="text-[11px] font-mono opacity-80 pt-1">
                  DNS-Abfragestatus: <strong>{result.report.dnsStatus}</strong> | Abgefragter Host: <strong>{result.nodeName}</strong> {result.ttl ? `| TTL: ${result.ttl}s` : ''}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Detected RFC 10023 Tags */}
          {result.report.saleSignalFound && (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
              <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 font-mono text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Extrahierte RFC 10023 Datenfelder:</span>
                <span className="text-slate-400 font-normal">{result.report.tags.length} Content-Tags</span>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* fval */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Kaufpreis (fval)
                  </span>
                  {result.report.parsedMap.fval ? (
                    <span className="text-base font-mono font-bold text-slate-950">
                      {result.report.parsedMap.fval}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 italic">Nicht angegeben (z. B. Verhandlungsbasis)</span>
                  )}
                  <p className="text-[11px] text-slate-500">Unverbindliche Richtpreisangabe nach RFC 10023 § 2.2.4.</p>
                </div>

                {/* furi */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Kontakt / Marktplatz (furi)
                  </span>
                  {result.report.parsedMap.furi ? (
                    <div>{renderSafeUri(result.report.parsedMap.furi)}</div>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 italic">Keine URI angegeben</span>
                  )}
                  <p className="text-[11px] text-slate-500">Klickbare URI für Verhandlungen (RFC 3986).</p>
                </div>

                {/* ftxt */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Freitext / Konditionen (ftxt)
                  </span>
                  {result.report.parsedMap.ftxt ? (
                    <span className="text-xs font-mono text-slate-900 block break-words">
                      {result.report.parsedMap.ftxt}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 italic">Keine Notiz hinterlegt</span>
                  )}
                  <p className="text-[11px] text-slate-500">Zusätzliche menschlesbare Verkaufsbedingungen.</p>
                </div>

                {/* fcod */}
                <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                    Registrar-Systemcode (fcod)
                  </span>
                  {result.report.parsedMap.fcod ? (
                    <span className="text-xs font-mono text-slate-900 font-bold block break-all">
                      {result.report.parsedMap.fcod}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-slate-400 italic">Kein Systemcode vorhanden</span>
                  )}
                  <p className="text-[11px] text-slate-500">Maschinenlesbarer Vermittlungscode nach RFC 10023 § 2.2.1.</p>
                </div>

              </div>
            </div>
          )}

          {/* 3. Warnings / Deviations Notice */}
          {result.report.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 text-xs font-mono text-amber-950 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <span>{isEn ? 'Format & syntax notes:' : 'Format- und Syntaxhinweise:'}</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-amber-900">
                {result.report.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 4. Raw Wire DNS Records */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 font-mono text-xs text-slate-300 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center gap-2">
                <span>{isEn ? 'DNS Resource Records (RRset):' : 'DNS-Zonendatei-Antwortsatz (RRset):'}</span>
                {result.report.hasPresentationEscapes && (
                  <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setShowWireEscapes(false)}
                      className={`px-2 py-0.5 rounded transition-colors ${!showWireEscapes ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      UTF-8 (dekodiert)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowWireEscapes(true)}
                      className={`px-2 py-0.5 rounded transition-colors ${showWireEscapes ? 'bg-slate-800 text-amber-400 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
                    >
                      DNS-Wire (\DDD Escapes)
                    </button>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  const recordsToCopy = showWireEscapes ? result.report.rawRecords : result.report.decodedRecords;
                  navigator.clipboard.writeText(recordsToCopy.join('\n'));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="hover:text-white flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? (isEn ? 'Copied!' : 'Kopiert!') : (isEn ? 'Copy TXT' : 'TXT kopieren')}</span>
              </button>
            </div>
            {result.report.rawRecords.length > 0 ? (
              <div className="space-y-1 text-emerald-300">
                {(showWireEscapes ? result.report.rawRecords : result.report.decodedRecords).map((r, idx) => (
                  <div key={idx} className="p-2 rounded bg-slate-900/80 border border-slate-800 break-all select-all">
                    "{r}"
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-500 italic py-2">
                {isEn ? 'No TXT records received on this node name.' : 'Keine TXT-Einträge auf diesem Knotennamen empfangen.'}
              </div>
            )}
          </div>

          {/* 5. Direct Action Links */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to={{
                pathname: `${langPrefix}/generator`,
                search: new URLSearchParams({
                  d: result.domain,
                  ...(result.report.parsedMap.fval ? { fval: result.report.parsedMap.fval } : {}),
                  ...(result.report.parsedMap.furi ? { furi: result.report.parsedMap.furi } : {}),
                  ...(result.report.parsedMap.ftxt ? { ftxt: result.report.parsedMap.ftxt } : {}),
                  ...(result.report.parsedMap.fcod ? { fcod: result.report.parsedMap.fcod } : {}),
                }).toString(),
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>{isEn ? 'Edit this record in the Generator' : 'Diesen Eintrag im Generator anpassen / korrigieren'}</span>
            </Link>

            <Link
              to={{
                pathname: `${langPrefix}/badge-generator`,
                search: new URLSearchParams({ d: result.domain }).toString(),
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono font-semibold text-xs flex items-center gap-2 transition-colors border border-slate-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isEn ? `Create badge for ${result.domain}` : `Badge für ${result.domain} erstellen`}</span>
            </Link>
          </div>

          {/* Ecosystem Context Link on Successful Validation */}
          {(result.report.status === 'valid' || result.report.status === 'warning') && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                {isEn
                  ? 'RFC 10023 is already evaluated by multiple tools and services.'
                  : 'RFC 10023 wird bereits von verschiedenen Tools und Diensten ausgewertet.'}
              </span>
              <Link
                to={isEn ? '/en/ecosystem' : '/oekosystem'}
                className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 hover:underline shrink-0"
              >
                {isEn ? 'View overview →' : 'Übersicht ansehen →'}
              </Link>
            </div>
          )}

          {/* 6. Isolated DNS & Mail Diagnostics (No Fake Scores) */}
          {result.diagnostics && (
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-900 font-mono flex items-center gap-2">
                    <Server className="w-4 h-4 text-slate-600" />
                    <span>Optionale DNS- &amp; Maildiagnose</span>
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Rein informativ dargestellt – hat keinen Einfluss auf die Gültigkeit des RFC 10023 Verkaufs-Signals.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-slate-600 bg-white px-2.5 py-1 rounded border border-slate-200">
                  DNSSEC: {result.diagnostics.dnssecAdFlag ? 'AD-Bit gesetzt' : 'AD-Bit nicht verifiziert'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {result.diagnostics.items.map((diag) => (
                  <div key={diag.id} className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{diag.label}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        diag.status === 'notice' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {diag.value}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-sans">{diag.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Technical Transparency Box */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-[11px] font-mono text-slate-600 space-y-1">
            <div className="font-bold text-slate-700">{isEn ? 'Audit Transparency & Cache Notice:' : 'Audit-Transparenz & Cache-Hinweis:'}</div>
            <div>{isEn ? 'Checked at:' : 'Prüfzeitpunkt:'} {new Date(result.timestamp).toLocaleString(isEn ? 'en-GB' : 'de-DE')} ({isEn ? 'Local' : 'Lokal'})</div>
            <div>{isEn ? 'Anycast resolver used:' : 'Verwendeter Anycast-Resolver:'} {result.resolver}</div>
            <div>{isEn ? 'Hoster heuristic:' : 'Hoster-Heuristik:'} {result.detectedHoster ? result.detectedHoster.name : (isEn ? 'Custom / Own nameservers' : 'Individuell / Eigene Nameserver')}</div>
            {result.nameservers.length > 0 && <div>{isEn ? 'Authoritative nameservers:' : 'Autoritative Nameserver:'} {result.nameservers.join(', ')}</div>}
            <div className="text-slate-500 pt-1">
              {isEn
                ? '* DNS records are subject to TTL caching. Recently changed records may be cached by resolvers for a few minutes to several hours.'
                : '* DNS-Einträge unterliegen TTL-Caching. Kürzlich geänderte Einträge können je nach Resolver einige Minuten bis Stunden Zwischenspeicherung aufweisen.'}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
