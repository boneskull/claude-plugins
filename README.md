# Boneskull's Claude Plugins

Personal marketplace for Claude Code plugins.

## Installation

Add this marketplace to Claude Code:

```bash
# From GitHub (when published)
/plugin marketplace add boneskull/claude-plugins

# From local checkout
/plugin marketplace add /path/to/claude-plugins
```

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
