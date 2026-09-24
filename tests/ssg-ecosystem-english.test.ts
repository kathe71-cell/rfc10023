import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('SSG Prerendering Language Integrity (/en/ecosystem & /oekosystem)', () => {
  const enHtmlPath = path.resolve(process.cwd(), 'dist/en/ecosystem/index.html');
  const deHtmlPath = path.resolve(process.cwd(), 'dist/oekosystem/index.html');

  it('generates dist/en/ecosystem/index.html and dist/oekosystem/index.html', () => {
    expect(fs.existsSync(enHtmlPath)).toBe(true);
    expect(fs.existsSync(deHtmlPath)).toBe(true);
  });

  it('renders <html lang="en"> on /en/ecosystem and <html lang="de"> on /oekosystem', () => {
    const enHtml = fs.readFileSync(enHtmlPath, 'utf-8');
    const deHtml = fs.readFileSync(deHtmlPath, 'utf-8');

    expect(enHtml).toContain('<html lang="en"');
    expect(deHtml).toContain('<html lang="de"');
  });

  it('contains NO German UI or content strings in dist/en/ecosystem/index.html', () => {
    const enHtml = fs.readFileSync(enHtmlPath, 'utf-8');

    const forbiddenGermanPhrases = [
      'Letzte Aktualisierung',
      'Erkannte _for-sale Records',
      'Erkannte',
      'Quelle öffnen',
      'Zuletzt geprüft',
      'Beobachtet seit',
      'Methodik',
      'Schritt 1',
      'RFC 10023 ist ein noch junger Mechanismus',
      'RFC 10023 Adoption Kennzahlen',
      'Telemetrische Zeitreihe der Adoption',
      'Hinweis zur methodischen Integrität',
      'Drei Arten der RFC-10023-Adoption',
      'Vom DNS-Signal zur Domain-Suche',
      'Was ist RFC 10023?',
      'Wie lautet der DNS-Knoten',
      'Welche Registries unterstützen'
    ];

    const violations: string[] = [];
    for (const phrase of forbiddenGermanPhrases) {
      if (enHtml.includes(phrase)) {
        violations.push(phrase);
      }
    }

    expect(violations).toEqual([]);
  });

  it('verifies dist/en/ecosystem/index.html contains expected English headings and metadata', () => {
    const enHtml = fs.readFileSync(enHtmlPath, 'utf-8');

    expect(enHtml).toContain('RFC 10023 Ecosystem &amp; Adoption');
    expect(enHtml).toContain('Last updated:');
    expect(enHtml).toContain('Detected _for-sale Records');
    expect(enHtml).toContain('Three Levels of RFC 10023 Adoption');
    expect(enHtml).toContain('From DNS Signal to Domain Discovery');
    expect(enHtml).toContain('Step 1');
    expect(enHtml).toContain('Methodology &amp; Data Governance');
  });

  it('verifies dist/oekosystem/index.html contains expected German content', () => {
    const deHtml = fs.readFileSync(deHtmlPath, 'utf-8');

    expect(deHtml).toContain('RFC 10023 Ökosystem &amp; Adoption');
    expect(deHtml).toContain('Letzte Aktualisierung:');
    expect(deHtml).toContain('Erkannte _for-sale Records');
    expect(deHtml).toContain('Schritt 1');
    expect(deHtml).toContain('Methodik &amp; Transparenz');
  });
});
