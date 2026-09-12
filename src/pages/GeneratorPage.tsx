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
          <span>Generator</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
          RFC 10023 Generator
        </h1>
        <p className="mt-3 text-base text-slate-600 max-w-3xl leading-relaxed">
          Erstellen Sie standardkonforme DNS-TXT-Einträge für Ihre Domains und exportieren Sie den fertigen Code für Cloudflare, BIND, Hetzner, INWX oder die Kommandozeile.
        </p>
      </div>

      {/* Generator Component */}
      <RfcGenerator />

      {/* Quick Setup Checklist */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4">
        <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-600" />
          So hinterlegen Sie den Eintrag
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">1. DNS öffnen</strong>
            <p>Melden Sie sich bei Ihrem Registrar oder DNS-Anbieter an und öffnen Sie die DNS-Verwaltung der Domain.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">2. Typ und Name wählen</strong>
            <p>Wählen Sie als Typ <code>TXT</code> und tragen Sie als Name <code>_for-sale</code> ein.</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <strong className="text-slate-900 font-bold block">3. Prüfen</strong>
            <p>Fügen Sie den generierten Text als Wert ein. Nach wenigen Minuten können Sie den Eintrag mit unserem Prüftool testen.</p>
          </div>
        </div>
      </div>

      {/* Citation Box */}
      <CitationBox title="RFC 10023 Record Generator & Multi-Format Exporter" url="https://rfc10023.de/generator" />

    </div>
  );
}
