# Personal Claude Plugins Marketplace Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bootstrap a personal Claude plugins repository that serves as a marketplace with a complete example plugin demonstrating all available plugin components (skills, commands, agents, hooks, and MCP server).

**Architecture:** Single git repository containing marketplace configuration at root and plugins in a `plugins/` subdirectory. Example plugin includes TypeScript-based MCP server with npm tooling, comprehensive demonstrations of skills, commands, agents, and hooks. Development tooling includes Prettier for code formatting with customized configuration.

**Tech Stack:** Node.js/npm, TypeScript, Prettier, Blue Oak Model License 1.0.0, Claude Code Plugin System (plugin.json, marketplace.json)

---

## Task 1: Initialize Repository Structure and Configuration

**Files:**

- Create: `.gitignore`
- Create: `package.json`
- Create: `.prettierignore`
- Create: `.editorconfig`
- Create: `LICENSE`
- Create: `README.md`

**Step 1: Create .gitignore file**

Create `.gitignore` with standard Node.js patterns plus Claude-specific exclusions:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Local settings (but keep shared .claude configs)
.claude/settings.local.json

# Test files
test.md
```

**Step 2: Create package.json with Prettier**

```json
{
  "name": "boneskull-claude-plugins",
  "version": "1.0.0",
  "description": "Personal marketplace for Claude Code plugins",
  "private": true,
  "scripts": {
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "devDependencies": {
    "prettier": "^3.1.1"
  },
  "prettier": {
    "semi": true,
    "singleQuote": true
  },
  "keywords": ["claude", "claude-code", "plugins", "marketplace"],
  "author": "boneskull",
  "license": "BlueOak-1.0.0"
}
```

**Step 3: Create .prettierignore**

```
package-lock.json
```

**Step 4: Copy .editorconfig from bupkis**

Run: `cp ../bupkis/.editorconfig .editorconfig`

Expected: File copied successfully

**Step 5: Download Blue Oak Model License**

Run: `curl -o LICENSE https://blueoakcouncil.org/license/1.0.0`

Expected: License file downloaded

**Step 6: Create README.md**

````markdown
# Boneskull's Claude Plugins

Personal marketplace for Claude Code plugins.

## Installation

Add this marketplace to Claude Code:

```bash
/plugin marketplace add boneskull/claude-plugins
```
````

## Plugins

### example-plugin

Comprehensive example demonstrating all Claude plugin features:

- Skills with progressive disclosure
- Custom slash commands
- Custom agents
- Event hooks
- TypeScript MCP server

## Development

### Setup

```bash
npm install
```

### Formatting

```bash
npm run format
```

## License

[Blue Oak Model License 1.0.0](LICENSE)

````

**Step 7: Install dependencies**

Run: `npm install`

Expected: prettier installed in node_modules/

**Step 8: Format existing files**

Run: `npm run format`

Expected: Files formatted with Prettier

**Step 9: Commit repository initialization**

```bash
git add .gitignore package.json package-lock.json .prettierignore .editorconfig LICENSE README.md
git commit -m "chore: initialize repository with dev tooling and license"
````

---

## Task 2: Create Marketplace Configuration

**Files:**

- Create: `.claude-plugin/marketplace.json`
- Create: `plugins/.gitkeep`

**Step 1: Create marketplace metadata directory**

Run: `mkdir -p .claude-plugin plugins`

Expected: Directories created

**Step 2: Create marketplace.json**

```json
{
  "name": "boneskull-plugins",
  "description": "Boneskull's personal collection of Claude Code plugins",
  "version": "1.0.0",
  "owner": {
    "name": "boneskull"
  },
  "pluginRoot": "./plugins",
  "plugins": [
    {
      "name": "example-plugin",
      "source": "./plugins/example-plugin",
      "description": "Comprehensive example plugin with skills, commands, agents, hooks, and MCP server",
      "version": "1.0.0",
      "author": {
        "name": "boneskull"
      },
      "category": "examples",
      "tags": ["example", "demo", "tutorial"],
      "strict": true
    }
  ]
}
```

**Step 3: Create plugins directory placeholder**

Run: `touch plugins/.gitkeep`

Expected: Placeholder file created

**Step 4: Format marketplace configuration**

Run: `npm run format`

Expected: marketplace.json formatted

**Step 5: Commit marketplace configuration**

```bash
git add .claude-plugin/marketplace.json plugins/.gitkeep
git commit -m "feat: add marketplace configuration"
```

---

## Task 3: Create Example Plugin Structure

**Files:**

- Create: `plugins/example-plugin/.claude-plugin/plugin.json`
- Create: `plugins/example-plugin/README.md`
- Create: `plugins/example-plugin/package.json`
- Create: `plugins/example-plugin/.gitignore`

**Step 1: Create example plugin directory structure**

Run: `mkdir -p plugins/example-plugin/.claude-plugin`

Expected: Plugin directory created

**Step 2: Create plugin.json manifest**

File: `plugins/example-plugin/.claude-plugin/plugin.json`

```json
{
  "name": "example-plugin",
  "version": "1.0.0",
  "description": "Comprehensive example plugin demonstrating all Claude Code plugin features",
  "author": {
    "name": "boneskull"
  },
  "license": "BlueOak-1.0.0",
  "keywords": ["example", "demo", "tutorial", "mcp", "skills"]
}
```

**Step 3: Create plugin README**

File: `plugins/example-plugin/README.md`

````markdown
# Example Plugin

Comprehensive example demonstrating all Claude Code plugin features.

## Features

### Skills

- **example-skill**: Demonstrates skill structure with progressive disclosure

### Commands

- `/example-plugin:hello`: Simple greeting command with arguments
- `/example-plugin:analyze`: Example analysis command

### Agents

- **example-agent**: Custom subagent demonstrating specialized capabilities

### Hooks

- **SessionStart**: Logs session initialization
- **PostToolUse**: Example post-tool processing

### MCP Server

- **example-mcp**: TypeScript-based MCP server with example tools

## Installation

From marketplace:

```bash
/plugin install example-plugin@boneskull-plugins
```
````

## Usage

### Using the Skill

The skill is automatically invoked when relevant. Try asking about example patterns.

### Using Commands

```bash
/example-plugin:hello World
/example-plugin:analyze path/to/file
```

### Using the Agent

The agent can be invoked via the Task tool when appropriate, or manually:

```bash
/agent example-agent
```

### Using the MCP Server

The MCP server provides additional tools that appear prefixed with `mcp__example-mcp__*`.

## Development

### Setup

```bash
cd plugins/example-plugin
npm install
npm run build
```

### Testing

```bash
npm test
```

## License

[Blue Oak Model License 1.0.0](../../LICENSE)

````

**Step 4: Create plugin package.json**

File: `plugins/example-plugin/package.json`

```json
{
  "name": "example-plugin-mcp",
  "version": "1.0.0",
  "description": "MCP server for example-plugin",
  "main": "dist/index.js",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.5.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0"
  },
  "keywords": ["mcp", "example"],
  "author": "boneskull",
  "license": "BlueOak-1.0.0"
}
````

