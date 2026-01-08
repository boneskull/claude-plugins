#!/usr/bin/env node
/**
 * MCP Server for claude-watcher Provides tools to register and manage watches
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { closeDatabase, getDatabase } from './db.js';
import { listTriggers, triggerExists } from './trigger-executor.js';
import { DEFAULT_INTERVAL, Watch } from './types.js';
import {
  calculateExpiry,
  ensureConfigDirs,
  formatWatch,
  generateWatchId,
} from './utils.js';

// Ensure config directories exist
ensureConfigDirs();

// Create server using the high-level McpServer API
const server = new McpServer({ name: 'claude-watcher', version: '1.0.0' });

// Tool: register_watch
server.registerTool(
  'register_watch',
  {
    description:
      'Register a new watch that polls a trigger and executes an action when it fires. ' +
      'The action prompt can use {{variable}} syntax to interpolate trigger output.',
    inputSchema: {
      trigger: z
        .string()
        .describe('Name of the trigger executable (e.g., "npm-publish")'),
      params: z.array(z.string()).describe('Arguments to pass to the trigger'),
      action: z.object({
        prompt: z
          .string()
          .describe(
            'Prompt to execute when trigger fires. Use {{var}} for interpolation.',
          ),
        cwd: z
          .string()
          .optional()
          .describe('Working directory for action execution'),
      }),
      ttl: z
        .string()
        .optional()
        .describe('Time-to-live (e.g., "48h", "7d"). Default: 48h'),
      interval: z
        .string()
        .optional()
        .describe('Polling interval (e.g., "30s", "5m"). Default: 30s'),
    },
  },
  async ({ trigger, params, action, ttl, interval }) => {
    // Validate trigger exists
    if (!(await triggerExists(trigger))) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `Error: Trigger "${trigger}" not found. Use list_triggers to see available triggers.`,
          },
        ],
        isError: true,
      };
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

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              watchId: watch.id,
              expiresAt: watch.expiresAt,
              message: `Watch registered. The daemon will poll "${trigger}" every ${watch.interval}.`,
            },
            null,
            2,
          ),
        },
      ],
    };
  },
);

// Tool: list_watches
server.registerTool(
  'list_watches',
  {
    description: 'List registered watches, optionally filtered by status.',
    inputSchema: {
      status: z
        .enum(['active', 'fired', 'expired', 'cancelled', 'all'])
        .optional()
        .describe('Filter by status. Default: all'),
    },
  },
  async ({ status }) => {
    const db = getDatabase();
    const watches = db.list(status ?? 'all');

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
  },
);

// Tool: watch_status
server.registerTool(
  'watch_status',
  {
    description: 'Get detailed status of a specific watch.',
    inputSchema: {
      watchId: z.string().describe('Watch ID to query'),
    },
  },
  async ({ watchId }) => {
    const db = getDatabase();
    const watch = db.getById(watchId);

    if (!watch) {
      return {
        content: [
          { type: 'text' as const, text: `Error: Watch not found: ${watchId}` },
        ],
        isError: true,
      };
    }

    return {
      content: [
        { type: 'text' as const, text: JSON.stringify(watch, null, 2) },
      ],
    };
  },
);

// Tool: cancel_watch
server.registerTool(
  'cancel_watch',
  {
    description: 'Cancel an active watch.',
    inputSchema: {
      watchId: z.string().describe('Watch ID to cancel'),
    },
  },
  async ({ watchId }) => {
    const db = getDatabase();
    const watch = db.getById(watchId);

    if (!watch) {
      return {
        content: [
          { type: 'text' as const, text: `Error: Watch not found: ${watchId}` },
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

    db.updateStatus(watchId, 'cancelled');
    return {
      content: [{ type: 'text' as const, text: `Watch ${watchId} cancelled.` }],
    };
  },
);

// Tool: list_triggers
server.registerTool(
  'list_triggers',
  {
    description: 'List available trigger executables with their metadata.',
    inputSchema: {},
  },
  async () => {
    const triggers = await listTriggers();

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
  },
);

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
