/**
 * SQLite database layer for watch persistence
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  CONFIG_DIR,
  DB_FILE,
  Watch,
  WatchAction,
  WatchRow,
  WatchStatus,
} from './types.js';

/** Convert database row to Watch object */
function rowToWatch(row: WatchRow): Watch {
  return {
    id: row.id,
    trigger: row.trigger,
    params: JSON.parse(row.params) as string[],
    action: JSON.parse(row.action) as WatchAction,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    interval: row.interval,
    lastCheck: row.last_check,
    firedAt: row.fired_at,
  };
}

/** Database connection manager */
export class WatchDatabase {
  private db: Database.Database;

  constructor(dbPath?: string) {
    const configDir = join(homedir(), CONFIG_DIR);
    const actualPath = dbPath ?? join(configDir, DB_FILE);

    // Ensure config directory exists
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true });
    }

    this.db = new Database(actualPath);
    this.db.pragma('journal_mode = WAL');
    this.initSchema();
  }

  /** Initialize database schema */
  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS watches (
        id TEXT PRIMARY KEY,
        trigger TEXT NOT NULL,
        params TEXT NOT NULL,
        action TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        expires_at TEXT NOT NULL,
        interval TEXT NOT NULL,
        last_check TEXT,
        fired_at TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_watches_status ON watches(status);
      CREATE INDEX IF NOT EXISTS idx_watches_expires_at ON watches(expires_at);
    `);
  }

  /** Insert a new watch */
  insert(watch: Watch): void {
    const stmt = this.db.prepare<
      [
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string,
        string | null,
        string | null,
      ]
    >(`
      INSERT INTO watches (id, trigger, params, action, status, created_at, expires_at, interval, last_check, fired_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      watch.id,
      watch.trigger,
      JSON.stringify(watch.params),
      JSON.stringify(watch.action),
      watch.status,
      watch.createdAt,
      watch.expiresAt,
      watch.interval,
      watch.lastCheck,
      watch.firedAt,
    );
  }

  /** Get a watch by ID */
  getById(id: string): Watch | null {
    const stmt = this.db.prepare<[string], WatchRow>(
      'SELECT * FROM watches WHERE id = ?',
    );
    const row = stmt.get(id);
    return row ? rowToWatch(row) : null;
  }

  /** List watches, optionally filtered by status */
  list(status?: WatchStatus | 'all'): Watch[] {
    if (!status || status === 'all') {
      const stmt = this.db.prepare<[], WatchRow>(
        'SELECT * FROM watches ORDER BY created_at DESC',
      );
      return stmt.all().map(rowToWatch);
    }
    const stmt = this.db.prepare<[string], WatchRow>(
      'SELECT * FROM watches WHERE status = ? ORDER BY created_at DESC',
    );
    return stmt.all(status).map(rowToWatch);
  }

  /** Get all active watches that need polling */
  getActiveWatches(): Watch[] {
    const stmt = this.db.prepare<[], WatchRow>(
      "SELECT * FROM watches WHERE status = 'active'",
    );
    return stmt.all().map(rowToWatch);
  }

  /** Update watch status */
  updateStatus(id: string, status: WatchStatus): void {
    const stmt = this.db.prepare<[string, string]>(
      'UPDATE watches SET status = ? WHERE id = ?',
    );
    stmt.run(status, id);
  }

  /** Update last check timestamp */
  updateLastCheck(id: string, timestamp: string): void {
    const stmt = this.db.prepare<[string, string]>(
      'UPDATE watches SET last_check = ? WHERE id = ?',
    );
    stmt.run(timestamp, id);
  }

  /** Mark watch as fired */
  markFired(id: string, firedAt: string): void {
    const stmt = this.db.prepare<[string, string]>(
      "UPDATE watches SET status = 'fired', fired_at = ? WHERE id = ?",
    );
    stmt.run(firedAt, id);
  }

  /** Mark expired watches */
  expireOldWatches(): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare<[string]>(`
      UPDATE watches
      SET status = 'expired'
      WHERE status = 'active' AND expires_at < ?
    `);
    const result = stmt.run(now);
    return result.changes;
  }

  /** Delete a watch */
  delete(id: string): boolean {
    const stmt = this.db.prepare<[string]>('DELETE FROM watches WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /** Close database connection */
  close(): void {
    this.db.close();
  }
}

/** Singleton instance for shared use */
let instance: WatchDatabase | null = null;

export function getDatabase(dbPath?: string): WatchDatabase {
  if (!instance) {
    instance = new WatchDatabase(dbPath);
  }
  return instance;
}

export function closeDatabase(): void {
  if (instance) {
    instance.close();
    instance = null;
  }
}
