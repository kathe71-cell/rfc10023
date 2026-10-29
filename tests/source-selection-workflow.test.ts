import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import {
  parseSourceArg,
  normalizeSourceArg,
} from '../scripts/update-adoption.mjs';

describe('RFC 10023 Adoption Source Selection & Isolation', () => {
  it('normalizes CLI source arguments correctly', () => {
    expect(normalizeSourceArg('domains-monitor')).toBe('domains-monitor');
    expect(normalizeSourceArg('domainsmonitor')).toBe('domains-monitor');
    expect(normalizeSourceArg('domains_monitor')).toBe('domains-monitor');

    expect(normalizeSourceArg('forsaledns')).toBe('forsaledns');
    expect(normalizeSourceArg('for-sale-dns')).toBe('forsaledns');

    expect(normalizeSourceArg('all')).toBe('all');
    expect(normalizeSourceArg('')).toBe('all');
    expect(normalizeSourceArg(undefined)).toBe('all');
  });

  it('parses --source and --source= flags from argv arrays', () => {
    expect(parseSourceArg(['node', 'script.mjs', '--source', 'domains-monitor'])).toBe('domains-monitor');
    expect(parseSourceArg(['node', 'script.mjs', '--source=domains-monitor'])).toBe('domains-monitor');

    expect(parseSourceArg(['node', 'script.mjs', '--source', 'forsaledns'])).toBe('forsaledns');
    expect(parseSourceArg(['node', 'script.mjs', '--source=forsaledns'])).toBe('forsaledns');

    expect(parseSourceArg(['node', 'script.mjs', '--source', 'all'])).toBe('all');
    expect(parseSourceArg(['node', 'script.mjs', '--source=all'])).toBe('all');

    // Default when no flag provided
    expect(parseSourceArg(['node', 'script.mjs'])).toBe('all');
    expect(parseSourceArg(['node', 'script.mjs', '--verbose'])).toBe('all');
  });

  it('guarantees no cross-contamination between ForSaleDNS and Domains Monitor data models', async () => {
    const { applyForSaleDnsUpdate } = await import('../scripts/import-forsaledns-history.mjs');
    const { recordHistoryEntry } = await import('../scripts/update-adoption.mjs');

    // 1. Domains Monitor history update must not introduce ForSaleDNS keys
    const dmHistory = [{ date: '2026-10-11', source: 'domainsMonitor', value: 1413797 }];
    const updatedDm = recordHistoryEntry(dmHistory, '2026-10-12', 'domainsMonitor', 1414573);
    expect(updatedDm.every((entry) => entry.source === 'domainsMonitor')).toBe(true);
    expect(updatedDm.some((entry) => 'activeListings' in entry)).toBe(false);

    // 2. ForSaleDNS update must never modify or inject Domains Monitor entries
    const initialFsMeta = { latestSnapshotDate: '2026-10-11', lastSuccessfulFetch: '2026-10-11T12:00:00Z' };
    const fsHistory = [{ date: '2026-10-11', activeListings: 418105, conformant: 235920, priced: 153842, dnssec: 163192, inventoryCompleted: 343818996, inventoryTotal: 343818996, baselineComplete: false, sweepComplete: true }];
    const newFsEntries = [{
      date: '2026-10-12',
      activeListings: 431793,
      conformant: 249266,
      priced: 165086,
      dnssec: 163268,
      inventoryCompleted: 343818996,
      inventoryTotal: 343818996,
      baselineComplete: false,
      sweepComplete: true,
    }];

    const outcome = applyForSaleDnsUpdate(initialFsMeta, fsHistory, newFsEntries, '2026-10-12T14:00:00Z');
    expect(outcome.status).toBe('success-new-data');
    expect(outcome.historyChanged).toBe(true);
    expect(outcome.meta.latestSnapshotDate).toBe('2026-10-12');
    expect(outcome.history).toHaveLength(2);
    // Verified: No Domains Monitor keys in ForSaleDNS history
    expect(outcome.history.every((entry) => 'activeListings' in entry)).toBe(true);
    expect(outcome.history.some((entry) => entry.source === 'domainsMonitor')).toBe(false);
  });
});

describe('GitHub Actions Adoption Workflow Architecture', () => {
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/update-adoption.yml');

  it('validates workflow file existence and basic structure', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // Concurrency protection against overlapping runs
    expect(content).toContain('concurrency:');
    expect(content).toContain('group: update-adoption');
    expect(content).toContain('cancel-in-progress: false');

    // Job A: Domains Monitor on ubuntu-latest
    expect(content).toContain('domains-monitor:');
    expect(content).toContain('runs-on: ubuntu-latest');
    expect(content).toContain('--source domains-monitor');
    expect(content).toContain('chore(adoption): update Domains Monitor data');

    // Job B: ForSaleDNS on self-hosted macOS runner (residential IP required to bypass Cloudflare bot challenge)
    expect(content).toContain('forsaledns:');
    expect(content).toMatch(/runs-on:\s*\[self-hosted,\s*macOS,\s*rfc10023\]/);
    expect(content).toContain('needs: domains-monitor');
    expect(content).toContain('--source forsaledns');
    expect(content).toContain('chore(adoption): update ForSaleDNS data');

    // Sequential pull to prevent non-fast-forward push conflicts
    expect(content).toContain('git pull origin main --ff-only');
  });

  it('ensures each job contains its dedicated freshness check', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // Domains Monitor freshness in domains-monitor job
    expect(content).toContain('Verify Domains Monitor data is fresh');
    expect(content).toContain('sources.domainsMonitor');
    expect(content).toContain('s.lastSuccessfulFetch');

    // ForSaleDNS freshness in forsaledns job
    expect(content).toContain('Verify ForSaleDNS data is fresh');
    expect(content).toContain('forSaleDns');
    expect(content).toContain('f.lastSuccessfulFetch');
  });

  it('verifies decoupled schedules and conditional job execution', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');

    // Schedules
    expect(content).toContain("'0 5 * * *'"); // 05:00 UTC (morning)
    expect(content).toContain("'30 13 * * *'"); // 13:30 UTC (afternoon)

    // Manual dispatch inputs
    expect(content).toContain('workflow_dispatch:');
    expect(content).toContain('inputs:');
    expect(content).toContain('source:');
    expect(content).toContain('- all');
    expect(content).toContain('- domains-monitor');
    expect(content).toContain('- forsaledns');

    // Domains monitor condition
    expect(content).toContain("github.event.schedule == '0 5 * * *'");
    expect(content).toContain("inputs.source == 'domains-monitor'");

    // ForSaleDNS condition
    expect(content).toContain("github.event.schedule == '30 13 * * *'");
    expect(content).toContain("inputs.source == 'forsaledns'");
  });
});