**Step 5: Create plugin-specific .gitignore**

File: `plugins/example-plugin/.gitignore`

```
node_modules/
dist/
*.tsbuildinfo
```

**Step 6: Format plugin files**

Run: `npm run format`

Expected: Plugin configuration files formatted

**Step 7: Commit plugin structure**

```bash
git add plugins/example-plugin/.claude-plugin/plugin.json plugins/example-plugin/README.md plugins/example-plugin/package.json plugins/example-plugin/.gitignore
git commit -m "feat: create example plugin structure"
```

---

## Task 4: Implement Example Skill

**Files:**

- Create: `plugins/example-plugin/skills/example-skill/SKILL.md`
- Create: `plugins/example-plugin/skills/example-skill/references/patterns.md`
- Create: `plugins/example-plugin/skills/example-skill/assets/template.txt`

**Step 1: Create skill directory structure**

Run: `mkdir -p plugins/example-plugin/skills/example-skill/{references,assets,scripts}`

Expected: Skill directory structure created

**Step 2: Create SKILL.md entry point**

File: `plugins/example-plugin/skills/example-skill/SKILL.md`

```markdown
---
name: example-skill
description: Demonstrates skill structure with progressive disclosure and best practices for skill development
---

# Example Skill

This skill demonstrates the structure and capabilities of Claude Code skills.

## When to Use This Skill

Use this skill when:

- Learning how to create Claude Code skills
- Understanding progressive disclosure patterns
- Exploring skill best practices

## Core Instructions

When this skill is active:

1. **Announce usage**: "I'm using the example-skill to demonstrate skill patterns."

2. **Progressive disclosure**: Load additional context from `references/` only when needed:
   - For pattern examples → Read `references/patterns.md`
   - For templates → Use `assets/template.txt`

3. **Keep it concise**: The SKILL.md file should stay under 500 lines. Move detailed content to reference files.

## Examples

<example>
user: Show me an example pattern
assistant: I'm using the example-skill to demonstrate skill patterns.
Let me load the patterns reference...
[Reads references/patterns.md]
Here's the pattern: ...
</example>

## Best Practices Demonstrated

- **Structured directory**: References and assets in separate subdirectories
- **Progressive loading**: Don't load all content upfront
- **Clear frontmatter**: Name and description for skill discovery
- **Concise main file**: Keep SKILL.md focused and lean

## Reference Files

- `references/patterns.md`: Detailed pattern examples (loaded on demand)
- `assets/template.txt`: Reusable template (loaded when needed)
```

