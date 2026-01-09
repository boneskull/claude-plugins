#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

/**
 * Example MCP Server Demonstrates basic MCP server implementation with
 * TypeScript
 */

// Define available tools
const TOOLS: Tool[] = [
  {
    description: 'Generate a personalized greeting message',
    inputSchema: {
      properties: {
        name: {
          description: 'Name of the person to greet',
          type: 'string',
        },
        style: {
          default: 'casual',
          description: 'Greeting style',
          enum: ['formal', 'casual', 'enthusiastic'],
          type: 'string',
        },
      },
      required: ['name'],
      type: 'object',
    },
    name: 'greet',
  },
  {
    description: 'Perform basic arithmetic calculations',
    inputSchema: {
      properties: {
        a: {
          description: 'First operand',
          type: 'number',
        },
        b: {
          description: 'Second operand',
          type: 'number',
        },
        operation: {
          description: 'Arithmetic operation to perform',
          enum: ['add', 'subtract', 'multiply', 'divide'],
          type: 'string',
        },
      },
      required: ['operation', 'a', 'b'],
      type: 'object',
    },
    name: 'calculate',
  },
];

const handleCalculate = (args: {
  a: number;
  b: number;
  operation: string;
}): string => {
  const { a, b, operation } = args;

  let result: number;
  switch (operation) {
    case 'add':
      result = a + b;
      break;
    case 'divide':
      if (b === 0) {
        throw new Error('Division by zero is not allowed');
      }
      result = a / b;
      break;
    case 'multiply':
      result = a * b;
      break;
    case 'subtract':
      result = a - b;
      break;
    default:
      throw new Error(`Unknown operation: ${operation}`);
  }

  return `${a} ${operation} ${b} = ${result}`;
};

// Tool implementations
const handleGreet = (args: { name: string; style?: string }): string => {
  const { name, style = 'casual' } = args;

  switch (style) {
    case 'enthusiastic':
      return `Hey ${name}! So great to meet you! 🎉`;
    case 'formal':
      return `Good day, ${name}. It is a pleasure to make your acquaintance.`;
    case 'casual':
    default:
      return `Hi ${name}, nice to meet you!`;
  }
};

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
  const { arguments: args, name } = request.params;

  try {
    let result: string;

    switch (name) {
      case 'calculate':
        result = handleCalculate(
          args as { a: number; b: number; operation: string },
        );
        break;
      case 'greet':
        result = handleGreet(args as { name: string; style?: string });
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ text: result, type: 'text' }],
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [{ text: `Error: ${errorMessage}`, type: 'text' }],
      isError: true,
    };
  }
});

// Start server
const main = async () => {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Example MCP server running on stdio');
};

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
