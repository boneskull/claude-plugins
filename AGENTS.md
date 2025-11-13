# AGENTS.md

This file provides guidance to Claude Code when working with this repository.

## Repository Overview

**What:** Personal marketplace of Claude Code plugins (monorepo)
**Purpose:** Collection of reusable plugins demonstrating skills, commands, agents, hooks, and MCP servers
**License:** Blue Oak Model License 1.0.0
**Current plugins:** example-plugin (full demo), bupkis (testing patterns), tools (CLI tools), github (workflows)

---

## Quick Start

```bash
# Install dependencies
npm install

# Format code
npm run format

# Build MCP servers (if needed)
cd plugins/example-plugin && npm install && npm run build

# Install marketplace locally
/plugin marketplace add /path/to/claude-plugins

# Install a plugin
/plugin install example-plugin@boneskull-plugins
```

---

## Architecture

### Plugin Structure

Every plugin follows this pattern:

```text
plugins/<plugin-name>/
├── .claude-plugin/plugin.json   # REQUIRED: Plugin metadata
├── skills/<name>/SKILL.md       # Auto-invoked capabilities
├── commands/<name>.md           # Slash commands (user-triggered)
├── agents/<name>.md             # Specialized subagents
├── hooks/hooks.json             # Lifecycle event handlers
├── src/                         # MCP server (TypeScript)
├── .mcp.json                    # MCP configuration
└── README.md
```

Plugins can include **any combination** of components - mix and match as needed.

### Key Concepts

#### 1. Progressive Disclosure (CRITICAL)

Keep `SKILL.md` files under 500 lines. Move detailed content to `references/` subdirectory.

```text
skills/<skill-name>/
├── SKILL.md              # Core patterns only (< 500 lines)
└── references/           # Detailed docs (loaded on-demand)
    ├── api_reference.md
    └── common_patterns.md
```

**Real example (bupkis):** Main skill 308 lines, references 2,080 lines = 6.7x token savings.

#### 2. Plugin Composition

- **Skills only:** `bupkis` plugin
- **Commands only:** `github` plugin
- **Full suite:** `example-plugin` (has everything)
- **Empty structure:** `tools` plugin (YAGNI applied)

#### 3. MCP Servers

TypeScript servers providing external tools. Must be built before use:

```bash
cd plugins/<plugin>
npm run build    # TypeScript → dist/index.js
```

Config in `.mcp.json`:

```json
{
  "mcpServers": {
    "example-mcp": {
      "command": "node",
      "args": ["dist/index.js"]
    }
  }
}
```

---

## Development Workflow

### Commands

```bash
npm run format              # Format with Prettier
npm run format:check        # Check formatting (CI)
cd plugins/<plugin>
npm run build               # Build MCP server
```

### Git Commits

**Format (enforced):** `<type>[scope]: <description>`

```bash
git commit -m "feat(github): add github plugin"
git commit -m "fix: resolve hook path issue"
git commit -m "docs: update README"
```

Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`

**Releases:** Automated by release-please (don't manually edit CHANGELOG.md or version numbers).

### Git Worktrees

Used for parallel development:

```bash
git worktree add .worktrees/<branch> -b <branch>
cd .worktrees/<branch>
```

---

## Code Style

### Naming Conventions

| Entity               | Convention           | Example          |
| -------------------- | -------------------- | ---------------- |
| Plugin directories   | kebab-case           | `example-plugin` |
| Skill files          | SKILL.md (uppercase) | `SKILL.md`       |
| Command/agent files  | kebab-case.md        | `analyze.md`     |
| TypeScript variables | camelCase            | `serverName`     |
| TypeScript classes   | PascalCase           | `ExampleServer`  |

### Formatting

- **Prettier:** Semicolons required, single quotes
- **EditorConfig:** 2 spaces, LF line endings, UTF-8
- **TypeScript:** Strict mode, ES2022, ES modules with `.js` extensions in imports

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
```

### YAML Frontmatter

**Skills:**

```yaml
---
name: skill-name
description: When to use this skill (max 1024 chars)
---
```

**Commands:**

```yaml
---
description: Brief description
argument-hint: param-name
---
```

**Agents:**

```yaml
---
name: agent-name
description: Agent capabilities
tools: Read, Grep, Glob, Bash
model: sonnet
---
```

---

## Critical Gotchas

### 1. Progressive Disclosure is Mandatory

**Problem:** Large skills (>500 lines) overwhelm Claude's context window.
**Solution:** Keep SKILL.md concise, move details to `references/`.
**Evidence:** bupkis plugin loads 308 lines initially vs 2,080 total (6.7x reduction).

