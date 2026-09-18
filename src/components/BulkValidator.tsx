import React, { useState } from 'react';
import { Layers, Play, CheckCircle2, AlertTriangle, XCircle, Download, RefreshCw, ShieldCheck, HelpCircle } from 'lucide-react';
import { cleanDomainInput, detectHosterFromNameservers, sanitizeCsvCell, toPunycodeHostname } from '../utils/dnsIntelligence';
import { parseRfc10023Records, type RfcValidationReport, type DnsQueryStatus } from '../utils/rfcParserEngine';
import { useLanguage } from '../context/LanguageContext';

interface BulkItemResult {
  domain: string;
  status: 'valid' | 'warning' | 'not_found' | 'error' | 'pending';
  dnsStatus: 'NOERROR' | 'NXDOMAIN' | 'NODATA' | 'SERVFAIL' | 'TIMEOUT' | 'ERROR' | 'PENDING';
  fval?: string;
  furi?: string;
  dnssec: boolean;
  hoster: string;
  rawCount: number;
  warnings: string[];
}

function isValidDomainFormat(raw: string): { isValid: boolean; cleaned: string } {
  const cleaned = cleanDomainInput(raw);
  if (
    !cleaned ||
    !cleaned.includes('.') ||
    cleaned.length < 4 ||
    cleaned.includes(' ') ||
    cleaned.startsWith('.') ||
    cleaned.endsWith('.') ||
    cleaned.startsWith('-') ||
    cleaned.endsWith('-')
  ) {
    return { isValid: false, cleaned: raw.trim() };
  }
  return { isValid: true, cleaned };
}