**Step 3: Create patterns reference**

File: `plugins/example-plugin/skills/example-skill/references/patterns.md`

```markdown
# Skill Patterns Reference

This file demonstrates progressive disclosure - it's only loaded when needed.

## Pattern 1: Conditional Loading

Load reference files based on user intent:

- User asks about patterns → Load patterns.md
- User needs template → Load template.txt
- User wants examples → Show inline examples from SKILL.md

## Pattern 2: Directory Organization
```

skill-name/
├── SKILL.md # Entry point (always loaded)
├── references/ # Documentation (on-demand)
│ ├── patterns.md
│ └── advanced.md
├── assets/ # Templates/binaries (on-demand)
│ └── template.txt
└── scripts/ # Executables (on-demand)
└── helper.sh

````

## Pattern 3: Frontmatter Requirements

```yaml
---
name: skill-name          # Max 64 chars, lowercase/hyphens
description: Clear third-person description of when to use this skill (max 1024 chars)
---
````

## Pattern 4: Size Management

- Keep SKILL.md under 500 lines
- Move detailed content to references/
- Use progressive disclosure
- Split large topics across multiple reference files

```

**Step 4: Create template asset**

File: `plugins/example-plugin/skills/example-skill/assets/template.txt`

```

# Example Template

This template demonstrates how skills can include reusable assets.

## Configuration

Setting: ${SETTING_NAME}
Value: ${SETTING_VALUE}

## Instructions

1. Replace ${SETTING_NAME} with actual setting name
2. Replace ${SETTING_VALUE} with actual value
3. Customize as needed

---

Generated by example-skill

````

**Step 5: Format skill files**

Run: `npm run format`

Expected: Markdown files formatted

**Step 6: Commit example skill**

```bash
git add plugins/example-plugin/skills/
git commit -m "feat: add example skill with progressive disclosure"
````

---

## Task 5: Implement Example Commands

**Files:**

- Create: `plugins/example-plugin/commands/hello.md`
- Create: `plugins/example-plugin/commands/analyze.md`

**Step 1: Create commands directory**

Run: `mkdir -p plugins/example-plugin/commands`

Expected: Commands directory created

**Step 2: Create hello command**

File: `plugins/example-plugin/commands/hello.md`

