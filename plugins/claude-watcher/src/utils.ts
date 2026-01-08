/**
 * Utility functions for claude-watcher
 */

import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import ms from 'ms';

import {
  ARCHIVE_DIR,
  CONFIG_DIR,
  DEFAULT_INTERVAL,
  DEFAULT_TTL,
  LOGS_DIR,
  RESULTS_DIR,
  TRIGGERS_DIR,
} from './types.js';

/** Generate a unique watch ID */
export function generateWatchId(): string {
  return `w_${crypto.randomUUID().slice(0, 8)}`;
}

/** Parse a duration string to milliseconds */
export function parseDuration(duration: string): number {
  // Cast needed because ms types are strict template literals,
  // but we accept arbitrary user input
  const result = ms(duration as ms.StringValue);
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
  for (const dir of [
    getConfigDir(),
    getResultsDir(),
    getArchiveDir(),
    getLogsDir(),
    getTriggersDir(),
  ]) {
    mkdirSync(dir, { recursive: true });
  }
}

/** Interpolate variables in a prompt string */
export function interpolatePrompt(
  prompt: string,
  variables: Record<string, unknown>,
): string {
  return prompt.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
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
