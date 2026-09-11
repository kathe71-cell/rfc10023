import React from 'react';
import HosterMatrix from '../components/HosterMatrix';
import CitationBox from '../components/CitationBox';
import { Database, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function MatrixPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>DACH Provider Evaluation</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          Hoster- &amp; DNS-Kompatibilitäts-Matrix
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
          Welcher Hoster unterstützt die Eingabe von Underscore-Labels wie <code className="font-mono text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded">_for-sale</code> im Webinterface? Detaillierte Testergebnisse für Hetzner, Cloudflare, INWX, Netcup, Strato und IONOS.
        </p>
      </div>

      {/* Matrix Component */}
      <HosterMatrix />

      {/* Recommendations & Workarounds */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-base">Empfohlene DNS-Provider</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Wer viele Domains verwaltet und RFC 10023 flexibel einsetzen möchte, sollte auf Provider mit moderner DNS-Architektur setzen: 
            <strong> Cloudflare DNS</strong>, <strong>Hetzner DNS Console</strong>, <strong>INWX</strong> oder <strong>deSEC</strong>. 
            Hier können Einträge ohne Fehlermeldungen angelegt und sekundenschnell weltweit propagiert werden.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-900 text-base">Workaround für restriktive Hoster</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Verweigert das Webinterface deines Hosters (z. B. bei älteren Strato- oder IONOS-Tarifen) die Speicherung mit dem Hinweis auf ein ungültiges Zeichen im Hostnamen, 
            kannst du die Nameserver der Domain kostenfrei auf Cloudflare oder deSEC delegieren. Die Domainregistrierung bleibt beim bisherigen Hoster erhalten.
          </p>
        </div>
      </div>

      {/* Citation Box */}
      <CitationBox title="Hoster- & DNS-Kompatibilitäts-Matrix für RFC 10023" url="https://rfc10023.de/hoster-matrix" />

    </div>
  );
}
