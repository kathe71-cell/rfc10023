import rawEcosystem from '../../data/ecosystem.json';
import rawCurrent from '../../data/adoption-current.json';
import rawHistory from '../../data/adoption-history.json';
import rawForSaleDnsHistory from '../../data/adoption-history-forsaledns.json';
import rawTimeline from '../../data/timeline.json';

export type EcosystemCategory =
  | 'registry'
  | 'registrar'
  | 'domain-intelligence'
  | 'aftermarket-search'
  | 'developer-ai'
  | 'dataset-monitoring'
  | 'browser-utility';

export type EcosystemStatus =
  | 'production'
  | 'supported'
  | 'experimental'
  | 'announced'
  | 'information';

export type SupportType =
  | 'native-integration'
  | 'parser'
  | 'scanner'
  | 'discovery'
  | 'API'
  | 'MCP'
  | 'browser-extension'
  | 'dataset'
  | 'documentation'
  | 'DNS-configuration';

export type MetaAdoptionTier = 'native' | 'tool' | 'documentation';

export interface EcosystemIntegration {
  id: string;
  name: string;
  category: EcosystemCategory;
  supportType: SupportType;
  status: EcosystemStatus;
  description: string;
  descriptionEn?: string;
  sourceUrl: string;
  firstObserved: string;
  lastVerified: string;
}

export interface EcosystemData {
  lastUpdated: string;
  integrations: EcosystemIntegration[];
}

export interface AdoptionSource {
  value: number;
  label: string;
  labelDe?: string;
  sourceUrl: string;
  lastSuccessfulFetch: string;
  mode: 'automatic' | 'manual';
}

export interface ForSaleDnsMeta {
  latestSnapshotDate: string;
  lastSuccessfulFetch: string;
}

export interface AdoptionCurrentData {
  lastUpdated: string;
  sources: Record<string, AdoptionSource>;
  forSaleDns?: ForSaleDnsMeta;
}

export interface AdoptionHistoryEntry {
  date: string;
  source: string;
  value: number;
}

export interface ForSaleDnsHistoryEntry {
  date: string;
  activeListings: number;
  conformant: number;
  priced: number;
  dnssec: number;
  inventoryCompleted: number;
  inventoryTotal: number;
  baselineComplete: boolean;
  sweepComplete: boolean;
}

export interface TimelineEntry {
  date: string;
  title: string;
  titleEn: string;
  category: string;
  description: string;
  descriptionEn: string;
  sourceUrl: string;
}

export const ECOSYSTEM_DATA = rawEcosystem as EcosystemData;
export const ADOPTION_CURRENT = rawCurrent as AdoptionCurrentData;
export const FORSALEDNS_META = (rawCurrent as AdoptionCurrentData).forSaleDns || null;
export const ADOPTION_HISTORY = rawHistory as AdoptionHistoryEntry[];
export const ADOPTION_HISTORY_FORSALEDNS = rawForSaleDnsHistory as ForSaleDnsHistoryEntry[];
export const TIMELINE_DATA = rawTimeline as TimelineEntry[];

/**
 * Determines the meta adoption tier (Native Integration vs Tool Support vs Documentation)
 * according to section 6 of the specifications.
 */
export function getMetaAdoptionTier(supportType: SupportType): MetaAdoptionTier {
  if (supportType === 'native-integration' || supportType === 'discovery') {
    return 'native';
  }
  if (
    supportType === 'parser' ||
    supportType === 'scanner' ||
    supportType === 'API' ||
    supportType === 'MCP' ||
    supportType === 'browser-extension' ||
    supportType === 'dataset'
  ) {
    return 'tool';
  }
  return 'documentation';
}

export function getTierBadgeInfo(tier: MetaAdoptionTier, isEn: boolean) {
  switch (tier) {
    case 'native':
      return {
        label: isEn ? 'Native Integration' : 'Native Integration',
        classes: 'bg-emerald-100 text-emerald-900 border-emerald-300',
      };
    case 'tool':
      return {
        label: isEn ? 'Tool Support' : 'Tool Support',
        classes: 'bg-blue-100 text-blue-900 border-blue-300',
      };
    case 'documentation':
    default:
      return {
        label: isEn ? 'Awareness / Documentation' : 'Dokumentation / Konfiguration',
        classes: 'bg-amber-100 text-amber-950 border-amber-300',
      };
  }
}

export function getStatusBadgeInfo(status: EcosystemStatus, isEn: boolean) {
  switch (status) {
    case 'production':
      return {
        label: isEn ? 'Production' : 'Produktiv',
        classes: 'bg-emerald-50 text-emerald-800 border-emerald-300',
      };
    case 'supported':
      return {
        label: isEn ? 'Supported' : 'Unterstützt',
        classes: 'bg-slate-100 text-slate-800 border-slate-300',
      };
    case 'experimental':
      return {
        label: isEn ? 'Experimental' : 'Experimentell',
        classes: 'bg-purple-100 text-purple-900 border-purple-300',
      };
    case 'announced':
      return {
        label: isEn ? 'Announced' : 'Angekündigt',
        classes: 'bg-amber-50 text-amber-900 border-amber-300',
      };
    case 'information':
    default:
      return {
        label: isEn ? 'Information' : 'Information',
        classes: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export function getCategoryLabel(category: EcosystemCategory, isEn: boolean): string {
  const map: Record<EcosystemCategory, { de: string; en: string }> = {
    registry: { de: 'Registry & Forschung', en: 'Registry & Research' },
    registrar: { de: 'Registrar', en: 'Registrar' },
    'domain-intelligence': { de: 'Domain Intelligence', en: 'Domain Intelligence' },
    'aftermarket-search': { de: 'Aftermarket & Suche', en: 'Aftermarket & Search' },
    'developer-ai': { de: 'Entwickler & KI / MCP', en: 'Developer & AI / MCP' },
    'dataset-monitoring': { de: 'Datensätze & Telemetrie', en: 'Datasets & Telemetry' },
    'browser-utility': { de: 'Browser & Utilities', en: 'Browser & Utilities' },
  };
  return isEn ? map[category].en : map[category].de;
}

export function computeEcosystemStats() {
  const total = ECOSYSTEM_DATA.integrations.length;
  let nativeCount = 0;
  let toolCount = 0;
  let docCount = 0;

  for (const item of ECOSYSTEM_DATA.integrations) {
    const tier = getMetaAdoptionTier(item.supportType);
    if (tier === 'native') nativeCount++;
    else if (tier === 'tool') toolCount++;
    else docCount++;
  }

  const primarySource = ADOPTION_CURRENT.sources.domainsMonitor;
  const detectedDomains = primarySource ? primarySource.value : 0;
  const lastUpdated = ECOSYSTEM_DATA.lastUpdated;

  return {
    totalIntegrations: total,
    nativeCount,
    toolCount,
    docCount,
    detectedDomains,
    lastUpdated,
  };
}
