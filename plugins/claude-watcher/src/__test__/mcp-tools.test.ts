/**
 * Tests for MCP tool handlers
 */

import { expect } from 'bupkis';
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, afterEach, before, describe, it } from 'node:test';

import { WatchDatabase } from '../db.js';
import {
  handleCancelWatch,
  handleListTriggers,
  handleListWatches,
  handleRegisterWatch,
  handleWatchStatus,
} from '../mcp-tools.js';

describe('MCP tool handlers', () => {
  let tempDir: string;
  let dbPath: string;
  let triggersDir: string;
  let db: WatchDatabase;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'claude-watcher-mcp-test-'));
    dbPath = join(tempDir, 'test.db');
    triggersDir = join(tempDir, 'triggers');

    // Create triggers directory
    mkdirSync(triggersDir, { recursive: true });

    // Initialize database
    db = new WatchDatabase(dbPath);
  });

  after(() => {
    if (db) {
      db.close();
    }
    rmSync(tempDir, { force: true, recursive: true });
  });

  afterEach(() => {
    // Close and recreate database for fresh state
    if (db) {
      db.close();
    }
    try {
      unlinkSync(dbPath);
    } catch {
      // Ignore
    }
    db = new WatchDatabase(dbPath);

    // Clean up triggers
    for (const file of readdirSync(triggersDir)) {
      rmSync(join(triggersDir, file));
    }
  });

  /** Helper to create an executable trigger */
  const createTrigger = (name: string): void => {
    const triggerPath = join(triggersDir, name);
    writeFileSync(triggerPath, '#!/bin/bash\nexit 0', 'utf-8');
    chmodSync(triggerPath, 0o755);
  };

  describe('handleRegisterWatch', () => {
    it('creates watch with valid trigger', async () => {
      createTrigger('test-trigger');

      const result = await handleRegisterWatch(
        {
          action: { prompt: 'Do something' },
          params: ['arg1', 'arg2'],
          trigger: 'test-trigger',
        },
        { db, triggersDir },
      );

      expect(result.isError, 'to be undefined');
      const response = JSON.parse(result.content[0]!.text);
      expect(response.watchId, 'to match', /^w_[a-f0-9]{8}$/);
      expect(response.message, 'to contain', 'Watch registered');

      // Verify watch is in database
      const watches = db.list('all');
      expect(watches, 'to have length', 1);
      expect(watches[0]!.trigger, 'to equal', 'test-trigger');
    });

    it('returns error for invalid trigger', async () => {
      const result = await handleRegisterWatch(
        {
          action: { prompt: 'Test' },
          params: [],
          trigger: 'nonexistent-trigger',
        },
        { db, triggersDir },
      );

      expect(result.isError, 'to be true');
      expect(result.content[0]!.text, 'to contain', 'not found');
    });

    it('respects TTL param', async () => {
      createTrigger('ttl-trigger');

      const beforeTime = Date.now();
      await handleRegisterWatch(
        {
          action: { prompt: 'Test' },
          params: [],
          trigger: 'ttl-trigger',
          ttl: '1h',
        },
        { db, triggersDir },
      );
      const afterTime = Date.now();

      const watches = db.list('all');
      const expiryTime = new Date(watches[0]!.expiresAt).getTime();
      const oneHour = 60 * 60 * 1000;

      // Expiry should be within ~1 hour from now
      expect(
        expiryTime,
        'to be greater than or equal to',
        beforeTime + oneHour,
      );
      expect(
        expiryTime,
        'to be less than or equal to',
        afterTime + oneHour + 100,
      );
    });

    it('respects interval param', async () => {
      createTrigger('interval-trigger');

      await handleRegisterWatch(
        {
          action: { prompt: 'Test' },
          interval: '5m',
          params: [],
          trigger: 'interval-trigger',
        },
        { db, triggersDir },
      );

      const watches = db.list('all');
      expect(watches[0]!.interval, 'to equal', '5m');
    });
  });

  describe('handleListWatches', () => {
    it('returns empty message when no watches', async () => {
      const result = await handleListWatches({}, { db, triggersDir });

      expect(result.content[0]!.text, 'to equal', 'No watches found.');
    });

    it('lists watches with correct formatting', async () => {
      createTrigger('list-trigger');

      await handleRegisterWatch(
        {
          action: { prompt: 'Test' },
          params: ['pkg', '1.0.0'],
          trigger: 'list-trigger',
        },
        { db, triggersDir },
      );

      const result = await handleListWatches({}, { db, triggersDir });

      expect(result.content[0]!.text, 'to contain', 'Found 1 watch');
      expect(result.content[0]!.text, 'to contain', 'list-trigger');
      expect(result.content[0]!.text, 'to contain', 'pkg 1.0.0');
      expect(result.content[0]!.text, 'to contain', '[active]');
    });

    it('filters by status', async () => {
      createTrigger('filter-trigger');

      // Create an active watch
      await handleRegisterWatch(
        {
          action: { prompt: 'Active' },
          params: [],
          trigger: 'filter-trigger',
        },
        { db, triggersDir },
      );

      // Create and cancel another watch
      await handleRegisterWatch(
        {
          action: { prompt: 'Cancelled' },
          params: [],
          trigger: 'filter-trigger',
        },
        { db, triggersDir },
      );
      const watches = db.list('all');
      db.updateStatus(watches[1]!.id, 'cancelled');

      // Filter by active only
      const activeResult = await handleListWatches(
        { status: 'active' },
        { db, triggersDir },
      );
      expect(activeResult.content[0]!.text, 'to contain', 'Found 1 watch');

      // Filter by cancelled
      const cancelledResult = await handleListWatches(
        { status: 'cancelled' },
        { db, triggersDir },
      );
      expect(cancelledResult.content[0]!.text, 'to contain', 'Found 1 watch');
      expect(cancelledResult.content[0]!.text, 'to contain', '[cancelled]');
    });
  });

  describe('handleWatchStatus', () => {
    it('returns watch details as JSON', async () => {
      createTrigger('status-trigger');

      await handleRegisterWatch(
        {
          action: { cwd: '/test/dir', prompt: 'Status test' },
          params: ['x', 'y'],
          trigger: 'status-trigger',
        },
        { db, triggersDir },
      );

      const watches = db.list('all');
      const result = await handleWatchStatus(
        { watchId: watches[0]!.id },
        { db, triggersDir },
      );

      const watch = JSON.parse(result.content[0]!.text);
      expect(watch, 'to satisfy', {
        action: { cwd: '/test/dir', prompt: 'Status test' },
        params: ['x', 'y'],
        status: 'active',
        trigger: 'status-trigger',
      });
    });

    it('returns error for unknown watchId', async () => {
      const result = await handleWatchStatus(
        { watchId: 'w_nonexist' },
        { db, triggersDir },
      );

      expect(result.isError, 'to be true');
      expect(result.content[0]!.text, 'to contain', 'not found');
    });
  });

  describe('handleCancelWatch', () => {
    it('cancels active watch', async () => {
      createTrigger('cancel-trigger');

      await handleRegisterWatch(
        {
          action: { prompt: 'Cancel me' },
          params: [],
          trigger: 'cancel-trigger',
        },
        { db, triggersDir },
      );

      const watches = db.list('all');
      const result = await handleCancelWatch(
        { watchId: watches[0]!.id },
        { db, triggersDir },
      );

      expect(result.isError, 'to be undefined');
      expect(result.content[0]!.text, 'to contain', 'cancelled');

      // Verify status changed
      const updated = db.getById(watches[0]!.id);
      expect(updated?.status, 'to equal', 'cancelled');
    });

    it('returns error for non-active watch', async () => {
      createTrigger('already-cancelled');

      await handleRegisterWatch(
        {
          action: { prompt: 'Test' },
          params: [],
          trigger: 'already-cancelled',
        },
        { db, triggersDir },
      );

      const watches = db.list('all');
      db.updateStatus(watches[0]!.id, 'fired');

      const result = await handleCancelWatch(
        { watchId: watches[0]!.id },
        { db, triggersDir },
      );

      expect(result.isError, 'to be true');
      expect(result.content[0]!.text, 'to contain', 'Cannot cancel');
      expect(result.content[0]!.text, 'to contain', 'fired');
    });

    it('returns error for unknown watchId', async () => {
      const result = await handleCancelWatch(
        { watchId: 'w_unknown1' },
        { db, triggersDir },
      );

      expect(result.isError, 'to be true');
      expect(result.content[0]!.text, 'to contain', 'not found');
    });
  });

  describe('handleListTriggers', () => {
    it('lists available triggers with metadata', async () => {
      createTrigger('trigger-one');
      createTrigger('trigger-two');

      // Add YAML metadata for one
      writeFileSync(
        join(triggersDir, 'trigger-one.yaml'),
        `name: trigger-one
description: First test trigger
args:
  - name: pkg
    description: Package name
defaultInterval: 60s`,
        'utf-8',
      );

      const result = await handleListTriggers({ triggersDir });

      expect(result.content[0]!.text, 'to contain', 'Available triggers');
      expect(result.content[0]!.text, 'to contain', 'trigger-one');
      expect(result.content[0]!.text, 'to contain', 'trigger-two');
      expect(result.content[0]!.text, 'to contain', 'First test trigger');
      expect(result.content[0]!.text, 'to contain', '<pkg>');
      expect(result.content[0]!.text, 'to contain', 'Default interval: 60s');
    });

    it('returns empty message when no triggers', async () => {
      const result = await handleListTriggers({ triggersDir });

      expect(result.content[0]!.text, 'to contain', 'No triggers found');
    });
  });
});