```markdown
---
description: Greet someone with a friendly message
argument-hint: name
---

# Hello Command

Greet the user with a personalized message.

## Usage
```

/example-plugin:hello World
/example-plugin:hello Claude
/example-plugin:hello

```

## Instructions

If $ARGUMENTS is provided:
- Respond with: "Hello, $ARGUMENTS! This is the example-plugin greeting you."

If $ARGUMENTS is empty:
- Respond with: "Hello! This is the example-plugin. Try: /example-plugin:hello YourName"

Keep the response friendly and demonstrate that the command received the argument correctly.
```

**Step 3: Create analyze command**

File: `plugins/example-plugin/commands/analyze.md`

```markdown
---
description: Analyze a file and provide insights
argument-hint: file-path
allowed-tools: Read, Bash
---

# Analyze Command

Read and analyze a file, providing insights about its contents.

## Usage
```

/example-plugin:analyze src/index.ts
/example-plugin:analyze README.md

```

## Instructions

1. Validate that $ARGUMENTS contains a file path
2. Use the Read tool to read the file
3. Analyze the file contents:
   - File type and format
   - Size and line count
   - Key patterns or structures
   - Any notable characteristics

4. Present findings in a structured format:

```

# Analysis: [filename]

**Type**: [file type]
**Size**: [lines/bytes]

## Key Findings

- Finding 1
- Finding 2
- Finding 3

## Recommendations

- Recommendation 1
- Recommendation 2

```

If no arguments provided, respond with:
"Please specify a file path: /example-plugin:analyze path/to/file"
```

**Step 4: Format command files**

Run: `npm run format`

Expected: Command markdown files formatted

**Step 5: Commit example commands**

```bash
git add plugins/example-plugin/commands/
git commit -m "feat: add example commands (hello, analyze)"
```

---

## Task 6: Implement Example Agent

**Files:**

- Create: `plugins/example-plugin/agents/example-agent.md`

**Step 1: Create agents directory**

Run: `mkdir -p plugins/example-plugin/agents`

Expected: Agents directory created

**Step 2: Create example agent**

File: `plugins/example-plugin/agents/example-agent.md`

```markdown
---
name: example-agent
description: Demonstrates custom agent capabilities with specialized expertise in code analysis
tools: Read, Grep, Glob, Bash
model: sonnet
---

# Example Agent

A custom subagent demonstrating specialized capabilities and restricted tool access.

## Expertise Areas

This agent specializes in:

- **Code Analysis**: Reading and understanding code structure
- **Pattern Detection**: Identifying common patterns and anti-patterns
- **Documentation Review**: Analyzing documentation quality
- **File Organization**: Evaluating project structure

## Available Tools

This agent has access to:

- **Read**: Reading file contents
- **Grep**: Searching for patterns in code
- **Glob**: Finding files by pattern
- **Bash**: Running read-only commands (ls, wc, etc.)

Note: This agent cannot modify files (no Write/Edit access) to demonstrate tool restrictions.

## Agent Behavior

When invoked, this agent should:

1. **Identify the task**: Understand what analysis is requested
2. **Gather context**: Use Glob/Grep to find relevant files
3. **Analyze thoroughly**: Read and examine code/documentation
4. **Report findings**: Provide structured analysis with examples
5. **Offer recommendations**: Suggest improvements when applicable

## Analysis Framework

For code analysis tasks:

1. **Structure**: Examine file organization and architecture
2. **Patterns**: Identify design patterns and conventions
3. **Quality**: Assess code clarity and documentation
4. **Recommendations**: Suggest improvements

## Example Usage
```

Task: Analyze the MCP server implementation
Response:

1. Locating MCP server files... [uses Glob]
2. Examining implementation... [uses Read]
3. Checking for patterns... [uses Grep]
4. Analysis complete:
   - Architecture: [findings]
   - Patterns: [findings]
   - Recommendations: [suggestions]

