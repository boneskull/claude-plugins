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
interface RegisterWatchInput {
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
interface ListWatchesInput {
  /** Filter by status */
  status?: WatchStatus | 'all';
}

/** Input to cancel_watch MCP tool */
interface CancelWatchInput {
  /** Watch ID to cancel */
  watchId: string;
}

/** Input to watch_status MCP tool */
interface WatchStatusInput {
  /** Watch ID to query */
  watchId: string;
}

/** Hook input from Claude Code */
interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  prompt: string;
}

/** Hook output to Claude Code */
interface HookOutput {
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
