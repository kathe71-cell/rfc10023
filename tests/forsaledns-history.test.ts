import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateForSaleDnsItem,
  processForSaleDnsEntries,
  applyForSaleDnsUpdate,
} from '../scripts/import-forsaledns-history.mjs';

describe('ForSaleDNS RFC 10023 Adoption History Integration Tests', () => {
  const forSaleDnsJsonPath = path.resolve(process.cwd(), 'data/adoption-history-forsaledns.json');
  const domainsMonitorJsonPath = path.resolve(process.cwd(), 'data/adoption-history.json');
  const deHtmlPath = path.resolve(process.cwd(), 'dist/oekosystem/index.html');
  const enHtmlPath = path.resolve(process.cwd(), 'dist/en/ecosystem/index.html');

  describe('1. Schema Validation and Ingestion Logic', () => {
    it('validates genuine vs malformed ForSaleDNS API items', () => {
      expect(
        validateForSaleDnsItem({
          day: '2026-08-17',
          active: 339896,
          inventoryTotal: 343818996,
          inventoryCompleted: 343818996,
          baselineComplete: false,
        })
      ).toBe(true);

      // Missing or invalid day
      expect(validateForSaleDnsItem({ day: 'invalid-date', active: 339896 })).toBe(false);
      // Zero or negative active count
      expect(validateForSaleDnsItem({ day: '2026-08-17', active: 0, inventoryTotal: 100, inventoryCompleted: 100 })).toBe(false);
      // Missing inventory data
      expect(validateForSaleDnsItem({ day: '2026-08-17', active: 339896, inventoryTotal: 0 })).toBe(false);
      // Null or non-object
      expect(validateForSaleDnsItem(null)).toBe(false);
    });

    it('processes, sorts chronologically, and deduplicates raw items', () => {
      const mockRaw = [
        { day: '2026-08-18', active: 340115, inventoryTotal: 1000, inventoryCompleted: 1000, baselineComplete: false },
        { day: '2026-08-16', active: 333159, inventoryTotal: 1000, inventoryCompleted: 976, baselineComplete: false },
        { day: '2026-08-18', active: 340120, inventoryTotal: 1000, inventoryCompleted: 1000, baselineComplete: false }, // Duplicate day with latest value
      ];

      const processed = processForSaleDnsEntries(mockRaw);
      expect(processed).toHaveLength(2);
      expect(processed[0].date).toBe('2026-08-16');
      expect(processed[0].sweepComplete).toBe(false);
      expect(processed[1].date).toBe('2026-08-18');
      expect(processed[1].activeListings).toBe(340120);
      expect(processed[1].sweepComplete).toBe(true);
    });
  });

  describe('2. ForSaleDNS Stored Historical Dataset Integrity', () => {
    it('verifies data/adoption-history-forsaledns.json exists and contains at least 41 daily entries', () => {
      expect(fs.existsSync(forSaleDnsJsonPath)).toBe(true);
      const data = JSON.parse(fs.readFileSync(forSaleDnsJsonPath, 'utf-8'));
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(41);
    });

    it('verifies strict chronological order and absence of duplicate days', () => {
      const data = JSON.parse(fs.readFileSync(forSaleDnsJsonPath, 'utf-8'));
      const seenDates = new Set<string>();

      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        expect(seenDates.has(item.date)).toBe(false);
        seenDates.add(item.date);

        if (i > 0) {
          expect(item.date.localeCompare(data[i - 1].date)).toBeGreaterThan(0);
        }
      }

      expect(data[0].date).toBe('2026-08-15');
      expect(data[data.length - 1].date >= '2026-09-24').toBe(true);
    });

    it('verifies correct handling of partial sweeps vs 100% complete sweeps', () => {
      const data = JSON.parse(fs.readFileSync(forSaleDnsJsonPath, 'utf-8'));

      // Days 2026-08-15 and 2026-08-16 were partial sweeps
      expect(data[0].sweepComplete).toBe(false);
      expect(data[0].inventoryCompleted).toBeLessThan(data[0].inventoryTotal);
      expect(data[1].sweepComplete).toBe(false);
      expect(data[1].inventoryCompleted).toBeLessThan(data[1].inventoryTotal);

      // Starting 2026-08-17, all 39 subsequent days are 100% complete inventory sweeps
      for (let i = 2; i < data.length; i++) {
        expect(data[i].sweepComplete).toBe(true);
        expect(data[i].inventoryCompleted).toBe(data[i].inventoryTotal);
      }

      // baselineComplete is documented as false across the dataset
      for (const item of data) {
        expect(item.baselineComplete).toBe(false);
      }
    });
  });

  describe('3. Strict Separation of Domains Monitor History', () => {
    it('ensures data/adoption-history.json is not modified or combined with ForSaleDNS', () => {
      expect(fs.existsSync(domainsMonitorJsonPath)).toBe(true);
      const dmData = JSON.parse(fs.readFileSync(domainsMonitorJsonPath, 'utf-8'));
      expect(Array.isArray(dmData)).toBe(true);
      expect(dmData.length).toBe(1);
      expect(dmData[0].date).toBe('2026-09-24');
      expect(dmData[0].source).toBe('domainsMonitor');
      expect(dmData[0].value).toBe(392683);
    });
  });

  describe('4. SSG Pre-Rendered Markup Integrity (German & English)', () => {
    it('verifies dist/oekosystem/index.html renders ForSaleDNS chart, methodology, and sources', () => {
      expect(fs.existsSync(deHtmlPath)).toBe(true);
      const deHtml = fs.readFileSync(deHtmlPath, 'utf-8');

      const forSaleHistory = JSON.parse(fs.readFileSync(forSaleDnsJsonPath, 'utf-8'));
      const latestActive = forSaleHistory[forSaleHistory.length - 1].activeListings;
      const deActiveFormatted = latestActive.toLocaleString('de-DE');
      const enActiveFormatted = latestActive.toLocaleString('en-US');

      // Main header
      expect(deHtml).toContain('RFC 10023 Adoption im Zeitverlauf');
      expect(deHtml).toContain('Letzte Aktualisierung: 25. September 2026');
      expect(deHtml).toContain('40 Tage');
      expect(deHtml).toContain('Abgerufen am 25. September 2026');
      // ForSaleDNS section
      expect(deHtml).toContain('ForSaleDNS – Aktive Listings');
      expect(deHtml).toContain(deActiveFormatted);
      expect(deHtml).toContain('ForSaleDNS · historische Adoptionsdaten');
      expect(deHtml).toContain('https://forsaledns.net/developers');
      expect(deHtml).toContain('ForSaleDNS-Quelle und Methodik öffnen');
      // Technical API endpoint preserved in methodology/technical section
      expect(deHtml).toContain('GET /api/v1/adoption-history');
      // Methodology text (Requirement 9)
      expect(deHtml).toContain('Die dargestellten Reihen stammen aus unterschiedlichen unabhängigen Scan- und Discovery-Systemen');
      expect(deHtml).toContain('Historische ForSaleDNS-Werte werden direkt aus der dokumentierten Adoption-History-API übernommen');
      // Domains Monitor section
      expect(deHtml).toContain('Domains Monitor – Erkannte Domains');
      expect(deHtml).toContain('392.683');
      expect(deHtml).toContain('domains-monitor.com/research/rfc10023');
    });

    it('verifies dist/en/ecosystem/index.html renders English ForSaleDNS chart, methodology, and sources', () => {
      expect(fs.existsSync(enHtmlPath)).toBe(true);
      const enHtml = fs.readFileSync(enHtmlPath, 'utf-8');
      const forSaleHistory = JSON.parse(fs.readFileSync(forSaleDnsJsonPath, 'utf-8'));
      const latestActive = forSaleHistory[forSaleHistory.length - 1].activeListings;
      const enActiveFormatted = latestActive.toLocaleString('en-US');

      // Main header
      expect(enHtml).toContain('RFC 10023 Adoption over time');
      expect(enHtml).toContain('Last updated: 25 September 2026');
      expect(enHtml).toContain('40 days');
      expect(enHtml).toContain('Retrieved on September 25, 2026');
      // ForSaleDNS section
      expect(enHtml).toContain('ForSaleDNS – Active Listings');
      expect(enHtml).toContain(enActiveFormatted);
      expect(enHtml).toContain('ForSaleDNS · historical adoption data');
      expect(enHtml).toContain('https://forsaledns.net/developers');
      expect(enHtml).toContain('Open ForSaleDNS source and methodology');
      // Technical API endpoint preserved in methodology/technical section
      expect(enHtml).toContain('GET /api/v1/adoption-history');
      // Methodology text (Requirement 9)
      expect(enHtml).toContain('The series shown originate from different independent scan and discovery systems');
      expect(enHtml).toContain('Historical ForSaleDNS values are retrieved directly from the documented Adoption History API');
      // Domains Monitor section
      expect(enHtml).toContain('Domains Monitor – Detected Domains');
      expect(enHtml).toContain('392,683');
    });
  });

  describe('5. Methodical Separation of Datenstand and Letzter erfolgreicher Abruf (Cases A - E)', () => {
    const initialMeta = {
      latestSnapshotDate: '2026-09-25',
      lastSuccessfulFetch: '2026-09-25T05:24:31Z',
    };
    const initialHistory = [
      { date: '2026-09-25', activeListings: 334576, sweepComplete: true },
    ];

    it('Fall A: Fetch erfolgreich + neuer Messpunkt -> Snapshot-Datum & Fetch-Zeit aktualisiert', () => {
      const newEntries = [
        { date: '2026-09-25', activeListings: 334576, sweepComplete: true },
        { date: '2026-09-26', activeListings: 335000, sweepComplete: true },
      ];
      const result = applyForSaleDnsUpdate(initialMeta, initialHistory, newEntries, '2026-09-26T05:17:42Z');

      expect(result.status).toBe('success-new-data');
      expect(result.meta.latestSnapshotDate).toBe('2026-09-26');
      expect(result.meta.lastSuccessfulFetch).toBe('2026-09-26T05:17:42Z');
      expect(result.historyChanged).toBe(true);
      expect(result.history).toHaveLength(2);
    });

    it('Fall B: Fetch erfolgreich + kein neuer Messpunkt -> Snapshot-Datum bleibt gleich, Fetch-Zeit aktualisiert', () => {
      const sameEntries = [
        { date: '2026-09-25', activeListings: 334576, sweepComplete: true },
      ];
      const result = applyForSaleDnsUpdate(initialMeta, initialHistory, sameEntries, '2026-09-26T05:17:42Z');

      expect(result.status).toBe('success-no-new-data');
      expect(result.meta.latestSnapshotDate).toBe('2026-09-25'); // Unchanged!
      expect(result.meta.lastSuccessfulFetch).toBe('2026-09-26T05:17:42Z'); // Updated!
      expect(result.historyChanged).toBe(false);
    });

    it('Fall C: Fetch schlägt fehl -> Snapshot-Datum bleibt gleich, Fetch-Zeit bleibt gleich', () => {
      const result = applyForSaleDnsUpdate(initialMeta, initialHistory, null, '2026-09-26T05:17:42Z');

      expect(result.status).toBe('fetch-failed');
      expect(result.meta.latestSnapshotDate).toBe('2026-09-25'); // Unchanged!
      expect(result.meta.lastSuccessfulFetch).toBe('2026-09-25T05:24:31Z'); // Unchanged!
      expect(result.historyChanged).toBe(false);
      expect(result.history).toEqual(initialHistory);
    });

    it('Fall D: UI zeigt beide Werte korrekt und getrennt im vorgerenderten HTML', () => {
      const deHtml = fs.readFileSync(deHtmlPath, 'utf-8');
      const enHtml = fs.readFileSync(enHtmlPath, 'utf-8');

      // German distinct labels
      expect(deHtml).toContain('Datenstand:');
      expect(deHtml).toContain('Letzter erfolgreicher Abruf:');
      expect(deHtml).toContain('MESZ');

      // English distinct labels
      expect(enHtml).toContain('Data snapshot:');
      expect(enHtml).toContain('Last successful fetch:');
      expect(enHtml).toContain('CEST');

      // Methodology explains the separation
      expect(deHtml).toContain('Der Datenstand bezeichnet den jüngsten von der Quelle veröffentlichten Messpunkt');
      expect(enHtml).toContain('The data snapshot refers to the latest measurement published by the source');
    });

    it('Fall E: Datums- und Zeitformatierung erfolgt in Europe/Berlin (MESZ/MEZ)', () => {
      const deFmt = new Intl.DateTimeFormat('de-DE', {
        timeZone: 'Europe/Berlin',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short',
      }).format(new Date('2026-09-25T05:24:31Z'));

      expect(deFmt).toContain('25.09.2026');
      expect(deFmt).toContain('MESZ');
    });
  });
});
