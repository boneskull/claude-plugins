#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Example MCP Server
 * Demonstrates basic MCP server implementation with TypeScript
 */

// Define available tools
const TOOLS: Tool[] = [
  {
    name: 'greet',
    description: 'Generate a personalized greeting message',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the person to greet',
        },
        style: {
          type: 'string',
          enum: ['formal', 'casual', 'enthusiastic'],
          description: 'Greeting style',
          default: 'casual',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'calculate',
    description: 'Perform basic arithmetic calculations',
    inputSchema: {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          description: 'Arithmetic operation to perform',
        },
        a: {
          type: 'number',
          description: 'First operand',
        },
        b: {
          type: 'number',
          description: 'Second operand',
        },
      },
      required: ['operation', 'a', 'b'],
    },
  },
];

// Tool implementations
function handleGreet(args: { name: string; style?: string }): string {
  const { name, style = 'casual' } = args;

  switch (style) {
    case 'formal':
      return `Good day, ${name}. It is a pleasure to make your acquaintance.`;
    case 'enthusiastic':
      return `Hey ${name}! So great to meet you! 🎉`;
    case 'casual':
    default:
      return `Hi ${name}, nice to meet you!`;
  }
}

function handleCalculate(args: {
  operation: string;
  a: number;
  b: number;
}): string {
  const { operation, a, b } = args;

  let result: number;
  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'subtract':
      result = a - b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'divide':
      if (b === 0) {
        throw new Error('Division by zero is not allowed');
      }
      result = a / b;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return `${a} ${operation} ${b} = ${result}`;
}

// Create and configure server
const server = new Server(
  {
    name: 'example-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  },
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
      case 'greet':
        result = handleGreet(args as { name: string; style?: string });
        break;
      case 'calculate':
        result = handleCalculate(
          args as { operation: string; a: number; b: number },
        );
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: 'text', text: result }],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Example MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