```

## Limitations

This agent demonstrates restricted capabilities:
- Cannot modify files (read-only analysis)
- Cannot make external network requests
- Cannot execute complex bash operations
- Focused on analysis and reporting only

This demonstrates how agents can be scoped for specific tasks.
```

**Step 3: Format agent file**

Run: `npm run format`

Expected: Agent markdown formatted

**Step 4: Commit example agent**

```bash
git add plugins/example-plugin/agents/
git commit -m "feat: add example agent with restricted tools"
```

---

## Task 7: Implement Example Hooks

**Files:**

- Create: `plugins/example-plugin/hooks/hooks.json`
- Create: `plugins/example-plugin/hooks/scripts/session-start.sh`
- Create: `plugins/example-plugin/hooks/scripts/post-tool-use.sh`

**Step 1: Create hooks directory structure**

Run: `mkdir -p plugins/example-plugin/hooks/scripts`

Expected: Hooks directory created

**Step 2: Create hooks configuration**

File: `plugins/example-plugin/hooks/hooks.json`

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/scripts/session-start.sh",
            "timeout": 10
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "./hooks/scripts/post-tool-use.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

**Step 3: Create session start hook script**

File: `plugins/example-plugin/hooks/scripts/session-start.sh`

```bash
#!/usr/bin/env bash
# Example SessionStart hook
# Demonstrates session initialization logging

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Extract session_id using basic tools
session_id=$(echo "$input" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)

# Log session start
echo "Example plugin: Session started ($session_id)" >&2

# Return success response
cat <<EOF
{
  "continue": true,
  "systemMessage": "Example plugin initialized for this session"
}
EOF

exit 0
```

**Step 4: Create post-tool-use hook script**

File: `plugins/example-plugin/hooks/scripts/post-tool-use.sh`

```bash
#!/usr/bin/env bash
# Example PostToolUse hook
# Demonstrates post-tool processing (Write/Edit operations)

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Extract tool information
tool_name=$(echo "$input" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
file_path=$(echo "$input" | grep -o '"file_path":"[^"]*"' | cut -d'"' -f4)

# Log the operation
echo "Example plugin: $tool_name completed on $file_path" >&2

# Return success response
cat <<EOF
{
  "continue": true,
  "systemMessage": "Example plugin processed $tool_name operation"
}
EOF

exit 0
```

**Step 5: Make hook scripts executable**

Run: `chmod +x plugins/example-plugin/hooks/scripts/*.sh`

Expected: Scripts marked executable

**Step 6: Format hooks configuration**

Run: `npm run format`

Expected: hooks.json formatted

**Step 7: Commit example hooks**

```bash
git add plugins/example-plugin/hooks/
git commit -m "feat: add example hooks (SessionStart, PostToolUse)"
```

---

## Task 8: Implement TypeScript MCP Server - Setup

**Files:**

- Create: `plugins/example-plugin/src/index.ts`
- Create: `plugins/example-plugin/tsconfig.json`
- Create: `plugins/example-plugin/.mcp.json`

**Step 1: Create TypeScript configuration**

