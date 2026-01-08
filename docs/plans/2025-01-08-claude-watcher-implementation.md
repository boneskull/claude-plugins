# claude-watcher Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an event-driven automation plugin that polls for conditions via trigger executables and executes Claude prompts when conditions are met.

**Architecture:** A daemon process polls user-defined triggers at intervals, writes results to disk when triggers fire, and a hook injects those results into the next Claude session. The MCP server provides tools for managing watches.

**Tech Stack:** TypeScript 5.9, Node.js 20+, @modelcontextprotocol/sdk, better-sqlite3, tsx for hooks

---

## Phase 1: Plugin Scaffold

### Task 1: Create Plugin Directory Structure

**Files:**
- Create: `plugins/claude-watcher/.claude-plugin/plugin.json`
- Create: `plugins/claude-watcher/package.json`
- Create: `plugins/claude-watcher/tsconfig.json`
- Create: `plugins/claude-watcher/.mcp.json`
- Create: `plugins/claude-watcher/README.md`

**Step 1: Create plugin manifest**

```json
{
  "author": {
    "name": "Christopher Hiller"
  },
  "description": "Event-driven automation daemon that polls for conditions and executes Claude prompts when triggers fire",
  "keywords": [
    "automation",
    "daemon",
    "watches",
    "mcp",
    "hooks",
    "triggers"
  ],
  "license": "BlueOak-1.0.0",
  "name": "claude-watcher",
  "version": "1.0.0"
}
```

Write to: `plugins/claude-watcher/.claude-plugin/plugin.json`

**Step 2: Create package.json**

```json
{
  "name": "claude-watcher-plugin",
  "version": "1.0.0",
  "type": "module",
  "description": "Event-driven automation daemon for Claude Code",
  "main": "dist/mcp-server.js",
  "bin": {
    "claude-watcher": "dist/bin/claude-watcher.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist",
    "test": "node --test dist/**/*.test.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "better-sqlite3": "^11.8.1",
    "ms": "^2.1.3"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.13",
    "@types/ms": "^2.1.0",
    "@types/node": "^22.15.21",
    "typescript": "^5.9.3"
  },
  "engines": {
    "node": ">=20.19.0"
  }
}
```

Write to: `plugins/claude-watcher/package.json`

**Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist"],
  "include": ["src/**/*"]
}
```

Write to: `plugins/claude-watcher/tsconfig.json`

**Step 4: Create MCP server config**

```json
{
  "mcpServers": {
    "claude-watcher": {
      "command": "node",
      "args": ["dist/mcp-server.js"],
      "env": {}
    }
  }
}
```

Write to: `plugins/claude-watcher/.mcp.json`

**Step 5: Create README**

```markdown
# claude-watcher

Event-driven automation daemon for Claude Code. Polls for conditions and executes Claude prompts when triggers fire.

## Installation

```bash
/plugin install claude-watcher@boneskull-plugins
```

## Usage

Register a watch to be notified when an npm package is published:

```
Use the register_watch tool to watch for foo@1.2.3 being published to npm.
When it's published, upgrade this project and run tests.
```

## Daemon Setup

The daemon must be running for watches to be polled. See the design doc for launchd/systemd configuration.

## Triggers

Place trigger executables in `~/.config/claude-watcher/triggers/`. A trigger:
- Receives params as CLI arguments
- Exits 0 when condition is met, non-zero otherwise
- Prints JSON to stdout with output variables (only read on exit 0)

## License

BlueOak-1.0.0
```

Write to: `plugins/claude-watcher/README.md`

**Step 6: Commit scaffold**

```bash
git add plugins/claude-watcher/
git commit -m "feat(claude-watcher): add plugin scaffold

Creates the basic plugin structure with:
- Plugin manifest
- Package.json with dependencies
- TypeScript config
- MCP server config
- README"
```

---

## Phase 2: Shared Types

### Task 2: Define TypeScript Interfaces

**Files:**
- Create: `plugins/claude-watcher/src/types.ts`

**Step 1: Write the types file**

```typescript
/**
 * Shared types for claude-watcher plugin
 */

/** Status of a watch */
export type WatchStatus = 'active' | 'fired' | 'expired' | 'cancelled';

/** Action to execute when trigger fires */
export interface WatchAction {
  /** Prompt to send to claude -p */
  prompt: string;
  /** Working directory for claude execution */
  cwd?: string;
}

/** A registered watch */
export interface Watch {
  /** Unique watch ID (w_<nanoid>) */
  id: string;
  /** Name of the trigger executable */
  trigger: string;
  /** Arguments passed to trigger */
  params: string[];
  /** Action to execute when trigger fires */
  action: WatchAction;
  /** Current status */
  status: WatchStatus;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp when watch expires */
  expiresAt: string;
  /** Polling interval (e.g., "30s", "5m") */
  interval: string;
  /** ISO timestamp of last check, null if never checked */
  lastCheck: string | null;
  /** ISO timestamp when trigger fired, null if not fired */
  firedAt: string | null;
}

/** Database row representation of a watch */
export interface WatchRow {
  id: string;
  trigger: string;
  params: string; // JSON string
  action: string; // JSON string
  status: WatchStatus;
  created_at: string;
  expires_at: string;
  interval: string;
  last_check: string | null;
  fired_at: string | null;
}

/** Output from a trigger execution */
export interface TriggerOutput {
  /** Arbitrary key-value pairs from trigger stdout */
  [key: string]: unknown;
}

/** Result of an action execution */
export interface ActionResult {
  /** The interpolated prompt that was executed */
  prompt: string;
  /** Working directory used */
  cwd: string;
  /** Exit code from claude -p */
  exitCode: number;
  /** Stdout from claude -p */
  stdout: string;
  /** Stderr from claude -p */
  stderr: string;
  /** ISO timestamp when action completed */
  completedAt: string;
}

