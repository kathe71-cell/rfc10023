import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Cpu, Code2, Copy, Check, ArrowRight, ExternalLink, Terminal, CheckCircle2, ArrowUpRight, Zap, Shield, AlertTriangle, Layers, Sparkles, Scale, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import RfcValidator from '../components/RfcValidator';
import RfcGenerator from '../components/RfcGenerator';
import HosterMatrix from '../components/HosterMatrix';
import CitationBox from '../components/CitationBox';
import { computeEcosystemStats } from '../data/ecosystem';

export default function HomePage() {
  const { t, language } = useLanguage();
  const langPrefix = language === 'en' ? '/en' : '';
  const [searchParams] = useSearchParams();
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const ecosystemStats = computeEcosystemStats();

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

  const embedUrl = language === 'en' ? 'https://www.rfc10023.de/en/widget-embed' : 'https://www.rfc10023.de/widget-embed';
  const embedLabel = language === 'en' ? 'IETF RFC 10023 Reference Portal' : 'RFC 10023 DACH Portal';
  const embedCode = `<iframe src="${embedUrl}" width="100%" height="540" frameborder="0" style="border-radius:12px; border:1px solid #e2e8f0;"></iframe>\n<p style="font-size:11px; color:#64748b; font-family:sans-serif;">${language === 'en' ? 'Reference' : 'Referenz'}: <a href="https://www.rfc10023.de${langPrefix}" target="_blank" rel="noopener noreferrer">${embedLabel}</a></p>`;

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  const faqs = [
    {
      q: 'Warum RFC 10023 statt klassischem Domainparking bei externen Werbediensten?',
      a: 'Herkömmliches Domainparking ersetzt die eigentlichen Webseiten-Inhalte durch Werbelinks Dritter. Mit RFC 10023 verbleibt die Domain in der gewohnten DNS-Zone des Inhabers. Das Verkaufsinteresse wird als eigenständiger TXT-Record am Knotennamen _for-sale publiziert – maschinenlesbar für Registrare und direkte Interessenten, ohne dass die Hauptseite verändert werden muss.'
    },
    {
      q: 'Muss jede Tag-Angabe in einen separaten TXT-Eintrag?',
      a: 'Ja. Nach RFC 10023 Abschnitt 2.1 lautet die normative Vorgabe der IETF: Jeder TXT-Eintrag enthält genau ein Tag-Wert-Paar nach der Versionskennung (zum Beispiel Eintrag 1 mit „v=FORSALE1;fval=EUR2500“ und Eintrag 2 mit „v=FORSALE1;furi=https://...“). Unser Generator erzeugt standardmäßig dieses normkonforme Multi-Record-RRset.'
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

              <h1 className="text-2xl sm:text-4xl lg:text-[40px] font-extrabold tracking-tight text-slate-950 leading-snug">
                <span>{t('hero.title_part1')} {t('hero.title_part2')}</span>
                <span className="block mt-1 sm:mt-1.5 text-emerald-700 underline decoration-slate-300 decoration-2 underline-offset-8">
                  {t('hero.title_part3')}
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-700 leading-relaxed max-w-2xl font-normal">
                {t('hero.desc')}
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2">
                <a
                  href="#generator"
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-center"
                >
                  <Cpu className="w-4 h-4" />
                  <span>{t('hero.cta_generate')}</span>
                </a>
                <a
                  href="#validator"
                  className="px-5 py-3 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-mono font-bold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 text-center"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{t('hero.cta_validate')}</span>
                </a>
                <Link
                  to={`${langPrefix}/bulk-scan`}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 text-center"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{t('hero.cta_bulk')}</span>
                </Link>
              </div>

              <div className="pt-6 border-t border-slate-100 grid grid-cols-3 gap-2 sm:gap-3 font-mono">
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0 text-center sm:text-left">
                  <span className="block text-sm sm:text-base font-bold text-slate-900 truncate">0 %</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider block truncate">{t('hero.stat_commission')}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0 text-center sm:text-left">
                  <span className="block text-sm sm:text-base font-bold text-slate-900 truncate">TXT (16)</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider block truncate">{t('hero.stat_record')}</span>
                </div>
                <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200 min-w-0 text-center sm:text-left">
                  <span className="block text-[11px] sm:text-base font-bold text-emerald-700 tracking-tight truncate" title="Informational">Informational</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider block truncate">IETF Status</span>
                </div>
              </div>

            </div>

            {/* Right Col Terminal Panel - Accurately showing live forsaledns.net output without fake claims */}
            <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 text-slate-200 font-mono text-xs shadow-xl">
              
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-300 truncate">{t('hero.terminal_header')}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-bold shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>Live DNS Query</span>
                </div>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed text-[11px] sm:text-xs">
                <p className="text-slate-500">{t('hero.terminal_comment')}</p>
                <div className="overflow-x-auto pb-0.5">
                  <p className="text-emerald-400 whitespace-nowrap">$ dig TXT _for-sale.forsaledns.net +short</p>
                </div>
                <div className="p-2.5 sm:p-3 bg-slate-900/90 rounded-lg border border-slate-800 text-slate-200 space-y-1 my-2 overflow-x-auto">
                  <p className="text-emerald-300 whitespace-nowrap sm:whitespace-normal sm:break-all">&quot;v=FORSALE1;furi=mailto:sales@sun.com.py&quot;</p>
                  <p className="text-emerald-300 whitespace-nowrap sm:whitespace-normal sm:break-all">&quot;v=FORSALE1;fval=USD195000&quot;</p>
                </div>
                <div className="pt-2 text-[10px] sm:text-[11px] text-slate-400 border-t border-slate-800/80 space-y-1">
                  <p className="break-words"><strong className="text-slate-200">{t('hero.terminal_node')}</strong> _for-sale.forsaledns.net.</p>
                  <p className="break-words"><strong className="text-slate-200">{t('hero.terminal_dnssec')}</strong> AD-Bit = false ({language === 'en' ? 'Not validated' : 'Nicht validiert'})</p>
                  <p className="break-words"><strong className="text-slate-200">{t('hero.terminal_standard')}</strong> IETF RFC 10023 (Informational)</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] gap-2">
                <span className="text-slate-500 text-[10px] sm:text-[11px] truncate">{language === 'en' ? 'Live reference: forsaledns.net' : 'Live-Referenz: forsaledns.net'}</span>
                <Link to={language === 'en' ? '/en/specification' : '/spezifikation'} className="text-emerald-400 hover:underline flex items-center gap-1 font-bold shrink-0 text-[10px] sm:text-[11px]">
                  {t('hero.terminal_spec_link')}
                </Link>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* Audience Entry Cards — direkt unter Hero */}
      <section className="bg-slate-50 border-b border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              {t('audience.headline')}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">{t('audience.sub')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

            {/* Card 1 — Einzelne Domain */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-lg transition-all duration-200 p-7 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                  {t('audience.domainer_label')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2 leading-snug">
                {t('audience.domainer_title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">
                {t('audience.domainer_desc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                <Link
                  to={`${langPrefix}/generator`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-950 text-white font-bold text-sm hover:bg-slate-800 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  {t('audience.domainer_cta1')}
                </Link>
                <Link
                  to={`${langPrefix}/validator`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold text-sm hover:border-emerald-500 hover:text-emerald-700 transition-colors"
                >
                  {t('audience.domainer_cta2')}
                </Link>
              </div>
            </div>

            {/* Card 2 — Portfolio */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-lg transition-all duration-200 p-7 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                  <Layers className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                  {t('audience.portfolio_label')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2 leading-snug">
                {t('audience.portfolio_title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">
                {t('audience.portfolio_desc')}
              </p>
              <div className="mt-auto">
                <Link
                  to={`${langPrefix}/bulk-scan`}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-sm hover:bg-amber-500 transition-colors"
                >
                  <Layers className="w-4 h-4" />
                  {t('audience.portfolio_cta')}
                </Link>
              </div>
            </div>

            {/* Card 3 — Entwickler & Registrare */}
            <div className="bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-lg transition-all duration-200 p-7 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-xl bg-slate-900 text-emerald-400">
                  <Code2 className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  {t('audience.dev_label')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-950 mb-2 leading-snug">
                {t('audience.dev_title')}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">
                {t('audience.dev_desc')}
              </p>
              <div className="flex flex-col sm:flex-row gap-2 mt-auto">
                <Link
                  to={language === 'en' ? '/en/specification' : '/spezifikation'}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  {t('audience.dev_cta1')}
                </Link>
                <Link
                  to={`${langPrefix}/api-docs`}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-semibold text-sm hover:border-slate-500 transition-colors font-mono"
                >
                  {t('audience.dev_cta2')}
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Position-0 Definition */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-7 rounded-2xl bg-white border border-slate-300/80 shadow-xs relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-900 text-white">
              {t('def.badge')}
            </span>
          </div>
          <p className="text-base sm:text-lg text-slate-900 leading-relaxed font-normal">
            {t('def.text')}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>IETF RFC 10023 (Informational) &bull; ISSN: 2070-1721</span>
            <Link to={language === 'en' ? '/en/specification' : '/spezifikation'} className="text-emerald-700 font-bold hover:underline">
              {t('def.spec_link')}
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
            {t('bento.bg_badge')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
            {t('bento.main_title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Card 1 */}
          <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                  {t('bento.card1_badge')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-950 mb-3">
                {t('bento.card1_title')}
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed mb-6">
                {t('bento.card1_desc')}
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">{t('bento.step1')}</span>
                  <span className="text-slate-500">_for-sale.domain.de</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">{t('bento.step2')}</span>
                  <span className="text-emerald-700 font-bold">DoH / Port 53</span>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-800 font-bold">{t('bento.step3')}</span>
                  <span className="text-slate-900 font-extrabold">Whois &amp; Search</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{t('bento.card1_footer')}</span>
              <Link to={language === 'en' ? '/en/specification' : '/spezifikation'} className="text-emerald-700 font-bold hover:underline">
                {t('bento.card1_tech_link')}
              </Link>
            </div>
          </div>

          {/* Card 2 */}
          <div className="lg:col-span-5 p-6 sm:p-8 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-slate-800 text-emerald-400 border border-slate-700">
                  {t('bento.card2_badge')}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-4">
                {t('bento.card2_title')}
              </h3>

              <div className="space-y-3 text-xs font-mono">
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">{t('bento.row_commission')}</span>
                  <span className="text-emerald-400 font-bold">{t('bento.row_commission_val')}</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">{t('bento.row_ns')}</span>
                  <span className="text-emerald-400 font-bold">{t('bento.row_ns_val')}</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">{t('bento.row_deindex')}</span>
                  <span className="text-emerald-400 font-bold">{t('bento.row_deindex_val')}</span>
                </div>
                <div className="pb-2.5 border-b border-slate-800 flex justify-between">
                  <span className="text-slate-400">{t('bento.row_dnssec')}</span>
                  <span className="text-emerald-400 font-bold">{t('bento.row_dnssec_val')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{t('bento.row_machine')}</span>
                  <span className="text-emerald-400 font-bold">{t('bento.row_machine_val')}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
              {t('bento.card2_note')}
            </div>
          </div>

          {/* Card 3 */}
          <div className="lg:col-span-12 p-6 sm:p-7 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1 max-w-3xl">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-700 tracking-wider">
                {t('bento.card3_badge')}
              </span>
              <h4 className="text-base font-bold text-slate-950">
                {t('bento.card3_title')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t('bento.card3_desc')}
              </p>
            </div>
            <a
              href="https://www.sidn.nl"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>{t('bento.card3_btn')}</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          </div>

        </div>
      </section>

      {/* Ecosystem & Adoption Teaser (Requirement 16) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-md relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 font-mono text-[10px] font-semibold text-emerald-400">
                <Globe className="w-3 h-3" />
                <span>{t('home.teaser_badge')}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {t('home.teaser_title')}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed font-normal max-w-2xl">
                {t('home.teaser_text')}
              </p>
              <div className="pt-2">
                <Link
                  to={language === 'en' ? '/en/ecosystem' : '/oekosystem'}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs transition-colors shadow-sm"
                >
                  <span>{t('home.teaser_cta')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 grid grid-cols-3 gap-3 font-mono">
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <span className="block text-xl sm:text-2xl font-black text-white">
                  {(ecosystemStats.detectedDomains / 1000).toFixed(0)}k+
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                  {language === 'en' ? 'Records' : 'Records'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <span className="block text-xl sm:text-2xl font-black text-emerald-400">
                  {ecosystemStats.totalIntegrations}+
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                  {language === 'en' ? 'Tools & Integrations' : 'Tools & Dienste'}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                <span className="block text-xl sm:text-2xl font-black text-white">
                  2026
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-0.5">
                  {language === 'en' ? 'Published' : 'Publiziert'}
                </span>
              </div>
            </div>

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
            {t('quote.text')}
          </p>
          <footer className="mt-4 text-xs font-mono text-slate-600">
            {t('quote.author')}
          </footer>
        </blockquote>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
              {t('faq.badge')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
              {t('faq.title')}
            </h2>
          </div>
          <Link
            to={`${langPrefix}/faq`}
            className="text-xs font-mono font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>{t('faq.view_all')}</span>
          </Link>
        </div>

        <div className="space-y-3">
          {[
            { q: t('faq.q1'), a: t('faq.a1') },
            { q: t('faq.q2'), a: t('faq.a2') },
            { q: t('faq.q3'), a: t('faq.a3') },
            { q: t('faq.q4'), a: t('faq.a4') },
            { q: t('faq.q5'), a: t('faq.a5') },
          ].map((faq, idx) => (
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
              {t('widget.title')}
            </h3>
          </div>
          <p className="text-xs text-slate-600 mb-4 max-w-2xl leading-relaxed">
            {t('widget.desc')}
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
              <span>{copiedEmbed ? t('widget.copied') : t('widget.copy_btn')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* E-E-A-T Editorial Trust- & Data Sources Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-700 block">
                  {t('trust.badge')}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-950">
                  {t('trust.title')}
                </h3>
              </div>
            </div>
            <span className="text-xs font-mono text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shrink-0">
              {t('trust.reviewed_by')}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">{t('trust.standards_label')}</span>
              <span className="text-slate-900 font-semibold">{t('trust.standards_val')}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">{t('trust.sources_label')}</span>
              <span className="text-slate-900 font-semibold">{t('trust.sources_val')}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal pt-1">
            {t('trust.methodology')}
          </p>
        </div>
      </section>

      {/* Citation Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CitationBox />
      </section>

    </div>
  );
}
