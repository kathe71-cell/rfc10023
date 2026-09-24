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
});
