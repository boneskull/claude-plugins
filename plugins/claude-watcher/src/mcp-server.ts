#!/usr/bin/env node
/**
 * MCP Server for claude-watcher Provides tools to register and manage watches
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { closeDatabase, getDatabase } from './db.js';
import { listTriggers, triggerExists } from './trigger-executor.js';
import { DEFAULT_INTERVAL, type Watch } from './types.js';
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
      action: z.object({
        cwd: z
          .string()
          .optional()
          .describe('Working directory for action execution'),
        prompt: z
          .string()
          .describe(
            'Prompt to execute when trigger fires. Use {{var}} for interpolation.',
          ),
      }),
      interval: z
        .string()
        .optional()
        .describe('Polling interval (e.g., "30s", "5m"). Default: 30s'),
      params: z.array(z.string()).describe('Arguments to pass to the trigger'),
      trigger: z
        .string()
        .describe('Name of the trigger executable (e.g., "npm-publish")'),
      ttl: z
        .string()
        .optional()
        .describe('Time-to-live (e.g., "48h", "7d"). Default: 48h'),
    },
  },
  async ({ action, interval, params, trigger, ttl }) => {
    // Validate trigger exists
    if (!(await triggerExists(trigger))) {
      return {
        content: [
          {
            text: `Error: Trigger "${trigger}" not found. Use list_triggers to see available triggers.`,
            type: 'text' as const,
          },
        ],
        isError: true,
      };
    }

    const db = getDatabase();
    const watch: Watch = {
      action: {
        cwd: action.cwd,
        prompt: action.prompt,
      },
      createdAt: new Date().toISOString(),
      expiresAt: calculateExpiry(ttl),
      firedAt: null,
      id: generateWatchId(),
      interval: interval ?? DEFAULT_INTERVAL,
      lastCheck: null,
      params,
      status: 'active',
      trigger,
    };

    db.insert(watch);

    return {
      content: [
        {
          text: JSON.stringify(
            {
              expiresAt: watch.expiresAt,
              message: `Watch registered. The daemon will poll "${trigger}" every ${watch.interval}.`,
              watchId: watch.id,
            },
            null,
            2,
          ),
          type: 'text' as const,
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
          { text: `Error: Watch not found: ${watchId}`, type: 'text' as const },
        ],
        isError: true,
      };
    }

    return {
      content: [
        { text: JSON.stringify(watch, null, 2), type: 'text' as const },
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
          { text: `Error: Watch not found: ${watchId}`, type: 'text' as const },
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

    db.updateStatus(watchId, 'cancelled');
    return {
      content: [{ text: `Watch ${watchId} cancelled.`, type: 'text' as const }],
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
const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('claude-watcher MCP server running on stdio');
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