File: `plugins/example-plugin/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 2: Create src directory**

Run: `mkdir -p plugins/example-plugin/src`

Expected: Source directory created

**Step 3: Create MCP server entry point**

File: `plugins/example-plugin/src/index.ts`

```typescript
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
```

**Step 4: Create MCP configuration**

File: `plugins/example-plugin/.mcp.json`

```json
{
  "mcpServers": {
    "example-mcp": {
      "command": "node",
      "args": ["dist/index.js"],
      "env": {}
    }
  }
}
```

**Step 5: Format TypeScript and configuration files**

Run: `npm run format`

Expected: Files formatted with Prettier

**Step 6: Commit MCP server implementation**

```bash
git add plugins/example-plugin/src/ plugins/example-plugin/tsconfig.json plugins/example-plugin/.mcp.json
git commit -m "feat: add TypeScript MCP server implementation"
```

---

## Task 9: Build and Test MCP Server

**Step 1: Install MCP server dependencies**

Run: `cd plugins/example-plugin && npm install`

Expected: Dependencies installed (should see @modelcontextprotocol/sdk, typescript, @types/node)

**Step 2: Build TypeScript code**

Run: `npm run build`

Expected: TypeScript compiled to dist/ directory, no errors

**Step 3: Verify build output exists**

Run: `ls -la dist/`

Expected: Should see index.js, index.d.ts, index.js.map files

**Step 4: Test MCP server starts**

Run: `timeout 2 node dist/index.js || true`

Expected: Error message "Example MCP server running on stdio" in stderr, then timeout (normal - server waits for input)

**Step 5: Return to repository root**

Run: `cd ../..`

Expected: Back in claude-plugins/ directory

**Step 6: Commit build verification**

```bash
git add plugins/example-plugin/package-lock.json
git commit -m "chore: lock MCP server dependencies"
```

---

## Task 10: Create Documentation and Final Setup

**Files:**

- Create: `docs/DEVELOPMENT.md`
- Modify: `README.md` (add usage instructions)

**Step 1: Create development documentation**

File: `docs/DEVELOPMENT.md`

```markdown
# Development Guide

This guide covers developing plugins for the boneskull-plugins marketplace.

## Repository Structure
```

claude-plugins/
├── .claude-plugin/
│ └── marketplace.json # Marketplace configuration
├── plugins/
│ └── example-plugin/ # Example plugin
│ ├── .claude-plugin/
│ │ └── plugin.json # Plugin manifest
│ ├── commands/ # Slash commands
│ ├── agents/ # Custom agents
│ ├── skills/ # Agent skills
│ ├── hooks/ # Event hooks
│ ├── src/ # MCP server source (TypeScript)
│ ├── .mcp.json # MCP server configuration
│ └── package.json # Node.js dependencies
├── docs/
│ ├── plans/ # Implementation plans
│ └── DEVELOPMENT.md # This file
├── package.json # Root package.json (dev tools)
└── README.md # Main documentation

````

## Creating a New Plugin

### 1. Directory Structure

```bash
mkdir -p plugins/my-plugin/.claude-plugin
cd plugins/my-plugin
````

### 2. Create plugin.json

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Plugin description",
  "author": {
    "name": "boneskull"
  },
  "license": "BlueOak-1.0.0",
  "keywords": ["tag1", "tag2"]
}
```

### 3. Add Plugin Components

Choose components based on your needs:

#### Commands (`commands/`)

Slash commands for user-triggered actions.

#### Agents (`agents/`)

Custom subagents with specialized capabilities.

#### Skills (`skills/`)

Agent Skills that Claude automatically uses when relevant.

#### Hooks (`hooks/`)

Event handlers for lifecycle events.

#### MCP Server

External tool integration via Model Context Protocol.

### 4. Register in Marketplace

Add entry to `.claude-plugin/marketplace.json`:

```json
{
  "name": "my-plugin",
  "source": "./plugins/my-plugin",
  "description": "Plugin description",
  "version": "1.0.0",
  "author": {
    "name": "boneskull"
  },
  "category": "utility",
  "tags": ["tag1", "tag2"],
  "strict": true
}
```

## Building MCP Servers

### TypeScript Setup

1. Create `tsconfig.json` in plugin directory
2. Add dependencies:
   ```bash
   npm install @modelcontextprotocol/sdk
   npm install -D typescript @types/node
   ```
3. Create `src/index.ts` with server implementation
4. Configure `.mcp.json` to reference built output

### Building

```bash
cd plugins/my-plugin
npm run build
```

## Code Formatting

Run Prettier from repository root:

```bash
npm run format        # Format all files
npm run format:check  # Check formatting
```

## Testing Locally

### Install Marketplace Locally

```bash
/plugin marketplace add /path/to/claude-plugins
```

### Install Plugin

```bash
/plugin install example-plugin@boneskull-plugins
```

### Verify Installation

```bash
/plugin list
```

## Naming Conventions

- **Plugin names**: kebab-case (e.g., `my-plugin`)
- **Command files**: kebab-case (e.g., `do-thing.md`)
- **Agent files**: kebab-case (e.g., `my-agent.md`)
- **Skill directories**: hyphen-case (e.g., `my-skill-name/`)

## Best Practices

1. **Keep skills under 500 lines** - Use progressive disclosure with `references/`
2. **Test hooks thoroughly** - Path configuration is the most common issue
3. **Document everything** - Include comprehensive README.md in each plugin
4. **Version consistently** - Use semantic versioning
5. **Format code** - Run `npm run format` before committing

## Resources

- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Example Plugin](../plugins/example-plugin/README.md)

## License

All plugins in this repository are licensed under [Blue Oak Model License 1.0.0](../LICENSE).

````

**Step 2: Update root README with usage details**

File: `README.md`

Replace with:

```markdown
# Boneskull's Claude Plugins

