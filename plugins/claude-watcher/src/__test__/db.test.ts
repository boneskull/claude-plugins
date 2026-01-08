/**
 * Tests for db.ts
 */

import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';

import { expect } from 'bupkis';

import { WatchDatabase } from '../db.js';
import { Watch } from '../types.js';

/** Create a test watch with sensible defaults */
function createTestWatch(overrides: Partial<Watch> = {}): Watch {
  return {
    id: `w_${Math.random().toString(16).slice(2, 10)}`,
    trigger: 'test-trigger',
    params: ['arg1', 'arg2'],
    action: { prompt: 'Test prompt', cwd: '/tmp' },
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(), // +24h
    interval: '30s',
    lastCheck: null,
    firedAt: null,
    ...overrides,
  };
}

describe('WatchDatabase', () => {
  let db: WatchDatabase;
  let tempDir: string;
  let dbPath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'claude-watcher-test-'));
    dbPath = join(tempDir, 'test.db');
    db = new WatchDatabase(dbPath);
  });

  afterEach(() => {
    db.close();
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('insert and getById', () => {
    it('round-trips a watch', () => {
      const watch = createTestWatch({ id: 'w_test1234' });
      db.insert(watch);

      const retrieved = db.getById('w_test1234');

      expect(retrieved, 'to satisfy', {
        id: 'w_test1234',
        trigger: 'test-trigger',
        params: ['arg1', 'arg2'],
        action: { prompt: 'Test prompt', cwd: '/tmp' },
        status: 'active',
        interval: '30s',
        lastCheck: null,
        firedAt: null,
      });
    });

    it('returns null for non-existent ID', () => {
      const result = db.getById('w_nonexistent');
      expect(result, 'to be null');
    });
  });

  describe('list', () => {
    it('returns all watches when no filter', () => {
      db.insert(createTestWatch({ id: 'w_1', status: 'active' }));
      db.insert(createTestWatch({ id: 'w_2', status: 'fired' }));
      db.insert(createTestWatch({ id: 'w_3', status: 'expired' }));

      const all = db.list();

      expect(all, 'to have length', 3);
    });

    it('returns all watches when filter is "all"', () => {
      db.insert(createTestWatch({ id: 'w_1', status: 'active' }));
      db.insert(createTestWatch({ id: 'w_2', status: 'fired' }));

      const all = db.list('all');

      expect(all, 'to have length', 2);
    });

    it('filters by status', () => {
      db.insert(createTestWatch({ id: 'w_1', status: 'active' }));
      db.insert(createTestWatch({ id: 'w_2', status: 'active' }));
      db.insert(createTestWatch({ id: 'w_3', status: 'fired' }));

      const active = db.list('active');

      expect(active, 'to have length', 2);
      expect(
        active.every((w) => w.status === 'active'),
        'to be true',
      );
    });

    it('returns empty array when no matches', () => {
      db.insert(createTestWatch({ id: 'w_1', status: 'active' }));

      const cancelled = db.list('cancelled');

      expect(cancelled, 'to be empty');
    });
  });

  describe('getActiveWatches', () => {
    it('only returns active watches', () => {
      db.insert(createTestWatch({ id: 'w_1', status: 'active' }));
      db.insert(createTestWatch({ id: 'w_2', status: 'fired' }));
      db.insert(createTestWatch({ id: 'w_3', status: 'active' }));
      db.insert(createTestWatch({ id: 'w_4', status: 'expired' }));

      const active = db.getActiveWatches();

      expect(active, 'to have length', 2);
      expect(active.map((w) => w.id).sort(), 'to deep equal', ['w_1', 'w_3']);
    });
  });

  describe('updateStatus', () => {
    it('changes status correctly', () => {
      db.insert(createTestWatch({ id: 'w_1', status: 'active' }));

      db.updateStatus('w_1', 'cancelled');

      const watch = db.getById('w_1');
      expect(watch, 'to satisfy', { status: 'cancelled' });
    });
  });

  describe('updateLastCheck', () => {
    it('updates timestamp', () => {
      db.insert(createTestWatch({ id: 'w_1', lastCheck: null }));
      const timestamp = '2025-01-08T12:00:00.000Z';

      db.updateLastCheck('w_1', timestamp);

      const watch = db.getById('w_1');
      expect(watch, 'to satisfy', { lastCheck: timestamp });
    });
  });

  describe('markFired', () => {
    it('sets status to fired and firedAt timestamp', () => {
      db.insert(
        createTestWatch({ id: 'w_1', status: 'active', firedAt: null }),
      );
      const firedAt = '2025-01-08T15:30:00.000Z';

      db.markFired('w_1', firedAt);

      const watch = db.getById('w_1');
      expect(watch, 'to satisfy', {
        status: 'fired',
        firedAt: firedAt,
      });
    });
  });

  describe('expireOldWatches', () => {
    it('expires watches past their expiresAt', () => {
      const pastExpiry = new Date(Date.now() - 3600000).toISOString(); // -1h
      const futureExpiry = new Date(Date.now() + 3600000).toISOString(); // +1h

      db.insert(
        createTestWatch({
          id: 'w_expired',
          status: 'active',
          expiresAt: pastExpiry,
        }),
      );
      db.insert(
        createTestWatch({
          id: 'w_valid',
          status: 'active',
          expiresAt: futureExpiry,
        }),
      );

      const count = db.expireOldWatches();

      expect(count, 'to equal', 1);

      const expired = db.getById('w_expired');
      const valid = db.getById('w_valid');

      expect(expired, 'to satisfy', { status: 'expired' });
      expect(valid, 'to satisfy', { status: 'active' });
    });

    it('returns count of expired watches', () => {
      const pastExpiry = new Date(Date.now() - 3600000).toISOString();

      db.insert(
        createTestWatch({ id: 'w_1', status: 'active', expiresAt: pastExpiry }),
      );
      db.insert(
        createTestWatch({ id: 'w_2', status: 'active', expiresAt: pastExpiry }),
      );
      db.insert(
        createTestWatch({ id: 'w_3', status: 'fired', expiresAt: pastExpiry }),
      ); // already fired, not active

      const count = db.expireOldWatches();

      expect(count, 'to equal', 2);
    });

    it('returns 0 when no watches to expire', () => {
      const futureExpiry = new Date(Date.now() + 86400000).toISOString();
      db.insert(
        createTestWatch({
          id: 'w_1',
          status: 'active',
          expiresAt: futureExpiry,
        }),
      );

      const count = db.expireOldWatches();

      expect(count, 'to equal', 0);
    });
  });

  describe('delete', () => {
    it('removes watch and returns true', () => {
      db.insert(createTestWatch({ id: 'w_1' }));

      const result = db.delete('w_1');

      expect(result, 'to be true');
      expect(db.getById('w_1'), 'to be null');
    });

    it('returns false for non-existent watch', () => {
      const result = db.delete('w_nonexistent');

      expect(result, 'to be false');
    });
  });
});
