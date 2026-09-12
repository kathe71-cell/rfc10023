import React from 'react';
import BadgeGenerator from '../components/BadgeGenerator';
import { ShieldCheck, Sparkles, ExternalLink, Code2 } from 'lucide-react';

export default function BadgePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
          <span>Verifikation für Domains</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Badge Generator für RFC 10023
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          Schaffen Sie Vertrauen bei Kaufinteressenten: Binden Sie ein verifizierbares Badge 
          auf Ihrer Projektseite oder in Portfolios ein. Interessenten können den DNS-Eintrag 
          mit einem Klick unabhängig nachprüfen.
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
          <h3 className="font-bold text-slate-900 text-base">Echtheitsnachweis</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Interessenten sehen sofort, dass das Angebot direkt aus der maßgeblichen DNS-Zone des Inhabers stammt.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="font-bold text-slate-900 text-base">Provision sparen</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Verlinken Sie direkt auf Ihr eigenes Kontaktformular oder einen Treuhanddienst wie Escrow.com und sparen Sie Vermittlungsgebühren.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-slate-200 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="font-bold text-slate-900 text-base">Datenschutzfreundlich</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Der Badge-Code kommt ohne externe Tracker oder Schriftarten aus. Reines HTML und CSS.
          </p>
        </div>
      </div>

    </div>
  );
}
