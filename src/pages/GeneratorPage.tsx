import React from 'react';
import RfcGenerator from '../components/RfcGenerator';
import CitationBox from '../components/CitationBox';
import { Cpu, Terminal, CheckCircle } from 'lucide-react';

export default function GeneratorPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span>IETF Record Builder</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          RFC 10023 Record Generator
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
          Erstelle in wenigen Schritten fehlerfreie, RFC-konforme DNS-TXT-Records für deine Domains und exportiere sie für Cloudflare, BIND, Hetzner, INWX oder die Linux/macOS-Kommandozeile.
        </p>
      </div>

      {/* Generator Component */}
      <RfcGenerator />

      {/* Quick Setup Checklist */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-600" />
          Schritt-für-Schritt Anleitung zur Hinterlegung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">1. Record anlegen</strong>
            <p>Logge dich bei deinem Domain-Registrar oder DNS-Hoster ein und öffne die DNS-Zonenverwaltung deiner Domain.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">2. Name &amp; Typ wählen</strong>
            <p>Wähle als Typ <code>TXT</code> und als Host/Name exakt <code>_for-sale</code> (oder <code>_for-sale.deinedomain.de.</code> im Zonefile).</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">3. Live testen</strong>
            <p>Füge den generierten String als Wert ein. Nach 5–10 Minuten kannst du den Eintrag mit unserem Live-Validator prüfen.</p>
          </div>
        </div>
      </div>

      {/* Citation Box */}
      <CitationBox title="RFC 10023 Record Generator & Multi-Format Exporter" url="https://rfc10023.de/generator" />

    </div>
  );
}
