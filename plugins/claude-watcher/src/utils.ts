/**
 * Utility functions for claude-watcher
 */

import ms from 'ms';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import {
  ARCHIVE_DIR,
  CONFIG_DIR,
  DEFAULT_INTERVAL,
  DEFAULT_TTL,
  LOGS_DIR,
  RESULTS_DIR,
  TRIGGERS_DIR,
} from './types.js';

/** Calculate expiration timestamp from TTL */
export const calculateExpiry = (ttl: string = DEFAULT_TTL): string => {
  const msValue = parseDuration(ttl);
  return new Date(Date.now() + msValue).toISOString();
};

/** Ensure all config directories exist */
export const ensureConfigDirs = (): void => {
  for (const dir of [
    getConfigDir(),
    getResultsDir(),
    getArchiveDir(),
    getLogsDir(),
    getTriggersDir(),
  ]) {
    mkdirSync(dir, { recursive: true });
  }
};

/** Format a watch for display */
export const formatWatch = (watch: {
  expiresAt: string;
  id: string;
  params: string[];
  status: string;
  trigger: string;
}): string => {
  const params = watch.params.join(' ');
  return `${watch.id}: ${watch.trigger} ${params} [${watch.status}] (expires ${watch.expiresAt})`;
};

/** Generate a unique watch ID */
export const generateWatchId = (): string => {
  return `w_${crypto.randomUUID().slice(0, 8)}`;
};

/** Get archive directory path */
const getArchiveDir = (): string => {
  return join(getConfigDir(), ARCHIVE_DIR);
};

/** Get config directory path */
const getConfigDir = (): string => {
  return join(homedir(), CONFIG_DIR);
};

/** Get the interval in milliseconds, with default */
export const getIntervalMs = (interval?: string): number => {
  return parseDuration(interval ?? DEFAULT_INTERVAL);
};

/** Get log file path for a watch */
export const getLogPath = (watchId: string): string => {
  return join(getLogsDir(), `${watchId}.log`);
};

/** Get logs directory path */
const getLogsDir = (): string => {
  return join(getConfigDir(), LOGS_DIR);
};

/** Get result file path for a watch */
export const getResultPath = (watchId: string): string => {
  return join(getResultsDir(), `${watchId}.json`);
};

/** Get results directory path */
const getResultsDir = (): string => {
  return join(getConfigDir(), RESULTS_DIR);
};

/** Get triggers directory path */
export const getTriggersDir = (): string => {
  return join(getConfigDir(), TRIGGERS_DIR);
};

/** Interpolate variables in a prompt string */
export const interpolatePrompt = (
  prompt: string,
  variables: Record<string, unknown>,
): string => {
  return prompt.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = variables[key];
    if (value === undefined) {
      return `{{${key}}}`;
    }
    // Handle objects and arrays by JSON-stringifying them
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value);
    }
    // Primitives: string, number, boolean, bigint, symbol
    // Use String() for safe stringification
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(value);
  });
};

/** Parse a duration string to milliseconds */
export const parseDuration = (duration: string): number => {
  // Cast needed because ms types are strict template literals,
  // but we accept arbitrary user input
  const result = ms(duration as ms.StringValue);
  if (result === undefined) {
    throw new Error(`Invalid duration: ${duration}`);
  }
  return result;
};
