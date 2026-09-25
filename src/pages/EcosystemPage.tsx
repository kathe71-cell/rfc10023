import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Globe,
  Layers,
  Search,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Code2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText,
  Mail,
  Filter,
  Server,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import CitationBox from '../components/CitationBox';
import {
  ECOSYSTEM_DATA,
  ADOPTION_HISTORY,
  ADOPTION_HISTORY_FORSALEDNS,
  ForSaleDnsHistoryEntry,
  TIMELINE_DATA,
  getMetaAdoptionTier,
  getTierBadgeInfo,
  getStatusBadgeInfo,
  getCategoryLabel,
  computeEcosystemStats,
} from '../data/ecosystem';
import { computeDynamicYScale, calculateSvgY } from '../utils/chartScaling';

function formatDisplayDate(dateStr: string, isEn: boolean): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 2) {
    const [year, month] = parts;
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthsDe = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    const mIdx = parseInt(month, 10) - 1;
    return isEn ? `${monthsEn[mIdx] || month} ${year}` : `${monthsDe[mIdx] || month} ${year}`;
  }
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return isEn ? `${year}-${month}-${day}` : `${day}.${month}.${year}`;
  }
  return dateStr;
}

function formatChartAxisDate(dateStr: string, isEn: boolean): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [, month, day] = parts;
  if (!isEn) {
    // German date format on chart axis: DD.MM. (e.g. 15.08., 24.09.)
    return `${day}.${month}.`;
  }
  const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mIdx = parseInt(month, 10) - 1;
  const monthName = monthsEn[mIdx] || month;
  return `${monthName} ${parseInt(day, 10)}`;
}


