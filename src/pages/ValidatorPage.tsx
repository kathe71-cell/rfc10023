import React from 'react';
import { useSearchParams } from 'react-router-dom';
import RfcValidator from '../components/RfcValidator';
import CitationBox from '../components/CitationBox';
import { ShieldCheck, Info } from 'lucide-react';

export default function ValidatorPage() {
  const [searchParams] = useSearchParams();
  const domainParam = searchParams.get('d') || '';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono font-bold uppercase mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>DoH Inspector &amp; Syntax Engine</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          RFC 10023 DNS Live-Validator
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
          Prüfe beliebige Domains weltweit in Echtzeit auf das Vorhandensein und die RFC-10023-Konformität des standardisierten <code className="font-mono text-emerald-700 bg-slate-100 px-1.5 py-0.5 rounded">_for-sale</code> TXT-Records via DNS-over-HTTPS.
        </p>
      </div>

      {/* Validator Component */}
      <RfcValidator initialDomain={domainParam} />

      {/* Technical Diagnostic Info */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600" />
          Wie funktioniert die DoH-Validierung?
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Die Abfrage erfolgt direkt aus deinem Browser an globale, neutrale Anycast-DoH-Endpunkte (Cloudflare 1.1.1.1 und Google 8.8.8.8) mit dem MIME-Typ <code>application/dns-json</code>. 
          Der Resolver liest die Resource Record Sets (RRsets) des Typs 16 (TXT) am autoritativen Leaf-Node <code>_for-sale.[domain]</code> aus. 
          Unser Parser überprüft anschließend die zwingende Versionskennung <code>v=FORSALE1;</code>, isoliert die Parameter <code>furi</code>, <code>fval</code>, <code>ftxt</code> und <code>fcod</code> und gleicht sie mit der IETF-Musterspezifikation ab.
        </p>
      </div>

      {/* Citation Box */}
      <CitationBox title="RFC 10023 DNS Live-Validator & Inspector" url="https://rfc10023.de/validator" />

    </div>
  );
}
