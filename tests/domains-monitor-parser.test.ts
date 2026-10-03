import { describe, it, expect } from 'vitest';
import { parseDomainsMonitorHtml } from '../scripts/update-adoption.mjs';

describe('parseDomainsMonitorHtml', () => {
  it('parses a <tr title="..."> row', () => {
    const html = `<table><tr title="Domains for sale with _for-sale DNS records (full dataset)">
      <td>Domains for sale (full dataset)</td><td>03.10.2026</td><td>569 405</td><td></td></tr></table>`;
    expect(parseDomainsMonitorHtml(html)).toEqual({ count: 569405, sourceDate: '2026-10-03' });
  });

  it('handles &nbsp; thousands separators', () => {
    const html = `<tr title="full dataset"><td>x</td><td>3.10.2026</td><td>569&nbsp;405</td></tr>`;
    expect(parseDomainsMonitorHtml(html)).toEqual({ count: 569405, sourceDate: '2026-10-03' });
  });

  it('falls back to visible text when the title attribute is missing', () => {
    const html = `<table><tr><td><a href="#">Domains for sale with _for-sale DNS records (full dataset)</a></td>
      <td><span>04.10.2026</span></td><td><b>571&#160;002</b></td></tr>
      <tr><td>Domains for sale with _for-sale DNS records (daily update)</td><td>04.10.2026</td><td>1 200</td></tr></table>`;
    expect(parseDomainsMonitorHtml(html)).toEqual({ count: 571002, sourceDate: '2026-10-04' });
  });

  it('returns null for unrelated pages (e.g. 404)', () => {
    expect(parseDomainsMonitorHtml('<html><body>Not Found</body></html>')).toBeNull();
    expect(parseDomainsMonitorHtml('')).toBeNull();
  });
});
