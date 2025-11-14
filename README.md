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

## Available Plugins

### bupkis

**Category:** Development/Testing

Idiomatic assertion patterns for the Bupkis testing library.

**Contains:**

- **Skills:**
  - `bupkis-assertion-patterns` - Learn expressive, maintainable assertions using Bupkis' powerful assertion vocabulary with progressive disclosure (308 lines main, 2,080 lines references)

**Installation:**

```bash
/plugin install bupkis@boneskull-plugins
```

### github

**Category:** Development/Version Control

Commands for interacting with GitHub issues and pull requests.

**Contains:**

- **Commands:**
  - `/github:resolve-review-comments` - Automatically resolve GitHub PR review comments with fix → test → commit → push → reply workflow

**Installation:**

```bash
/plugin install github@boneskull-plugins
```

### tools

**Category:** Development/Tools

Skills and documentation for various CLI and development tools.

**Contains:**

- **Skills:**
  - `git-commit-messages` - Format git commit messages correctly using multiline strings (not HEREDOC) for reliable commits

**Installation:**

```bash
/plugin install tools@boneskull-plugins
```

---

**Note:** The `example-plugin` is included in the repository as a comprehensive reference but is not published to the marketplace.

## Development

See [Development Guide](docs/DEVELOPMENT.md) for details on creating new plugins.

### Quick Start

```bash
# Install dependencies
npm install

# Format code
npm run format
```

## License

[Blue Oak Model License 1.0.0](LICENSE)

All plugins in this repository are licensed under the Blue Oak Model License 1.0.0, a modern permissive open source license.
