import React from 'react';
import { Link } from 'react-router-dom';
import { Terminal, Shield, ExternalLink, GitBranch, ArrowUpRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          
          {/* Col 1: Brand & Statement */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-emerald-400">
                <Terminal className="w-4 h-4" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white font-mono">
                RFC10023<span className="text-emerald-400">.de</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg">
              Das unabhängige DACH-Referenzportal und Entwickler-Toolkit zum IETF-Standard 
              <strong className="text-slate-200"> RFC 10023</strong> (<em>The &apos;_for-sale&apos; Underscored and Globally Scoped DNS Node Name</em>). 
              Dezentrale, standardisierte Kennzeichnung von Domain-Verkaufsabsichten ohne proprietäre Plattform-Abhängigkeit.
            </p>
            <div className="p-3.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-400 leading-relaxed">
              <strong className="text-slate-300 block mb-1">Unabhängigkeitshinweis:</strong>
              rfc10023.de ist ein freies Fach- und Informationsportal. Es besteht kein gesellschaftsrechtliches Verhältnis zur Internet Engineering Task Force (IETF), DENIC eG oder SIDN.
            </div>
          </div>

          {/* Col 2: Navigation & Tools */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Tools &amp; Matrix
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/validator" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  Live DNS-Validator <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/generator" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  1-Click Record Builder <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/hoster-matrix" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  Hoster-Kompatibilität <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/spezifikation" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  IETF Spezifikations-Guide <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              <li>
                <Link to="/rechner-embed" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1">
                  Webmaster Embed-Widget <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Primärquellen & Recht */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-400">
              Quellen &amp; Recht
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://www.rfc-editor.org/info/rfc10023"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  IETF RFC 10023 Original <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.sidn.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
                >
                  SIDN Registry (.nl) <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <Link to="/impressum" className="text-slate-300 hover:text-white transition-colors">
                  &rarr; Impressum (§ 5 DDG)
                </Link>
              </li>
              <li>
                <Link to="/datenschutz" className="text-slate-300 hover:text-white transition-colors">
                  Datenschutzerklärung (DSGVO)
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Facts Strip */}
        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>IETF RFC 10023 · Status: Informational · Stand: Sept. 2026</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-slate-400">
            <span>Zero-CDN</span>
            <span>•</span>
            <span>100 % DSGVO-konform</span>
            <span>•</span>
            <span>Cookielose Vercel Analytics</span>
            <span>•</span>
            <Link to="/impressum" className="text-slate-300 hover:underline">
              Impressum
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