/** Result file written when a watch fires */
export interface WatchResult {
  /** Watch ID */
  watchId: string;
  /** Trigger name */
  trigger: string;
  /** Trigger params */
  params: string[];
  /** Output from trigger */
  triggerOutput: TriggerOutput;
  /** Action execution result */
  action: ActionResult;
  /** ISO timestamp when trigger fired */
  firedAt: string;
}

/** Trigger metadata from YAML sidecar */
export interface TriggerMetadata {
  /** Trigger name (matches executable name) */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Argument definitions */
  args?: Array<{
    name: string;
    description: string;
  }>;
  /** Default polling interval */
  defaultInterval?: string;
}

/** Input to register_watch MCP tool */
export interface RegisterWatchInput {
  /** Trigger name */
  trigger: string;
  /** Trigger params */
  params: string[];
  /** Action configuration */
  action: {
    prompt: string;
    cwd?: string;
  };
  /** Time-to-live (e.g., "48h", "7d") */
  ttl?: string;
  /** Polling interval override */
  interval?: string;
}

/** Input to list_watches MCP tool */
export interface ListWatchesInput {
  /** Filter by status */
  status?: WatchStatus | 'all';
}

/** Input to cancel_watch MCP tool */
export interface CancelWatchInput {
  /** Watch ID to cancel */
  watchId: string;
}

/** Input to watch_status MCP tool */
export interface WatchStatusInput {
  /** Watch ID to query */
  watchId: string;
}

/** Hook input from Claude Code */
export interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  prompt: string;
}

/** Hook output to Claude Code */
export interface HookOutput {
  continue: boolean;
  systemMessage?: string;
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext?: string;
  };
}

/** Configuration paths */
export const CONFIG_DIR = '.config/claude-watcher';
export const DB_FILE = 'watches.db';
export const RESULTS_DIR = 'results';
export const ARCHIVE_DIR = 'results/archive';
export const LOGS_DIR = 'logs';
export const TRIGGERS_DIR = 'triggers';

/** Default values */
export const DEFAULT_TTL = '48h';
export const DEFAULT_INTERVAL = '30s';
```

Write to: `plugins/claude-watcher/src/types.ts`

**Step 2: Verify TypeScript compiles**

Run: `cd plugins/claude-watcher && npm install && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit types**

```bash
git add plugins/claude-watcher/src/types.ts
git commit -m "feat(claude-watcher): add shared TypeScript types

Defines interfaces for:
- Watch, WatchRow, WatchStatus
- TriggerOutput, TriggerMetadata
- ActionResult, WatchResult
- MCP tool inputs
- Hook input/output
- Config paths and defaults"
```

---

## Phase 3: Database Layer

### Task 3: Create Database Module

**Files:**
- Create: `plugins/claude-watcher/src/db.ts`

**Step 1: Write database module**