export default function BulkValidator() {
  const { t, language } = useLanguage();
  const [inputText, setInputText] = useState(
    'forsaledns.net\nbeispiel-investor.de\ndomain-portfolio.de'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BulkItemResult[]>([]);
  const [progress, setProgress] = useState(0);

  const startBulkScan = async () => {
    const rawLines = inputText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const lines = Array.from(new Set(rawLines)).slice(0, 30); // Max 30 domains for DoH concurrency & rate limits

    if (lines.length === 0) {
      alert(language === 'en' ? 'Please enter at least one domain name (one domain per line).' : 'Bitte gib mindestens einen Domainnamen ein (eine Domain pro Zeile).');
      return;
    }

    setIsRunning(true);
    setProgress(0);

    const queue: { domain: string; index: number }[] = [];
    let completed = 0;

    const initialList: BulkItemResult[] = lines.map((rawLine, index) => {
      const { isValid, cleaned } = isValidDomainFormat(rawLine);
      if (!isValid) {
        completed++;
        return {
          domain: rawLine,
          status: 'error',
          dnsStatus: 'ERROR',
          dnssec: false,
          hoster: '-',
          rawCount: 0,
          warnings: [language === 'en' ? 'Invalid domain format' : 'Ungültiges Domainformat'],
        };
      }
      queue.push({ domain: cleaned, index });
      return {
        domain: cleaned,
        status: 'pending',
        dnsStatus: 'PENDING',
        dnssec: false,
        hoster: language === 'en' ? 'Resolving...' : 'Ermittle...',
        rawCount: 0,
        warnings: [],
      };
    });

    setResults(initialList);
    setProgress(lines.length > 0 ? Math.round((completed / lines.length) * 100) : 0);

    const updatedList = [...initialList];

    // Concurrency throttle: process in batches of 3
    const CONCURRENCY = 3;

    async function processItem(item: { domain: string; index: number }) {
      const d = item.domain;
      const punyHost = toPunycodeHostname(d);
      const nodeName = `_for-sale.${punyHost}`;
      let detectedHoster = 'Standard DNS';
      let isDnssec = false;

      try {
        // Run NS and TXT lookup in parallel with 6s timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const [cfRes, nsRes] = await Promise.allSettled([
          fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nodeName)}&type=TXT`, {
            headers: { Accept: 'application/dns-json' },
            signal: controller.signal,
          }),
          fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(punyHost)}&type=NS`, {
            headers: { Accept: 'application/dns-json' },
            signal: controller.signal,
          }),
        ]);

        clearTimeout(timeoutId);

        // Process Nameservers
        if (nsRes.status === 'fulfilled' && nsRes.value.ok) {
          try {
            const nsData = await nsRes.value.json();
            if (nsData.Answer && Array.isArray(nsData.Answer)) {
              const nsList = nsData.Answer
                .filter((a: { type: number }) => a.type === 2)
                .map((a: { data: string }) => a.data);
              const hosterProfile = detectHosterFromNameservers(nsList);
              if (hosterProfile) {
                detectedHoster = hosterProfile.name;
              }
            }
          } catch {}
        }

        // Process TXT record with standard parser engine
        if (cfRes.status === 'fulfilled') {
          if (!cfRes.value.ok) {
            updatedList[item.index] = {
              domain: d,
              status: 'error',
              dnsStatus: 'ERROR',
              dnssec: false,
              hoster: detectedHoster,
              rawCount: 0,
              warnings: [`HTTP ${cfRes.value.status}`],
            };
          } else {
            const cfData = await cfRes.value.json();
            if (cfData.AD) isDnssec = true;

            const rcode = cfData.Status ?? 0;
            let rawRecords: string[] = [];

            if (cfData.Answer && Array.isArray(cfData.Answer)) {
              rawRecords = cfData.Answer
                .filter((a: { type: number }) => a.type === 16)
                .map((a: { data: string }) => {
                  let str = a.data.trim();
                  if (str.startsWith('"') && str.endsWith('"')) {
                    str = str.slice(1, -1);
                  }
                  return str.replace(/\\"/g, '"');
                });
            }

            let dnsQueryStatus: DnsQueryStatus = 'NOERROR';
            if (rcode === 3) dnsQueryStatus = 'NXDOMAIN';
            else if (rcode === 2) dnsQueryStatus = 'SERVFAIL';
            else if (rawRecords.length === 0) dnsQueryStatus = 'NODATA';

            const parsed: RfcValidationReport = parseRfc10023Records(rawRecords, dnsQueryStatus, language === 'en' ? 'en' : 'de');

            let displayStatus: BulkItemResult['status'] = 'not_found';
            if (parsed.dnsStatus === 'NXDOMAIN' || parsed.dnsStatus === 'NODATA') {
              displayStatus = 'not_found';
            } else if (parsed.dnsStatus === 'SERVFAIL' || parsed.dnsStatus === 'ERROR' || parsed.dnsStatus === 'TIMEOUT') {
              displayStatus = 'error';
            } else if (parsed.saleSignalFound) {
              displayStatus = parsed.status === 'valid' ? 'valid' : 'warning';
            }

            updatedList[item.index] = {
              domain: d,
              status: displayStatus,
              dnsStatus: parsed.dnsStatus,
              fval: parsed.parsedMap.fval,
              furi: parsed.parsedMap.furi,
              dnssec: isDnssec,
              hoster: detectedHoster,
              rawCount: rawRecords.length,
              warnings: parsed.warnings,
            };
          }
        } else {
          // Promise rejected (e.g. timeout / abort)
          updatedList[item.index] = {
            domain: d,
            status: 'error',
            dnsStatus: 'TIMEOUT',
            dnssec: false,
            hoster: detectedHoster,
            rawCount: 0,
            warnings: ['Timeout or network unreachable'],
          };
        }
      } catch (err: unknown) {
        updatedList[item.index] = {
          domain: d,
          status: 'error',
          dnsStatus: 'ERROR',
          dnssec: false,
          hoster: detectedHoster,
          rawCount: 0,
          warnings: [err instanceof Error ? err.message : 'Unknown error'],
        };
      }

      completed++;
      setProgress(Math.round((completed / lines.length) * 100));
      setResults([...updatedList]);
    }

    // Worker pool execution
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, async () => {
      while (queue.length > 0) {
        const item = queue.shift();
        if (item) {
          await processItem(item);
        }
      }
    });

    await Promise.all(workers);
    setIsRunning(false);
  };

  const exportCsv = () => {
    const header = language === 'en'
      ? 'Domain;Status;DNS Status;Price (fval);Contact (furi);DNSSEC (AD);Hoster;Record Count\n'
      : 'Domain;Status;DNS-Status;Preis (fval);Kontakt (furi);DNSSEC (AD);Hoster;Anzahl Records\n';
    
    const rows = results
      .map((r) => {
        const d = sanitizeCsvCell(r.domain);
        const st = sanitizeCsvCell(r.status);
        const dnsSt = sanitizeCsvCell(r.dnsStatus);
        const fval = sanitizeCsvCell(r.fval || '');
        const furi = sanitizeCsvCell(r.furi || '');
        const dnssecStr = sanitizeCsvCell(
          r.status === 'error' && r.hoster === '-'
            ? '-'
            : r.dnssec
            ? (language === 'en' ? 'YES (AD)' : 'JA (AD)')
            : (language === 'en' ? 'Not validated (AD=0)' : 'Nicht validiert (AD=0)')
        );
        const hoster = sanitizeCsvCell(r.hoster);
        const count = sanitizeCsvCell(r.rawCount);
        return `"${d}";"${st}";"${dnsSt}";"${fval}";"${furi}";"${dnssecStr}";"${hoster}";"${count}"`;
      })
      .join('\n');

    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rfc10023_bulk_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500">
              {t('bulk.subbadge')}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {t('bulk.title')}
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          {t('bulk.limit_badge')}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            {t('bulk.label_input')}
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isRunning}
            placeholder={t('bulk.placeholder')}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-mono focus:bg-white focus:outline-none focus:border-slate-900 leading-relaxed"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={startBulkScan}
            disabled={isRunning}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                <span>{t('bulk.btn_scanning')} ({progress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                <span>{t('bulk.btn_start')}</span>
              </>
            )}
          </button>

          {results.length > 0 && !isRunning && (
            <button
              type="button"
              onClick={exportCsv}
              className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-mono font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-700" />
              <span>{t('bulk.btn_export')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="bg-emerald-600 h-2 transition-all duration-300 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* Results Table */}
      {results.length > 0 && (
        <div className="mt-6 border border-slate-200 rounded-xl overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-bold">
              <tr>
                <th className="px-4 py-3">{t('bulk.col_domain')}</th>
                <th className="px-4 py-3">{t('bulk.col_status')}</th>
                <th className="px-4 py-3">{t('bulk.col_price')}</th>
                <th className="px-4 py-3">{t('bulk.col_contact')}</th>
                <th className="px-4 py-3">{t('bulk.col_hoster')}</th>
                <th className="px-4 py-3">{t('bulk.col_dnssec')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    {r.status === 'error' && r.warnings.some(w => w.includes('Domainformat') || w.includes('domain format')) ? (
                      <span className="text-slate-700">{r.domain}</span>
                    ) : (
                      <a
                        href={`${language === 'en' ? '/en' : ''}/validator?d=${encodeURIComponent(r.domain)}`}
                        className="hover:text-emerald-600 underline decoration-slate-300"
                      >
                        {r.domain}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {r.status === 'valid' && (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> {t('bulk.status_valid')}
                        </span>
                      )}
                      {r.status === 'warning' && (
                        <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">
                          <AlertTriangle className="w-3.5 h-3.5" /> {t('bulk.status_syntax')}
                        </span>
                      )}
                      {r.status === 'not_found' && (
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">{t('bulk.status_not_found')}</span>
                      )}
                      {r.status === 'pending' && (
                        <span className="text-slate-400 animate-pulse">{t('bulk.status_pending')}</span>
                      )}
                      {r.status === 'error' && (
                        <span className="text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded">{t('bulk.status_error')}</span>
                      )}
                      {r.status === 'error' && r.warnings.length > 0 && (
                        <span className="text-[10px] text-rose-500 font-mono">
                          {r.warnings[0]}
                        </span>
                      )}
                      {r.dnsStatus !== 'PENDING' && !r.warnings.some(w => w.includes('Domainformat') || w.includes('domain format')) && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          DNS: {r.dnsStatus}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-emerald-700 font-bold">{r.fval || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-600" title={r.furi}>
                    {r.furi || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.hoster}</td>
                  <td className="px-4 py-3">
                    {r.status === 'error' && r.hoster === '-' ? (
                      <span className="text-slate-400">-</span>
                    ) : r.dnssec ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> {t('bulk.dnssec_yes')}
                      </span>
                    ) : (
                      <span
                        className="text-slate-500 flex items-center gap-1"
                        title={language === 'en' ? 'DoH resolver response without Authenticated Data flag (AD=0)' : 'Resolver-Antwort ohne Authenticated-Data-Flag (AD=0)'}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        {t('bulk.dnssec_no')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
