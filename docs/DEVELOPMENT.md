# Development Guide

This guide covers developing plugins for the boneskull-plugins marketplace.

## Repository Structure

```
claude-plugins/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace configuration
├── plugins/
│   └── example-plugin/       # Example plugin
│       ├── .claude-plugin/
│       │   └── plugin.json   # Plugin manifest
│       ├── commands/         # Slash commands
│       ├── agents/           # Custom agents
│       ├── skills/           # Agent skills
│       ├── hooks/            # Event hooks
│       ├── src/              # MCP server source (TypeScript)
│       ├── .mcp.json         # MCP server configuration
│       └── package.json      # Node.js dependencies
├── docs/
│   ├── plans/                # Implementation plans
│   └── DEVELOPMENT.md        # This file
├── package.json              # Root package.json (dev tools)
└── README.md                 # Main documentation
```

## Creating a New Plugin

### 1. Directory Structure

```bash
mkdir -p plugins/my-plugin/.claude-plugin
cd plugins/my-plugin
```

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
