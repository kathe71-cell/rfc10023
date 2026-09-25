import { describe, it, expect } from 'vitest';
import { SEARCH_INDEX } from '../src/data/searchIndex';

describe('RFC 10023 Ecosystem Integration Tests', () => {
  it('has tool-ecosystem in search index with all required German keywords', () => {
    const ecoItem = SEARCH_INDEX.find(item => item.id === 'tool-ecosystem');
    expect(ecoItem).toBeDefined();
    expect(ecoItem?.pathDe).toBe('/oekosystem');
    expect(ecoItem?.pathEn).toBe('/en/ecosystem');

    const requiredDe = [
      'ökosystem',
      'oekosystem',
      'ecosystem',
      'adoption',
      'verbreitung',
      'integrationen',
      'integration',
      'unterstützung',
      'tools',
      'scanner',
      'sidn',
      'inwx',
      'forsaledns',
      'domaintoolbelt',
      'domains monitor',
      'mcp',
      'domain intelligence',
      '_for-sale'
    ];

    const kwsDe = ecoItem!.keywordsDe.map(k => k.toLowerCase());
    for (const kw of requiredDe) {
      expect(kwsDe).toContain(kw);
    }
  });

  it('has tool-ecosystem in search index with all required English keywords', () => {
    const ecoItem = SEARCH_INDEX.find(item => item.id === 'tool-ecosystem');
    expect(ecoItem).toBeDefined();

    const requiredEn = [
      'ecosystem',
      'adoption',
      'integrations',
      'support',
      'tools',
      'scanners',
      'sidn',
      'inwx',
      'forsaledns',
      'domaintoolbelt',
      'domains monitor',
      'mcp',
      'domain intelligence',
      '_for-sale'
    ];

    const kwsEn = ecoItem!.keywordsEn.map(k => k.toLowerCase());
    for (const kw of requiredEn) {
      expect(kwsEn).toContain(kw);
    }
  });

  it('includes Atom as a verified native-integration in ECOSYSTEM_DATA', async () => {
    const { ECOSYSTEM_DATA, getMetaAdoptionTier } = await import('../src/data/ecosystem');
    const atom = ECOSYSTEM_DATA.integrations.find(item => item.id === 'atom');

    expect(atom).toBeDefined();
    expect(atom?.name).toBe('Atom');
    expect(atom?.category).toBe('aftermarket-search');
    expect(atom?.supportType).toBe('native-integration');
    expect(atom?.status).toBe('production');
    expect(getMetaAdoptionTier(atom!.supportType)).toBe('native');
    expect(atom?.sourceUrl).toBe(
      'https://www.atom.com/blog/atom-adopts-rfc-10023-every-eligible-listing-is-getting-a-machine-readable-for-sale-signal/'
    );
    expect(atom?.firstObserved).toBe('2026-09-25');
    expect(atom?.lastVerified).toBe('2026-09-25');
    expect(atom?.description).toContain('Atom-Nameservern');
    expect(atom?.description).toContain('RFC 10023');
    expect(atom?.descriptionEn).toContain('Atom nameservers');
    expect(atom?.descriptionEn).toContain('RFC 10023');
  });

  it('includes Atom platform rollout milestone in TIMELINE_DATA', async () => {
    const { TIMELINE_DATA } = await import('../src/data/ecosystem');
    const atomMilestone = TIMELINE_DATA.find(entry => entry.date === '2026-09-25' && entry.title.includes('Atom'));

    expect(atomMilestone).toBeDefined();
    expect(atomMilestone?.titleEn).toBe('Atom begins platform-wide RFC 10023 rollout');
    expect(atomMilestone?.sourceUrl).toBe(
      'https://www.atom.com/blog/atom-adopts-rfc-10023-every-eligible-listing-is-getting-a-machine-readable-for-sale-signal/'
    );
    expect(atomMilestone?.description).toContain('Atom-Nameservern');
    expect(atomMilestone?.descriptionEn).toContain('Atom nameservers');
  });

  it('includes Atom in global search index keywords', () => {
    const ecoItem = SEARCH_INDEX.find(item => item.id === 'tool-ecosystem');
    expect(ecoItem?.keywordsDe).toContain('atom');
    expect(ecoItem?.keywordsDe).toContain('atom.com');
    expect(ecoItem?.keywordsEn).toContain('atom');
    expect(ecoItem?.keywordsEn).toContain('atom.com');
  });
});
