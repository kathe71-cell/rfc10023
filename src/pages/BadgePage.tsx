import React from 'react';
import BadgeGenerator from '../components/BadgeGenerator';
import { ShieldCheck, Sparkles, ExternalLink, Code2 } from 'lucide-react';

export default function BadgePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Editorial Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Trust &amp; Conversion Asset</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          RFC 10023 Trust-Badge Generator
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          Erhöhe das Vertrauen von Kaufinteressenten: Binde ein verifizierbares Trust-Badge 
          auf deiner Parking-Landingpage, deiner Verkaufs-Subdomain oder deinem GitHub-Portfolio ein. 
          Kaufinteressenten können den DNS-Eintrag mit einem Klick neutral überprüfen.
        </p>
      </div>

      {/* Component */}
      <BadgeGenerator />

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-bold text-slate-900 text-base">Echtheits-Beweis</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Interessenten sehen sofort, dass das Angebot direkt aus der maßgeblichen DNS-Zone des Inhabers stammt – Schutz vor Phishing und Fake-Brokern.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-slate-900 text-base">Provision sparen</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Verlinke im Badge direkt auf dein eigenes Kontaktformular oder Treuhand-Konto (z. B. Escrow) und spare 15–20 % Marktplatzprovision.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-slate-900 text-base">100 % DSGVO-konform</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Der Badge-Code lädt keine externen Tracking-Pixel oder Drittland-Fonts nach. Rein statisches HTML/CSS oder Markdown.
          </p>
        </div>
      </div>

    </div>
  );
}
