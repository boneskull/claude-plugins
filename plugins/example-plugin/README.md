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