```typescript
/**
 * SQLite database layer for watch persistence
 */

import Database from 'better-sqlite3';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import {
  Watch,
  WatchRow,
  WatchStatus,
  WatchAction,
  CONFIG_DIR,
  DB_FILE,
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
    const stmt = this.db.prepare(`
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
      watch.firedAt
    );
  }

  /** Get a watch by ID */
  getById(id: string): Watch | null {
    const stmt = this.db.prepare('SELECT * FROM watches WHERE id = ?');
    const row = stmt.get(id) as WatchRow | undefined;
    return row ? rowToWatch(row) : null;
  }

  /** List watches, optionally filtered by status */
  list(status?: WatchStatus | 'all'): Watch[] {
    let stmt: Database.Statement;
    if (!status || status === 'all') {
      stmt = this.db.prepare('SELECT * FROM watches ORDER BY created_at DESC');
      return (stmt.all() as WatchRow[]).map(rowToWatch);
    }
    stmt = this.db.prepare(
      'SELECT * FROM watches WHERE status = ? ORDER BY created_at DESC'
    );
    return (stmt.all(status) as WatchRow[]).map(rowToWatch);
  }

  /** Get all active watches that need polling */
  getActiveWatches(): Watch[] {
    const stmt = this.db.prepare(
      "SELECT * FROM watches WHERE status = 'active'"
    );
    return (stmt.all() as WatchRow[]).map(rowToWatch);
  }

  /** Update watch status */
  updateStatus(id: string, status: WatchStatus): void {
    const stmt = this.db.prepare('UPDATE watches SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }

  /** Update last check timestamp */
  updateLastCheck(id: string, timestamp: string): void {
    const stmt = this.db.prepare(
      'UPDATE watches SET last_check = ? WHERE id = ?'
    );
    stmt.run(timestamp, id);
  }

  /** Mark watch as fired */
  markFired(id: string, firedAt: string): void {
    const stmt = this.db.prepare(
      "UPDATE watches SET status = 'fired', fired_at = ? WHERE id = ?"
    );
    stmt.run(firedAt, id);
  }

  /** Mark expired watches */
  expireOldWatches(): number {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE watches
      SET status = 'expired'
      WHERE status = 'active' AND expires_at < ?
    `);
    const result = stmt.run(now);
    return result.changes;
  }

  /** Delete a watch */
  delete(id: string): boolean {
    const stmt = this.db.prepare('DELETE FROM watches WHERE id = ?');
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
```

Write to: `plugins/claude-watcher/src/db.ts`

**Step 2: Verify compiles**

Run: `cd plugins/claude-watcher && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit database layer**

```bash
git add plugins/claude-watcher/src/db.ts
git commit -m "feat(claude-watcher): add SQLite database layer

Implements WatchDatabase class with:
- Schema initialization (watches table)
- CRUD operations for watches
- Filtering by status
- Expiration handling
- WAL mode for performance"
```

---

## Phase 4: Utility Functions

### Task 4: Create Utility Modules

**Files:**
- Create: `plugins/claude-watcher/src/utils.ts`

**Step 1: Write utilities**

```typescript
/**
 * Utility functions for claude-watcher
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { mkdirSync, existsSync } from 'node:fs';
import ms from 'ms';
import {
  CONFIG_DIR,
  RESULTS_DIR,
  ARCHIVE_DIR,
  LOGS_DIR,
  TRIGGERS_DIR,
  DEFAULT_TTL,
  DEFAULT_INTERVAL,
} from './types.js';

/** Generate a unique watch ID */
export function generateWatchId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = 'w_';
  for (let i = 0; i < 8; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/** Parse a duration string to milliseconds */
export function parseDuration(duration: string): number {
  const result = ms(duration);
  if (result === undefined) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return result;
}

/** Calculate expiration timestamp from TTL */
export function calculateExpiry(ttl: string = DEFAULT_TTL): string {
  const msValue = parseDuration(ttl);
  return new Date(Date.now() + msValue).toISOString();
}

/** Get the interval in milliseconds, with default */
export function getIntervalMs(interval?: string): number {
  return parseDuration(interval ?? DEFAULT_INTERVAL);
}

/** Get config directory path */
export function getConfigDir(): string {
  return join(homedir(), CONFIG_DIR);
}

/** Get results directory path */
export function getResultsDir(): string {
  return join(getConfigDir(), RESULTS_DIR);
}

/** Get archive directory path */
export function getArchiveDir(): string {
  return join(getConfigDir(), ARCHIVE_DIR);
}

/** Get logs directory path */
export function getLogsDir(): string {
  return join(getConfigDir(), LOGS_DIR);
}

/** Get triggers directory path */
export function getTriggersDir(): string {
  return join(getConfigDir(), TRIGGERS_DIR);
}

/** Ensure all config directories exist */
export function ensureConfigDirs(): void {
  const dirs = [
    getConfigDir(),
    getResultsDir(),
    getArchiveDir(),
    getLogsDir(),
    getTriggersDir(),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }
}

/** Interpolate variables in a prompt string */
export function interpolatePrompt(
  prompt: string,
  variables: Record<string, unknown>
): string {
  return prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const value = variables[key];
    return value !== undefined ? String(value) : `{{${key}}}`;
  });
}

/** Get result file path for a watch */
export function getResultPath(watchId: string): string {
  return join(getResultsDir(), `${watchId}.json`);
}

/** Get log file path for a watch */
export function getLogPath(watchId: string): string {
  return join(getLogsDir(), `${watchId}.log`);
}

/** Format a watch for display */
export function formatWatch(watch: {
  id: string;
  trigger: string;
  params: string[];
  status: string;
  expiresAt: string;
}): string {
  const params = watch.params.join(' ');
  return `${watch.id}: ${watch.trigger} ${params} [${watch.status}] (expires ${watch.expiresAt})`;
}
```

Write to: `plugins/claude-watcher/src/utils.ts`

**Step 2: Verify compiles**

Run: `cd plugins/claude-watcher && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit utilities**

```bash
git add plugins/claude-watcher/src/utils.ts
git commit -m "feat(claude-watcher): add utility functions

Includes:
- Watch ID generation
- Duration parsing with ms library
- TTL/interval handling
- Config directory helpers
- Prompt interpolation
- Path helpers"
```

---

## Phase 5: Trigger Executor

### Task 5: Create Trigger Execution Module

**Files:**
- Create: `plugins/claude-watcher/src/trigger-executor.ts`

**Step 1: Write trigger executor**

```typescript
/**
 * Executes trigger executables and parses their output
 */

import { spawn } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { join, basename } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { TriggerOutput, TriggerMetadata } from './types.js';
import { getTriggersDir } from './utils.js';

/** Result of executing a trigger */
export interface TriggerResult {
  /** Whether condition was met (exit code 0) */
  fired: boolean;
  /** Parsed JSON output if fired */
  output: TriggerOutput | null;
  /** Error message if execution failed */
  error?: string;
}

/** Execute a trigger executable with params */
export async function executeTrigger(
  triggerName: string,
  params: string[]
): Promise<TriggerResult> {
  const triggerPath = join(getTriggersDir(), triggerName);

  // Check trigger exists and is executable
  try {
    await access(triggerPath, constants.X_OK);
  } catch {
    return {
      fired: false,
      output: null,
      error: `Trigger not found or not executable: ${triggerName}`,
    };
  }

  return new Promise((resolve) => {
    const proc = spawn(triggerPath, params, {
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000, // 30 second timeout
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on('error', (err) => {
      resolve({
        fired: false,
        output: null,
        error: `Failed to execute trigger: ${err.message}`,
      });
    });

    proc.on('close', (code) => {
      if (code === 0) {
        // Trigger fired - parse JSON output
        try {
          const output = JSON.parse(stdout.trim()) as TriggerOutput;
          resolve({ fired: true, output });
        } catch {
          // Still fired, but no valid JSON output
          resolve({
            fired: true,
            output: {},
            error: `Trigger fired but output was not valid JSON: ${stdout}`,
          });
        }
      } else {
        // Condition not met
        resolve({ fired: false, output: null });
      }
    });
  });
}

/** List available triggers with their metadata */
export async function listTriggers(): Promise<TriggerMetadata[]> {
  const triggersDir = getTriggersDir();
  const triggers: TriggerMetadata[] = [];

  try {
    const files = await readdir(triggersDir);

    for (const file of files) {
      // Skip YAML sidecars and hidden files
      if (file.endsWith('.yaml') || file.endsWith('.yml') || file.startsWith('.')) {
        continue;
      }

      const triggerPath = join(triggersDir, file);

      // Check if executable
      try {
        await access(triggerPath, constants.X_OK);
      } catch {
        continue; // Not executable, skip
      }

      const name = basename(file).replace(/\.[^.]+$/, ''); // Remove extension if any

      // Try to load YAML sidecar
      let metadata: TriggerMetadata = { name };

      for (const ext of ['.yaml', '.yml']) {
        try {
          const yamlPath = join(triggersDir, `${name}${ext}`);
          const yamlContent = await readFile(yamlPath, 'utf-8');
          const parsed = parseYaml(yamlContent) as Partial<TriggerMetadata>;
          metadata = { name, ...parsed };
          break;
        } catch {
          // No sidecar found, continue
        }
      }

      triggers.push(metadata);
    }
  } catch {
    // Triggers directory doesn't exist yet
  }

  return triggers;
}

/** Check if a trigger exists */
export async function triggerExists(triggerName: string): Promise<boolean> {
  const triggerPath = join(getTriggersDir(), triggerName);
  try {
    await access(triggerPath, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}
```

Write to: `plugins/claude-watcher/src/trigger-executor.ts`

**Step 2: Add yaml dependency**

Update `plugins/claude-watcher/package.json` to add yaml:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "better-sqlite3": "^11.8.1",
    "ms": "^2.1.3",
    "yaml": "^2.7.1"
  }
}
```

**Step 3: Verify compiles**

Run: `cd plugins/claude-watcher && npm install && npx tsc --noEmit`
Expected: No errors

**Step 4: Commit trigger executor**

```bash
git add plugins/claude-watcher/src/trigger-executor.ts plugins/claude-watcher/package.json
git commit -m "feat(claude-watcher): add trigger executor

