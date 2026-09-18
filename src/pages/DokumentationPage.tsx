import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Code2, Database, Scale, HelpCircle, Sparkles, ArrowRight, ExternalLink, ShieldCheck, Cpu, Layers } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function DokumentationPage() {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const langPrefix = isEn ? '/en' : '';

  const docSections = [
    {
      title: isEn ? 'RFC 10023 Specification' : 'RFC 10023 Spezifikation',
      desc: isEn
        ? 'Complete breakdown of IETF RFC 10023 (Informational, July 2026). ABNF grammar, tags (fval, furi, ftxt, fcod), limits, and conventions.'
        : 'Vollständige Aufschlüsselung der IETF-Veröffentlichung RFC 10023 (Informational, Juli 2026). ABNF-Grammatik, Tags (fval, furi, ftxt, fcod) und Grenzwerte.',
      path: `${langPrefix}/spezifikation`,
      icon: BookOpen,
      tag: 'ABNF & Syntax',
    },
    {
      title: isEn ? 'DNS Provider Guides & Matrix' : 'DNS-Anbieter Anleitungen & Matrix',
      desc: isEn
        ? 'Step-by-step instructions for Cloudflare, Hetzner, INWX, Netcup, STRATO, IONOS, AWS Route 53, and OVHcloud with underscore support status.'
        : 'Schritt-für-Schritt-Anleitungen für Cloudflare, Hetzner, INWX, Netcup, STRATO, IONOS, AWS Route 53 und OVHcloud.',
      path: `${langPrefix}/hoster-matrix`,
      icon: Database,
      tag: isEn ? 'Zone Editors' : 'Zoneneditoren',
    },
    {
      title: isEn ? 'REST API Documentation' : 'REST-API Dokumentation',
      desc: isEn
        ? 'Integrate live RFC 10023 validation and DoH checks into your registrar, broker, or domain portfolio software via /api/v1/validate.'
        : 'Binde Live-RFC-10023-Prüfungen per JSON-REST-Schnittstelle in Registrare, Brokerage-Plattformen oder Portfolio-Tools ein.',
      path: `${langPrefix}/api-docs`,
      icon: Code2,
      tag: 'JSON API',
    },
    {
      title: isEn ? 'Legal & Tax Guidelines' : 'Recht, Steuern & Praxisleitfaden',
      desc: isEn
        ? 'German & EU legal frameworks: Imprint duty under § 5 DDG, price indications, contract conclusion, and tax aspects of domain sales.'
        : 'Rechtlicher Rahmen im DACH-Raum: Impressumspflicht nach § 5 DDG, PAngV, Vertragsschluss und steuerliche Aspekte beim Domainverkauf.',
      path: isEn ? '/en/legal-guidelines' : '/recht-leitfaden',
      icon: Scale,
      tag: isEn ? 'Legal Compliance' : 'Rechtssicherheit',
    },
    {
      title: isEn ? 'Frequently Asked Questions (FAQ)' : 'Häufig gestellte Fragen (FAQ)',
      desc: isEn
        ? 'Detailed answers regarding DNSSEC, multi-record RRsets, costs, email spam protection, and registry adoption (e.g. SIDN .nl).'
        : 'Ausführliche Antworten zu DNSSEC, Multi-Record RRsets, Kostenfreiheit, Spam-Schutz und Registrar-Unterstützung (z. B. SIDN .nl).',
      path: `${langPrefix}/faq`,
      icon: HelpCircle,
      tag: 'FAQ-Hub',
    },
    {
      title: isEn ? 'Verification Badge' : 'Prüf-Badge für Verkaufsseiten',
      desc: isEn
        ? 'Embed neutral verification badges linking directly to live DNS inspection for your domain landing pages.'
        : 'Erstelle neutrale Prüf-Badges für Landingpages mit Direktverlinkung zur Live-DNS-Verifikation.',
      path: `${langPrefix}/badge-generator`,
      icon: Sparkles,
      tag: 'Tool',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
      
      {/* Header */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
          <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isEn ? 'Documentation Hub' : 'Dokumentations-Zentrum'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
          {isEn ? 'RFC 10023 Reference & Guides' : 'Dokumentation zu RFC 10023'}
        </h1>
        <p className="text-base sm:text-lg text-slate-700 leading-relaxed">
          {isEn
            ? 'Everything you need to configure, inspect, and automate DNS for-sale indicators according to the official IETF Informational publication RFC 10023.'
            : 'Spezifikationen, Zoneneditor-Anleitungen, REST-API-Referenz und rechtliche Leitfäden zur Signalisierung von Domainverkäufen im DNS nach RFC 10023.'}
        </p>
      </div>

      {/* Grid of Docs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {docSections.map((sec) => {
          const Icon = sec.icon;
          return (
            <Link
              key={sec.path}
              to={sec.path}
              className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-slate-100 text-slate-800 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-50 border border-slate-200 text-slate-600">
                    {sec.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-950 mb-2 group-hover:text-emerald-800 transition-colors">
                  {sec.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  {sec.desc}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-mono font-bold text-slate-700 group-hover:text-emerald-700">
                <span>{isEn ? 'Read section' : 'Dokumentation öffnen'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Official IETF Reference Box */}
      <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
            Offizielle Primärquelle
          </span>
        </div>
        <h3 className="text-xl font-bold text-white">
          IETF RFC 10023: The '_for-sale' Underscored and Globally Scoped DNS Node Name
        </h3>
        <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
          Veröffentlicht im Juli 2026 durch das Internet Engineering Steering Group (IESG) als <strong>Informational RFC</strong>. 
          Autor: Marco Davids (SIDN Labs). ISSN: 2070-1721.
        </p>
        <div className="flex flex-wrap gap-4 pt-2">
          <a
            href="https://www.rfc-editor.org/rfc/rfc10023.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold transition-colors"
          >
            <span>Original RFC 10023 Text (RFC Editor)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <a
            href="https://datatracker.ietf.org/doc/rfc10023/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold transition-colors"
          >
            <span>IETF Datatracker</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

    </div>
  );
}
