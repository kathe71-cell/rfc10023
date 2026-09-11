import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Database, BookOpen, CheckCircle, HelpCircle, Code2, Copy, Check, ArrowRight, ExternalLink, Sparkles, Terminal, FileText } from 'lucide-react';
import RfcValidator from '../components/RfcValidator';
import RfcGenerator from '../components/RfcGenerator';
import HosterMatrix from '../components/HosterMatrix';
import CitationBox from '../components/CitationBox';

export default function HomePage() {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const embedCode = `<iframe src="https://rfc10023.de/rechner-embed" width="100%" height="520" frameborder="0" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>\n<p style="font-size:11px; color:#64748b;">Powered by <a href="https://rfc10023.de" target="_blank">RFC 10023 Referenzportal</a></p>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const faqs = [
    {
      q: 'Was bezweckt der Standard RFC 10023 in der Praxis?',
      a: 'RFC 10023 löst das Problem fragmentierter, proprietärer Verkaufs-Landingpages. Bisher mussten Domain-Inhaber ihre Domains auf Marktplätze (wie Sedo oder Afternic) umrouten. Mit RFC 10023 kann eine Domain normal weiterbetrieben werden (oder auf beliebigen Nameservern liegen), während Registrare, Makler und automatisierte Erwerbs-Tools die Verkaufsbereitschaft direkt über eine DNS-Abfrage am Knoten _for-sale auslesen können.'
    },
    {
      q: 'Wie sieht die Mindestanforderung an den TXT-Record aus?',
      a: 'Der TXT-Record muss zwingend mit dem Versions-Tag "v=FORSALE1;" beginnen. Ohne diesen Header ist der Record nach RFC 10023 ungültig. Dahinter folgen optionale Schlüssel-Wert-Paare wie fval=EUR:2500 (Preis) oder furi=https://... (Kontaktseite).'
    },
    {
      q: 'Welche Registries werten RFC 10023 bereits aus?',
      a: 'Pionier ist die niederländische Registry SIDN (.nl). Sie integriert den _for-sale TXT-Record direkt in ihre Whois- und Domain-Lookup-Dienste. Wenn eine .nl-Domain zum Verkauf steht, wird dies direkt auf der offiziellen SIDN-Webseite angezeigt.'
    },
    {
      q: 'Ersetzt der DNS-Record einen Treuhanddienst (Escrow)?',
      a: 'Nein. RFC 10023 ist ein reines Signal- und Discovery-Protokoll. Die Verhandlung, Bezahlung und Eigentumsübertragung erfolgt weiterhin über bewährte Treuhanddienste (z. B. Sedo, Dan, Escrow.com) oder bilaterale Kaufverträge.'
    },
    {
      q: 'Kann ich mehrere _for-sale TXT-Einträge hinterlegen?',
      a: 'Ja. RFC 10023 erlaubt mehrere TXT-Records innerhalb des RRsets, solange jedes Tag-Werte-Paar eindeutig ist. Es können beispielsweise unterschiedliche Kontaktkanäle oder automatisierte Vermittlungscodes parallel publiziert werden.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section (Helles Editorial Design) */}
      <section className="pt-12 sm:pt-16 pb-8 border-b border-slate-200 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-50/60 blur-3xl pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Superscript Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono font-bold tracking-wider text-slate-800 uppercase mb-6">
            <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            <span>IETF Standard · Published July 2026 · DNS Node: _for-sale</span>
          </div>

          {/* Display Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.08] max-w-4xl">
            Domain-Verkaufssignale direkt im <span className="text-emerald-600 underline decoration-emerald-300 decoration-wavy underline-offset-8">DNS</span> standardisieren.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl leading-relaxed">
            Mit <strong className="text-slate-900 font-bold">RFC 10023</strong> publizieren Domaininhaber ihre Verkaufsbereitschaft, Festpreise und Kontaktwege dezentral und maschinenlesbar. Unser DACH-Portal bietet Live-Validierung, 1-Click-Record-Generierung und Hoster-Support.
          </p>

          {/* Dual CTAs & Stats Grid */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#validator"
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Live-Validator starten</span>
            </a>
            <a
              href="#generator"
              className="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl transition-all shadow-sm flex items-center gap-2"
            >
              <Cpu className="w-4 h-4 text-white" />
              <span>TXT-Record erstellen</span>
            </a>
            <Link
              to="/hoster-matrix"
              className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm rounded-xl transition-colors"
            >
              Hoster-Matrix ansehen &rarr;
            </Link>
          </div>

          {/* Real Facts Strip */}
          <div className="mt-12 pt-8 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <span className="block text-2xl sm:text-3xl font-mono font-black text-slate-900">RFC 10023</span>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">IETF Standards Track</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-mono font-black text-emerald-600">_for-sale</span>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Global DNS Node Name</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-mono font-black text-slate-900">v=FORSALE1</span>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Obligatorischer Versions-Tag</span>
            </div>
            <div>
              <span className="block text-2xl sm:text-3xl font-mono font-black text-slate-900">0 % Provision</span>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500">Direkter Käuferkontakt</span>
            </div>
          </div>

        </div>
      </section>

      {/* Position-0 Definitions-Box (Featured Snippet Optimized) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border-2 border-emerald-500/30 shadow-sm relative">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900">
              Definition nach IETF RFC 10023
            </span>
          </div>
          <p className="text-base sm:text-lg text-slate-800 leading-relaxed font-medium">
            <strong>RFC 10023</strong> (&bdquo;The &apos;_for-sale&apos; Underscored and Globally Scoped DNS Node Name&ldquo;) 
            ist eine im Juli 2026 von der IETF verabschiedete Spezifikation. Sie definiert einen standardisierten 
            DNS-TXT-Eintrag am Knotenpunkt <code>_for-sale.[domain]</code> mit dem Pflicht-Tag <code>v=FORSALE1;</code>, 
            über den Domaininhaber ihre Verkaufsabsicht maschinenlesbar im weltweiten Domain Name System publizieren.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <span>Quelle: Internet Engineering Task Force (IETF)</span>
            <Link to="/spezifikation" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
              Zur vollständigen Spezifikation <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Interactive Tool 1: Live Validator */}
      <section id="validator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <RfcValidator />
      </section>

      {/* Interactive Tool 2: Generator */}
      <section id="generator" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <RfcGenerator />
      </section>

      {/* Hoster Matrix Section */}
      <section id="matrix" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <HosterMatrix />
      </section>

      {/* E-E-A-T Redaktions-Trust-Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center text-emerald-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Fachredaktion rfc10023.de &middot; Technische Redaktion
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-2xl">
                Geprüft nach IETF RFC 10023, RFC 8552 und RFC 2181. Stand: September 2026. 
                Alle Angaben basieren auf den offiziellen Spezifikationen der Internet Engineering Task Force 
                sowie Praxistests auf Zoneneditoren führender europäischer Hostinganbieter.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-mono font-bold border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              IETF Konform
            </span>
          </div>
        </div>
      </section>

      {/* Topical Authority: Fachratgeber & Praxis-Cluster */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-700">
            Hintergrund &amp; Leitfäden
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Praxiswissen zum _for-sale DNS-Standard
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 font-mono font-black text-sm">
              01
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">
              Unabhängigkeit von Parkseiten
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Domainparking verliert zunehmend an Effektivität, da Browser Werbebanner blockieren und Suchmaschinen Parkseiten deindexieren. Der DNS-Record läuft im Hintergrund weiter, ohne das Routing der eigentlichen Website zu stören.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-4 font-mono font-black text-sm">
              02
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">
              Automatisierte Registrars &amp; Crawler
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Registrare können über Standard-DNS-Resolver bei Whois-Abfragen prüfen, ob der Inhaber verkaufsbereit ist. Dies schafft einen nahtlosen Erwerbsprozess für Käufer direkt im Warenkorb des Registrars.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center mb-4 font-mono font-black text-sm">
              03
            </div>
            <h3 className="font-extrabold text-lg text-slate-900 mb-2">
              DNSSEC-Signierung &amp; Echtheit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Durch die Signierung der Zone via DNSSEC ist das Verkaufsangebot kryptografisch vor Manipulationen und DNS-Spoofing geschützt. Käufer können sicher sein, dass das Angebot tatsächlich vom Domaininhaber stammt.
            </p>
          </div>

        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-mono uppercase font-bold tracking-wider text-emerald-700">
            Häufig gestellte Fragen
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            FAQ zu RFC 10023
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base hover:bg-slate-50 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-slate-400 font-mono text-lg shrink-0">
                  {openFaq === idx ? '−' : '+'}
                </span>
              </button>
              {openFaq === idx && (
                <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Webmaster Embed Widget Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900">
              Webmaster Embed-Widget (Kostenfrei)
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4 max-w-2xl leading-relaxed">
            Integriere den RFC 10023 Live-Validator oder Generator direkt in deine eigene Website, dein Domain-Blog oder dein Registrar-Portal. Responsive und iframe-freigegeben.
          </p>
          <div className="relative">
            <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all">
              {embedCode}
            </pre>
            <button
              type="button"
              onClick={copyEmbed}
              className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmbed ? 'Kopiert!' : 'Code kopieren'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Citation Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CitationBox />
      </section>

    </div>
  );
}