Implements:
- executeTrigger() to run trigger binaries
- listTriggers() to discover available triggers
- YAML sidecar parsing for metadata
- Timeout handling (30s)"
```

---

## Phase 6: Action Executor

### Task 6: Create Action Execution Module

**Files:**
- Create: `plugins/claude-watcher/src/action-executor.ts`

**Step 1: Write action executor**

```typescript
/**
 * Executes actions by spawning claude -p
 */

import { spawn } from 'node:child_process';
import { writeFile, appendFile } from 'node:fs/promises';
import { WatchAction, ActionResult, TriggerOutput, WatchResult } from './types.js';
import { interpolatePrompt, getResultPath, getLogPath } from './utils.js';

/** Execute an action and return the result */
export async function executeAction(
  watchId: string,
  action: WatchAction,
  triggerOutput: TriggerOutput
): Promise<ActionResult> {
  const interpolatedPrompt = interpolatePrompt(action.prompt, triggerOutput);
  const cwd = action.cwd ?? process.cwd();
  const logPath = getLogPath(watchId);

  // Log the action start
  await appendFile(
    logPath,
    `\n=== Action started at ${new Date().toISOString()} ===\n` +
    `Prompt: ${interpolatedPrompt}\n` +
    `CWD: ${cwd}\n\n`
  );

  return new Promise((resolve) => {
    const proc = spawn('claude', ['-p', interpolatedPrompt], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      // Stream to log file
      appendFile(logPath, chunk).catch(() => {});
    });

    proc.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      appendFile(logPath, `[stderr] ${chunk}`).catch(() => {});
    });

    proc.on('error', (err) => {
      const result: ActionResult = {
        prompt: interpolatedPrompt,
        cwd,
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        completedAt: new Date().toISOString(),
      };
      appendFile(
        logPath,
        `\n=== Action failed: ${err.message} ===\n`
      ).catch(() => {});
      resolve(result);
    });

    proc.on('close', (code) => {
      const result: ActionResult = {
        prompt: interpolatedPrompt,
        cwd,
        exitCode: code ?? 1,
        stdout,
        stderr,
        completedAt: new Date().toISOString(),
      };
      appendFile(
        logPath,
        `\n=== Action completed with exit code ${code} ===\n`
      ).catch(() => {});
      resolve(result);
    });
  });
}

/** Write a watch result to the results directory */
export async function writeResult(result: WatchResult): Promise<void> {
  const resultPath = getResultPath(result.watchId);
  await writeFile(resultPath, JSON.stringify(result, null, 2), 'utf-8');
}

/** Full action execution: run action and write result */
export async function executeAndWriteResult(
  watchId: string,
  trigger: string,
  params: string[],
  action: WatchAction,
  triggerOutput: TriggerOutput,
  firedAt: string
): Promise<WatchResult> {
  const actionResult = await executeAction(watchId, action, triggerOutput);

  const result: WatchResult = {
    watchId,
    trigger,
    params,
    triggerOutput,
    action: actionResult,
    firedAt,
  };

  await writeResult(result);
  return result;
}
```

Write to: `plugins/claude-watcher/src/action-executor.ts`

**Step 2: Verify compiles**

Run: `cd plugins/claude-watcher && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit action executor**

```bash
git add plugins/claude-watcher/src/action-executor.ts
git commit -m "feat(claude-watcher): add action executor

Implements:
- executeAction() to spawn claude -p
- Prompt interpolation with trigger output
- Streaming output to log files
- writeResult() to write JSON results"
```

---

## Phase 7: MCP Server

### Task 7: Create MCP Server with Tools

**Files:**
- Create: `plugins/claude-watcher/src/mcp-server.ts`

**Step 1: Write MCP server**

