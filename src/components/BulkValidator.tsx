import React, { useState } from 'react';
import { Layers, Play, CheckCircle2, AlertTriangle, XCircle, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { cleanDomainInput, detectHosterFromNameservers } from '../utils/dnsIntelligence';

interface BulkItemResult {
  domain: string;
  status: 'valid' | 'warning' | 'not_found' | 'error' | 'pending';
  fval?: string;
  furi?: string;
  dnssec: boolean;
  hoster: string;
  rawCount: number;
}

export default function BulkValidator() {
  const [inputText, setInputText] = useState(
    'forsaledns.net\nbeispiel-investor.de\ndomain-portfolio.de'
  );
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<BulkItemResult[]>([]);
  const [progress, setProgress] = useState(0);

  const startBulkScan = async () => {
    const rawLines = inputText
      .split('\n')
      .map((l) => cleanDomainInput(l))
      .filter((d) => d.includes('.') && d.length > 3);

    const domains = Array.from(new Set(rawLines)).slice(0, 30); // Max 30 domains for fast DoH execution

    if (domains.length === 0) {
      alert('Bitte gib mindestens einen gültigen Domainnamen ein (eine Domain pro Zeile).');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    const initialList: BulkItemResult[] = domains.map((d) => ({
      domain: d,
      status: 'pending',
      dnssec: false,
      hoster: 'Ermittle...',
      rawCount: 0,
    }));
    setResults(initialList);

    const updatedList = [...initialList];

    for (let i = 0; i < domains.length; i++) {
      const d = domains[i];
      const nodeName = `_for-sale.${d}`;

      try {
        // Query TXT via Cloudflare DoH
        const cfRes = await fetch(
          `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(nodeName)}&type=TXT`,
          { headers: { Accept: 'application/dns-json' } }
        );

        let records: string[] = [];
        let isDnssec = false;

        if (cfRes.ok) {
          const data = await cfRes.json();
          if (data.AD) isDnssec = true;
          if (data.Answer && Array.isArray(data.Answer)) {
            records = data.Answer
              .filter((a: { type: number }) => a.type === 16)
              .map((a: { data: string }) => a.data.replace(/^"|"$/g, ''));
          }
        }

        // Check Nameservers
        let detectedHoster = 'Standard DNS';
        try {
          const nsRes = await fetch(
            `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(d)}&type=NS`,
            { headers: { Accept: 'application/dns-json' } }
          );
          if (nsRes.ok) {
            const nsData = await nsRes.json();
            if (nsData.Answer && Array.isArray(nsData.Answer)) {
              const nsList = nsData.Answer
                .filter((a: { type: number }) => a.type === 2)
                .map((a: { data: string }) => a.data);
              const hosterProfile = detectHosterFromNameservers(nsList);
              if (hosterProfile) {
                detectedHoster = hosterProfile.name;
              }
            }
          }
        } catch {}

        if (records.length === 0) {
          updatedList[i] = {
            domain: d,
            status: 'not_found',
            dnssec: isDnssec,
            hoster: detectedHoster,
            rawCount: 0,
          };
        } else {
          // Parse tags
          let fval = '';
          let furi = '';
          let hasVersion = false;

          records.forEach((rec) => {
            rec.split(';').forEach((part) => {
              const eq = part.indexOf('=');
              if (eq !== -1) {
                const k = part.substring(0, eq).trim().toLowerCase();
                const v = part.substring(eq + 1).trim();
                if (k === 'v' && v.toUpperCase() === 'FORSALE1') hasVersion = true;
                if (k === 'fval') fval = v;
                if (k === 'furi') furi = v;
              }
            });
          });

          updatedList[i] = {
            domain: d,
            status: hasVersion ? 'valid' : 'warning',
            fval: fval || '-',
            furi: furi || '-',
            dnssec: isDnssec,
            hoster: detectedHoster,
            rawCount: records.length,
          };
        }
      } catch {
        updatedList[i] = {
          domain: d,
          status: 'error',
          dnssec: false,
          hoster: 'Fehler',
          rawCount: 0,
        };
      }

      setProgress(Math.round(((i + 1) / domains.length) * 100));
      setResults([...updatedList]);
    }

    setIsRunning(false);
  };

  const exportCsv = () => {
    const header = 'Domain;Status;Preis (fval);Kontakt (furi);DNSSEC;Hoster;Anzahl Records\n';
    const rows = results
      .map(
        (r) =>
          `"${r.domain}";"${r.status}";"${r.fval || ''}";"${r.furi || ''}";"${r.dnssec ? 'JA' : 'NEIN'}";"${r.hoster}";"${r.rawCount}"`
      )
      .join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
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
              Multi-Domain Portfolio Auditor
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Portfolio Bulk-Scanner
          </h2>
        </div>
        <div className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          Bis zu 30 Domains parallel
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 mb-1.5">
            Domains einfügen (Eine Domain pro Zeile):
          </label>
          <textarea
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isRunning}
            placeholder="domain1.de&#10;domain2.at&#10;domain3.ch"
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
                <span>Prüfe Portfolio ({progress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-emerald-400" />
                <span>Bulk-Scan starten</span>
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
              <span>Ergebnisse als CSV exportieren</span>
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
                <th className="px-4 py-3">Domain</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Preis (fval)</th>
                <th className="px-4 py-3">Kontakt (furi)</th>
                <th className="px-4 py-3">Hoster</th>
                <th className="px-4 py-3">DNSSEC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-bold text-slate-900">
                    <a
                      href={`/validator?d=${encodeURIComponent(r.domain)}`}
                      className="hover:text-emerald-600 underline decoration-slate-300"
                    >
                      {r.domain}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === 'valid' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Valide
                      </span>
                    )}
                    {r.status === 'warning' && (
                      <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-50 px-2 py-0.5 rounded font-bold">
                        <AlertTriangle className="w-3.5 h-3.5" /> Syntax
                      </span>
                    )}
                    {r.status === 'not_found' && (
                      <span className="text-slate-400">Kein Record</span>
                    )}
                    {r.status === 'pending' && (
                      <span className="text-slate-400 animate-pulse">Abfrage...</span>
                    )}
                    {r.status === 'error' && (
                      <span className="text-rose-600 font-bold">Fehler</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-emerald-700 font-bold">{r.fval || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate text-slate-600" title={r.furi}>
                    {r.furi || '-'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{r.hoster}</td>
                  <td className="px-4 py-3">
                    {r.dnssec ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> JA
                      </span>
                    ) : (
                      <span className="text-slate-400">Nein</span>
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
