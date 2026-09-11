import React from 'react';
import BulkValidator from '../components/BulkValidator';
import { Layers, ShieldCheck, Download, CheckCircle2 } from 'lucide-react';

export default function BulkPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Editorial Header */}
      <div className="max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-mono text-xs font-semibold">
          <Layers className="w-3.5 h-3.5 text-emerald-700" />
          <span>Domainer Portfolio Tool</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Portfolio Bulk-Scanner für RFC 10023
        </h1>
        <p className="text-base text-slate-600 leading-relaxed font-normal">
          Überprüfe bis zu 30 Domainnamen gleichzeitig auf gültige <code>_for-sale</code> TXT-Records, 
          DNSSEC-Validierung und die beteiligten Nameserver. Ideal für Domain-Investoren, Registrare und Broker-Teams.
        </p>
      </div>

      {/* Bulk Tool */}
      <BulkValidator />

      {/* Info & Legal Box */}
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-900 font-mono block text-sm">
          Hinweise zur Performance &amp; Datenschutz:
        </strong>
        <p>
          Der Scan erfolgt clientseitig direkt aus Ihrem Browser heraus über Anycast DNS-over-HTTPS (DoH). 
          Es werden keine eingegebenen Domain-Listen auf unseren Servern gespeichert oder für Werbezwecke ausgewertet.
        </p>
        <p>
          <strong>Rechtlicher Hinweis:</strong> Die Prüfung dient rein informatorischen Zwecken 
          und stellt keine Rechts- oder Handelsberatung dar. Ein gefundener DNS-Record begründet keinen 
          rechtsverbindlichen Kaufvertrag (§ 145 BGB), sondern dokumentiert die technische Verkaufsabsicht 
          (invitatio ad offerendum) des Domain-Inhabers.
        </p>
      </div>

    </div>
  );
}
