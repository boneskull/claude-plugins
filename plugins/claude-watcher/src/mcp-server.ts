#!/usr/bin/env node
/**
 * MCP Server for claude-watcher Provides tools to register and manage watches
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { closeDatabase, getDatabase } from './db.js';
import { listTriggers, triggerExists } from './trigger-executor.js';
import {
  CancelWatchInput,
  DEFAULT_INTERVAL,
  ListWatchesInput,
  RegisterWatchInput,
  Watch,
  WatchStatusInput,
} from './types.js';
import {
  calculateExpiry,
  ensureConfigDirs,
  formatWatch,
  generateWatchId,
} from './utils.js';

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
    description: 'List available trigger executables with their metadata.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool handlers
async function handleRegisterWatch(args: RegisterWatchInput): Promise<string> {
  const { trigger, params, action, ttl, interval } = args;

  // Validate trigger exists
  if (!(await triggerExists(trigger))) {
    throw new Error(
      `Trigger "${trigger}" not found. Use list_triggers to see available triggers.`,
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
    2,
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
      `Cannot cancel watch with status "${watch.status}". Only active watches can be cancelled.`,
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
  { capabilities: { tools: {} } },
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
        result = await handleRegisterWatch(
          args as unknown as RegisterWatchInput,
        );
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
    return {
      content: [{ type: 'text', text: `Error: ${msg}` }],
      isError: true,
    };
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
