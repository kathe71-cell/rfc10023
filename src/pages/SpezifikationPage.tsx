import React from 'react';
import { BookOpen, ExternalLink, ShieldCheck, Terminal, AlertTriangle, Layers } from 'lucide-react';
import CitationBox from '../components/CitationBox';

export default function SpezifikationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>IETF RFC 10023 Analysis &middot; Status: Informational</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
          RFC 10023: Die offizielle Spezifikation
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
          Umfassende deutsche Dokumentation der IETF-Spezifikation 
          &bdquo;<em>The &apos;_for-sale&apos; Underscored and Globally Scoped DNS Node Name</em>&ldquo; (Juli 2026).
        </p>
        <div className="mt-6 flex items-center gap-4 text-xs font-mono text-slate-500">
          <span>Kategorie: Informational</span>
          <span>&bull;</span>
          <span>ISSN: 2070-1721</span>
          <span>&bull;</span>
          <a
            href="https://www.rfc-editor.org/info/rfc10023"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1"
          >
            IETF Originaltext <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Section 1: Abstract & Problemstellung */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          1. Motivation und Problemstellung
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Im heutigen Domain-Sekundärmarkt (Domain Aftermarket) ist die Entdeckung zum Verkauf stehender Domains hochgradig fragmentiert. 
          Interessenten müssen entweder die Domain im Browser aufrufen (in der Hoffnung, dass eine Parking-Seite aktiv ist), Whois-Einträge manuell prüfen (die durch die DSGVO meist anonymisiert sind) oder proprietäre Marktplatz-Datenbanken (wie Sedo, Dan, Afternic) durchsuchen.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          RFC 10023 etabliert eine <strong>dezentrale, protokollbasierte Discovery-Schicht</strong>. 
          Domaininhaber müssen ihre Nameserver nicht ändern und keine teuren Parkingservices nutzen: Ein einfacher DNS-TXT-Record signalisiert der gesamten Internet-Infrastruktur, dass die Domain zum Verkauf steht.
        </p>
      </section>

      {/* Section 2: Der DNS Leaf Node */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          2. Der reservierte DNS-Knotenpunkt (_for-sale)
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Gemäß den Richtlinien von <strong>RFC 8552</strong> (<em>Scoped, Underscored DNS Node Names</em>) nutzt die Spezifikation das Präfix <code>_for-sale</code>. 
          Der Unterstrich verhindert Kollisionen mit tatsächlichen Hostnamen (wie <code>mail.example.de</code> oder <code>www.example.de</code>), die nach RFC 1035 keine Unterstriche enthalten dürfen.
        </p>
        <div className="p-4 rounded-xl bg-slate-900 text-emerald-300 font-mono text-xs overflow-x-auto">
          _for-sale.&lt;domain-name&gt;.  IN  TXT  &quot;v=FORSALE1; [tags...]&quot;
        </div>
      </section>

      {/* Section 3: Tag-Spezifikation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          3. Tag-Value-Spezifikation (Syntax)
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Der Inhalt des TXT-Records besteht aus durch Semikolons getrennten Schlüssel-Wert-Paaren. 
          Jeder Tag darf pro TXT-Record maximal einmal vorkommen; mehrere TXT-Records innerhalb eines RRsets sind zulässig.
        </p>

        <div className="border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4 font-bold">Tag</th>
                <th className="py-3 px-4 font-bold">Status</th>
                <th className="py-3 px-4 font-bold">Bedeutung</th>
                <th className="py-3 px-4 font-bold">Beispielwert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">v</td>
                <td className="py-3 px-4 text-rose-600 font-bold">Pflicht</td>
                <td className="py-3 px-4 text-slate-700">Protokollversion. Muss an erster Stelle stehen.</td>
                <td className="py-3 px-4 font-mono text-emerald-700">v=FORSALE1</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">fval</td>
                <td className="py-3 px-4 text-slate-500">Optional</td>
                <td className="py-3 px-4 text-slate-700">Verkaufspreis im ISO-4217 Währungsformat oder Freiform (&bdquo;VHB&ldquo;).</td>
                <td className="py-3 px-4 font-mono text-emerald-700">fval=EUR:2500</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">furi</td>
                <td className="py-3 px-4 text-slate-500">Optional</td>
                <td className="py-3 px-4 text-slate-700">Kontakt-URL oder Landeseite (HTTP/HTTPS oder mailto).</td>
                <td className="py-3 px-4 font-mono text-emerald-700">furi=https://sedo.com/...</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">ftxt</td>
                <td className="py-3 px-4 text-slate-500">Optional</td>
                <td className="py-3 px-4 text-slate-700">Menschlich lesbare Notiz oder Verkaufsbedingungen.</td>
                <td className="py-3 px-4 font-mono text-emerald-700">ftxt=Inkl. Treuhand</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-900">fcod</td>
                <td className="py-3 px-4 text-slate-500">Optional</td>
                <td className="py-3 px-4 text-slate-700">Automatisierter Transaktions- oder Identifikationscode.</td>
                <td className="py-3 px-4 font-mono text-emerald-700">fcod=AUTH-84920</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Fallstudie SIDN */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          4. Praxis-Implementierung: Die SIDN-Fallstudie (.nl)
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Die niederländische Länderregistry <strong>SIDN</strong> (.nl) hat RFC 10023 als weltweit erste Top-Level-Domain direkt in ihre Infrastruktur integriert. 
          Führt ein Nutzer auf der offiziellen SIDN-Website oder per Whois-Lookup eine Domain-Verfügbarkeitsprüfung durch, prüft das SIDN-Backend automatisch den <code>_for-sale</code> TXT-Record. 
          Ist der Record vorhanden, erscheint in der Auskunft nicht &bdquo;Domain vergeben&ldquo;, sondern ein direkter Hinweis auf die Verkaufsbereitschaft inklusive Kaufpreis und Verkäuferkontakt.
        </p>
      </section>

      {/* Section 5: Sicherheits- und Missbrauchshinweise */}
      <section className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
        <div className="flex items-center gap-2 text-amber-950 font-bold">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3>Sicherheitshinweise (Section 4 des RFC)</h3>
        </div>
        <p className="text-xs text-amber-900 leading-relaxed">
          RFC 10023 beinhaltet keine Authentifizierungsschicht für die Zahlungsabwicklung. 
          Interessenten sollten vor Überweisungen sicherstellen, dass die Domain per <strong>DNSSEC</strong> signiert ist, um DNS-Cache-Poisoning auszuschließen. 
          Zudem wird dringend empfohlen, Transaktionen stets über lizenzierte Treuhanddienste abzuwickeln.
        </p>
      </section>

      {/* Citation Box */}
      <CitationBox title="IETF RFC 10023: The _for-sale Underscored DNS Node Name" url="https://rfc10023.de/spezifikation" />

    </div>
  );
}
