import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, AlertTriangle, XCircle, ArrowRight, Copy, Check, Terminal, ExternalLink, RefreshCw, ShieldCheck, Server, Sparkles, Activity, Cpu, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { cleanDomainInput, detectHosterFromNameservers, HosterProfile } from '../utils/dnsIntelligence';
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
}

interface RfcValidatorProps {
  initialDomain?: string;
  embedded?: boolean;
  autoFocus?: boolean;
}

export default function RfcValidator({ initialDomain = '', embedded = false, autoFocus = false }: RfcValidatorProps) {
  const { t, language } = useLanguage();
  const [searchParams] = useSearchParams();
  const urlDomain = searchParams.get('d') || searchParams.get('domain') || '';
  const effectiveInitial = initialDomain || urlDomain;

  const [domainInput, setDomainInput] = useState(effectiveInitial);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [digCopied, setDigCopied] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showDevDetails, setShowDevDetails] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus only when explicitly requested (e.g. dedicated tool view without scrolling)
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
      alert('Bitte geben Sie einen gültigen Domainnamen ein (zum Beispiel forsaledns.net oder beispieldomain.de).');
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

      // No records returned
      if (rawTxtRecords.length === 0) {
        setResult({
          domain: d,
          nodeName,
          status: 'not_found',
          statusMessage: language === 'en'
            ? `No TXT record found under '${nodeName}'.`
            : `Kein TXT-Eintrag unter '${nodeName}' gefunden.`,
          architecture: 'unknown',
          architectureLabel: language === 'en' ? 'No Record' : 'Kein Eintrag',
          dnssec: isDnssec,
          rawTxt: [],
          tags: [],
          parsedMap: {},
          warnings: language === 'en' ? [
            'No resource record currently exists for this node in the global DNS.',
            'Newly published records may take several minutes to propagate depending on authoritative nameserver TTLs.',
          ] : [
            'Im weltweiten DNS existiert derzeit kein Eintrag für diesen Knoten.',
            'Neu angelegte DNS-Einträge können je nach Nameserver einige Minuten bis Stunden für die weltweite Verbreitung benötigen.',
          ],
          dnsProvider: providerUsed,
          nameservers,
          detectedHoster,
          latencyMs,
          queryFlags: flags,
          ttl,
        });
        setLoading(false);
        return;
      }

      // Syntax Analysis
      const parsedTags: TagItem[] = [];
      const parsedMap: Record<string, string> = {};
      const warnings: string[] = [];
      let foundForsaleVersion = false;

      rawTxtRecords.forEach((recordStr, recIdx) => {
        const cleanRec = recordStr.trim();

        if (cleanRec.startsWith('v=FORSALE1;') || cleanRec === 'v=FORSALE1' || cleanRec.startsWith('v=FORSALE1')) {
          foundForsaleVersion = true;
        }

        const segments = cleanRec.split(';').map((s) => s.trim()).filter(Boolean);

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
        ? (language === 'en' ? `Multi-record RRset (${rawTxtRecords.length} TXT lines)` : `Mehrzeiliger Standard-Eintrag (${rawTxtRecords.length} TXT-Zeilen)`)
        : (language === 'en' ? 'Single-line record (1 TXT line)' : 'Einzeiliger Eintrag (1 TXT-Zeile)');

      let status: 'valid' | 'warning' = 'valid';

      if (!foundForsaleVersion) {
        status = 'warning';
        warnings.push(
          language === 'en'
            ? 'Mandatory header "v=FORSALE1;" is missing or misspelled.'
            : 'Der Pflicht-Header "v=FORSALE1;" fehlt oder ist fehlerhaft geschrieben.'
        );
      }

      if (!parsedMap.fval && !parsedMap.furi && !parsedMap.ftxt) {
        status = 'warning';
        warnings.push(
          language === 'en'
            ? 'Record contains neither price (fval), contact URI (furi), nor remarks (ftxt).'
            : 'Der Eintrag enthält weder Preis (fval), Kontakt (furi) noch Notiz (ftxt).'
        );
      }

      if (parsedMap.fval) {
        const val = parsedMap.fval.toUpperCase();
        if (val !== 'VHB' && !/^[A-Z]{3}:?\d+/.test(val)) {
          warnings.push(
            language === 'en'
              ? `Price format "${parsedMap.fval}": RFC 10023 recommends ISO 4217 currency code followed immediately by amount without spaces (e.g. EUR2500 or USD1000).`
              : `Format beim Preis "${parsedMap.fval}": RFC 10023 empfiehlt Währungscode gefolgt vom Betrag ohne Leerzeichen (zum Beispiel EUR2500 oder USD1000).`
          );
        }
      }

      if (parsedMap.furi) {
        if (!parsedMap.furi.startsWith('http://') && !parsedMap.furi.startsWith('https://') && !parsedMap.furi.startsWith('mailto:') && !parsedMap.furi.startsWith('tel:')) {
          warnings.push(
            language === 'en'
              ? `Contact URI "${parsedMap.furi}": Please use a standard URI scheme such as https://, mailto:, or tel:.`
              : `Kontaktadresse "${parsedMap.furi}": Bitte ein gängiges Schema wie https://, mailto: oder tel: verwenden.`
          );
        }
      }

      setResult({
        domain: d,
        nodeName,
        status,
        statusMessage: status === 'valid'
          ? (language === 'en' ? 'Valid RFC 10023 sale offer discovered in DNS.' : 'Gültiges RFC 10023 Angebot im DNS gefunden.')
          : (language === 'en' ? 'DNS record found, but exhibits deviations from the IETF standard.' : 'Eintrag im DNS gefunden, weicht aber teilweise vom Standard ab.'),
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
    const d = cleanDomainInput(targetDomain || domainInput || 'beispieldomain.de');
    const cmd = `dig TXT _for-sale.${d} +short`;
    navigator.clipboard.writeText(cmd);
    setDigCopied(true);
    setTimeout(() => setDigCopied(false), 2000);
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
              title="Kopiert den passenden Terminal-Befehl"
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
                  <span>Aufbau: {result.architectureLabel}</span>
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
                to={`/generator?domain=${encodeURIComponent(result.domain)}`}
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
                  Preis (<code className="text-emerald-700 font-bold">fval</code>)
                </span>
                <span className="font-mono text-sm font-black text-emerald-700">
                  {result.parsedMap.fval || 'Nicht hinterlegt'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2">
                <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                  Kontaktadresse (<code className="text-emerald-700 font-bold">furi</code>)
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
                  <span className="font-mono text-xs text-slate-400">Keine Adresse hinterlegt</span>
                )}
              </div>

              {result.parsedMap.ftxt && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 sm:col-span-2 lg:col-span-4">
                  <span className="text-[11px] font-mono uppercase font-bold text-slate-500 block mb-1">
                    Notiz (<code className="text-slate-800 font-bold">ftxt</code>)
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
              <strong className="block font-bold text-amber-950 font-mono">Hinweise zum Eintrag:</strong>
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
                      {result.queryFlags.ad ? 'true (validiert)' : 'false (unsigniert)'}
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
                      {result.ttl !== null ? `${result.ttl} Sekunden` : 'n/a'}
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
                  Unformatierte DNS TXT Antworten ({result.rawTxt.length} Records)
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
              url={`https://rfc10023.de/validator?d=${encodeURIComponent(result.domain)}`}
              title={`RFC 10023 Prüfbericht für ${result.domain} – DNS-Status: ${result.status === 'valid' ? 'Valide hinterlegt' : 'Geprüft'}`}
            />
          </div>
        </div>
      )}

    </div>
  );
}
