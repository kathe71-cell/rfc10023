import React, { useState, useEffect, useRef } from 'react';
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
  ShieldCheck,
  Server,
  Sparkles,
  Activity,
  Cpu,
  ChevronDown,
  ChevronUp,
  Share2,
  FileCode,
  Mail,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cleanDomainInput, detectHosterFromNameservers, HosterProfile } from '../utils/dnsIntelligence';
import { parseRfc10023Records, RfcTagItem } from '../utils/rfcParserEngine';
import { performDomainAudit, DomainHealthAudit } from '../utils/dnsAuditEngine';
import SocialShare from './SocialShare';

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
  nameservers: string[];
  detectedHoster: HosterProfile | null;
  latencyMs: number;
  queryFlags: {
    ad: boolean;
    ra: boolean;
    rd: boolean;
    cd: boolean;
  };
  ttl: number | null;
  audit: DomainHealthAudit | null;
}

interface RfcValidatorProps {
  initialDomain?: string;
  embedded?: boolean;
  autoFocus?: boolean;
}

export default function RfcValidator({ initialDomain = '', embedded = false, autoFocus = false }: RfcValidatorProps) {
  const { t, language } = useLanguage();
  const langPrefix = language === 'en' ? '/en' : '';
  const [searchParams] = useSearchParams();
  const urlDomain = searchParams.get('d') || searchParams.get('domain') || '';
  const effectiveInitial = initialDomain || urlDomain;

  const [domainInput, setDomainInput] = useState(effectiveInitial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [digCopied, setDigCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showDevDetails, setShowDevDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus only when explicitly requested
  useEffect(() => {
    if (autoFocus && inputRef.current && !effectiveInitial) {
      inputRef.current.focus({ preventScroll: true });
    }
  }, [autoFocus, effectiveInitial]);

  // Sync if URL search params or initialDomain change
  useEffect(() => {
    if (effectiveInitial && effectiveInitial !== domainInput) {
      setDomainInput(effectiveInitial);
      handleValidate(effectiveInitial);
    }
  }, [effectiveInitial]);

  const handleValidate = async (targetDomain?: string) => {
    const d = cleanDomainInput(targetDomain || domainInput);
    if (!d || !d.includes('.')) {
      alert(t('val.invalid_domain'));
      return;
    }

    setLoading(true);
    setResult(null);

    const startTime = performance.now();
    const nodeName = `_for-sale.${d}`;
    let rawTxtRecords: string[] = [];
    let isDnssec = false;
    let providerUsed = 'Cloudflare 1.1.1.1 Anycast';
    const nameservers: string[] = [];
    let detectedHoster: HosterProfile | null = null;
    let ttl: number | null = null;
    let flags = { ad: false, ra: true, rd: true, cd: false };

    try {
      // 1. Fetch Authoritative Nameservers
      try {
        const nsRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=NS`,
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
        console.warn('NS query failed', e);
      }

      // 2. Query Leaf Node TXT via Cloudflare DoH
      const cfUrl = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nodeName)}&type=TXT`;
      const cfRes = await fetch(cfUrl, {
        headers: { Accept: 'application/dns-json' },
      });

      if (cfRes.ok) {
        const data = await cfRes.json();
        isDnssec = Boolean(data.AD);
        flags = {
          ad: Boolean(data.AD),
          ra: Boolean(data.RA ?? true),
          rd: Boolean(data.RD ?? true),
          cd: Boolean(data.CD ?? false),
        };
        if (data.Answer && Array.isArray(data.Answer)) {
          const txtAnswers = data.Answer.filter((a: { type: number }) => a.type === 16);
          if (txtAnswers.length > 0 && txtAnswers[0].TTL !== undefined) {
            ttl = txtAnswers[0].TTL;
          }
          rawTxtRecords = txtAnswers.map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
        }
      }

      // 3. Fallback to Google DoH if no records found
      if (rawTxtRecords.length === 0) {
        providerUsed = 'Google 8.8.8.8 Anycast';
        const googleUrl = `https://dns.google/resolve?name=${encodeURIComponent(nodeName)}&type=TXT`;
        const gRes = await fetch(googleUrl);
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData.AD) isDnssec = true;
          flags = {
            ad: Boolean(gData.AD),
            ra: Boolean(gData.RA ?? true),
            rd: Boolean(gData.RD ?? true),
            cd: Boolean(gData.CD ?? false),
          };
          if (gData.Answer && Array.isArray(gData.Answer)) {
            const txtAnswers = gData.Answer.filter((a: { type: number }) => a.type === 16);
            if (txtAnswers.length > 0 && txtAnswers[0].TTL !== undefined) {
              ttl = txtAnswers[0].TTL;
            }
            rawTxtRecords = txtAnswers.map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
          }
        }
      }

      const latencyMs = Math.round(performance.now() - startTime);

      // Determine RFC 10023 status
      let interimStatus: 'valid' | 'warning' | 'not_found' | 'error' = 'not_found';
      let parsedTags: TagItem[] = [];
      let parsedMap: Record<string, string> = {};
      let warnings: string[] = [];
      let statusMessage = '';
      let architecture: 'ietf_multi' | 'single_line' | 'unknown' = 'unknown';
      let architectureLabel = language === 'en' ? 'No Record' : 'Kein Eintrag';

      if (rawTxtRecords.length > 0) {
        const report = parseRfc10023Records(rawTxtRecords, language === 'en' ? 'en' : 'de');
        parsedTags = report.tags.map((t) => ({
          tag: t.tag,
          value: t.value,
          sourceRecordIndex: t.sourceRecordIndex,
        }));
        parsedMap = report.parsedMap;
        warnings = report.warnings;
        interimStatus = report.status;
        statusMessage = interimStatus === 'valid'
          ? (language === 'en' ? 'Valid RFC 10023 sale offer discovered in DNS.' : 'Gültiges RFC 10023 Angebot im DNS gefunden.')
          : (language === 'en' ? 'DNS record found, but exhibits deviations from the IETF standard.' : 'Eintrag im DNS gefunden, weicht aber teilweise vom Standard ab.');
        architecture = report.architecture;
        architectureLabel = report.architectureLabel;
      } else {
        statusMessage = language === 'en'
          ? `No TXT record found under '${nodeName}'.`
          : `Kein TXT-Eintrag unter '${nodeName}' gefunden.`;
        warnings = language === 'en' ? [
          'No resource record currently exists for this node in the global DNS.',
          'Newly published records may take several minutes to propagate depending on authoritative nameserver TTLs.',
        ] : [
          'Im weltweiten DNS existiert derzeit kein Eintrag für diesen Knoten.',
          'Neu angelegte DNS-Einträge können je nach Nameserver einige Minuten bis Stunden für die weltweite Verbreitung benötigen.',
        ];
      }

      // 4. Run Multi-Vector Health & Email Routing Audit
      let auditResult: DomainHealthAudit | null = null;
      try {
        auditResult = await performDomainAudit(d, interimStatus, language === 'en' ? 'en' : 'de');
      } catch (auditErr) {
        console.warn('Audit engine failed', auditErr);
      }

      setResult({
        domain: d,
        nodeName,
        status: interimStatus,
        statusMessage,
        architecture,
        architectureLabel,
        dnssec: isDnssec,
        rawTxt: rawTxtRecords,
        tags: parsedTags,
        parsedMap,
        warnings,
        dnsProvider: providerUsed,
        nameservers,
        detectedHoster,
        latencyMs,
        queryFlags: flags,
        ttl,
        audit: auditResult,
      });
    } catch (err) {
      const latencyMs = Math.round(performance.now() - startTime);
      setResult({
        domain: d,
        nodeName,
        status: 'error',
        statusMessage: language === 'en' ? 'Query failed (Network timeout or DNS resolution error).' : 'Abfrage fehlgeschlagen (Netzwerk- oder DNS-Zeitüberschreitung).',
        architecture: 'unknown',
        architectureLabel: language === 'en' ? 'Error' : 'Fehler',
        dnssec: false,
        rawTxt: [],
        tags: [],
        parsedMap: {},
        warnings: [String(err)],
        dnsProvider: providerUsed,
        nameservers: [],
        detectedHoster: null,
        latencyMs,
        queryFlags: flags,
        ttl: null,
        audit: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyDigCommand = (targetDomain?: string) => {
    const d = cleanDomainInput(targetDomain || domainInput || t('val.placeholder'));
    const cmd = `dig TXT _for-sale.${d} +short`;
    navigator.clipboard.writeText(cmd);
    setDigCopied(true);
    setTimeout(() => setDigCopied(false), 2000);
  };

  const copyJsonResult = () => {
    if (!result) return;
    const jsonStr = JSON.stringify(result, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 2000);
  };

  const copyShareLink = () => {
    if (!result) return;
    const shareUrl = `https://www.rfc10023.de${langPrefix}/validator?d=${encodeURIComponent(result.domain)}`;
    navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className={`w-full bg-white rounded-2xl border border-slate-200 shadow-sm ${embedded ? 'p-4' : 'p-6 sm:p-8'}`}>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              {t('val.badge')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('val.title')}
          </h2>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Terminal className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('val.node_prefix')}</span>
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
            placeholder={t('val.placeholder')}
            className="w-full pl-24 pr-28 sm:pr-40 py-3.5 bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white focus:outline-none rounded-xl text-slate-900 font-mono text-base transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-2 px-4 sm:px-5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-xs rounded-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">{t('val.btn_checking')}</span>
              </>
            ) : (
              <>
                <span>{t('val.btn_check')}</span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">↵</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </>
            )}
          </button>
        </div>

        {/* Quick test buttons & CLI dig shortcut */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-slate-400">{t('val.examples')}</span>
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyDigCommand()}
              title={t('val.dig_title')}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px] font-semibold flex items-center gap-1.5 transition-colors border border-slate-200"
            >
              <Terminal className="w-3 h-3 text-emerald-600" />
              <span>{digCopied ? t('val.dig_copied') : t('val.dig_btn')}</span>
            </button>
            <span className="hidden md:inline-block text-[10px] text-slate-400 font-mono">
              {t('val.esc_hint')}
            </span>
          </div>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 pt-6 border-t border-slate-100 space-y-6">
          
          {/* Action Toolbar (Share link, Copy JSON, Copy dig) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">{result.domain}</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">{result.latencyMs} ms</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyShareLink}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-slate-500" />}
                <span>{linkCopied ? t('val.audit_link_copied') : t('val.audit_share_link')}</span>
              </button>
              <button
                type="button"
                onClick={copyJsonResult}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <FileCode className="w-3.5 h-3.5 text-slate-500" />}
                <span>{jsonCopied ? t('val.audit_json_copied') : t('val.audit_copy_json')}</span>
              </button>
            </div>
          </div>

          {/* Domain Audit & Readiness Hero Index */}
          {result.audit && (
            <div className={`p-5 sm:p-6 rounded-2xl border ${
              result.audit.rating === 'optimal'
                ? 'bg-emerald-50/50 border-emerald-200'
                : result.audit.rating === 'critical'
                ? 'bg-rose-50/50 border-rose-200'
                : result.audit.rating === 'good'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-amber-50/50 border-amber-200'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Score Dial / Badge Indicator */}
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="relative flex items-center justify-center shrink-0 w-20 h-20 rounded-2xl bg-white border border-slate-200 shadow-xs">
                    <svg className="w-18 h-18 -rotate-90 transform" viewBox="0 0 36 36">
                      <path
                        className="text-slate-100"
                        strokeWidth="3.5"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className={
                          result.audit.score >= 80
                            ? 'text-emerald-500 transition-all duration-1000 ease-out'
                            : result.audit.score >= 50
                            ? 'text-amber-500 transition-all duration-1000 ease-out'
                            : 'text-rose-500 transition-all duration-1000 ease-out'
                        }
                        strokeDasharray={`${result.audit.score}, 100`}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-black font-mono text-slate-900 leading-none">
                        {result.audit.score}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase mt-0.5">
                        / 100
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-mono font-bold uppercase tracking-wider text-slate-700 shadow-2xs mb-1.5">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>{t('val.audit_score_label')}</span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                      {result.audit.ratingLabel}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-xl leading-relaxed">
                      {result.audit.summary}
                    </p>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="shrink-0 flex items-center gap-2">
                  <Link
                    to={`${langPrefix}/generator?domain=${encodeURIComponent(result.domain)}`}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{language === 'en' ? 'Optimize Record' : 'Record anpassen'}</span>
                  </Link>
                </div>
              </div>

              {/* Multi-Vector Assessment Checklist */}
              <div className="mt-6 pt-5 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.audit.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500 uppercase truncate">
                        {item.label}
                      </span>
                      {item.status === 'pass' && (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" /> OK
                        </span>
                      )}
                      {item.status === 'warn' && (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 font-mono font-bold text-[10px] flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-700" /> Notice
                        </span>
                      )}
                      {item.status === 'fail' && (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-rose-100 text-rose-950 font-mono font-bold text-[10px] flex items-center gap-1 animate-pulse">
                          <ShieldAlert className="w-3 h-3 text-rose-700" /> Risk
                        </span>
                      )}
                      {item.status === 'info' && (
                        <span className="shrink-0 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-mono font-bold text-[10px] flex items-center gap-1">
                          <Info className="w-3 h-3 text-slate-500" /> Info
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs font-black text-slate-900 truncate">
                      {item.value}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-normal">
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>

            </div>
          )}

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
                      <ShieldCheck className="w-3.5 h-3.5" /> {t('val.dnssec_confirmed')}
                    </span>
                  )}
                  <span>{t('val.architecture_label')} {result.architectureLabel}</span>
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
                <span className="hidden sm:inline">{copied ? t('val.record_copied') : t('val.copy_record')}</span>
              </button>
            )}
          </div>

          {/* Hoster Info Banner */}
          {result.detectedHoster ? (
            <div className="p-4 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    {t('val.detected_hoster')}
                  </div>
                  <div className="text-sm font-bold font-mono text-emerald-400">
                    {result.detectedHoster.name}
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    {result.detectedHoster.instructions}
                  </div>
                </div>
              </div>
              <Link
                to={`${langPrefix}/generator?domain=${encodeURIComponent(result.domain)}`}
                className="shrink-0 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('val.create_for_hoster')}</span>
              </Link>
            </div>
          ) : result.nameservers.length > 0 ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600 flex flex-wrap items-center gap-2">
              <span className="font-bold text-slate-800">Nameserver:</span>
              {result.nameservers.map((ns, idx) => (
                <span key={idx} className="bg-white px-2 py-0.5 rounded border border-slate-200">
                  {ns}
                </span>
              ))}
            </div>
          ) : null}

          {/* Parsed Tag Cards */}
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
                  {t('val.price_label')} (<code className="text-emerald-700 font-bold">fval</code>)
                </span>
                <span className="font-mono text-sm font-black text-emerald-700">
                  {result.parsedMap.fval || t('val.price_empty')}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  {t('val.contact_label')} (<code className="text-emerald-700 font-bold">furi</code>)
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
                  <span className="font-mono text-xs text-slate-400">{t('val.contact_empty')}</span>
                )}
              </div>

              {result.parsedMap.ftxt && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2 lg:col-span-4">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                    {t('val.note_label')} (<code className="text-slate-800 font-bold">ftxt</code>)
                  </span>
                  <p className="text-xs text-slate-800 font-mono italic">
                    &bdquo;{result.parsedMap.ftxt}&ldquo;
                  </p>
                </div>
              )}

            </div>
          )}

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1.5">
              <strong className="block font-bold text-amber-950 font-mono">{t('val.warnings_title')}</strong>
              <ul className="list-disc list-inside space-y-1">
                {result.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Raw RRset & Dev Inspector */}
          <div className="space-y-3 pt-2">
            
            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              {result.rawTxt.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowRaw(!showRaw)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>{showRaw ? t('val.raw_hide') : t('val.raw_show')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowDevDetails(!showDevDetails)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Activity className="w-3.5 h-3.5 text-emerald-600" />
                <span>{showDevDetails ? t('val.inspector_hide') : `${t('val.inspector_show')} (${result.latencyMs} ms)`}</span>
                {showDevDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => copyDigCommand(result.domain)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors ml-auto"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                <span>{digCopied ? t('val.dig_copied') : t('val.dig_btn')}</span>
              </button>
            </div>

            {/* Collapsible Dev Details */}
            {showDevDetails && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    DoH Query Inspector & Response Metrics
                  </span>
                  <span className="text-emerald-400 font-bold">{result.latencyMs} ms RTT</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Resolver:</span>
                    <span className="text-emerald-400 font-bold truncate block">{result.dnsProvider}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">DNSSEC (AD Flag):</span>
                    <span className={result.queryFlags.ad ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {result.queryFlags.ad ? t('val.dnssec_valid') : t('val.dnssec_unsigned')}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Flags (RD / RA):</span>
                    <span className="text-slate-300 font-bold">
                      RD={result.queryFlags.rd ? '1' : '0'} RA={result.queryFlags.ra ? '1' : '0'}
                    </span>
                  </div>
                  <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800/80">
                    <span className="text-slate-500 block text-[10px]">Record TTL:</span>
                    <span className="text-slate-300 font-bold">
                      {result.ttl !== null ? `${result.ttl} ${t('val.seconds')}` : 'n/a'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-[11px] text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/60">
                  <span className="text-slate-400">Terminal Quick-Check:</span>
                  <code className="bg-slate-900 px-2 py-1 rounded text-emerald-300 select-all overflow-x-auto">
                    dig TXT {result.nodeName} +short
                  </code>
                </div>
              </div>
            )}

            {/* Raw TXT Box */}
            {showRaw && result.rawTxt.length > 0 && (
              <div className="p-3.5 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs space-y-1 overflow-x-auto">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider pb-1 border-b border-slate-800 mb-2">
                  {t('val.raw_title')} ({result.rawTxt.length} Records)
                </div>
                {result.rawTxt.map((txt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <span className="text-slate-500 select-none">[{idx + 1}]</span>
                    <span className="text-emerald-400">&quot;{txt}&quot;</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Social Share Result */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl">
            <span className="text-xs text-slate-600 font-mono">
              {t('val.share_title')} <strong>{result.domain}</strong> {t('val.share_end')}
            </span>
            <SocialShare
              url={`https://rfc10023.de${langPrefix}/validator?d=${encodeURIComponent(result.domain)}`}
              title={language === 'en' 
                ? `RFC 10023 Verification Report for ${result.domain} – DNS status: ${result.status === 'valid' ? 'Valid' : 'Audited'}`
                : `RFC 10023 Prüfbericht für ${result.domain} – DNS-Status: ${result.status === 'valid' ? 'Valide hinterlegt' : 'Geprüft'}`}
            />
          </div>
        </div>
      )}

    </div>
  );
}
