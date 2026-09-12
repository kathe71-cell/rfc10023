import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Cpu, Code2, Copy, Check, ArrowRight, ExternalLink, Terminal, CheckCircle2, ArrowUpRight, Zap, Shield, AlertTriangle, Layers, Sparkles, Scale } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import RfcValidator from '../components/RfcValidator';
import RfcGenerator from '../components/RfcGenerator';
import HosterMatrix from '../components/HosterMatrix';
import CitationBox from '../components/CitationBox';

export default function HomePage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const domainQuery = searchParams.get('d') || searchParams.get('domain');
    if (domainQuery) {
      const el = document.getElementById('validator');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [searchParams]);

  const embedCode = `<iframe src="https://rfc10023.de/widget-embed" width="100%" height="540" frameborder="0" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>\n<p style="font-size:11px; color:#64748b; font-family:sans-serif;">Standard: <a href="https://rfc10023.de" target="_blank">RFC 10023 DACH Portal</a></p>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const faqs = [
    {
      q: 'Warum RFC 10023 statt klassischem Domainparking bei Sedo oder Afternic?',
      a: 'Domainparking über externe Werbeseiten birgt handfeste Nachteile: Browser blockieren die Banner, Suchmaschinen strafen geparkte Adressen mit Deindexierung ab und bei einem Verkauf fallen 10 bis 15 Prozent Provision an. Mit RFC 10023 bleibt die Domain auf Ihren regulären Nameservern oder einer eigenen Webpräsenz erreichbar. Das Verkaufsangebot wird direkt im DNS signalisiert, lesbar für Registrare und Käufer ohne Zwischenhändler.'
    },
    {
      q: 'Muss jede Tag-Angabe in einen separaten TXT-Eintrag?',
      a: 'Nach RFC 10023 Abschnitt 2.1 lautet die Vorgabe der IETF: Jeder TXT-Eintrag enthält genau ein Tag-Wert-Paar (zum Beispiel Eintrag 1 mit "v=FORSALE1;fval=USD195000" und Eintrag 2 mit "v=FORSALE1;furi=https://..."). Unser Generator unterstützt sowohl dieses offizielle Verfahren als auch die einzeilige Variante für Nameserver mit einfacher Menüführung.'
    },
    {
      q: 'Wie erkennen Registrare und Broker, dass eine Domain zum Verkauf steht?',
      a: 'Registrare wie die niederländische Registry SIDN für .nl führen bei Verfügbarkeitsabfragen einen DNS-Query auf Typ 16 (TXT) am Knotennamen _for-sale durch. Findet das System den Eintrag "v=FORSALE1", zeigt der Registrar dem Interessenten direkt den Kaufpreis und den Kontakt an.'
    },
    {
      q: 'Welche Kosten entstehen durch den DNS-Standard?',
      a: 'Keine. RFC 10023 ist ein offener Standard der IETF. TXT-Einträge im DNS gehören bei praktisch allen Hostern zum kostenfreien Standardumfang einer Domain.'
    },
    {
      q: 'Wie schützt man sich vor Spam auf die Kontaktdaten?',
      a: 'Im Tag furi sollte man statt einer offenen Mailadresse besser einen Link zu einem geschützten Kontaktformular, einer Projektseite oder einem Treuhandkonto angeben. So bleibt die Domain maschinenlesbar, ohne Angriffsfläche für Adress-Sammler zu bieten.'
    }
  ];

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="pt-10 sm:pt-14 pb-12 border-b border-slate-200 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Col */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-800">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('hero.badge')}</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-950 leading-[1.05]">
                {t('hero.title_part1')}<br />
                {t('hero.title_part2')}<br />
                <span className="text-emerald-700 underline decoration-slate-300 underline-offset-8">
                  {t('hero.title_part3')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                {t('hero.desc')}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <a
                  href="#validator"
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('hero.cta_validate')}</span>
                </a>
                <a
                  href="#generator"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{t('hero.cta_generate')}</span>
                </a>
                <Link
                  to="/bulk-scan"
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('hero.cta_bulk')}</span>
                </Link>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-4 font-mono">
                <div>
                  <span className="block text-2xl font-black text-slate-950">0 %</span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">{t('hero.stat_commission')}</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-slate-950">TXT 16</span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">{t('hero.stat_record')}</span>
                </div>
                <div>
                  <span className="block text-2xl font-black text-emerald-700">v=FORSALE1</span>
                  <span className="text-[11px] text-slate-500 uppercase tracking-wider">{t('hero.stat_mandatory')}</span>
                </div>
              </div>

            </div>

            {/* Right Col Terminal Panel */}
            <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-5 border border-slate-800 text-slate-200 font-mono text-xs shadow-xl">
              
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
                  <span className="ml-2 text-[11px] text-slate-400">Terminal &mdash; DNS-Abfrage</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold uppercase">Live DoH</span>
              </div>

              <div className="space-y-2 text-slate-300 overflow-x-auto leading-relaxed">
                <p className="text-slate-500"># Abfrage der Verkaufsdaten einer Domain:</p>
                <p className="text-emerald-400">$ dig TXT _for-sale.forsaledns.net +short</p>
                <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-200 space-y-1 my-2">
                  <p className="text-emerald-300">&quot;v=FORSALE1;fval=USD195000&quot;</p>
                  <p className="text-emerald-300">&quot;v=FORSALE1;furi=mailto:sales@sun.com.py&quot;</p>
                  <p className="text-slate-400">&quot;v=FORSALE1;ftxt=Direct inquiries welcome&quot;</p>
                </div>
                <div className="pt-2 text-[11px] text-slate-400 border-t border-slate-800/80 space-y-1">
                  <p><strong className="text-slate-200">DNS-Knoten:</strong> _for-sale.forsaledns.net.</p>
                  <p><strong className="text-slate-200">DNSSEC:</strong> Signiert und authentifiziert</p>
                  <p><strong className="text-slate-200">Standard:</strong> IETF RFC 10023</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Praxisbeispiel: Registry SIDN (.nl)</span>
                <Link to="/spezifikation" className="text-emerald-400 hover:underline flex items-center gap-1 font-bold">
                  Spezifikation lesen &rarr;
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Feature Navigation Grid */}
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
              Bis zu 30 Domains parallel prüfen, DNSSEC abfragen und als CSV exportieren.
            </p>
          </Link>

          <Link
            to="/badge-generator"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-slate-900 text-emerald-400 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Verifikations-Badge</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Kopierbare Badges für Verkaufsseiten mit Direktlink zur Prüfung.
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
              Kostenfreie Schnittstelle für Entwickler, Skripte und Abfrage-Tools.
            </p>
          </Link>

          <Link
            to="/recht-leitfaden"
            className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all group"
          >
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900 w-fit mb-3 group-hover:scale-110 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Recht und Steuern</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Impressumspflicht nach § 5 DDG, Vertragsrecht und Preisangaben im DACH-Raum.
            </p>
          </Link>
        </div>
      </section>

      {/* Position-0 Definition */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-300/80 shadow-xs relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-white">
              Definition
            </span>
          </div>
          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-normal">
            <strong>RFC 10023</strong> beschreibt einen DNS-TXT-Eintrag unter <code>_for-sale.[domain]</code>. 
            Mit dem Pflichtfeld <code>v=FORSALE1;</code> sowie optionalen Angaben wie <code>fval</code> (Preis) und <code>furi</code> (Kontaktadresse) 
            hinterlegen Inhaber ihre Verkaufsbereitschaft direkt in der DNS-Zone der Domain.
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>IETF Standard &bull; ISSN: 2070-1721</span>
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

      {/* Bento Grid: Systemvergleich */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
            Hintergrund
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight mt-1">
            Warum DNS-Signale herkömmliches Parking ablösen
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card 1 */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                  Ablauf
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                Direkte Erkennung bei Whois- und Verfügbarkeitsprüfungen
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed mb-6">
                Bisher sah ein Interessent erst beim Aufruf im Webbrowser, ob eine Domain zum Verkauf steht. 
                RFC 10023 verlagert diese Information in das DNS:
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">1. Inhaber setzt TXT-Eintrag</span>
                  <span className="text-slate-500">_for-sale.domain.de</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">2. Resolver liest v=FORSALE1 aus</span>
                  <span className="text-emerald-700 font-bold">DoH / Port 53</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">3. Registrar zeigt Verkaufsoption</span>
                  <span className="text-slate-900 font-extrabold">Whois &amp; Suche</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Keine Bindung an externe Parkingservices</span>
              <Link to="/spezifikation" className="text-emerald-700 font-bold hover:underline">
                Technische Details &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                  Vergleich
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-4">
                Klassisches Parking versus RFC 10023
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">Verkaufsprovision</span>
                  <span className="text-emerald-400 font-bold">0 % (beim Direktverkauf)</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">Nameserver-Wechsel</span>
                  <span className="text-emerald-400 font-bold">Nicht nötig</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">Deindexierungsrisiko</span>
                  <span className="text-emerald-400 font-bold">Keines</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">DNSSEC-Signierung</span>
                  <span className="text-emerald-400 font-bold">Voll unterstützt</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Maschinenlesbar</span>
                  <span className="text-emerald-400 font-bold">Offizieller Standard</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              * Gilt für Direktverkäufe über den im DNS hinterlegten Kontaktlink.
            </div>
          </div>

          {/* Card 3 */}
          <div className="lg:col-span-12 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-3xl">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 tracking-wider">
                Praxiseinsatz
              </span>
              <h4 className="text-base font-bold text-slate-950">
                Registry SIDN (.nl) prüft RFC 10023 bei Domainabfragen
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Die niederländische Vergabestelle SIDN fragt bei Verfügbarkeitsprüfungen automatisiert den Eintrag <code>_for-sale</code> ab. 
                Steht eine .nl-Adresse zum Verkauf, erscheint der Hinweis samt Preis und Kontakt direkt im Suchergebnis.
              </p>
            </div>
            <a
              href="https://www.sidn.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>SIDN.nl öffnen</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>
      </section>

      {/* Hoster Matrix Section */}
      <section id="matrix" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <HosterMatrix />
      </section>

      {/* Quote */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <blockquote className="p-8 sm:p-10 rounded-2xl bg-slate-100 border-l-4 border-emerald-600 text-slate-900">
          <p className="text-lg sm:text-xl font-medium italic leading-relaxed">
            &bdquo;RFC 10023 trennt das Verkaufsangebot von der eigentlichen Website. Eine Domain muss nicht 
            brachliegen oder auf Werbebanner umgeleitet werden, um Kaufinteressenten zu signalisieren, 
            dass Angebote willkommen sind.&ldquo;
          </p>
          <footer className="mt-4 text-xs font-mono text-slate-600">
            &mdash; IETF DNSOP Working Group
          </footer>
        </blockquote>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
            Fragen und Antworten
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

      {/* Webmaster Widget Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Code2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-slate-950">
              Widget zum Einbinden
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4 max-w-2xl leading-relaxed">
            Binde den RFC 10023 Validator oder Generator direkt in deine Website, dein Blog oder ein Kundenportal ein.
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
