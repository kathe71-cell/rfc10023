import React from 'react';
import { BookOpen, ExternalLink, AlertTriangle } from 'lucide-react';
import CitationBox from '../components/CitationBox';

export default function SpezifikationPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Title */}
      <div className="border-b border-slate-200 pb-8">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold uppercase mb-3">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>IETF RFC 10023 &middot; Status: Informational</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-950 leading-tight">
          RFC 10023 Spezifikation
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-700 leading-relaxed">
          Technische Analyse und deutsche Referenz des IETF-Standards 
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
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          1. Motivation und Discovery-Architektur
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Im heutigen Domain-Sekundärmarkt ist die Erkennung zum Verkauf stehender Domains fragmentiert. 
          Interessenten müssen die Domain im Browser aufrufen (in der Hoffnung, dass eine Parking-Seite geschaltet ist), 
          Whois-Datenbanken prüfen (die durch Datenschutzgesetze wie die DSGVO meist redigiert sind) oder geschlossene Marktplatz-Verzeichnisse durchforsten.
        </p>
        <p className="text-sm text-slate-700 leading-relaxed">
          RFC 10023 etabliert eine <strong>dezentrale, protokollbasierte Discovery-Schicht</strong> direkt im Domain Name System. 
          Domaininhaber müssen ihre Nameserver nicht ändern und keine teuren Parkingservices nutzen: Ein einfacher DNS-TXT-Record signalisiert der weltweiten Internet-Infrastruktur, 
          dass die Domain für Kaufangebote bereitsteht.
        </p>
      </section>

      {/* Section 2: Der DNS Leaf Node */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          2. Der reservierte DNS-Knotenpunkt (_for-sale)
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Gemäß den Vorgaben von <strong>RFC 8552</strong> (<em>Scoped, Underscored DNS Node Names</em>) nutzt die Spezifikation das Präfix <code>_for-sale</code>. 
          Der Unterstrich verhindert Kollisionen mit gewöhnlichen Hostnamen (wie <code>mail.example.de</code> oder <code>www.example.de</code>), die nach RFC 1035 keine Unterstriche enthalten dürfen.
        </p>
        <div className="p-4 rounded-xl bg-slate-950 text-emerald-300 font-mono text-xs overflow-x-auto space-y-1">
          <p className="text-slate-500">; Syntax nach RFC 10023 Section 2.1 (Multi-Record RRset):</p>
          <p>_for-sale.&lt;domain-name&gt;.  3600  IN  TXT  &quot;v=FORSALE1;fval=EUR2500&quot;</p>
          <p>_for-sale.&lt;domain-name&gt;.  3600  IN  TXT  &quot;v=FORSALE1;furi=https://&lt;domain-name&gt;/kontakt&quot;</p>
        </div>
      </section>

      {/* Section 3: Tag-Spezifikation */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          3. Tag-Value-Spezifikation (Section 2.1 &amp; 2.2)
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Nach RFC 10023 Section 2.1 gilt: <strong>Jeder TXT-Record darf genau ein Tag-Wert-Paar enthalten</strong> und muss mit <code>v=FORSALE1;</code> beginnen. 
          Mehrere Tags werden durch mehrere TXT-Records innerhalb desselben Resource Record Sets (RRset) abgebildet.
        </p>

        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4 font-bold">Tag</th>
                <th className="py-3 px-4 font-bold">Pflicht</th>
                <th className="py-3 px-4 font-bold">Bedeutung</th>
                <th className="py-3 px-4 font-bold">Beispielwert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">v</td>
                <td className="py-3 px-4 text-emerald-700 font-bold">Ja</td>
                <td className="py-3 px-4 text-slate-700">Versionskennung. Muss exakt <code>FORSALE1</code> lauten.</td>
                <td className="py-3 px-4 font-mono text-slate-950 font-semibold">v=FORSALE1;</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">fval</td>
                <td className="py-3 px-4 text-slate-500">Nein</td>
                <td className="py-3 px-4 text-slate-700">Festpreis nach ISO 4217 (Code direkt vor dem Betrag). Bei VHB entfällt der Tag.</td>
                <td className="py-3 px-4 font-mono text-emerald-700 font-semibold">fval=EUR2500</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">furi</td>
                <td className="py-3 px-4 text-slate-500">Nein</td>
                <td className="py-3 px-4 text-slate-700">Kontakt-URI (HTTP, HTTPS, mailto oder tel nach RFC 3986).</td>
                <td className="py-3 px-4 font-mono text-blue-600 font-semibold">furi=https://sedo.com/...</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">ftxt</td>
                <td className="py-3 px-4 text-slate-500">Nein</td>
                <td className="py-3 px-4 text-slate-700">Menschlich lesbare Notiz (z. B. Verhandlungsbasis, Konditionen).</td>
                <td className="py-3 px-4 font-mono text-slate-800">ftxt=Inkl. Treuhand</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-slate-950">fcod</td>
                <td className="py-3 px-4 text-slate-500">Nein</td>
                <td className="py-3 px-4 text-slate-700">Maschineller Transaktions- oder Identifikationscode.</td>
                <td className="py-3 px-4 font-mono text-slate-800">fcod=AUTH-84920</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Fallstudie SIDN */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-950 tracking-tight">
          4. Praxis-Implementierung: Die SIDN-Fallstudie (.nl)
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">
          Die niederländische Länderregistry <strong>SIDN</strong> (.nl) hat RFC 10023 als weltweit erste Top-Level-Domain direkt in ihre Infrastruktur integriert. 
          Führt ein Nutzer auf der offiziellen SIDN-Website oder per Whois-Lookup eine Domainabfrage durch, prüft das SIDN-Backend automatisch den <code>_for-sale</code> TXT-Record. 
          Ist der Record vorhanden, erscheint in der Auskunft nicht &bdquo;Domain vergeben&ldquo;, sondern ein direkter Hinweis auf die Verkaufsbereitschaft inklusive Kaufpreis und Verkäuferkontakt.
        </p>
      </section>

      {/* Section 5: Sicherheits- und Missbrauchshinweise */}
      <section className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
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
