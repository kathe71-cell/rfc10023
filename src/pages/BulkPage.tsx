import React from 'react';
import BulkValidator from '../components/BulkValidator';
import { Layers, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';

export default function BulkPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-emerald-700" />
          <span>Portfolio Werkzeug</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Portfolio Bulk-Scanner für RFC 10023
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          Prüfen Sie bis zu 30 Domains gleichzeitig auf vorhandene <code>_for-sale</code> Einträge, 
          DNSSEC-Absicherung und die zuständigen Nameserver. Praktisch für Domaininhaber, Registrare und Makler.
        </p>
      </div>

      {/* Bulk Tool */}
      <BulkValidator />

      {/* Info Box */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-900 font-mono block text-sm">
          Hinweise zu Ablauf und Datenschutz:
        </strong>
        <p>
          Die Abfrage läuft direkt in Ihrem Browser über DNS über HTTPS (DoH). 
          Wir speichern keine der eingegebenen Domainlisten auf unseren Servern.
        </p>
        <p>
          <strong>Rechtlicher Hinweis:</strong> Die Auswertung dient reinen Informationszwecken. 
          Ein gefundener DNS-Eintrag begründet keinen Kaufvertrag nach § 145 BGB, sondern signalisiert 
          lediglich die Verkaufsbereitschaft des Inhabers.
        </p>
      </div>

    </div>
  );
}