```typescript
#!/usr/bin/env node
/**
 * MCP Server for claude-watcher
 * Provides tools to register and manage watches
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { getDatabase, closeDatabase } from './db.js';
import { listTriggers, triggerExists } from './trigger-executor.js';
import {
  generateWatchId,
  calculateExpiry,
  formatWatch,
  ensureConfigDirs,
} from './utils.js';
import {
  Watch,
  RegisterWatchInput,
  ListWatchesInput,
  CancelWatchInput,
  WatchStatusInput,
  DEFAULT_INTERVAL,
} from './types.js';

// Ensure config directories exist
ensureConfigDirs();

// Define MCP tools
const TOOLS: Tool[] = [
  {
    name: 'register_watch',
    description:
      'Register a new watch that polls a trigger and executes an action when it fires. ' +
      'The action prompt can use {{variable}} syntax to interpolate trigger output.',
    inputSchema: {
      type: 'object',
      properties: {
        trigger: {
          type: 'string',
          description: 'Name of the trigger executable (e.g., "npm-publish")',
        },
        params: {
          type: 'array',
          items: { type: 'string' },
          description: 'Arguments to pass to the trigger',
        },
        action: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description:
                'Prompt to execute when trigger fires. Use {{var}} for interpolation.',
            },
            cwd: {
              type: 'string',
              description: 'Working directory for action execution',
            },
          },
          required: ['prompt'],
        },
        ttl: {
          type: 'string',
          description: 'Time-to-live (e.g., "48h", "7d"). Default: 48h',
        },
        interval: {
          type: 'string',
          description: 'Polling interval (e.g., "30s", "5m"). Default: 30s',
        },
      },
      required: ['trigger', 'params', 'action'],
    },
  },
  {
    name: 'list_watches',
    description: 'List registered watches, optionally filtered by status.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'fired', 'expired', 'cancelled', 'all'],
          description: 'Filter by status. Default: all',
        },
      },
    },
  },
  {
    name: 'watch_status',
    description: 'Get detailed status of a specific watch.',
    inputSchema: {
      type: 'object',
      properties: {
        watchId: {
          type: 'string',
          description: 'Watch ID to query',
        },
      },
      required: ['watchId'],
    },
  },
  {
    name: 'cancel_watch',
    description: 'Cancel an active watch.',
    inputSchema: {
      type: 'object',
      properties: {
        watchId: {
          type: 'string',
          description: 'Watch ID to cancel',
        },
      },
      required: ['watchId'],
    },
  },
  {
    name: 'list_triggers',
    description:
      'List available trigger executables with their metadata.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool handlers
async function handleRegisterWatch(
  args: RegisterWatchInput
): Promise<string> {
  const { trigger, params, action, ttl, interval } = args;

  // Validate trigger exists
  if (!(await triggerExists(trigger))) {
    throw new Error(
      `Trigger "${trigger}" not found. Use list_triggers to see available triggers.`
    );
  }

  const db = getDatabase();
  const watch: Watch = {
    id: generateWatchId(),
    trigger,
    params,
    action: {
      prompt: action.prompt,
      cwd: action.cwd,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: calculateExpiry(ttl),
    interval: interval ?? DEFAULT_INTERVAL,
    lastCheck: null,
    firedAt: null,
  };

  db.insert(watch);

  return JSON.stringify(
    {
      watchId: watch.id,
      expiresAt: watch.expiresAt,
      message: `Watch registered. The daemon will poll "${trigger}" every ${watch.interval}.`,
    },
    null,
    2
  );
}

async function handleListWatches(args: ListWatchesInput): Promise<string> {
  const db = getDatabase();
  const watches = db.list(args.status ?? 'all');

  if (watches.length === 0) {
    return 'No watches found.';
  }

  const formatted = watches.map(formatWatch).join('\n');
  return `Found ${watches.length} watch(es):\n\n${formatted}`;
}

async function handleWatchStatus(args: WatchStatusInput): Promise<string> {
  const db = getDatabase();
  const watch = db.getById(args.watchId);

  if (!watch) {
    throw new Error(`Watch not found: ${args.watchId}`);
  }

  return JSON.stringify(watch, null, 2);
}

async function handleCancelWatch(args: CancelWatchInput): Promise<string> {
  const db = getDatabase();
  const watch = db.getById(args.watchId);

  if (!watch) {
    throw new Error(`Watch not found: ${args.watchId}`);
  }

  if (watch.status !== 'active') {
    throw new Error(
      `Cannot cancel watch with status "${watch.status}". Only active watches can be cancelled.`
    );
  }

  db.updateStatus(args.watchId, 'cancelled');
  return `Watch ${args.watchId} cancelled.`;
}

async function handleListTriggers(): Promise<string> {
  const triggers = await listTriggers();

  if (triggers.length === 0) {
    return 'No triggers found. Add executables to ~/.config/claude-watcher/triggers/';
  }

  const formatted = triggers
    .map((t) => {
      let line = `- ${t.name}`;
      if (t.description) {
        line += `: ${t.description}`;
      }
      if (t.args && t.args.length > 0) {
        const argStr = t.args.map((a) => `<${a.name}>`).join(' ');
        line += `\n  Usage: ${t.name} ${argStr}`;
      }
      if (t.defaultInterval) {
        line += `\n  Default interval: ${t.defaultInterval}`;
      }
      return line;
    })
    .join('\n\n');

  return `Available triggers:\n\n${formatted}`;
}

// Create server
const server = new Server(
  { name: 'claude-watcher', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Handle tool listing
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: string;

    switch (name) {
      case 'register_watch':
        result = await handleRegisterWatch(args as unknown as RegisterWatchInput);
        break;
      case 'list_watches':
        result = await handleListWatches(args as unknown as ListWatchesInput);
        break;
      case 'watch_status':
        result = await handleWatchStatus(args as unknown as WatchStatusInput);
        break;
      case 'cancel_watch':
        result = await handleCancelWatch(args as unknown as CancelWatchInput);
        break;
      case 'list_triggers':
        result = await handleListTriggers();
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return { content: [{ type: 'text', text: result }] };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
  }
});

// Cleanup on exit
process.on('SIGINT', () => {
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDatabase();
  process.exit(0);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('claude-watcher MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

Write to: `plugins/claude-watcher/src/mcp-server.ts`

**Step 2: Build the plugin**

Run: `cd plugins/claude-watcher && npm run build`
Expected: dist/ directory created with compiled JS

**Step 3: Commit MCP server**

```bash
git add plugins/claude-watcher/src/mcp-server.ts
git commit -m "feat(claude-watcher): add MCP server with tools