Personal marketplace for Claude Code plugins.

## Installation

Add this marketplace to Claude Code:

```bash
# From GitHub (when published)
/plugin marketplace add boneskull/claude-plugins

# From local checkout
/plugin marketplace add /path/to/claude-plugins
````

## Plugins

### example-plugin

Comprehensive example demonstrating all Claude plugin features:

- **Skills**: Example skill with progressive disclosure pattern
- **Commands**: `/example-plugin:hello` and `/example-plugin:analyze`
- **Agents**: `example-agent` for code analysis
- **Hooks**: SessionStart and PostToolUse examples
- **MCP Server**: TypeScript-based server with `greet` and `calculate` tools

#### Installing the Example Plugin

```bash
/plugin install example-plugin@boneskull-plugins
```

#### Using the Example Plugin

**Commands:**

```bash
/example-plugin:hello World
/example-plugin:analyze path/to/file
```

**Skill:**
The example-skill is automatically invoked when relevant.

**Agent:**
Invoke via Task tool or manually request analysis tasks.

**MCP Tools:**
Tools appear as `mcp__example-mcp__greet` and `mcp__example-mcp__calculate`.

## Development

See [Development Guide](docs/DEVELOPMENT.md) for details on creating new plugins.

### Quick Start

```bash
# Install dependencies
npm install

# Format code
npm run format

# Build example plugin MCP server
cd plugins/example-plugin
npm install
npm run build
```

## Repository Structure

```
claude-plugins/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace catalog
├── plugins/
│   └── example-plugin/       # Comprehensive example plugin
├── docs/
│   ├── plans/                # Implementation plans
│   └── DEVELOPMENT.md        # Development guide
└── package.json              # Dev tooling (Prettier)
```

## License

[Blue Oak Model License 1.0.0](LICENSE)

All plugins in this repository are licensed under the Blue Oak Model License 1.0.0, a modern permissive open source license.

````

**Step 3: Format documentation**

Run: `npm run format`

Expected: All markdown files formatted

**Step 4: Commit documentation**

```bash
git add docs/DEVELOPMENT.md README.md
git commit -m "docs: add development guide and update README"
````

---

## Task 11: Final Validation and Cleanup

**Step 1: Remove test.md file**

Run: `rm test.md`

Expected: test.md deleted

**Step 2: Run final formatting pass**

Run: `npm run format`

Expected: All files formatted consistently

**Step 3: Verify repository structure**

Run: `tree -L 3 -a -I 'node_modules|.git|dist' .`

Expected output should show:

```
.
├── .claude-plugin/
│   └── marketplace.json
├── .editorconfig
├── .gitignore
├── .prettierignore
├── LICENSE
├── README.md
├── docs/
│   ├── DEVELOPMENT.md
│   └── plans/
│       └── 2025-11-10-bootstrap-personal-plugin-marketplace.md
├── package.json
├── package-lock.json
└── plugins/
    ├── .gitkeep
    └── example-plugin/
        ├── .claude-plugin/
        ├── .gitignore
        ├── .mcp.json
        ├── README.md
        ├── agents/
        ├── commands/
        ├── hooks/
        ├── package.json
        ├── package-lock.json
        ├── skills/
        ├── src/
        └── tsconfig.json
```

