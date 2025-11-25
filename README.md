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

[📖 Plugin README](plugins/bupkis/README.md)

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

[📖 Plugin README](plugins/github/README.md)

**Category:** development

Commands for interacting with GitHub issues and pull requests (PRs).

**Contains:**

- **Commands:**
  - `/github:resolve-review-comments` - Address any valid, outstanding pull request (PR) review comments

**Installation:**

```bash
/plugin install github@boneskull-plugins
```

### refactor

[📖 Plugin README](plugins/refactor/README.md)

**Category:** development

General-purpose software development refactoring and reorganization.

**Contains:**

- **Commands:**
  - `/refactor:simplify` - Simplify and refactor code to improve readability and maintainability
- **Agents:**
  - `code-simplifier` - Expert refactoring specialist that improves code clarity, reduces complexity, and enhances maintainability while preserving behavior and public APIs

**Installation:**

```bash
/plugin install refactor@boneskull-plugins
```

### tools

[📖 Plugin README](plugins/tools/README.md)

**Category:** development

Skills and documentation for various CLI, development, and language-specific tools.

**Contains:**

- **Skills:**
  - `git-commit-messages` - Format git commit messages correctly, avoiding HEREDOC syntax issues in favor of multiline strings (145 lines)
  - `git-directory-management` - Manage git-tracked directories correctly - never create .gitkeep files in directories that will immediately contain tracked files (209 lines)
- **Commands:**
  - `/tools:apply-template` - Retroactively apply configuration and dev dependencies from [boneskull/boneskull-template](https://github.com/boneskull/boneskull-template) to an existing project
- **Hooks:**
  - PostToolUse hooks configured (ESLint auto-fix on Write/Edit operations)

**Installation:**

```bash
/plugin install tools@boneskull-plugins
```

### xstate

[📖 Plugin README](plugins/xstate/README.md)

**Category:** development

XState v5 backend state management with comprehensive state machine patterns, actor testing, and server-side orchestration.

**Contains:**

- **Skills:**
  - `xstate-v5` - Expert guidance for implementing and analyzing XState v5 state machines with TypeScript support and best practices (160 lines main, 3,182 lines references)
  - `xstate-audition` - Expert guidance on testing XState v5 Actors using xstate-audition library for comprehensive state machine and actor testing (386 lines main, 2,146 lines references)
- **Commands:**
  - `/xstate:xstate` - Get expert guidance on XState v5 state machines and actor model implementation
  - `/xstate:audition` - Get expert guidance on testing XState v5 actors with xstate-audition

**Installation:**

```bash
/plugin install xstate@boneskull-plugins
```

### skill-activation

[📖 Plugin README](plugins/skill-activation/README.md)

**Category:** workflow

Centralized skill activation system that automatically suggests relevant skills from installed plugins based on user prompts and file context.

**Contains:**

- **Hooks:**
  - UserPromptSubmit hooks configured (automatic skill suggestion system)

**Installation:**

```bash
/plugin install skill-activation@boneskull-plugins
```

### zod

[📖 Plugin README](plugins/zod/README.md)

**Category:** development

Comprehensive guidance for using Zod v4 with breaking changes from v3. Provides migration patterns, API reference, and common validation patterns.

**Contains:**

- **Skills:**
  - `zod-v4` - Expert guidance on Zod v4 validation library including breaking changes from v3, migration patterns, core API usage, and common validation patterns (127 lines main, 1,486 lines references)

**Installation:**

```bash
/plugin install zod@boneskull-plugins
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

## Acknowledgements

- [Nick Nisi's claude-plugins](https://github.com/nicknisi/claude-plugins) - I stole some code and ideas from his repo. Thanks, Nick!
- [Claude Code Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase) - Provided the groundwork for the [skill-activation](plugins/skill-activation/README.md) plugin.

## License

[Blue Oak Model License 1.0.0](LICENSE)

All plugins in this repository are licensed under the Blue Oak Model License 1.0.0, a modern permissive open source license.