Implements 5 MCP tools:
- register_watch: Create a new watch
- list_watches: List watches by status
- watch_status: Get watch details
- cancel_watch: Cancel an active watch
- list_triggers: List available triggers"
```

---

## Phase 8: Daemon Process

### Task 8: Create Daemon with Polling Loop

**Files:**
- Create: `plugins/claude-watcher/src/daemon.ts`

**Step 1: Write daemon**

```typescript
/**
 * Daemon process that polls triggers and executes actions
 */

import { getDatabase, closeDatabase } from './db.js';
import { executeTrigger } from './trigger-executor.js';
import { executeAndWriteResult } from './action-executor.js';
import { ensureConfigDirs, getIntervalMs } from './utils.js';
import { Watch } from './types.js';

/** Daemon configuration */
interface DaemonConfig {
  /** Minimum interval between checking any single watch (ms) */
  minPollInterval: number;
  /** How often to check for expired watches (ms) */
  expiryCheckInterval: number;
}

const DEFAULT_CONFIG: DaemonConfig = {
  minPollInterval: 5000, // 5 seconds
  expiryCheckInterval: 60000, // 1 minute
};

/** Daemon state */
interface DaemonState {
  running: boolean;
  lastPollTimes: Map<string, number>;
}

/** Start the daemon */
export async function startDaemon(
  config: DaemonConfig = DEFAULT_CONFIG
): Promise<void> {
  console.log('Starting claude-watcher daemon...');

  // Ensure directories exist
  ensureConfigDirs();

  const db = getDatabase();
  const state: DaemonState = {
    running: true,
    lastPollTimes: new Map(),
  };

  // Handle shutdown
  const shutdown = () => {
    console.log('Shutting down daemon...');
    state.running = false;
    closeDatabase();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Expiry check loop
  const expiryLoop = setInterval(() => {
    const expired = db.expireOldWatches();
    if (expired > 0) {
      console.log(`Expired ${expired} watch(es)`);
    }
  }, config.expiryCheckInterval);

  // Main polling loop
  console.log('Daemon started. Polling active watches...');

  while (state.running) {
    try {
      const watches = db.getActiveWatches();

      for (const watch of watches) {
        if (!state.running) break;

        // Check if enough time has passed since last poll
        const lastPoll = state.lastPollTimes.get(watch.id) ?? 0;
        const intervalMs = getIntervalMs(watch.interval);
        const now = Date.now();

        if (now - lastPoll < intervalMs) {
          continue; // Not time yet
        }

        // Update last poll time
        state.lastPollTimes.set(watch.id, now);
        db.updateLastCheck(watch.id, new Date(now).toISOString());

        // Execute trigger
        await pollWatch(watch, db);
      }

      // Small delay between loop iterations
      await sleep(config.minPollInterval);
    } catch (error) {
      console.error('Error in polling loop:', error);
      await sleep(5000); // Wait before retrying
    }
  }

  clearInterval(expiryLoop);
}

/** Poll a single watch */
async function pollWatch(watch: Watch, db: ReturnType<typeof getDatabase>): Promise<void> {
  const { id, trigger, params, action } = watch;

  console.log(`Polling ${trigger} ${params.join(' ')} (${id})`);

  try {
    const result = await executeTrigger(trigger, params);

    if (result.error) {
      console.error(`Trigger error for ${id}: ${result.error}`);
      return;
    }

    if (result.fired) {
      console.log(`Trigger fired for ${id}!`);

      const firedAt = new Date().toISOString();
      db.markFired(id, firedAt);

      // Execute action
      console.log(`Executing action for ${id}...`);
      const watchResult = await executeAndWriteResult(
        id,
        trigger,
        params,
        action,
        result.output ?? {},
        firedAt
      );

      console.log(
        `Action completed for ${id} with exit code ${watchResult.action.exitCode}`
      );
    }
  } catch (error) {
    console.error(`Error polling ${id}:`, error);
  }
}

/** Sleep utility */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startDaemon().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
```

Write to: `plugins/claude-watcher/src/daemon.ts`

**Step 2: Verify compiles**

Run: `cd plugins/claude-watcher && npx tsc --noEmit`
Expected: No errors

**Step 3: Commit daemon**

```bash
git add plugins/claude-watcher/src/daemon.ts
git commit -m "feat(claude-watcher): add daemon with polling loop

Implements:
- Main polling loop for active watches
- Per-watch interval tracking
- Automatic expiry checking
- Graceful shutdown handling
- Action execution on trigger fire"
```

---

## Phase 9: CLI Entry Point

### Task 9: Create CLI Binary

**Files:**
- Create: `plugins/claude-watcher/src/bin/claude-watcher.ts`

**Step 1: Write CLI**

```typescript
#!/usr/bin/env node
/**
 * CLI entry point for claude-watcher
 */

import { startDaemon } from '../daemon.js';

const VERSION = '1.0.0';

function printUsage(): void {
  console.log(`
claude-watcher v${VERSION}

Usage:
  claude-watcher daemon    Start the daemon process
  claude-watcher version   Print version
  claude-watcher help      Show this help

The daemon polls registered watches and executes actions when triggers fire.
Configure it to run at startup with launchd (macOS) or systemd (Linux).

For more information, see:
  ~/.config/claude-watcher/README.md
`);
}

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case 'daemon':
      await startDaemon();
      break;

    case 'version':
    case '-v':
    case '--version':
      console.log(VERSION);
      break;

    case 'help':
    case '-h':
    case '--help':
    case undefined:
      printUsage();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
```

Write to: `plugins/claude-watcher/src/bin/claude-watcher.ts`

**Step 2: Update tsconfig to include bin directory**

The rootDir is `./src` which includes `src/bin/`, so no changes needed.

**Step 3: Build and verify**

Run: `cd plugins/claude-watcher && npm run build && ls dist/bin/`
Expected: `claude-watcher.js` exists

**Step 4: Commit CLI**

```bash
git add plugins/claude-watcher/src/bin/claude-watcher.ts
git commit -m "feat(claude-watcher): add CLI entry point

Commands:
- daemon: Start the polling daemon
- version: Print version
- help: Show usage"
```

---

## Phase 10: UserPromptSubmit Hook

### Task 10: Create Result Notification Hook

**Files:**
- Create: `plugins/claude-watcher/hooks/hooks.json`
- Create: `plugins/claude-watcher/hooks/package.json`
- Create: `plugins/claude-watcher/hooks/scripts/watch-results-hook.ts`

**Step 1: Create hooks.json**

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "command": "npx -y tsx ${CLAUDE_PLUGIN_ROOT}/hooks/scripts/watch-results-hook.ts",
            "type": "command"
          }
        ]
      }
    ]
  }
}
```

Write to: `plugins/claude-watcher/hooks/hooks.json`

**Step 2: Create hooks package.json**

```json
{
  "name": "@claude-watcher/hooks",
  "version": "1.0.0",
  "type": "module",
  "description": "Hook scripts for claude-watcher plugin",
  "private": true,
  "scripts": {
    "test": "echo '{\"prompt\": \"test\", \"cwd\": \".\", \"session_id\": \"test\", \"transcript_path\": \"/tmp\", \"permission_mode\": \"auto\"}' | npx tsx scripts/watch-results-hook.ts"
  },
  "devDependencies": {
    "@types/node": "^22.15.21",
    "tsx": "^4.21.0",
    "typescript": "^5.9.3"
  }
}
```

Write to: `plugins/claude-watcher/hooks/package.json`

**Step 3: Write hook script**

```typescript
#!/usr/bin/env node
/**
 * UserPromptSubmit hook that reads pending watch results
 * and injects them into the Claude session context.
 */

import { readFileSync, readdirSync, renameSync, mkdirSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, basename } from 'node:path';

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  prompt: string;
}

interface HookOutput {
  continue: boolean;
  systemMessage?: string;
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext?: string;
  };
}

interface WatchResult {
  watchId: string;
  trigger: string;
  params: string[];
  triggerOutput: Record<string, unknown>;
  action: {
    prompt: string;
    cwd: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    completedAt: string;
  };
  firedAt: string;
}

const CONFIG_DIR = join(homedir(), '.config', 'claude-watcher');
const RESULTS_DIR = join(CONFIG_DIR, 'results');
const ARCHIVE_DIR = join(CONFIG_DIR, 'results', 'archive');

function main(): void {
  // Read input from stdin
  let inputJson = '';
  try {
    inputJson = readFileSync(0, 'utf-8');
  } catch {
    // No stdin, exit gracefully
    outputResult({ continue: true });
    return;
  }

  let _input: HookInput;
  try {
    _input = JSON.parse(inputJson) as HookInput;
  } catch {
    outputResult({ continue: true });
    return;
  }

  // Check if results directory exists
  if (!existsSync(RESULTS_DIR)) {
    outputResult({ continue: true });
    return;
  }

  // Find pending result files
  let files: string[];
  try {
    files = readdirSync(RESULTS_DIR).filter(
      (f) => f.endsWith('.json') && !f.startsWith('.')
    );
  } catch {
    outputResult({ continue: true });
    return;
  }

  if (files.length === 0) {
    outputResult({ continue: true });
    return;
  }

  // Ensure archive directory exists
  if (!existsSync(ARCHIVE_DIR)) {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  // Process each result
  const summaries: string[] = [];

  for (const file of files) {
    const filePath = join(RESULTS_DIR, file);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const result = JSON.parse(content) as WatchResult;

      const status =
        result.action.exitCode === 0
          ? 'succeeded'
          : `failed (exit ${result.action.exitCode})`;

      const params = result.params.join(' ');
      const stdout = result.action.stdout.slice(0, 500); // Truncate long output

      summaries.push(
        `**${result.trigger} ${params}** - ${status}\n` +
        '```\n' +
        stdout +
        (result.action.stdout.length > 500 ? '\n...(truncated)' : '') +
        '\n```'
      );

      // Move to archive
      const archivePath = join(ARCHIVE_DIR, basename(file));
      renameSync(filePath, archivePath);
    } catch (err) {
      // Skip files we can't process
      console.error(`Error processing ${file}:`, err);
    }
  }

  if (summaries.length === 0) {
    outputResult({ continue: true });
    return;
  }

  // Build notification message
  const message =
    '---\n' +
    '## Completed Watches\n\n' +
    summaries.join('\n\n') +
    '\n---';

  outputResult({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: message,
    },
  });
}

