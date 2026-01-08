/**
 * Shared types for claude-watcher plugin
 */

/** Result of an action execution */
export interface ActionResult {
  /** ISO timestamp when action completed */
  completedAt: string;
  /** Working directory used */
  cwd: string;
  /** Exit code from claude -p */
  exitCode: number;
  /** The interpolated prompt that was executed */
  prompt: string;
  /** Stderr from claude -p */
  stderr: string;
  /** Stdout from claude -p */
  stdout: string;
}

/** Input to cancel_watch MCP tool */
interface _CancelWatchInput {
  /** Watch ID to cancel */
  watchId: string;
}

/** Hook input from Claude Code */
interface _HookInput {
  cwd: string;
  permission_mode: string;
  prompt: string;
  session_id: string;
  transcript_path: string;
}

/** Hook output to Claude Code */
interface _HookOutput {
  continue: boolean;
  hookSpecificOutput?: {
    additionalContext?: string;
    hookEventName: string;
  };
  systemMessage?: string;
}

/** Input to list_watches MCP tool */
export interface ListWatchesInput {
  /** Filter by status */
  status?: 'all' | WatchStatus;
}

/** Input to register_watch MCP tool */
export interface RegisterWatchInput {
  /** Action configuration */
  action: {
    cwd?: string;
    prompt: string;
  };
  /** Polling interval override */
  interval?: string;
  /** Trigger params */
  params: string[];
  /** Trigger name */
  trigger: string;
  /** Time-to-live (e.g., "48h", "7d") */
  ttl?: string;
}

/** Trigger metadata from YAML sidecar */
export interface TriggerMetadata {
  /** Argument definitions */
  args?: Array<{
    description: string;
    name: string;
  }>;
  /** Default polling interval */
  defaultInterval?: string;
  /** Human-readable description */
  description?: string;
  /** Trigger name (matches executable name) */
  name: string;
}

/** Output from a trigger execution */
export interface TriggerOutput {
  /** Arbitrary key-value pairs from trigger stdout */
  [key: string]: unknown;
}

/** A registered watch */
export interface Watch {
  /** Action to execute when trigger fires */
  action: WatchAction;
  /** ISO timestamp of creation */
  createdAt: string;
  /** ISO timestamp when watch expires */
  expiresAt: string;
  /** ISO timestamp when trigger fired, null if not fired */
  firedAt: null | string;
  /** Unique watch ID (w_<nanoid>) */
  id: string;
  /** Polling interval (e.g., "30s", "5m") */
  interval: string;
  /** ISO timestamp of last check, null if never checked */
  lastCheck: null | string;
  /** Arguments passed to trigger */
  params: string[];
  /** Current status */
  status: WatchStatus;
  /** Name of the trigger executable */
  trigger: string;
}

/** Action to execute when trigger fires */
export interface WatchAction {
  /** Working directory for claude execution */
  cwd?: string;
  /** Prompt to send to claude -p */
  prompt: string;
}

/** Result file written when a watch fires */
export interface WatchResult {
  /** Action execution result */
  action: ActionResult;
  /** ISO timestamp when trigger fired */
  firedAt: string;
  /** Trigger params */
  params: string[];
  /** Trigger name */
  trigger: string;
  /** Output from trigger */
  triggerOutput: TriggerOutput;
  /** Watch ID */
  watchId: string;
}

/** Database row representation of a watch */
export interface WatchRow {
  action: string; // JSON string
  created_at: string;
  expires_at: string;
  fired_at: null | string;
  id: string;
  interval: string;
  last_check: null | string;
  params: string; // JSON string
  status: WatchStatus;
  trigger: string;
}

/** Status of a watch */
export type WatchStatus = 'active' | 'cancelled' | 'expired' | 'fired';

/** Input to watch_status MCP tool */
export interface WatchStatusInput {
  /** Watch ID to query */
  watchId: string;
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