### 2. Hook Paths are Relative to Plugin Root

**Problem:** "Most common issue according to docs" - hooks fail silently.
**Solution:** Paths in `hooks.json` are relative to plugin root. Test manually:

```bash
bash plugins/<plugin>/hooks/scripts/<script>.sh
```

### 3. MCP Servers Must Be Built

**Problem:** `.mcp.json` points to `dist/index.js` (built output), not `src/`.
**Solution:** Always run `npm run build` after changes. Runtime errors if not built.

### 4. No Tests Yet

Current state: `"test": "exit 0"` (placeholder). Project is 4 days old, mostly Markdown content.

### 5. Design Documents Are Reference Material

Check `docs/plans/` for historical context. All features start with design docs.

### 6. Review Comments vs Issue Comments

GitHub plugin gotcha: Use `in_reply_to` for review threads, NOT issue comments.

### 7. Tool Restrictions Show Intent

`example-agent` has NO Write/Edit access (read-only). Shows how to create specialized agents.

---

## Common Issues

**MCP server not found:**

```bash
cd plugins/<plugin> && npm install && npm run build
ls dist/index.js  # Verify build output
```

**Hook not executing:**

```bash
ls -la plugins/<plugin>/hooks/scripts/<script>.sh  # Check path
chmod +x plugins/<plugin>/hooks/scripts/<script>.sh  # Add permission
```

**Skill not activating:**
Check YAML frontmatter - description must be specific and action-oriented.

**Prettier check failing:**

```bash
npm run format
git commit -m "style: format code with prettier"
```

**Commit rejected:**
Use format: `<type>: <description>` (conventional commits enforced).

---

## Project Structure

```text
claude-plugins/
├── .claude-plugin/marketplace.json    # Plugin catalog
├── plugins/
│   ├── example-plugin/               # Full demo (all components)
│   ├── bupkis/                       # Testing patterns skill
│   ├── tools/                        # CLI tools (YAGNI structure)
│   └── github/                       # GitHub workflow commands
├── docs/
│   ├── DEVELOPMENT.md                # Development guide
│   └── plans/                        # Design documents
├── .github/workflows/                # CI: lint, commitlint, release
├── package.json                      # Root dev tooling
└── .editorconfig, .prettierignore   # Code style configs
```

**Key patterns:**

- Monorepo with independent plugins
- Shared dev tooling at root (Prettier, Husky, Commitlint)
- Design-first development (docs/plans/)
- Automated releases (release-please)
- Dependency automation (Renovate)

---

## Plugin Development

### Creating a Plugin

1. Create directory: `plugins/<name>/`
2. Create manifest: `.claude-plugin/plugin.json`
3. Add components (skills, commands, agents, hooks, MCP)
4. Register in marketplace: `.claude-plugin/marketplace.json`
5. Write README

### Creating a Skill

1. Create: `plugins/<plugin>/skills/<name>/SKILL.md`
2. Add YAML frontmatter (name, description)
3. Keep under 500 lines
4. Move detailed docs to `references/`
5. Use ✅/❌ comparison pattern for examples

### Creating an MCP Server

1. Create TypeScript source in `src/`
2. Configure `tsconfig.json` (strict mode, ES2022)
3. Define tools with JSON Schema
4. Build: `npm run build`
5. Configure `.mcp.json` pointing to `dist/index.js`

**Error handling pattern:**

```typescript
try {
  return { content: [{ type: 'text', text: result }] };
} catch (error) {
  const msg = error instanceof Error ? error.message : 'Unknown error';
  return { content: [{ type: 'text', text: `Error: ${msg}` }], isError: true };
}
```

---

## Resources

**Internal:**

- Development guide: `docs/DEVELOPMENT.md`
- Design documents: `docs/plans/`
- Example plugin: `plugins/example-plugin/` (canonical reference)

**External:**

- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins)
- [MCP Documentation](https://modelcontextprotocol.io/)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

## Tips

1. **Use example-plugin as reference** - demonstrates every capability
2. **Check design docs** (`docs/plans/`) for context
3. **Test locally** with `/plugin marketplace add /path/to/claude-plugins`
4. **Use git worktrees** for parallel development
5. **Leverage automation** - releases and dependencies are automated
6. **Remember**: SKILL.md < 500 lines, MCP servers need building, hook paths are relative

---

**Maintainer:** @boneskull
**Version:** 0.1.0
**Last Updated:** 2025-11-13
