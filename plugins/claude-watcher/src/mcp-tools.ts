/**
 * MCP tool handler functions (extracted for testability)
 */

import { type WatchDatabase } from './db.js';
import { listTriggers, triggerExists } from './trigger-executor.js';
import { DEFAULT_INTERVAL, type Watch } from './types.js';
import { calculateExpiry, formatWatch, generateWatchId } from './utils.js';

/** Options for tool handlers (for testing) */
export interface ToolHandlerOptions {
  /** Database instance */
  db: WatchDatabase;
  /** Triggers directory override */
  triggersDir?: string;
}

/** Tool result content type */
export interface ToolResult {
  content: Array<{ text: string; type: 'text' }>;
  isError?: boolean;
}

/** Handler for cancel_watch tool */
export const handleCancelWatch = async (
  input: { watchId: string },
  options: ToolHandlerOptions,
): Promise<ToolResult> => {
  const { db } = options;
  const watch = db.getById(input.watchId);

  if (!watch) {
    return {
      content: [
        {
          text: `Error: Watch not found: ${input.watchId}`,
          type: 'text' as const,
        },
      ],
      isError: true,
    };
  }

  if (watch.status !== 'active') {
    return {
      content: [
        {
          text: `Error: Cannot cancel watch with status "${watch.status}". Only active watches can be cancelled.`,
          type: 'text' as const,
        },
      ],
      isError: true,
    };
  }

  db.updateStatus(input.watchId, 'cancelled');
  return {
    content: [
      { text: `Watch ${input.watchId} cancelled.`, type: 'text' as const },
    ],
  };
};

/** Handler for list_triggers tool */
export const handleListTriggers = async (
  options: Pick<ToolHandlerOptions, 'triggersDir'>,
): Promise<ToolResult> => {
  const triggers = await listTriggers(options.triggersDir);

  if (triggers.length === 0) {
    return {
      content: [
        {
          text: 'No triggers found. Add executables to ~/.config/claude-watcher/triggers/',
          type: 'text' as const,
        },
      ],
    };
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

  return {
    content: [
      { text: `Available triggers:\n\n${formatted}`, type: 'text' as const },
    ],
  };
};

/** Handler for list_watches tool */
export const handleListWatches = async (
  input: { status?: 'active' | 'all' | 'cancelled' | 'expired' | 'fired' },
  options: ToolHandlerOptions,
): Promise<ToolResult> => {
  const { db } = options;
  const watches = db.list(input.status ?? 'all');

  if (watches.length === 0) {
    return {
      content: [{ text: 'No watches found.', type: 'text' as const }],
    };
  }

  const formatted = watches.map(formatWatch).join('\n');
  return {
    content: [
      {
        text: `Found ${watches.length} watch(es):\n\n${formatted}`,
        type: 'text' as const,
      },
    ],
  };
};

/** Handler for register_watch tool */
export const handleRegisterWatch = async (
  input: {
    action: { cwd?: string; prompt: string };
    interval?: string;
    params: string[];
    trigger: string;
    ttl?: string;
  },
  options: ToolHandlerOptions,
): Promise<ToolResult> => {
  const { db, triggersDir } = options;

  // Validate trigger exists
  if (!(await triggerExists(input.trigger, triggersDir))) {
    return {
      content: [
        {
          text: `Error: Trigger "${input.trigger}" not found. Use list_triggers to see available triggers.`,
          type: 'text' as const,
        },
      ],
      isError: true,
    };
  }

  const watch: Watch = {
    action: {
      cwd: input.action.cwd,
      prompt: input.action.prompt,
    },
    createdAt: new Date().toISOString(),
    expiresAt: calculateExpiry(input.ttl),
    firedAt: null,
    id: generateWatchId(),
    interval: input.interval ?? DEFAULT_INTERVAL,
    lastCheck: null,
    params: input.params,
    status: 'active',
    trigger: input.trigger,
  };

  db.insert(watch);

  return {
    content: [
      {
        text: JSON.stringify(
          {
            expiresAt: watch.expiresAt,
            message: `Watch registered. The daemon will poll "${input.trigger}" every ${watch.interval}.`,
            watchId: watch.id,
          },
          null,
          2,
        ),
        type: 'text' as const,
      },
    ],
  };
};

/** Handler for watch_status tool */
export const handleWatchStatus = async (
  input: { watchId: string },
  options: ToolHandlerOptions,
): Promise<ToolResult> => {
  const { db } = options;
  const watch = db.getById(input.watchId);

  if (!watch) {
    return {
      content: [
        {
          text: `Error: Watch not found: ${input.watchId}`,
          type: 'text' as const,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [{ text: JSON.stringify(watch, null, 2), type: 'text' as const }],
  };
};
