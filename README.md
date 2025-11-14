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

**Category:** development

Idiomatic assertion patterns for the Bupkis testing library.

**Contains:**

- **Skills:**
  - `bupkis-assertion-patterns` - How to write idiomatic assertions with the Bupkis assertion library for TypeScript and JavaScript (307 lines main, 2,080 lines references)

**Installation:**

```bash
/plugin install bupkis@boneskull-plugins
```

### github

**Category:** development

Commands for interacting with GitHub issues and pull requests (PRs).

**Contains:**

- **Commands:**
  - `/github:resolve-review-comments` - Address any valid, outstanding pull request (PR) review comments

**Installation:**

```bash
/plugin install github@boneskull-plugins
```

### tools

**Category:** development

Skills and documentation for various CLI, development, and language-specific tools.

**Contains:**

- **Skills:**
  - `git-commit-messages` - Format git commit messages correctly, avoiding HEREDOC syntax issues in favor of multiline strings (145 lines)
  - `git-directory-management` - Manage git-tracked directories correctly - never create .gitkeep files in directories that will immediately contain tracked files (209 lines)

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
