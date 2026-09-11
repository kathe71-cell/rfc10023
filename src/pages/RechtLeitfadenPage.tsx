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
          <span>DACH Compliance &bull; DE / AT / CH</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          Rechtssicherheit bei Domainverkäufen via DNS (RFC 10023)
        </h1>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
          Was müssen Domain-Inhaber, Investoren und Unternehmen im deutschsprachigen Raum 
          beachten, wenn sie Verkaufsabsichten und Preisvorstellungen über DNS-TXT-Records signalisieren? 
          Ein Leitfaden zu Impressumspflicht (§ 5 DDG), BGB-Vertragsrecht, Steuern und UWG.
        </p>
      </div>

      {/* Warning Box: Keine Rechtsberatung */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-xs sm:text-sm text-amber-950 leading-relaxed space-y-1">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Wichtiger Hinweis zur Rechtsberatung:</span>
        </div>
        <p>
          Dieser Leitfaden stellt die technische und rechtliche Einordnung nach aktuellem Kenntnisstand 
          (Stand: 2026) dar und dient rein informatorischen Zwecken. Er ersetzt keine individuelle Rechts- oder 
          Steuerberatung durch einen zugelassenen Fachanwalt für IT-Recht oder Steuerberater.
        </p>
      </div>

      {/* Chapters */}
      <div className="space-y-10 text-slate-800">
        
        {/* Chapter 1: Vertragsschluss & Invitatio ad offerendum */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">1</span>
            <span>Ist ein DNS-Record ein verbindliches Kaufangebot (§ 145 BGB)?</span>
          </h2>
          <p className="leading-relaxed">
            <strong>Nein.</strong> Nach deutschem und europäischem Zivilrecht stellt die Veröffentlichung eines 
            Preises im DNS-TXT-Record (z. B. <code>fval=EUR2500</code>) in der Regel kein bindendes Angebot 
            an jedermann dar, sondern eine rechtlich unverbindliche <strong>Aufforderung zur Abgabe eines Angebots 
            (invitatio ad offerendum)</strong>.
          </p>
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs sm:text-sm space-y-2">
            <strong className="text-slate-900 block font-mono">Die Konsequenz:</strong>
            <p>
              Niemand kann durch bloßen Klick oder einseitige Erklärung einen Kaufvertrag erzwingen. 
              Der Domain-Inhaber behält die volle Vertragsfreiheit und kann frei entscheiden, ob, an wen 
              und zu welchen Konditionen er die Domain tatsächlich überträgt.
            </p>
          </div>
        </section>

        {/* Chapter 2: Impressumspflicht (§ 5 Digitale-Dienste-Gesetz / DDG) */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">2</span>
            <span>Gilt die Impressumspflicht (§ 5 DDG) für den DNS-Record?</span>
          </h2>
          <p className="leading-relaxed">
            Ein DNS-TXT-Record selbst ist kein eigenständiger geschäftsmäßiger Telemediendienst, 
            auf dem ein vollständiges Impressum abgedruckt werden muss. Die DNS-Architektur (RFC 1035) 
            beschränkt Textzeichen zudem technisch.
          </p>
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-950 space-y-2">
            <strong className="text-emerald-900 block font-mono">Best Practice für das <code>furi</code>-Tag:</strong>
            <p>
              Verlinke im <code>furi</code>-Tag auf eine SSL-gesicherte Website oder ein Treuhandportal (z. B. Escrow, Sedo 
              oder eine eigene Webvisitenkarte), die über ein <strong>vollständiges, leicht erkennbares Impressum</strong> und 
              eine Datenschutzerklärung verfügt. So vermeidest du Abmahnrisiken nach dem UWG.
            </p>
          </div>
        </section>

        {/* Chapter 3: Umsatzsteuer & Preisangabenverordnung (PAngV) */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">3</span>
            <span>Preisangabenverordnung (PAngV) &amp; Mehrwertsteuer</span>
          </h2>
          <p className="leading-relaxed">
            Richtet sich ein Verkaufsangebot an Endverbraucher (B2C), schreibt die deutsche 
            Preisangabenverordnung grundsätzlich vor, dass Endpreise inklusive der gesetzlichen 
            Mehrwertsteuer angegeben werden müssen.
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-slate-700">
            <li>
              <strong>B2B-Transaktionen:</strong> Zwischen Unternehmern können Preise netto vereinbart werden. 
              In internationalen Domain-Transaktionen ist die Angabe von Nettopreisen üblich.
            </li>
            <li>
              <strong>Empfehlung für RFC 10023:</strong> Nutze das Freitext-Feld <code>ftxt</code> für Klarheit: 
              z. B. <code>ftxt=Netto zzgl. USt. / B2B Transaktion</code> oder <code>ftxt=Endpreis inkl. MwSt.</code>.
            </li>
          </ul>
        </section>

        {/* Chapter 4: Markenschutz & Cybersquatting */}
        <section className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-slate-900 text-emerald-400 font-mono text-sm flex items-center justify-center">4</span>
            <span>Markenschutz &amp; Bösgläubigkeit (Cybersquatting)</span>
          </h2>
          <p className="leading-relaxed">
            Ein öffentlicher Verkaufs-Record im DNS dokumentiert transparent die Absicht, eine Domain 
            gegen Entgelt zu veräußern. Handelt es sich um eine Domain, die fremde Marken-, Namens- 
            oder Unternehmenskennzeichen verletzt, kann ein hoher <code>fval</code>-Preis von Gerichten 
            (bzw. in WIPO / UDRP-Verfahren) als <strong>starker Beweis für Bösgläubigkeit (Bad Faith)</strong> 
            gewertet werden.
          </p>
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-950">
            <strong>Vorsicht:</strong> Biete über RFC 10023 nur Domains an, an denen du berechtigte 
            Interessen besitzt und die keine Rechte Dritter verletzen.
          </div>
        </section>

      </div>

      {/* Action CTA */}
      <div className="p-8 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="text-lg font-bold">Standardkonformen Record erstellen</h3>
          <p className="text-xs text-slate-400 mt-1">
            Nutze unseren Generator mit integriertem Byte-Guard und VHB-Logik.
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
