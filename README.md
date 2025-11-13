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

### bupkis

Idiomatic assertion patterns for the Bupkis testing library.

- **Skills**: bupkis-assertion-patterns with comprehensive patterns and reference documentation
- **Category**: Development/Testing

Learn to write expressive, maintainable assertions using Bupkis' powerful assertion vocabulary.

#### Installing the Bupkis Plugin

```bash
/plugin install bupkis@boneskull-plugins
```

### tools

Skills and documentation for various CLI, development, and language-specific tools.

- **Skills**: One skill per tool (to be added incrementally)
- **Category**: Development/Tools

Learn best practices and common patterns for the tools you use every day.

#### Installing the Tools Plugin

```bash
/plugin install tools@boneskull-plugins
```

### github

Commands for interacting with GitHub issues and pull requests (PRs).

- **Commands**: Workflow commands for common GitHub operations
- **Category**: Development/Version Control

Streamline your GitHub workflow with commands for resolving review comments and managing PRs.

#### Installing the GitHub Plugin

```bash
/plugin install github@boneskull-plugins
```

## Development

See [Development Guide](docs/DEVELOPMENT.md) for details on creating new plugins.

### Quick Start

```bash
# Install dependencies
npm install

# Format code
npm run format
```

## Repository Structure

```
claude-plugins/
├── .claude-plugin/
│   └── marketplace.json      # Marketplace catalog
├── plugins/
│   ├── bupkis/               # Bupkis assertion patterns
│   ├── github/               # GitHub workflow commands
│   └── tools/                # CLI and development tools
├── docs/
│   ├── plans/                # Implementation plans
│   └── DEVELOPMENT.md        # Development guide
└── package.json              # Dev tooling (Prettier)
```

## License

[Blue Oak Model License 1.0.0](LICENSE)

All plugins in this repository are licensed under the Blue Oak Model License 1.0.0, a modern permissive open source license.