export default function EcosystemPage() {
  const location = useLocation();
  const { language } = useLanguage();
  const isEn = location.pathname === '/en' || location.pathname.startsWith('/en/') || language === 'en';
  const langPrefix = isEn ? '/en' : '';
  const pagePath = isEn ? '/en/ecosystem' : '/oekosystem';
  const canonicalUrl = `https://www.rfc10023.de${pagePath}`;

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const stats = useMemo(() => computeEcosystemStats(), []);

  // Filter integrations
  const filteredIntegrations = useMemo(() => {
    return ECOSYSTEM_DATA.integrations.filter((item) => {
      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Meta Tier filter
      if (selectedTier !== 'all') {
        const tier = getMetaAdoptionTier(item.supportType);
        if (tier !== selectedTier) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (isEn && item.descriptionEn ? item.descriptionEn : item.description).toLowerCase();
        const name = item.name.toLowerCase();
        const cat = item.category.toLowerCase();
        const support = item.supportType.toLowerCase();
        if (!name.includes(q) && !desc.includes(q) && !cat.includes(q) && !support.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [selectedCategory, selectedTier, searchQuery, isEn]);

  // Categories list for filter pills
  const categories: { id: string; labelDe: string; labelEn: string }[] = [
    { id: 'all', labelDe: 'Alle', labelEn: 'All' },
    { id: 'registry', labelDe: 'Registry', labelEn: 'Registry' },
    { id: 'registrar', labelDe: 'Registrar', labelEn: 'Registrar' },
    { id: 'domain-intelligence', labelDe: 'Domain Intelligence', labelEn: 'Domain Intelligence' },
    { id: 'aftermarket-search', labelDe: 'Aftermarket & Suche', labelEn: 'Aftermarket & Search' },
    { id: 'developer-ai', labelDe: 'Entwickler & KI / MCP', labelEn: 'Developer & AI / MCP' },
    { id: 'dataset-monitoring', labelDe: 'Datensätze & Telemetrie', labelEn: 'Datasets & Telemetry' },
    { id: 'browser-utility', labelDe: 'Browser & Utilities', labelEn: 'Browser & Utilities' },
  ];

  // Schema.org JSON-LD
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': `${canonicalUrl}#webpage`,
        url: canonicalUrl,
        name: isEn
          ? 'RFC 10023 Adoption & Ecosystem – Tools, Integrations and Statistics'
          : 'RFC 10023 Adoption & Ökosystem – Tools, Integrationen und Statistiken',
        description: isEn
          ? 'Comprehensive overview of RFC 10023 and _for-sale DNS record adoption: implementations, tools, registrars, datasets and verified telemetry.'
          : 'Aktuelle Übersicht zur Verbreitung von RFC 10023 und dem _for-sale DNS Record: Implementierungen, Tools, Registrare, Datensätze und Adoption.',
        inLanguage: isEn ? 'en-US' : 'de-DE',
        isPartOf: {
          '@type': 'WebSite',
          '@id': 'https://www.rfc10023.de/#website',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isEn ? 'Home' : 'Startseite',
            item: `https://www.rfc10023.de${langPrefix}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isEn ? 'Ecosystem & Adoption' : 'Ökosystem & Adoption',
            item: canonicalUrl,
          },
        ],
      },
      {
        '@type': 'ItemList',
        name: isEn ? 'Documented RFC 10023 Integrations' : 'Dokumentierte RFC 10023 Integrationen',
        numberOfItems: ECOSYSTEM_DATA.integrations.length,
        itemListElement: ECOSYSTEM_DATA.integrations.map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: item.name,
          url: item.sourceUrl,
          description: isEn && item.descriptionEn ? item.descriptionEn : item.description,
        })),
      },
    ],
  };

  // Telemetry time series: Domains Monitor (Own baseline started 2026-09-24)
  const historyPoints = ADOPTION_HISTORY;
  const dmSvgWidth = 600;
  const dmSvgHeight = 120;
  const dmPaddingX = 40;
  const dmPaddingY = 20;

  // Dynamic Y-scale calculation for Domains Monitor
  const dmScale = useMemo(() => {
    const values = historyPoints.map((p) => p.value);
    return computeDynamicYScale(values, {
      minPaddingRatio: 0.02,
      rangePaddingRatio: 0.15,
      gridLineCount: 2,
    });
  }, [historyPoints]);

  const dmPointsString = useMemo(() => {
    if (historyPoints.length < 2) return '';
    return historyPoints
      .map((pt, idx) => {
        const x = dmPaddingX + (idx / (historyPoints.length - 1)) * (dmSvgWidth - dmPaddingX * 2);
        const y = calculateSvgY(pt.value, dmScale, dmSvgHeight, dmPaddingY);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [historyPoints, dmScale]);

  // Telemetry time series: ForSaleDNS (Verified public API: 41 daily observations)
  const forSalePoints = ADOPTION_HISTORY_FORSALEDNS;
  const completeSweepPoints = useMemo(
    () => forSalePoints.filter((p) => p.sweepComplete),
    [forSalePoints]
  );
  const latestForSale = forSalePoints[forSalePoints.length - 1] || null;

  // Growth within the complete-sweep ForSaleDNS observation dataset
  const forSaleGrowth = useMemo(() => {
    if (completeSweepPoints.length < 2) return null;
    const first = completeSweepPoints[0].activeListings;
    const last = completeSweepPoints[completeSweepPoints.length - 1].activeListings;
    const diff = last - first;
    const pct = ((diff / first) * 100).toFixed(1);
    return {
      firstDate: completeSweepPoints[0].date,
      lastDate: completeSweepPoints[completeSweepPoints.length - 1].date,
      firstVal: first,
      lastVal: last,
      diff,
      pct,
    };
  }, [completeSweepPoints]);

  // ForSaleDNS SVG Chart coordinates
  const fsSvgWidth = 720;
  const fsSvgHeight = 200;
  const fsPaddingX = 55;
  const fsPaddingY = 25;

  // Dynamic Y-scale calculation for ForSaleDNS
  const fsScale = useMemo(() => {
    const values = forSalePoints.map((p) => p.activeListings);
    return computeDynamicYScale(values, {
      minPaddingRatio: 0.02,
      rangePaddingRatio: 0.15,
      gridLineCount: 3,
    });
  }, [forSalePoints]);

  // Full polyline points with safe dynamic coordinates
  const fsAllPoints = useMemo(() => {
    if (!forSalePoints || forSalePoints.length === 0) return [];
    return forSalePoints.map((pt, idx) => {
      const x = fsPaddingX + (idx / (forSalePoints.length - 1)) * (fsSvgWidth - fsPaddingX * 2);
      const y = calculateSvgY(pt.activeListings, fsScale, fsSvgHeight, fsPaddingY);
      return {
        ...pt,
        idx,
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
      };
    });
  }, [forSalePoints, fsScale]);

  // Polyline for complete sweeps (indices where sweepComplete is true)
  const fsCompletePointsString = useMemo(() => {
    const sweepPts = fsAllPoints.filter((p) => p.sweepComplete);
    if (sweepPts.length < 2) return '';
    return sweepPts.map((p) => `${p.x},${p.y}`).join(' ');
  }, [fsAllPoints]);

  // Polyline for partial sweeps bridge (indices 0, 1, 2)
  const fsPartialPointsString = useMemo(() => {
    if (fsAllPoints.length < 3) return '';
    return fsAllPoints.slice(0, 3).map((p) => `${p.x},${p.y}`).join(' ');
  }, [fsAllPoints]);

  return (
    <div className="space-y-16 pb-16">
      {/* Inject Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hero Section */}
      <section className="pt-10 sm:pt-14 pb-12 border-b border-slate-200 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <li>
                <Link to={langPrefix || '/'} className="hover:text-slate-900 transition-colors">
                  {isEn ? 'Home' : 'Start'}
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-bold">{isEn ? 'Ecosystem & Adoption' : 'Ökosystem & Adoption'}</li>
            </ol>
          </nav>

          <div className="space-y-4 max-w-4xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-xs font-semibold text-slate-800">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isEn
                  ? 'IETF RFC 10023 Telemetry & Ecosystem'
                  : 'IETF RFC 10023 Telemetrie & Ökosystem'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-950">
              {isEn ? 'RFC 10023 Ecosystem & Adoption' : 'RFC 10023 Ökosystem & Adoption'}
            </h1>

            <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-normal">
              {isEn
                ? 'RFC 10023 is a recent mechanism for publishing a domain’s availability for sale directly within the DNS. Nevertheless, registries, domain tools, scanners, developer services, and other applications already support the _for-sale record. This page transparently documents the evolution of the ecosystem based on verified sources.'
                : 'RFC 10023 ist ein noch junger Mechanismus zur Veröffentlichung der Verkaufsbereitschaft einer Domain direkt im DNS. Dennoch unterstützen bereits Registries, Domain-Tools, Scanner, Entwicklerdienste und weitere Anwendungen den _for-sale Record. Diese Seite dokumentiert die Entwicklung des Ökosystems transparent und quellenbasiert.'}
            </p>

            <div className="pt-2 text-xs font-mono text-slate-500 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {isEn
                  ? `Last updated: September 24, 2026`
                  : `Letzte Aktualisierung: 24. September 2026`}
              </span>
            </div>
          </div>

          {/* Adoption Stats / Snapshot Cards */}
          <div className="mt-10 pt-8 border-t border-slate-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-800">
                {isEn ? 'RFC 10023 Adoption Snapshot' : 'RFC 10023 Adoption Kennzahlen'}
              </h2>
              <span className="text-[11px] font-mono text-slate-500">
                {isEn ? 'Status: 24 Sep 2026' : 'Stand: 24.09.2026'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Detected Domains */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  {isEn ? 'Detected _for-sale Records' : 'Erkannte _for-sale Records'}
                </span>
                <div className="text-3xl font-extrabold text-slate-950 font-mono tracking-tight">
                  {stats.detectedDomains.toLocaleString(isEn ? 'en-US' : 'de-DE')}+
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-mono text-slate-500">
                  <span>{isEn ? 'Source: Domains Monitor' : 'Quelle: Domains Monitor'}</span>
                  <a
                    href="https://domains-monitor.com/research/rfc10023"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:underline flex items-center gap-0.5"
                  >
                    <span>{isEn ? 'Source' : 'Quelle'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Card 2: Documented Integrations */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  {isEn ? 'Documented Integrations' : 'Dokumentierte Einträge'}
                </span>
                <div className="text-3xl font-extrabold text-slate-950 font-mono tracking-tight">
                  {stats.totalIntegrations}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs font-mono text-slate-500">
                  <span>
                    {isEn ? 'Verified external entries' : 'Verifizierte externe Einträge'}
                  </span>
                </div>
              </div>

              {/* Card 3: Native & Tool Support */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  {isEn ? 'Active Tools & Scanners' : 'Tools, Parser & Scanner'}
                </span>
                <div className="text-3xl font-extrabold text-emerald-800 font-mono tracking-tight">
                  {stats.nativeCount + stats.toolCount}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs font-mono text-slate-500">
                  <span>
                    {stats.nativeCount} {isEn ? 'Native / Discovery' : 'Nativ / Discovery'}, {stats.toolCount} Tools
                  </span>
                </div>
              </div>

              {/* Card 4: Documentation / Registrars */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 shadow-2xs">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 block mb-1">
                  {isEn ? 'Guides & Documentation' : 'Anleitungen & Dokumentation'}
                </span>
                <div className="text-3xl font-extrabold text-slate-800 font-mono tracking-tight">
                  {stats.docCount}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/60 text-xs font-mono text-slate-500">
                  <span>
                    {isEn ? 'Knowledge bases & Setup' : 'Wissensdatenbanken & Setup'}
                  </span>
                </div>
              </div>

            </div>

            {/* Permanent Mandatory Notice (Requirement 10) */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-600 leading-relaxed font-sans flex items-start gap-2.5">
              <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                {isEn
                  ? 'Different providers use distinct data sources, scanning methodologies, and classification criteria. Telemetry metrics are therefore not directly comparable across vendors. All figures are based on publicly verifiable sources.'
                  : 'Unterschiedliche Anbieter verwenden unterschiedliche Datenquellen, Scanmethoden und Definitionen. Die Werte sind daher nicht direkt miteinander vergleichbar. Alle Angaben basieren auf öffentlich nachprüfbaren Quellen.'}
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* Historical Adoption Trajectory (Requirement 8, 9, 10, 11, 12) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Main Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{isEn ? 'Independent Telemetry & Time Series' : 'Unabhängige Telemetrie & Zeitreihen'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              {isEn ? 'RFC 10023 Adoption over time' : 'RFC 10023 Adoption im Zeitverlauf'}
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
              {isEn
                ? 'Independent telemetry networks continuously monitor the DNS deployment of RFC 10023 and _for-sale records. To maintain scientific and methodological rigor, data sources with differing scanning methodologies are always presented separately.'
                : 'Unabhängige Messsysteme erfassen fortlaufend die Verteilung von RFC 10023 und _for-sale-Records im weltweiten DNS. Zur Wahrung wissenschaftlicher und methodischer Exaktheit werden Datenquellen mit unterschiedlichen Scan-Verfahren stets getrennt ausgewiesen.'}
            </p>
          </div>
          <div className="text-xs font-mono text-slate-500 shrink-0">
            <span className="inline-block px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-semibold text-slate-700">
              {isEn ? '2 Independent Data Sources' : '2 unabhängige Datenreihen'}
            </span>
          </div>
        </div>

        {/* DATA SERIES 1: ForSaleDNS Historical Trend (Requirements 3, 4, 8, 11, 12) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300">
                  {isEn ? 'ForSaleDNS – Active Listings' : 'ForSaleDNS – Aktive Listings'}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {forSalePoints.length} {isEn ? 'daily observations' : 'tägliche Messpunkte'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                {isEn ? 'Observation History: Active RFC 10023 Listings' : 'Beobachtungs-Historie: Aktive RFC-10023-Listings'}
              </h3>
            </div>
            <div className="text-left sm:text-right font-mono text-xs text-slate-500">
              <span className="font-bold text-slate-900 text-sm">
                {latestForSale ? latestForSale.activeListings.toLocaleString(isEn ? 'en-US' : 'de-DE') : (isEn ? '334,576' : '334.576')}
              </span>
              <span className="block text-[11px] text-slate-400">
                {isEn ? 'Observed active listings (24 Sep 2026)' : 'Beobachtete aktive Listings (24.09.2026)'}
              </span>
            </div>
          </div>

          {/* Legend and completeness indicators */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 bg-emerald-600 rounded"></span>
                <span className="text-slate-700 font-semibold">
                  {isEn ? 'Full sweep (100% of 343.8M inventory, 39 days)' : 'Vollständiger Scan (100 % von 343,8M Inventar, 39 Tage)'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-5 h-0.5 border-b-2 border-dashed border-amber-600"></span>
                <span className="text-amber-900 font-semibold">
                  {isEn ? 'Preliminary partial sweeps (15 & 16 Aug)' : 'Vorläufige Teil-Scans (15. & 16.08.)'}
                </span>
              </div>
            </div>
            {forSaleGrowth && (
              <div className="text-slate-600 font-semibold">
                {isEn
                  ? `Change within dataset: ${forSaleGrowth.pct}% (${forSaleGrowth.diff.toLocaleString('en-US')} listings)`
                  : `Veränderung im Datensatz: ${forSaleGrowth.pct.replace('.', ',')} % (${forSaleGrowth.diff.toLocaleString('de-DE')} Listings)`}
              </div>
            )}
          </div>

          {/* SVG Chart for ForSaleDNS */}
          <div className="w-full overflow-x-auto bg-slate-50/70 p-4 sm:p-6 rounded-xl border border-slate-200">
            <div className="min-w-[640px]">
              <svg viewBox={`0 0 ${fsSvgWidth} ${fsSvgHeight}`} className="w-full h-44 sm:h-52 overflow-visible">
                <defs>
                  <linearGradient id="fsGradientAdoption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Dynamic horizontal grid lines & Y-axis labels */}
                {fsScale.gridLines.map((val) => {
                  const y = calculateSvgY(val, fsScale, fsSvgHeight, fsPaddingY);
                  return (
                    <g key={val}>
                      <line
                        x1={fsPaddingX}
                        y1={y}
                        x2={fsSvgWidth - fsPaddingX}
                        y2={y}
                        stroke="#cbd5e1"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={fsPaddingX - 10}
                        y={y + 3}
                        textAnchor="end"
                        className="text-[10px] font-mono fill-slate-500 font-medium"
                      >
                        {(val / 1000).toFixed(0)}k
                      </text>
                    </g>
                  );
                })}

                {/* Base axis line */}
                <line
                  x1={fsPaddingX}
                  y1={fsSvgHeight - fsPaddingY}
                  x2={fsSvgWidth - fsPaddingX}
                  y2={fsSvgHeight - fsPaddingY}
                  stroke="#cbd5e1"
                />

                {/* Partial sweep line segment (index 0, 1, 2) */}
                {fsPartialPointsString && (
                  <polyline
                    fill="none"
                    stroke="#d97706"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={fsPartialPointsString}
                  />
                )}

                {/* Complete sweep line segment (index 2 to 40) */}
                {fsCompletePointsString && (
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={fsCompletePointsString}
                  />
                )}

                {/* Render individual points */}
                {fsAllPoints.map((pt) => {
                  const isPartial = !pt.sweepComplete;
                  const isKeyPoint = [0, 2, 9, 16, 23, 30, 37, 40].includes(pt.idx);

                  return (
                    <g key={pt.date} className="group cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isKeyPoint ? 4.5 : 2.5}
                        className={
                          isPartial
                            ? 'fill-white stroke-amber-600 stroke-2 group-hover:stroke-[3.5px] transition-all'
                            : 'fill-white stroke-emerald-700 stroke-2 group-hover:stroke-[3.5px] transition-all'
                        }
                      />
                      {/* Value callout on key points */}
                      {isKeyPoint && (
                        <text
                          x={pt.x}
                          y={pt.y - 8}
                          textAnchor="middle"
                          className={`text-[9px] font-mono font-bold ${
                            isPartial ? 'fill-amber-900' : 'fill-slate-800'
                          }`}
                        >
                          {(pt.activeListings / 1000).toFixed(0)}k
                        </text>
                      )}
                      {/* X-axis date labels on key points */}
                      {isKeyPoint && (
                        <text
                          x={pt.x}
                          y={fsSvgHeight - fsPaddingY + 14}
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-slate-500 font-medium"
                        >
                          {formatChartAxisDate(pt.date, isEn)}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                {isEn ? 'Active Listings' : 'Aktive Listings'}
              </span>
              <div className="text-lg font-bold font-mono text-slate-950">
                {latestForSale ? latestForSale.activeListings.toLocaleString(isEn ? 'en-US' : 'de-DE') : (isEn ? '334,576' : '334.576')}
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {isEn ? '24 Sep 2026' : '24.09.2026'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                {isEn ? 'Conformant' : 'RFC-10023-konform'}
              </span>
              <div className="text-lg font-bold font-mono text-emerald-800">
                {latestForSale ? latestForSale.conformant.toLocaleString(isEn ? 'en-US' : 'de-DE') : (isEn ? '334,565' : '334.565')}
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                99.99% {isEn ? 'valid' : 'valide'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                {isEn ? 'DNSSEC Secured' : 'Mit DNSSEC'}
              </span>
              <div className="text-lg font-bold font-mono text-slate-900">
                {latestForSale ? latestForSale.dnssec.toLocaleString(isEn ? 'en-US' : 'de-DE') : (isEn ? '161,897' : '161.897')}
              </div>
              <span className="text-[10px] font-mono text-slate-600">
                48.4% {isEn ? 'signed' : 'signiert'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                {isEn ? 'Priced Listings' : 'Mit Preisangabe'}
              </span>
              <div className="text-lg font-bold font-mono text-slate-900">
                {latestForSale ? latestForSale.priced.toLocaleString(isEn ? 'en-US' : 'de-DE') : (isEn ? '75,038' : '75.038')}
              </div>
              <span className="text-[10px] font-mono text-slate-600">
                22.4% {isEn ? 'with price' : 'mit Festpreis'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                {isEn ? 'Inventory Scope' : 'Scan-Umfang'}
              </span>
              <div className="text-lg font-bold font-mono text-slate-900">
                343,8M
              </div>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                100 % {isEn ? 'sweepComplete' : 'vollständig'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-0.5">
                {isEn ? 'Baseline Status' : 'Baseline-Status'}
              </span>
              <div className="text-lg font-bold font-mono text-slate-700">
                false
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                {isEn ? 'Audit in progress' : 'Audit in Prüfung'}
              </span>
            </div>
          </div>

          {/* Historical Transparency & Baseline Explanation (Requirements 4, 11, 12) */}
          <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 leading-relaxed font-sans space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold font-mono text-amber-900 uppercase tracking-wider">
              <Info className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{isEn ? 'Methodological Note: ForSaleDNS Sweep Completeness & Baseline' : 'Methodischer Hinweis: ForSaleDNS Scan-Vollständigkeit & Baseline'}</span>
            </div>
            <p>
              {isEn
                ? 'The first two measurement days (15 & 16 Aug 2026) were preliminary partial sweeps with 72.2% and 97.6% inventory coverage (indicated with dashed lines). Since 17 Aug 2026, daily sweep completeness (sweepComplete) has remained continuously at 100.0% (343,818,996 of 343,818,996 domains). The multi-month baseline audit cycle (baselineComplete) is currently documented as in progress (false). The calculated growth rate (-1.6%) refers strictly to the observed ForSaleDNS dataset across complete sweeps and does not represent global adoption growth.'
                : 'Die ersten beiden Messtage (15. & 16.08.2026) waren vorläufige Teil-Scans mit 72,2 % bzw. 97,6 % Inventarabdeckung (gestrichelt dargestellt). Seit dem 17.08.2026 beträgt die tägliche Scan-Vollständigkeit (sweepComplete) durchgehend 100,0 % (343.818.996 von 343.818.996 Domains). Der multi-monatliche Baseline-Audit-Zyklus (baselineComplete) ist laut API noch in Bearbeitung (false). Die berechnete Wachstumsrate (-1,6 %) bezieht sich streng auf den beobachteten ForSaleDNS-Datenbestand bei vollständigen Scans und stellt kein globales Adoptionswachstum dar.'}
            </p>
          </div>

          {/* Source Citation for ForSaleDNS (Requirement 10) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{isEn ? 'Source: ForSaleDNS Observation History' : 'Quelle: ForSaleDNS Beobachtungshistorie'}</span>
              <span>•</span>
              <a
                href="https://forsaledns.net/api/v1/adoption-history"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>GET /api/v1/adoption-history</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-slate-600">
              <span>{isEn ? 'Latest verified snapshot: 24 Sep 2026' : 'Letzter erfolgreicher Abruf: 24.09.2026'}</span>
            </div>
          </div>
        </div>

        {/* METHODOLOGY NOTICE DIRECTLY BENEATH THE CHART (Requirement 9) */}
        <div className="p-5 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans space-y-2">
          <p className="font-bold text-slate-900 text-sm">
            {isEn
              ? 'The series shown originate from different independent scan and discovery systems. Values from different providers are not directly comparable due to differing data sources and scanning methodologies.'
              : 'Die dargestellten Reihen stammen aus unterschiedlichen unabhängigen Scan- und Discovery-Systemen. Werte verschiedener Anbieter sind aufgrund unterschiedlicher Datenquellen und Scanmethoden nicht unmittelbar miteinander vergleichbar.'}
          </p>
          <p className="text-slate-600">
            {isEn
              ? 'Historical ForSaleDNS values are retrieved directly from the documented Adoption History API. Our own Domains Monitor measurements on rfc10023.de are continuously recorded since September 24, 2026.'
              : 'Historische ForSaleDNS-Werte werden direkt aus der dokumentierten Adoption-History-API übernommen. Eigene Domains-Monitor-Messungen von rfc10023.de werden seit dem 24.09.2026 fortlaufend gespeichert.'}
          </p>
        </div>

        {/* DATA SERIES 2: Domains Monitor Baseline (Requirements 2, 8, 10, 13) */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-900 border border-slate-300">
                  {isEn ? 'Domains Monitor – Detected Domains' : 'Domains Monitor – Erkannte Domains'}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {isEn ? 'Own measurement series started 24 Sep 2026' : 'Eigene Messreihe ab 24.09.2026'}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-950">
                {isEn ? 'Longitudinal Zone Scan Recording' : 'Telemetrische Erfassung aus Zonen-Scans'}
              </h3>
            </div>
            <div className="text-left sm:text-right font-mono text-xs text-slate-500">
              <span className="font-bold text-slate-900 text-sm">
                392.683
              </span>
              <span className="block text-[11px] text-slate-400">
                {isEn ? 'Baseline snapshot (24 Sep 2026)' : 'Basiswert (24.09.2026)'}
              </span>
            </div>
          </div>

          {historyPoints.length >= 3 ? (
            <div className="w-full overflow-x-auto">
              <div className="min-w-[500px]">
                <svg viewBox={`0 0 ${dmSvgWidth} ${dmSvgHeight}`} className="w-full h-32 overflow-visible">
                  <line
                    x1={dmPaddingX}
                    y1={dmPaddingY}
                    x2={dmSvgWidth - dmPaddingX}
                    y2={dmPaddingY}
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                  />
                  <line
                    x1={dmPaddingX}
                    y1={dmSvgHeight - dmPaddingY}
                    x2={dmSvgWidth - dmPaddingX}
                    y2={dmSvgHeight - dmPaddingY}
                    stroke="#e2e8f0"
                  />
                  <polyline
                    fill="none"
                    stroke="#059669"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={dmPointsString}
                  />
                  {historyPoints.map((pt, idx) => {
                    const x = dmPaddingX + (idx / (historyPoints.length - 1)) * (dmSvgWidth - dmPaddingX * 2);
                    const y = calculateSvgY(pt.value, dmScale, dmSvgHeight, dmPaddingY);
                    return (
                      <g key={pt.date} className="group">
                        <circle
                          cx={x}
                          cy={y}
                          r="4.5"
                          className="fill-white stroke-emerald-700 stroke-2 group-hover:stroke-[3.5px] transition-all"
                        />
                        <text
                          x={x}
                          y={y - 10}
                          textAnchor="middle"
                          className="text-[10px] font-mono font-bold fill-slate-700"
                        >
                          {(pt.value / 1000).toFixed(0)}k
                        </text>
                        <text
                          x={x}
                          y={dmSvgHeight}
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-slate-400"
                        >
                          {formatChartAxisDate(pt.date, isEn)}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-sans space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 font-mono text-xs uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isEn ? 'Methodological Integrity Note' : 'Hinweis zur methodischen Integrität'}</span>
                </div>
                <p>
                  {isEn
                    ? 'The historical time series is recorded continuously and strictly on a daily schedule starting on the launch date (September 24, 2026). To maintain academic credibility and prevent synthetic bias, we intentionally do not publish retroactively interpolated or estimated figures.'
                    : 'Die historische Zeitreihe wird ab dem Launch-Datum (24.09.2026) kontinuierlich und täglich per GitHub Action fortgeschrieben. Um maximale wissenschaftliche und redaktionelle Glaubwürdigkeit zu wahren, verzichten wir bewusst auf rückwirkend interpolierte oder geschätzte Pseudomesswerte.'}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {isEn
                    ? 'A dedicated trend curve for Domains Monitor will dynamically render once multiple verified daily measurement snapshots are captured.'
                    : 'Eine grafische Trendlinie für Domains Monitor wird dynamisch visualisiert, sobald mehrere tagesaktuelle Messpunkte vorliegen.'}
                </p>
              </div>

              {/* Verified baseline table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4 text-left">{isEn ? 'Date' : 'Datum'}</th>
                      <th className="py-2.5 px-4 text-left">{isEn ? 'Source' : 'Quelle'}</th>
                      <th className="py-2.5 px-4 text-left">{isEn ? 'Observed Records' : 'Erfasste Records'}</th>
                      <th className="py-2.5 px-4 text-left">{isEn ? 'Collection Mode' : 'Erfassungsmodus'}</th>
                      <th className="py-2.5 px-4 text-left">{isEn ? 'Verification' : 'Verifikation'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {historyPoints.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{item.date}</td>
                        <td className="py-2.5 px-4 text-slate-600">{item.source}</td>
                        <td className="py-2.5 px-4 font-bold text-emerald-800">{item.value.toLocaleString(isEn ? 'en-US' : 'de-DE')}</td>
                        <td className="py-2.5 px-4 text-slate-500">Telemetry Snapshot</td>
                        <td className="py-2.5 px-4 text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isEn ? 'Verified' : 'Verifiziert'}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Source Citation for Domains Monitor (Requirement 10) */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">{isEn ? 'Source: Domains Monitor' : 'Quelle: Domains Monitor'}</span>
              <span>•</span>
              <a
                href="https://domains-monitor.com/research/rfc10023"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>domains-monitor.com/research/rfc10023</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span>{isEn ? 'Start: 24 Sep 2026' : 'Start: 24.09.2026'}</span>
              <span>•</span>
              <span>{isEn ? 'Daily cron: 05:17 UTC' : 'Täglicher Abgleich: 05:17 UTC'}</span>
            </div>
          </div>
        </div>

      </section>

      {/* 3 Adoption Tiers Explanation (Requirement 6) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
            {isEn ? 'Classification Criteria' : 'Klassifizierungs-Kriterien'}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
            {isEn ? 'Three Levels of RFC 10023 Adoption' : 'Drei Arten der RFC-10023-Adoption'}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {isEn
              ? 'To prevent marketing exaggeration, we strictly distinguish between real technical execution and mere informational articles.'
              : 'Zur Vermeidung von Marketing-Übertreibungen trennen wir strikt zwischen tatsächlicher technischer Verarbeitung und reiner Berichterstattung.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Tier 1: Native Integration */}
          <div className="p-6 rounded-2xl bg-white border border-emerald-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
                {isEn ? 'Native Integration' : 'Native Integration'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-950">
              {isEn ? 'Automated Ingestion & Processing' : 'Automatisierte Verarbeitung'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isEn
                ? 'A service or marketplace actively and automatically queries the _for-sale TXT record, extracts tags (fval, furi), and surfaces the sale intent directly in search results or checkout flows.'
                : 'Ein Dienst oder Marktplatz liest oder verarbeitet den _for-sale TXT-Record tatsächlich automatisiert im Regelbetrieb, wertet Tags wie fval und furi aus und zeigt die Verkaufsbereitschaft an.'}
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-700 font-semibold">
              {isEn ? 'Example: ForSaleDNS' : 'Beispiel: ForSaleDNS'}
            </div>
          </div>

          {/* Tier 2: Tool Support */}
          <div className="p-6 rounded-2xl bg-white border border-blue-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-blue-100 text-blue-900 border border-blue-300">
                {isEn ? 'Tool Support' : 'Tool Support'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-950">
              {isEn ? 'Scanners, APIs, MCP & Parsers' : 'Scanner, APIs, MCP & Parser'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isEn
                ? 'Software, libraries, or developer tools providing scanners, syntax parsers, DoH validators, Model Context Protocol (MCP) servers, or browser extensions for RFC 10023 inspection.'
                : 'Ein Tool bietet eigenständige Scanner, Parser, Syntax-Validatoren, REST-APIs, MCP-Server für KI-Agenten, Browser-Erweiterungen oder telemetrische Datensätze.'}
            </p>
            <div className="pt-2 text-[11px] font-mono text-blue-700 font-semibold">
              {isEn ? 'Examples: SIDN Labs, IPWhois, MCP' : 'Beispiele: SIDN Labs, IPWhois, MCP'}
            </div>
          </div>

          {/* Tier 3: Awareness / Documentation */}
          <div className="p-6 rounded-2xl bg-white border border-amber-200 shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-100 text-amber-950 border border-amber-300">
                {isEn ? 'Documentation' : 'Dokumentation'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-950">
              {isEn ? 'Awareness & Setup Guides' : 'Anleitungen & Wissensdatenbank'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isEn
                ? 'A registrar or DNS provider explains the standard in knowledge bases or tutorial articles and documents how customers can configure the _for-sale record without actively evaluating signals itself.'
                : 'Ein Anbieter informiert über RFC 10023, erklärt die ABNF-Syntax oder dokumentiert im Hilfebereich, wie der Record im Nameserver-Panel angelegt wird, ohne dass eine native Auswertung erfolgt.'}
            </p>
            <div className="pt-2 text-[11px] font-mono text-amber-800 font-semibold">
              {isEn ? 'Example: INWX Knowledge Base' : 'Beispiel: INWX Wissensdatenbank'}
            </div>
          </div>

        </div>
      </section>

      {/* How Adoption Works Flowchart (Requirement 14) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-6">
          <div className="max-w-3xl">
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-emerald-800 block mb-1">
              {isEn ? 'DNS Architecture' : 'DNS-Architektur'}
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-950 tracking-tight">
              {isEn ? 'From DNS Signal to Domain Discovery' : 'Vom DNS-Signal zur Domain-Suche'}
            </h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              {isEn
                ? 'RFC 10023 separates the sale signal from proprietary landing pages and closed broker marketplaces. Domain owners publish availability directly in the global DNS hierarchy. Third-party tools and registrars evaluate this signal automatically.'
                : 'RFC 10023 trennt das Verkaufssignal von Landingpages und einzelnen Marktplätzen. Domaininhaber veröffentlichen die Information direkt im DNS. Drittanbieter können dieses Signal anschließend automatisiert auswerten.'}
            </p>
          </div>

          {/* Pure HTML/CSS Flowchart (No heavy diagram libraries) */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2 font-mono text-xs">
            
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{isEn ? 'Step 1' : 'Schritt 1'}</span>
              <div className="font-bold text-slate-900">
                {isEn ? 'Domain Owner' : 'Domaininhaber'}
              </div>
              <p className="text-[11px] text-slate-500 font-sans leading-normal">
                {isEn ? 'Decides to offer domain for sale' : 'Entscheidet über Verkaufsbereitschaft'}
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">{isEn ? 'Step 2' : 'Schritt 2'}</span>
              <div className="font-bold text-emerald-950 break-all">
                _for-sale TXT
              </div>
              <p className="text-[11px] text-slate-600 font-sans leading-normal">
                v=FORSALE1;fval=EUR...
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-emerald-400 uppercase">{isEn ? 'Step 3' : 'Schritt 3'}</span>
              <div className="font-bold text-white">
                Global DNS
              </div>
              <p className="text-[11px] text-slate-300 font-sans leading-normal">
                Port 53 / DoH / DNSSEC
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase">{isEn ? 'Step 4' : 'Schritt 4'}</span>
              <div className="font-bold text-slate-900">
                {isEn ? 'Scanner / AI / Broker' : 'Scanner / KI / Broker'}
              </div>
              <p className="text-[11px] text-slate-500 font-sans leading-normal">
                {isEn ? 'Automated resolution & parsing' : 'Automatische Abfrage & Tag-Parsing'}
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-4 rounded-xl bg-emerald-100/70 border border-emerald-300 flex flex-col justify-between space-y-2">
              <span className="text-[10px] font-bold text-emerald-800 uppercase">{isEn ? 'Step 5' : 'Schritt 5'}</span>
              <div className="font-bold text-emerald-950">
                {isEn ? 'Offer Visible' : 'Verkauf sichtbar'}
              </div>
              <p className="text-[11px] text-emerald-900 font-sans leading-normal">
                {isEn ? 'Buyer discovers domain in search' : 'Käufer findet Domain in Whois/Suche'}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Main Ecosystem Matrix & Filter (Requirements 11 & 12) */}
      <section id="matrix" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="space-y-6">
          
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
                  {isEn ? 'Directory' : 'Verzeichnis'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mt-1">
                  {isEn ? 'Who Already Supports RFC 10023?' : 'Wer unterstützt RFC 10023 bereits?'}
                </h2>
              </div>
              <div className="text-xs font-mono text-slate-500">
                {isEn
                  ? `Showing ${filteredIntegrations.length} of ${ECOSYSTEM_DATA.integrations.length} entries`
                  : `Zeige ${filteredIntegrations.length} von ${ECOSYSTEM_DATA.integrations.length} Integrationen`}
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isEn ? 'Search integration, service, or feature...' : 'Integration, Dienst oder Begriff suchen …'}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                {isEn ? 'Category:' : 'Kategorie:'}
              </span>
              {categories.map((cat) => {
                const isActive = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isEn ? cat.labelEn : cat.labelDe}
                  </button>
                );
              })}
            </div>

            {/* Tier Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-xs font-mono text-slate-400 mr-2 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                {isEn ? 'Support Tier:' : 'Unterstützung:'}
              </span>
              {[
                { id: 'all', labelDe: 'Alle Stufen', labelEn: 'All Tiers' },
                { id: 'native', labelDe: 'Native Integration', labelEn: 'Native Integration' },
                { id: 'tool', labelDe: 'Tool Support', labelEn: 'Tool Support' },
                { id: 'documentation', labelDe: 'Dokumentation', labelEn: 'Documentation' },
              ].map((tier) => {
                const isActive = selectedTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedTier(tier.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-700 text-white font-bold'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isEn ? tier.labelEn : tier.labelDe}
                  </button>
                );
              })}
            </div>

          </div>

          {/* Results List / Grid */}
          {filteredIntegrations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-white border border-slate-200">
              <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {isEn ? 'No integrations match your filters' : 'Keine passenden Integrationen gefunden'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedTier('all');
                  setSearchQuery('');
                }}
                className="mt-3 text-xs font-mono text-emerald-700 underline font-semibold"
              >
                {isEn ? 'Reset all filters' : 'Filter zurücksetzen'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredIntegrations.map((item) => {
                const tier = getMetaAdoptionTier(item.supportType);
                const tierBadge = getTierBadgeInfo(tier, isEn);
                const statusBadge = getStatusBadgeInfo(item.status, isEn);
                const categoryLabel = getCategoryLabel(item.category, isEn);
                const desc = isEn && item.descriptionEn ? item.descriptionEn : item.description;

                return (
                  <div
                    key={item.id}
                    className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Badges strip */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {categoryLabel}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${tierBadge.classes}`}
                        >
                          {tierBadge.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${statusBadge.classes}`}
                        >
                          {statusBadge.label}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-bold text-slate-950 mb-2">{item.name}</h3>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{desc}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-500">
                        <div>
                          <span className="text-slate-400 block">{isEn ? 'Support Type' : 'Support-Typ'}</span>
                          <span className="text-slate-800 font-semibold">{item.supportType}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">{isEn ? 'Last Verified' : 'Zuletzt geprüft'}</span>
                          <span className="text-slate-800 font-semibold">{formatDisplayDate(item.lastVerified, isEn)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-mono text-slate-400">
                          {isEn ? 'Observed since:' : 'Beobachtet seit:'} {formatDisplayDate(item.firstObserved, isEn)}
                        </span>
                        <a
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 font-mono text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                          <span>{isEn ? 'Open Source' : 'Quelle öffnen'}</span>
                          <ExternalLink className="w-3 h-3 text-slate-500" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </section>

      {/* Adoption Timeline (Requirement 13) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-8">
          <div>
            <span className="text-[11px] font-mono uppercase font-bold tracking-wider text-slate-500">
              {isEn ? 'Chronology' : 'Chronologie'}
            </span>
            <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight mt-1">
              {isEn ? 'RFC 10023 Adoption Timeline' : 'RFC 10023 Adoption Timeline'}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {isEn
                ? 'Verified technical milestones since the publication of IETF RFC 10023.'
                : 'Verifizierte technische Meilensteine seit der Veröffentlichung von IETF RFC 10023.'}
            </p>
          </div>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
            {TIMELINE_DATA.map((event, idx) => (
              <div key={idx} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-emerald-600 group-hover:scale-125 transition-transform" />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {formatDisplayDate(event.date, isEn)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                      {event.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-950">
                    {isEn ? event.titleEn : event.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                    {isEn ? event.descriptionEn : event.description}
                  </p>

                  <div className="pt-1">
                    <a
                      href={event.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-emerald-700 hover:underline inline-flex items-center gap-1 font-semibold"
                    >
                      <span>{isEn ? 'Source link' : 'Quellenlink'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Own Tools on rfc10023.de (Separated as required by Rule 7 & 15) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-md space-y-6">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-emerald-400 text-xs font-mono font-semibold mb-2">
              <Server className="w-3.5 h-3.5" />
              <span>{isEn ? 'Toolkit & Diagnostics' : 'Toolkit & Diagnostik'}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {isEn ? 'RFC 10023 Developer & Validator Tools' : 'RFC 10023 Tools auf rfc10023.de'}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
              {isEn
                ? 'We provide open reference utilities for generating, inspecting, and testing _for-sale records. In accordance with strict neutrality rules, our own tools are categorized separately from third-party ecosystem integrations.'
                : 'Zur Unterstützung des Ökosystems stellen wir freie Referenz-Tools zur Generierung, Validierung und Prüfung bereit. Eigene Werkzeuge werden transparent getrennt von externen Integrationen aufgeführt.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            
            {/* Tool 1 */}
            <Link
              to={`${langPrefix}/validator`}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-bold text-sm text-white">Live DNS Validator</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn
                    ? 'Inspect _for-sale TXT records live via DNS-over-HTTPS with DNSSEC validation.'
                    : 'Prüft _for-sale TXT-Records live über DoH mit genauer Fehlerdifferenzierung und DNSSEC.'}
                </p>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{isEn ? 'Open validator' : 'Validator öffnen'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Tool 2 */}
            <Link
              to={`${langPrefix}/generator`}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Cpu className="w-4 h-4" />
                  <span className="font-bold text-sm text-white">Record Generator</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn
                    ? 'Generate standard-compliant multi-record RRsets for Cloudflare, Hetzner, INWX, and BIND.'
                    : 'Erzeugt normkonforme Multi-Record RRsets für Hetzner, Cloudflare, INWX, BIND & Terraform.'}
                </p>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{isEn ? 'Open generator' : 'Generator öffnen'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Tool 3 */}
            <Link
              to={`${langPrefix}/bulk-scan`}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Layers className="w-4 h-4" />
                  <span className="font-bold text-sm text-white">Portfolio Bulk Scanner</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn
                    ? 'Audit up to 50 domains simultaneously for RFC 10023 signals with rate limiting.'
                    : 'Prüfe ganze Portfolios mit bis zu 50 Domains parallel auf Verkaufssignale und CSV-Export.'}
                </p>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{isEn ? 'Open bulk scanner' : 'Bulk-Scan öffnen'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Tool 4 */}
            <Link
              to={`${langPrefix}/api-docs`}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Code2 className="w-4 h-4" />
                  <span className="font-bold text-sm text-white">REST API v1</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn
                    ? 'Free public JSON endpoint for automated validation scripts and developer bots.'
                    : 'Kostenfreie JSON DoH REST-API für Entwickler, Monitoring-Skripte und Bots.'}
                </p>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{isEn ? 'API documentation' : 'API-Doku ansehen'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Tool 5 */}
            <Link
              to={`${langPrefix}/hoster-matrix`}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Server className="w-4 h-4" />
                  <span className="font-bold text-sm text-white">Provider Guides</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn
                    ? 'Step-by-step guides for DNS setup across Hetzner, Cloudflare, Netcup, and INWX.'
                    : 'Schritt-für-Schritt-Anleitungen zur Einrichtung bei Hetzner, Cloudflare, Netcup & Co.'}
                </p>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{isEn ? 'View guides' : 'Anleitungen ansehen'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

            {/* Tool 6 */}
            <Link
              to={`${langPrefix}/badge-generator`}
              className="p-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500 transition-colors group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold text-sm text-white">Trust Badge Generator</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {isEn
                    ? '100% privacy-compliant HTML/CSS badges for domain sales landing pages.'
                    : 'Erstelle neutrale, datenschutzkonforme Verifikations-Badges für Landingpages.'}
                </p>
              </div>
              <div className="mt-3 text-xs font-mono text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                <span>{isEn ? 'Generate badges' : 'Badges erstellen'}</span>
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* Methodology Section (Requirement 27) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold">
              {isEn ? 'Methodology & Data Governance' : 'Methodik & Transparenz'}
            </h2>
          </div>
          
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-3 font-sans">
            <p>
              {isEn
                ? 'This directory is based exclusively on publicly verifiable information. An entry does not automatically imply a full native RFC 10023 integration; we rigorously distinguish between native automated processing, developer tools/scanners, and pure documentation.'
                : 'Diese Übersicht basiert ausschließlich auf öffentlich nachprüfbaren Informationen. Ein Eintrag bedeutet nicht automatisch eine vollständige native RFC-10023-Integration; wir unterscheiden strikt zwischen nativer automatisierter Verarbeitung, Entwickler-Tools/Scannern und reiner Dokumentation.'}
            </p>
            <p>
              {isEn
                ? 'Published telemetry figures originate from independent third-party monitoring projects. Different scanners apply distinct data sources, discovery zones, and measurement methodologies, meaning figures cannot be directly cross-compared. Exact calendar dates are only published when backed by definitive source records; otherwise, month-level resolution is applied.'
                : 'Die dargestellten Adoptionszahlen stammen von unabhängigen Monitoring-Projekten. Unterschiedliche Scanner verwenden verschiedene Datengrundlagen, Zonenabfragen und Scanmethoden; Kennzahlen sind daher nicht unmittelbar miteinander vergleichbar. Exakte Tagesdaten werden nur bei eindeutig belegten Quellen ausgewiesen, andernfalls erfolgt die Angabe auf Monatsebene.'}
            </p>
            <p>
              {isEn
                ? 'Historical adoption telemetry is recorded prospectively on a daily schedule without retroactive estimation or synthetic data interpolation.'
                : 'Historische Telemetriedaten werden prospektiv und tagesaktuell fortgeschrieben; auf rückwirkende Schätzungen oder synthetische Interpolationen wird vollständig verzichtet.'}
            </p>
            <p className="text-xs text-slate-500 font-mono">
              {isEn
                ? 'Verification policy: Every integration requires a verifiable public source URL. Entries without documented evidence will not be published.'
                : 'Prüfungsstandard: Jeder Eintrag erfordert eine überprüfbare öffentliche Quellenangabe. Einträge ohne belegte Nachweise werden nicht veröffentlicht.'}
            </p>
          </div>
        </div>
      </section>

      {/* Report / Submit Integration (Requirement 28) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-6 sm:p-8 rounded-2xl bg-emerald-50/70 border border-emerald-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1 max-w-2xl">
            <h2 className="text-lg font-bold text-emerald-950">
              {isEn ? 'Missing an Implementation or Tool?' : 'Fehlt eine Implementierung oder ein Tool?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
              {isEn
                ? 'Do you operate a scanner, registrar guide, DNS utility, or AI tool that supports RFC 10023? Submit your integration with a verifiable public URL for editorial review.'
                : 'Betreibst du einen Scanner, Registrar-Leitfaden, DNS-Tool oder ein KI-Werkzeug, das RFC 10023 unterstützt? Reiche deine Integration mit einer verifizierbaren Quellen-URL zur Prüfung ein.'}
            </p>
          </div>

          <a
            href={isEn ? "mailto:info@rfc10023.de?subject=Submit%20RFC%2010023%20Integration" : "mailto:info@rfc10023.de?subject=RFC%2010023%20Integration%20melden"}
            className="shrink-0 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs font-bold transition-colors flex items-center gap-2 shadow-sm"
          >
            <Mail className="w-4 h-4 text-emerald-400" />
            <span>{isEn ? 'Submit Integration' : 'Integration melden'}</span>
          </a>
        </div>
      </section>

      {/* Citation Box */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CitationBox
          title={isEn ? 'RFC 10023 Ecosystem & Adoption Tracker' : 'RFC 10023 Ökosystem & Adoption Tracker'}
          url={canonicalUrl}
          date="2026-09-24"
        />
      </section>
    </div>
  );
}
