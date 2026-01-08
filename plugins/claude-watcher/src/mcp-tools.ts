/**
 * MCP tool handler functions (extracted for testability)
 */

import { WatchDatabase } from './db.js';
import { listTriggers, triggerExists } from './trigger-executor.js';
import { DEFAULT_INTERVAL, Watch } from './types.js';
import { calculateExpiry, formatWatch, generateWatchId } from './utils.js';

/** Tool result content type */
export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/** Options for tool handlers (for testing) */
export interface ToolHandlerOptions {
  /** Database instance */
  db: WatchDatabase;
  /** Triggers directory override */
  triggersDir?: string;
}

/** Handler for register_watch tool */
export async function handleRegisterWatch(
  input: {
    trigger: string;
    params: string[];
    action: { prompt: string; cwd?: string };
    ttl?: string;
    interval?: string;
  },
  options: ToolHandlerOptions,
): Promise<ToolResult> {
  const { db, triggersDir } = options;

  // Validate trigger exists
  if (!(await triggerExists(input.trigger, triggersDir))) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: Trigger "${input.trigger}" not found. Use list_triggers to see available triggers.`,
        },
      ],
      isError: true,
    };
  }

  const watch: Watch = {
    id: generateWatchId(),
    trigger: input.trigger,
    params: input.params,
    action: {
      prompt: input.action.prompt,
      cwd: input.action.cwd,
    },
    status: 'active',
    createdAt: new Date().toISOString(),
    expiresAt: calculateExpiry(input.ttl),
    interval: input.interval ?? DEFAULT_INTERVAL,
    lastCheck: null,
    firedAt: null,
  };

  db.insert(watch);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            watchId: watch.id,
            expiresAt: watch.expiresAt,
            message: `Watch registered. The daemon will poll "${input.trigger}" every ${watch.interval}.`,
          },
          null,
          2,
        ),
      },
    ],
  };
}

/** Handler for list_watches tool */
export async function handleListWatches(
  input: { status?: 'active' | 'fired' | 'expired' | 'cancelled' | 'all' },
  options: ToolHandlerOptions,
): Promise<ToolResult> {
  const { db } = options;
  const watches = db.list(input.status ?? 'all');

  if (watches.length === 0) {
    return {
      content: [{ type: 'text' as const, text: 'No watches found.' }],
    };
  }

  const formatted = watches.map(formatWatch).join('\n');
  return {
    content: [
      {
        type: 'text' as const,
        text: `Found ${watches.length} watch(es):\n\n${formatted}`,
      },
    ],
  };
}

/** Handler for watch_status tool */
export async function handleWatchStatus(
  input: { watchId: string },
  options: ToolHandlerOptions,
): Promise<ToolResult> {
  const { db } = options;
  const watch = db.getById(input.watchId);

  if (!watch) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: Watch not found: ${input.watchId}`,
        },
      ],
      isError: true,
    };
  }

  return {
    content: [{ type: 'text' as const, text: JSON.stringify(watch, null, 2) }],
  };
}

/** Handler for cancel_watch tool */
export async function handleCancelWatch(
  input: { watchId: string },
  options: ToolHandlerOptions,
): Promise<ToolResult> {
  const { db } = options;
  const watch = db.getById(input.watchId);

  if (!watch) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: Watch not found: ${input.watchId}`,
        },
      ],
      isError: true,
    };
  }

  if (watch.status !== 'active') {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Error: Cannot cancel watch with status "${watch.status}". Only active watches can be cancelled.`,
        },
      ],
      isError: true,
    };
  }

  db.updateStatus(input.watchId, 'cancelled');
  return {
    content: [
      { type: 'text' as const, text: `Watch ${input.watchId} cancelled.` },
    ],
  };
}

/** Handler for list_triggers tool */
export async function handleListTriggers(
  options: Pick<ToolHandlerOptions, 'triggersDir'>,
): Promise<ToolResult> {
  const triggers = await listTriggers(options.triggersDir);

  if (triggers.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No triggers found. Add executables to ~/.config/claude-watcher/triggers/',
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
      { type: 'text' as const, text: `Available triggers:\n\n${formatted}` },
    ],
  };
}
