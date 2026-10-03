import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const current = JSON.parse(fs.readFileSync(path.join(root, 'data/adoption-current.json'), 'utf-8')).sources.domainsMonitor;
const history = JSON.parse(fs.readFileSync(path.join(root, 'data/adoption-history.json'), 'utf-8'));

describe('Domains Monitor telemetry sync', () => {
  it('uses the full dataset metric from the primary source URL', () => {
    expect(current.metric).toBe('full_dataset');
    expect(current.sourceUrl).toBe('https://domains-monitor.com/for-sale-domains/');
    expect(current.count).toBe(current.value);
    expect(current.sourceDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('latest history point equals current snapshot; older points are preserved', () => {
    const last = history[history.length - 1];
    expect(last.value).toBe(current.value);
    expect(history[0]).toEqual({ date: '2026-09-24', source: 'domainsMonitor', value: 392683 });
  });

  it('prerendered /oekosystem shows current KPI, never the stale value as KPI', () => {
    const html = fs.readFileSync(path.join(root, 'dist/oekosystem/index.html'), 'utf-8');
    const de = current.value.toLocaleString('de-DE');
    expect(html).toContain(`>${de}<`);
    // stale 392.683 only allowed as historical table row
    const stale = html.split('392.683').length - 1;
    expect(stale).toBeLessThanOrEqual(1);
    expect(html).not.toContain('392.683<!-- -->+');
  });

  it('STALE GUARD: header "last updated" must not be newer than DM sourceDate without differentiation', () => {
    const html = fs.readFileSync(path.join(root, 'dist/oekosystem/index.html'), 'utf-8');
    const [y, m, d] = current.sourceDate.split('-');
    const ageDays = (Date.now() - new Date(current.sourceDate).getTime()) / 86400000;
    if (ageDays > 2) {
      // data is stale -> UI must show explicit warning
      expect(html).toContain('data-stale-warning');
    }
    expect(html).toContain(`Datenstand: ${d}.${m}.${y}`);
  });
});
