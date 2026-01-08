# Claude Plugins _a la_ boneskull

I HAVE PLUGINS HERE. THEY ARE THE BEST PLUGINS OF ALL TIME. I AM LETTING YOU USE THEM.

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

[📖 bupkis Plugin README](plugins/bupkis/README.md)

**Category:** development

Idiomatic assertion patterns for the [Bupkis](https://bupkis.zip) assertion library.

**Contains:**

- **Skills:**
  - `bupkis-assertion-patterns` - How to write idiomatic assertions with the Bupkis assertion library for TypeScript and JavaScript (307 lines main, 2,080 lines references)

**Installation:**

```bash
/plugin install bupkis@boneskull-plugins
```

### claude-watcher

[📖 claude-watcher Plugin README](plugins/claude-watcher/README.md)

**Category:** automation

Event-driven automation daemon for Claude Code. Polls for conditions and executes Claude prompts when triggers fire.

**Contains:**

- **MCP Tools:**
  - `register_watch` - Register a watch with trigger, action prompt, TTL, and polling interval
  - `list_watches` - List all registered watches, optionally filtered by status
  - `watch_status` - Get detailed status of a specific watch by ID
  - `cancel_watch` - Cancel an active watch
  - `list_triggers` - List available trigger executables with their metadata
- **Commands:**
  - `/claude-watcher:watch` - Interactive watch registration helper
- **Bundled Triggers:**
  - `npm-publish` - Check if an npm package version is published
  - `gh-pr-merged` - Check if a GitHub PR has been merged
- **Hooks:**
  - Stop hooks configured (watch results notification on session end)

**Installation:**

```bash
/plugin install claude-watcher@boneskull-plugins
```

### github

[📖 github Plugin README](plugins/github/README.md)

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

[📖 refactor Plugin README](plugins/refactor/README.md)

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

[📖 tools Plugin README](plugins/tools/README.md)

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

[📖 xstate Plugin README](plugins/xstate/README.md)

**Category:** development

[XState v5](https://stately.ai/docs/xstate) backend state management with comprehensive state machine patterns, actor testing, and server-side orchestration.

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

[📖 skill-activation Plugin README](plugins/skill-activation/README.md)

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

[📖 zod Plugin README](plugins/zod/README.md)

**Category:** development

Comprehensive guidance for using the [Zod v4](https://zod.dev/) validation library with breaking changes from v3. Provides migration patterns, API reference, and common validation patterns.

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

This is a monorepo containing multiple plugins. Each plugin is a separate npm package in the `plugins/` directory.

### Quick Start

Clone this repository and run the following commands to get started:

```bash
# install dependencies, run prepare scripts
npm install

# run tests for all plugins
npm test
```

## Acknowledgements

- [Nick Nisi's claude-plugins](https://github.com/nicknisi/claude-plugins) - I stole some code and ideas from his repo. Thanks, Nick!
- [Claude Code Infrastructure Showcase](https://github.com/diet103/claude-code-infrastructure-showcase) - Provided the groundwork for the [skill-activation](plugins/skill-activation/README.md) plugin.

## Resources

- [How to Automate Claude Plugin Versioning with Release Please](https://gist.github.com/boneskull/5028e07534c87d33bdb4431360605fa6) - A guide to automating version bumps and releases of your Claude plugins with [Release Please](https://github.com/googleapis/release-please).

## License

Copyright © 2025 [Christopher "boneskull" Hiller](https://github.com/boneskull). Licensed under the [Blue Oak Model License 1.0.0](LICENSE)