function outputResult(result: HookOutput): void {
  console.log(JSON.stringify(result));
}

main();
```

Write to: `plugins/claude-watcher/hooks/scripts/watch-results-hook.ts`

**Step 4: Test hook locally**

Run: `cd plugins/claude-watcher/hooks && npm install && npm test`
Expected: `{"continue":true}` (no results to process)

**Step 5: Commit hook**

```bash
git add plugins/claude-watcher/hooks/
git commit -m "feat(claude-watcher): add UserPromptSubmit hook

Reads pending results from ~/.config/claude-watcher/results/
and injects notifications into Claude session context.
Moves processed results to archive/"
```

---

## Phase 11: Example Triggers

### Task 11: Create Bundled Trigger Examples

**Files:**
- Create: `plugins/claude-watcher/triggers/npm-publish`
- Create: `plugins/claude-watcher/triggers/npm-publish.yaml`
- Create: `plugins/claude-watcher/triggers/gh-pr-merged`
- Create: `plugins/claude-watcher/triggers/gh-pr-merged.yaml`

**Step 1: Create npm-publish trigger**

```bash
#!/bin/bash
# Check if a specific npm package version is published
# Usage: npm-publish <package> <version>

PACKAGE="$1"
VERSION="$2"

if [[ -z "$PACKAGE" || -z "$VERSION" ]]; then
  echo "Usage: npm-publish <package> <version>" >&2
  exit 1
