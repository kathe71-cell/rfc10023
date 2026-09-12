import React, { useState } from 'react';
import { Terminal, Copy, Check, ExternalLink, Code2, ShieldCheck, Zap } from 'lucide-react';

export default function ApiDocsPage() {
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [testDomain, setTestDomain] = useState('forsaledns.net');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const curlSnippet = `curl -s "https://rfc10023.de/api/lookup?d=${testDomain}"`;

  const runLiveTest = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lookup?d=${encodeURIComponent(testDomain)}`);
      const json = await res.json();
      setApiResponse(json);
    } catch (e) {
      setApiResponse({ error: 'Lookup failed', details: String(e) });
    } finally {
      setLoading(false);
    }
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-900 text-emerald-400 font-mono text-xs font-semibold">
          <Terminal className="w-3.5 h-3.5" />
          <span>REST-API Dokumentation</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Kostenfreie Schnittstelle für RFC 10023
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          Für Entwickler, Registrare und Skripte: Fragen Sie beliebige Domains 
          über unsere DNS-Infrastruktur ab und erhalten Sie ein klares JSON-Objekt mit 
          allen Tags, Nameservern und dem DNSSEC-Status.
        </p>
      </div>

      {/* Endpoint Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
              GET
            </span>
            <code className="text-sm sm:text-base font-mono font-bold text-slate-900">
              https://rfc10023.de/api/lookup?d=&#123;domain&#125;
            </code>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>CORS aktiv</span>
            <span>•</span>
            <span>Keine Registrierung</span>
            <span>•</span>
            <span>Anycast DNS</span>
          </div>
        </div>

        {/* Parameters */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            Parameter der Abfrage
          </h3>
          <div className="border border-slate-200 rounded-xl overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="px-4 py-2.5">Parameter</th>
                  <th className="px-4 py-2.5">Typ</th>
                  <th className="px-4 py-2.5">Pflicht</th>
                  <th className="px-4 py-2.5">Beschreibung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="px-4 py-2.5 font-bold text-slate-900">d <span className="font-normal text-slate-400">oder</span> domain</td>
                  <td className="px-4 py-2.5 text-slate-600">string</td>
                  <td className="px-4 py-2.5 text-emerald-700 font-bold">Ja</td>
                  <td className="px-4 py-2.5 text-slate-600">Der zu prüfende Domainname (zum Beispiel <code>beispieldomain.de</code>).</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Interactive Try-it Console */}
        <div className="pt-4 border-t border-slate-100 space-y-4">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            Direkt im Browser ausprobieren
          </h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={testDomain}
              onChange={(e) => setTestDomain(e.target.value)}
              placeholder="beispieldomain.de"
              className="w-full sm:w-80 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:bg-white focus:outline-none focus:border-slate-900"
            />
            <button
              type="button"
              onClick={runLiveTest}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-mono font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? 'Lade Daten...' : 'Abfrage senden'}
            </button>
            <button
              type="button"
              onClick={copyCurl}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>cURL kopieren</span>
            </button>
          </div>

          {/* Response Payload */}
          {apiResponse && (
            <div className="mt-4 p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto">
              <div className="text-slate-500 mb-2">// Server-Antwort (JSON):</div>
              <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
            </div>
          )}
        </div>

      </div>

      {/* Code Examples */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <h3 className="text-sm font-mono font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-600" />
            <span>Beispiel in JavaScript / TypeScript</span>
          </h3>
          <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
{`const res = await fetch(
  "https://rfc10023.de/api/lookup?d=meinedomain.de"
);
const data = await res.json();
if (data.status === "valid") {
  console.log("Preis:", data.tags.fval);
  console.log("Kontakt:", data.tags.furi);
}`}
          </pre>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <h3 className="text-sm font-mono font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Beispiel in Python</span>
          </h3>
          <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl font-mono text-xs overflow-x-auto">
{`import requests

res = requests.get("https://rfc10023.de/api/lookup?d=meinedomain.de")
record = res.json()
if record.get("status") == "valid":
    print(f"Verkauf aktiv: {record['tags'].get('fval')}")`}
          </pre>
        </div>
      </div>

    </div>
  );
}
