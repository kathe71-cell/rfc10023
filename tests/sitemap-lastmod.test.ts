import { describe, it, expect } from 'vitest';
import { updateSitemapLastmod } from '../scripts/update-adoption.mjs';

const xml = `<urlset>
  <url><loc>https://www.rfc10023.de/oekosystem</loc><lastmod>2026-10-01</lastmod></url>
  <url><loc>https://www.rfc10023.de/en/ecosystem</loc><lastmod>2026-10-09</lastmod></url>
  <url><loc>https://www.rfc10023.de/oekosystem-alt</loc><lastmod>2026-01-01</lastmod></url>
</urlset>`;
const locs = ['https://www.rfc10023.de/oekosystem', 'https://www.rfc10023.de/en/ecosystem'];

describe('updateSitemapLastmod', () => {
  const out = updateSitemapLastmod(xml, locs, '2026-10-04');
  it('moves lastmod forward for the ecosystem pages', () => {
    expect(out).toContain('<loc>https://www.rfc10023.de/oekosystem</loc><lastmod>2026-10-04</lastmod>');
  });
  it('never moves lastmod backwards', () => {
    expect(out).toContain('<loc>https://www.rfc10023.de/en/ecosystem</loc><lastmod>2026-10-09</lastmod>');
  });
  it('does not touch other URLs', () => {
    expect(out).toContain('<loc>https://www.rfc10023.de/oekosystem-alt</loc><lastmod>2026-01-01</lastmod>');
  });
});