fi

if curl -sf "https://registry.npmjs.org/${PACKAGE}/${VERSION}" > /dev/null 2>&1; then
  echo "{\"package\": \"${PACKAGE}\", \"version\": \"${VERSION}\", \"slug\": \"${PACKAGE}@${VERSION}\"}"
  exit 0
else
  exit 1
fi
```

Write to: `plugins/claude-watcher/triggers/npm-publish`
Then: `chmod +x plugins/claude-watcher/triggers/npm-publish`

**Step 2: Create npm-publish.yaml metadata**

```yaml
name: npm-publish
description: Fires when a specific npm package version is published to the registry
args:
  - name: package
    description: Package name (e.g., "foo" or "@scope/foo")
  - name: version
    description: Exact version to watch for (e.g., "1.2.3")
defaultInterval: 30s
```

Write to: `plugins/claude-watcher/triggers/npm-publish.yaml`

**Step 3: Create gh-pr-merged trigger**

```bash
#!/bin/bash
# Check if a GitHub PR has been merged
# Usage: gh-pr-merged <owner/repo> <pr-number>

REPO="$1"
PR="$2"

if [[ -z "$REPO" || -z "$PR" ]]; then
  echo "Usage: gh-pr-merged <owner/repo> <pr-number>" >&2
  exit 1
fi

# Requires gh CLI to be installed and authenticated
if ! command -v gh &> /dev/null; then
  echo "gh CLI not installed" >&2
  exit 1
fi

MERGED=$(gh pr view "$PR" --repo "$REPO" --json merged --jq '.merged' 2>/dev/null)

if [[ "$MERGED" == "true" ]]; then
  echo "{\"repo\": \"${REPO}\", \"pr\": ${PR}, \"prUrl\": \"https://github.com/${REPO}/pull/${PR}\"}"
  exit 0
else
  exit 1
fi
```

Write to: `plugins/claude-watcher/triggers/gh-pr-merged`
Then: `chmod +x plugins/claude-watcher/triggers/gh-pr-merged`

**Step 4: Create gh-pr-merged.yaml metadata**

```yaml
name: gh-pr-merged
description: Fires when a GitHub pull request is merged
args:
  - name: repo
    description: Repository in owner/repo format (e.g., "facebook/react")
  - name: pr-number
    description: Pull request number
defaultInterval: 60s
```

Write to: `plugins/claude-watcher/triggers/gh-pr-merged.yaml`

**Step 5: Commit triggers**

```bash
git add plugins/claude-watcher/triggers/
git commit -m "feat(claude-watcher): add example triggers

Bundled triggers:
- npm-publish: Check if npm package version is published
- gh-pr-merged: Check if GitHub PR is merged

Each trigger has a YAML sidecar with metadata."
```

---

## Phase 12: Marketplace Registration

### Task 12: Register Plugin in Marketplace

**Files:**
- Modify: `.claude-plugin/marketplace.json`

**Step 1: Read current marketplace.json**

Read: `.claude-plugin/marketplace.json`

**Step 2: Add claude-watcher entry**

Add to the plugins array:

```json
{
  "name": "claude-watcher",
  "source": "./plugins/claude-watcher"
}
```

**Step 3: Commit registration**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(marketplace): register claude-watcher plugin"
```

---

## Phase 13: Final Build and Test

### Task 13: Build and Verify Plugin

**Step 1: Install all dependencies**

Run: `cd plugins/claude-watcher && npm install`
Expected: No errors

**Step 2: Build TypeScript**

Run: `cd plugins/claude-watcher && npm run build`
Expected: dist/ directory with compiled JS

**Step 3: Verify MCP server starts**

Run: `cd plugins/claude-watcher && echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"1.0","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | node dist/mcp-server.js`
Expected: JSON response with server capabilities

**Step 4: Test hook script**

Run: `cd plugins/claude-watcher/hooks && npm test`
Expected: `{"continue":true}`

**Step 5: Verify CLI**

Run: `cd plugins/claude-watcher && node dist/bin/claude-watcher.js help`
Expected: Usage information printed

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore(claude-watcher): finalize build and tests"
```

---

## Summary

This implementation plan creates a complete `claude-watcher` plugin with:

| Component | Location | Purpose |
|-----------|----------|---------|
| Types | `src/types.ts` | Shared TypeScript interfaces |
| Database | `src/db.ts` | SQLite persistence layer |
| Utilities | `src/utils.ts` | Helper functions |
| Trigger Executor | `src/trigger-executor.ts` | Run trigger binaries |
| Action Executor | `src/action-executor.ts` | Run claude -p |
| MCP Server | `src/mcp-server.ts` | 5 tools for watch management |
| Daemon | `src/daemon.ts` | Polling loop |
| CLI | `src/bin/claude-watcher.ts` | Entry point |
| Hook | `hooks/scripts/watch-results-hook.ts` | Result notification |
| Triggers | `triggers/*` | Example triggers |

**Total Tasks:** 13
**Total Commits:** ~13 (one per task)

**Post-Implementation:**
1. User needs to manually set up launchd/systemd service for the daemon
2. User needs to install the plugin: `/plugin install claude-watcher@boneskull-plugins`
3. User can add custom triggers to `~/.config/claude-watcher/triggers/`
