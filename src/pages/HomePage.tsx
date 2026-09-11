import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Cpu, Code2, Copy, Check, ArrowRight, ExternalLink, Terminal, CheckCircle2, ArrowUpRight, Zap, Shield, AlertTriangle, Layers, Sparkles, Scale } from 'lucide-react';
import RfcValidator from '../components/RfcValidator';
import RfcGenerator from '../components/RfcGenerator';
import HosterMatrix from '../components/HosterMatrix';
import CitationBox from '../components/CitationBox';

export default function HomePage() {
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const embedCode = `<iframe src="https://rfc10023.de/rechner-embed" width="100%" height="540" frameborder="0" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>\n<p style="font-size:11px; color:#64748b; font-family:sans-serif;">Standard: <a href="https://rfc10023.de" target="_blank">RFC 10023 DACH Hub</a></p>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const faqs = [
    {
      q: 'Warum RFC 10023 statt klassischem Sedo- oder Dan-Parking?',
      a: 'Domainparking über externe Werbeseiten birgt massive Nachteile: Browser-Adblocker sperren die Seiten, Google straft geparkte Domains mit Deindexierung ab und bei einem Verkauf fallen 10 bis 15 Prozent Vermittlungsprovision an. Mit RFC 10023 bleibt die Domain auf Ihren regulären Nameservern oder einer eigenen Webpräsenz erreichbar. Das Verkaufsangebot wird transparent im DNS signalisiert – direkt für Registrare und Käufer ohne Zwischenhändler.'
    },
    {
      q: 'Muss jede Tag-Angabe in einen separaten TXT-Eintrag?',
      a: 'Nach RFC 10023 Section 2.1 lautet die strikte IETF-Vorgabe: Jeder TXT-Record darf maximal ein Tag-Wert-Paar enthalten (z. B. Record 1: "v=FORSALE1;fval=USD195000", Record 2: "v=FORSALE1;furi=https://..."). Unser Generator unterstützt sowohl dieses offizielle Multi-Record-Verfahren als auch den Single-Line-Fallback für Webhoster mit restriktiven Kontrollpanels.'
    },
    {
      q: 'Wie erkennen Registrare und Broker, dass eine Domain zum Verkauf steht?',
      a: 'Moderne Registrare (Pionier: die niederländische Registry SIDN für .nl) führen bei Whois- oder Verfügbarkeitsabfragen einen DNS-Query auf Typ 16 (TXT) am Hostnamen _for-sale durch. Wird ein valider v=FORSALE1-Header gefunden, zeigt der Registrar dem Interessenten direkt die Kaufoption und den im fval-Tag hinterlegten Festpreis an.'
    },
    {
      q: 'Welche Kosten oder Gebühren entstehen durch den DNS-Standard?',
      a: 'Keine. RFC 10023 ist ein offener Internet-Standard der IETF. DNS-TXT-Records sind bei allen gängigen Hostern kostenfrei im Leistungsumfang der Domain enthalten.'
    },
    {
      q: 'Wie schützt man sich vor Spam oder Scraping der Kontaktdaten?',
      a: 'Im Tag furi sollte idealerweise kein ungeschützter Mailto-Link, sondern ein Link zu einem geschützten Kontaktformular, einer Escrow-Landingpage oder einem Treuhanddienst hinterlegt werden. So bleibt die Domain maschinenlesbar, ohne Angriffsfläche für Spambots zu bieten.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section: Editorial, Direct, Anti-AI-Slop */}
      <section className="pt-10 sm:pt-14 pb-12 border-b border-slate-200 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Col: 7 cols */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Technical Node Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-800">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                <span>IETF RFC 10023 &bull; DNS Node: <strong className="text-slate-950">_for-sale</strong></span>
              </div>

              {/* Display Headline */}
              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-[1.05]">
                Kein Parking.<br />
                Kein Redirect-Zwang.<br />
                <span className="text-emerald-700 underline decoration-slate-300 underline-offset-8">
                  Verkaufen direkt im DNS.
                </span>
              </h1>

              {/* Subtext: Specific, grounded, direct */}
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                Der IETF-Standard <strong className="text-slate-900 font-bold">RFC 10023</strong> definiert die offizielle 
                Discovery-Schicht für Domainverkäufe. Statt Traffic auf Werbe-Parkingseiten umzuleiten, hinterlegen Inhaber Preis 
                und Kontakt im DNS-TXT-Record – maschinenlesbar für Registrare, Broker und automatisierte Erwerbs-Tools.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#validator"
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Domain live prüfen</span>
                </a>
                <a
                  href="#generator"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Record generieren</span>
                </a>
                <Link
                  to="/bulk-scan"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bulk-Scan &rarr;</span>
                </Link>
              </div>

              {/* Technical Facts Grid */}
              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 font-mono">
                <div>
                  <span className="block text-2xl font-black text-slate-950">0 %</span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">Provision</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-950">TXT 16</span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">Record-Typ</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-emerald-700">v=FORSALE1</span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">Mandatory Tag</span>
                </div>
              </div>

            </div>

            {/* Right Col: 5 cols Terminal Panel */}
            <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-5 border border-slate-800 text-slate-200 font-mono text-xs shadow-xl">
              
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  <span className="ml-2 text-[11px] text-slate-400">terminal &mdash; dig query</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Live DoH Output</span>
              </div>

              <div className="space-y-2 text-slate-300 overflow-x-auto leading-relaxed">
                <p className="text-slate-500"># Abfrage eines RFC 10023 Resource Record Sets:</p>
                <p className="text-emerald-400">$ dig TXT _for-sale.forsaledns.net +short</p>
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-200 space-y-1 my-2">
                  <p className="text-emerald-300">&quot;v=FORSALE1;fval=USD195000&quot;</p>
                  <p className="text-emerald-300">&quot;v=FORSALE1;furi=mailto:sales@sun.com.py&quot;</p>
                  <p className="text-slate-400">&quot;v=FORSALE1;ftxt=Direct inquiries welcome&quot;</p>
                </div>
                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80 space-y-1">
                  <p><strong className="text-slate-200">DNS Node:</strong> _for-sale.forsaledns.net.</p>
                  <p><strong className="text-slate-200">DNSSEC:</strong> Validated (RRSIG Authenticated)</p>
                  <p><strong className="text-slate-200">Standard:</strong> IETF RFC 10023 (Section 2.1)</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Referenz: SIDN Registry (.nl)</span>
                <Link to="/spezifikation" className="text-emerald-400 hover:underline flex items-center gap-1 font-bold">
                  Spezifikation lesen &rarr;
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Feature Teaser Grid: The 4 Hub Modules */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/bulk-scan"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Portfolio Bulk-Scanner</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bis zu 30 Domains gleichzeitig scannen, DNSSEC prüfen und als CSV exportieren.
            </p>
          </Link>

          <Link
            to="/badge-generator"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Trust-Badge Generator</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kopierbare HTML- und Markdown-Badges für Parking- &amp; Verkaufsseiten.
            </p>
          </Link>

          <Link
            to="/api-docs"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-slate-100 text-slate-800 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Öffentliche REST-API</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kostenlose JSON-Schnittstelle ohne Auth für Devs, CLI-Tools und Scraper.
            </p>
          </Link>

          <Link
            to="/recht-leitfaden"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Recht &amp; Steuern Guide</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Impressumspflicht (§ 5 DDG), BGB-Vertragsrecht und PAngV für DACH.
            </p>
          </Link>
        </div>
      </section>

      {/* Position-0 Definitions-Box (Featured Snippet Optimized) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-300/80 shadow-xs relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-white">
              IETF Norm-Definition
            </span>
          </div>
          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-normal">
            <strong>RFC 10023</strong> (<em>The &apos;_for-sale&apos; Underscored and Globally Scoped DNS Node Name</em>) 
            beschreibt einen maschinenlesbaren DNS-TXT-Eintrag unter <code>_for-sale.[domain]</code>. 
            Mit dem zwingenden Header <code>v=FORSALE1;</code> und optionalen Tags wie <code>fval</code> (Preis) und <code>furi</code> (Kontaktadresse) 
            ermöglicht er die dezentrale Kennzeichnung von Domain-Verkaufsangeboten direkt im Domain Name System.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Internet Engineering Task Force &bull; ISSN: 2070-1721</span>
            <Link to="/spezifikation" className="text-emerald-700 font-bold hover:underline">
              RFC 10023 Spezifikation &rarr;
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

      {/* Asymmetric Bento-Grid: Architektur & Hard Facts */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
            Systemvergleich &amp; Architektur
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
            Warum DNS-Signale herkömmliches Parking ablösen
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bento Card 1: 7 cols (Architectural Flow) */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Discovery-Protokoll
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                Direkte Integration in Registry- &amp; Registrar-Whois
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed mb-6">
                Bislang erfuhr ein Kaufinteressent oft erst durch den manuellen Aufruf einer Domain, ob diese zum Verkauf steht. 
                RFC 10023 verlagert diese Information in die <strong>Infrastrukturebene</strong>:
              </p>

              {/* Diagram Flow */}
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">1. Domaininhaber setzt TXT-Record</span>
                  <span className="text-slate-500">_for-sale.domain.de</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">2. Resolver liest v=FORSALE1 aus</span>
                  <span className="text-emerald-700 font-bold">DoH / Port 53</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">3. Registrar zeigt For-Sale im Check</span>
                  <span className="text-slate-900 font-extrabold">Whois &amp; Checkout</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Keine Abhängigkeit von Parking-Plattformen</span>
              <Link to="/spezifikation" className="text-emerald-700 font-bold hover:underline">
                Technische Details &rarr;
              </Link>
            </div>
          </div>

          {/* Bento Card 2: 5 cols (Hard Comparison Table) */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                  Systemvergleich
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-4">
                Klassisches Parking vs. RFC 10023
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">Verkaufsprovision</span>
                  <span className="text-emerald-400 font-bold">0 % (Direkt)</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">Nameserver-Zwang</span>
                  <span className="text-emerald-400 font-bold">Nein (Beliebiger DNS)</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">Google Deindexierung</span>
                  <span className="text-emerald-400 font-bold">Kein Risiko</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">DNSSEC Signierung</span>
                  <span className="text-emerald-400 font-bold">100 % Kompatibel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maschinenlesbar</span>
                  <span className="text-emerald-400 font-bold">IETF Standard</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              * Gilt für Direktverkäufe über den im DNS hinterlegten Kontaktlink.
            </div>
          </div>

          {/* Bento Card 3: 12 cols (SIDN Case Study) */}
          <div className="lg:col-span-12 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-3xl">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 tracking-wider">
                Praxis-Referenz
              </span>
              <h4 className="text-base font-bold text-slate-950">
                SIDN (.nl Registry) schaltet RFC 10023 im Whois scharf
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Die niederländische Registry SIDN prüft bei Domain-Verfügbarkeitsabfragen automatisiert den Knotenpunkt <code>_for-sale</code>. 
                Steht eine .nl-Domain zum Verkauf, wird dies direkt in den offiziellen Suchergebnissen der Registry angezeigt. 
                Damit ist RFC 10023 der erste Verkaufsstandard, der von einer staatlich beauftragten Registry nativ unterstützt wird.
              </p>
            </div>
            <a
              href="https://www.sidn.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>SIDN.nl ansehen</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>
      </section>

      {/* Hoster Matrix Section */}
      <section id="matrix" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <HosterMatrix />
      </section>

      {/* Pull Quote im Editorial Magazin-Stil */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <blockquote className="p-8 sm:p-10 rounded-2xl bg-slate-100 border-l-4 border-emerald-600 text-slate-900">
          <p className="text-lg sm:text-xl font-medium italic leading-relaxed">
            &bdquo;RFC 10023 schließt eine historische Lücke im Domain Name System: Es trennt das Verkaufs-Signal 
            von der Webpräsenz. Eine Domain muss nicht länger brachliegen oder auf billige Werbebanner umgeleitet werden, 
            nur um zu signalisieren, dass der Inhaber für Angebote offen ist.&ldquo;
          </p>
          <footer className="mt-4 text-xs font-mono text-slate-600">
            &mdash; Auszug aus den IETF DNSOP Working Group Protokollen
          </footer>
        </blockquote>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
            Fragen &amp; Antworten
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
            Häufige Fragen zu RFC 10023
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
            <h3 className="text-lg font-bold text-slate-950">
              Webmaster Embed-Widget (Kostenfrei einbinden)
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4 max-w-2xl leading-relaxed">
            Binde den RFC 10023 Live-Validator oder Generator direkt in dein Blog, Forum oder dein Registrar-Portal ein. 
            Responsive und für Iframes via Content-Security-Policy autorisiert.
          </p>
          <div className="relative">
            <pre className="p-4 bg-slate-950 text-emerald-300 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap select-all">
              {embedCode}
            </pre>
            <button
              type="button"
              onClick={copyEmbed}
              className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-mono font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-sm"
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