**Step 4: Validate marketplace.json structure**

Run: `cat .claude-plugin/marketplace.json | jq . > /dev/null && echo "Valid JSON" || echo "Invalid JSON"`

Expected: "Valid JSON"

**Step 5: Validate plugin.json structure**

Run: `cat plugins/example-plugin/.claude-plugin/plugin.json | jq . > /dev/null && echo "Valid JSON" || echo "Invalid JSON"`

Expected: "Valid JSON"

**Step 6: Verify MCP server builds cleanly**

Run: `cd plugins/example-plugin && npm run build && cd ../..`

Expected: Clean build with no errors

**Step 7: Check git status**

Run: `git status`

Expected: Only test.md should be untracked (will be removed next step)

**Step 8: Final commit**

```bash
git add -A
git commit -m "chore: remove test file and finalize repository setup"
```

**Step 9: Verify commit history**

Run: `git log --oneline -15`

Expected: Should see all commits from this plan:

- chore: initialize repository with dev tooling and license
- feat: add marketplace configuration
- feat: create example plugin structure
- feat: add example skill with progressive disclosure
- feat: add example commands (hello, analyze)
- feat: add example agent with restricted tools
- feat: add example hooks (SessionStart, PostToolUse)
- feat: add TypeScript MCP server implementation
- chore: lock MCP server dependencies
- docs: add development guide and update README
- chore: remove test file and finalize repository setup

**Step 10: Create summary report**

Display to user:

````markdown
# Repository Bootstrap Complete! 🎉

Your personal Claude plugins marketplace is ready.

## What's Been Created

### Repository Structure

✅ Marketplace configuration (`.claude-plugin/marketplace.json`)
✅ Development tooling (Prettier, .editorconfig, .gitignore)
✅ Blue Oak Model License 1.0.0
✅ Comprehensive documentation (README.md, docs/DEVELOPMENT.md)

### Example Plugin (`plugins/example-plugin`)

✅ Plugin manifest (`.claude-plugin/plugin.json`)
✅ Example skill with progressive disclosure
✅ Two commands: hello, analyze
✅ Custom agent with restricted tools
✅ Event hooks: SessionStart, PostToolUse
✅ TypeScript MCP server with greet & calculate tools

## Next Steps

### 1. Test Locally

```bash
/plugin marketplace add /Users/boneskull/projects/boneskull/claude-plugins
/plugin install example-plugin@boneskull-plugins
/example-plugin:hello Test
```
````

### 2. Publish to GitHub

```bash
git remote add origin https://github.com/boneskull/claude-plugins.git
git push -u origin main
```

### 3. Install from GitHub

```bash
/plugin marketplace add boneskull/claude-plugins
```

### 4. Create Your Own Plugin

See `docs/DEVELOPMENT.md` for plugin development guide.

## Repository Statistics

- Total commits: 11
- Files created: 30+
- Lines of code: ~1,500
- Components: Skills, Commands, Agents, Hooks, MCP Server

Happy plugin development! 🚀

```

---

## Plan Summary

This plan creates a fully functional personal Claude plugins marketplace with:

1. **Repository Infrastructure**: Git, npm, Prettier, Blue Oak License
2. **Marketplace Configuration**: Proper marketplace.json with plugin catalog
3. **Complete Example Plugin**: Demonstrates all plugin capabilities
   - Skills (with progressive disclosure pattern)
   - Commands (with arguments and tool restrictions)
   - Agents (with specialized capabilities)
   - Hooks (with bash scripts)
   - MCP Server (TypeScript implementation)
4. **Documentation**: README, development guide, and this implementation plan
5. **Build System**: TypeScript compilation for MCP server
6. **Code Quality**: Prettier formatting with custom configuration

Each task follows test-driven development principles where applicable and includes frequent, atomic commits. The resulting repository serves as both a functional marketplace and a comprehensive reference for plugin development.
```
