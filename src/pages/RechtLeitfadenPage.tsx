import React from 'react';
import { ShieldCheck, Scale, AlertTriangle, FileText, CheckCircle2, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RechtLeitfadenPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-amber-100 border border-amber-300 text-amber-950 font-mono text-xs font-bold">
          <Scale className="w-3.5 h-3.5 text-amber-800" />
          <span>Rechtlicher Rahmen &bull; DACH</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          Rechtliche Hinweise zu Domainverkäufen über DNS (RFC 10023)
        </h1>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
          Was Domaininhaber und Unternehmen in Deutschland, Österreich und der Schweiz 
          beachten sollten, wenn sie Verkaufsabsichten und Preisvorstellungen über DNS-Einträge signalisieren. 
          Hinweise zu Impressumspflicht, BGB-Vertragsrecht, Steuern und Wettbewerbsrecht.
        </p>
      </div>

      {/* Hinweis: Keine Rechtsberatung */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Wichtiger Hinweis:</span>
        </div>
        <p>
          Diese Übersicht dient reinen Informationszwecken und spiegelt den technischen und 
          rechtlichen Stand wider. Sie stellt keine Rechtsberatung oder steuerliche Beratung dar und 
          ersetzt nicht das Gespräch mit einem Fachanwalt für IT-Recht oder Steuerberater.
        </p>
      </div>

      {/* Chapters */}
      <div className="space-y-10 text-slate-800">
        
        {/* Chapter 1 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">1</span>
            <span>Ist ein DNS-Eintrag ein verbindliches Kaufangebot (§ 145 BGB)?</span>
          </h2>
          <p className="leading-relaxed">
            <strong>Nein.</strong> Nach deutschem und europäischem Zivilrecht ist die Veröffentlichung eines 
            Preises im DNS-Eintrag (wie <code>fval=EUR2500</code>) kein verbindliches Angebot an die Allgemeinheit, 
            sondern eine unverbindliche Aufforderung zur Abgabe von Angeboten (Fachbegriff: <em>invitatio ad offerendum</em>).
          </p>
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm space-y-2">
            <strong className="text-slate-900 block font-mono">Bedeutung in der Praxis:</strong>
            <p>
              Niemand kann durch eine einfache Annahmeerklärung einen Kauf erzwingen. 
              Als Domaininhaber behalten Sie die volle Vertragsfreiheit und entscheiden frei, an wen 
              und zu welchem Preis Sie die Domain verkaufen.
            </p>
          </div>
        </section>

        {/* Chapter 2 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">2</span>
            <span>Gilt die Impressumspflicht (§ 5 DDG) für den DNS-Eintrag?</span>
          </h2>
          <p className="leading-relaxed">
            Ein TXT-Eintrag im DNS ist kein Telemediendienst, der ein eigenes Impressum tragen muss. 
            Aufgrund der technischen Längenbegrenzung von DNS-Strings wäre das auch gar nicht möglich.
          </p>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2">
            <strong className="text-emerald-900 block font-mono">Empfehlung für das Feld <code>furi</code>:</strong>
            <p>
              Verlinken Sie im Feld <code>furi</code> auf eine gesicherte Website, eine eigene Projektseite 
              oder einen Treuhandservice, wo ein vollständiges, leicht auffindbares Impressum und 
              eine Datenschutzerklärung hinterlegt sind. So vermeiden Sie Risiken nach dem Gesetz gegen den unlauteren Wettbewerb.
            </p>
          </div>
        </section>

        {/* Chapter 3 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">3</span>
            <span>Mehrwertsteuer und Preisangabenverordnung</span>
          </h2>
          <p className="leading-relaxed">
            Richtet sich ein Verkaufsangebot an Verbraucher, verlangt die Preisangabenverordnung in Deutschland grundsätzlich 
            die Nennung von Endpreisen inklusive Umsatzsteuer.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            <li>
              <strong>Im B2B-Bereich:</strong> Bei Verkäufen zwischen Unternehmern sind Nettopreise üblich.
            </li>
            <li>
              <strong>Empfehlung für RFC 10023:</strong> Nutzen Sie das Freitextfeld <code>ftxt</code> für Klarheit, 
              zum Beispiel mit dem Zusatz <code>ftxt=Netto zzgl. USt. / B2B Transaktion</code> oder <code>ftxt=Endpreis inkl. MwSt.</code>.
            </li>
          </ul>
        </section>

        {/* Chapter 4 */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">4</span>
            <span>Markenschutz und Markenrechte</span>
          </h2>
          <p className="leading-relaxed">
            Ein öffentlicher Verkaufsvermerk im DNS dokumentiert die Absicht, eine Domain gegen Geld abzugeben. 
            Verletzt die Domain fremde Markenrechte oder Firmennamen, kann ein hoher Kaufpreis von Gerichten 
            oder Schiedsstellen als Indiz für Bösgläubigkeit gewertet werden.
          </p>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-950">
            <strong>Wichtig:</strong> Nutzen Sie RFC 10023 nur für Domains, an denen Sie berechtigte 
            Interessen halten und keine Rechte Dritter verletzen.
          </div>
        </section>

      </div>

      {/* Action CTA */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold">Standardkonformen Eintrag erstellen</h3>
          <p className="text-xs text-slate-400 mt-1">
            Nutzen Sie unseren Generator mit automatischer Längenprüfung und flexiblen Exportformaten.
          </p>
        </div>
        <Link
          to="/generator"
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 font-mono font-bold text-xs rounded-xl text-white transition-colors"
        >
          Zum Generator &rarr;
        </Link>
      </div>

    </div>
  );
}
