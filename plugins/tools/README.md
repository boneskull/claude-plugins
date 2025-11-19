# Tools Plugin

Skills and documentation for various CLI, development, and language-specific tools.

## Purpose

This plugin collects skills for the tools you use every day. Each tool gets its own dedicated skill containing:

- Common usage patterns and idioms
- Best practices for effective usage
- Quick reference documentation
- Progressive disclosure for detailed docs

## Installation

From marketplace:

```bash
/plugin install tools@boneskull-plugins
```

## Skill Organization

### Naming Convention

Tool skills follow tool names directly:

- `jq` for jq command-line JSON processor
- `ripgrep` for ripgrep search tool
- `prettier` for Prettier code formatter
- `typescript` for TypeScript compiler

This predictable naming makes skills easy to find.

### Skill Structure

Each tool skill follows this pattern:

```text
skills/<tool-name>/
├── SKILL.md                    # Main skill with YAML frontmatter
└── reference/                  # Optional: progressive disclosure
    ├── README.md               # Quick reference
    ├── common_patterns.md      # Common usage patterns
    └── api_reference.md        # Detailed API docs
```

### Progressive Disclosure Pattern

Skills use reference files for detailed documentation. The main SKILL.md contains essential patterns and guidance. Reference files load on-demand when needed, keeping the main skill focused.

**Example:** See the [bupkis plugin](../bupkis/) for a working example of this pattern.

## Hooks

### ESLint Auto-Fixer

Automatically runs `eslint --fix` on JavaScript and TypeScript files after Write and Edit operations.

**Behavior:**

- Triggers on PostToolUse event for Write/Edit tools
- Processes: `.ts`, `.tsx`, `.js`, `.jsx`, `.cjs`, `.mjs`, `.mts`, `.cts` files
- Auto-fixes formatting and style issues
- Reports unfixable errors to Claude for manual correction
- Skips silently if eslint not available

**Configuration:**

Hook runs automatically when plugin is installed. No additional setup required.

**Supported file extensions:**

- TypeScript: `.ts`, `.tsx`, `.mts`, `.cts`
- JavaScript: `.js`, `.jsx`, `.mjs`, `.cjs`

**Error handling:**

The hook runs `eslint --fix` and reports any remaining errors that require manual intervention:

```text
ESLint found 2 error(s) in component.tsx:
Line 15:7: 'useState' is not defined (no-undef)
Line 23:5: Missing return type on function (explicit-function-return-type)
```

When errors are reported, Claude will see them and can fix them manually.

## Adding New Tool Skills

1. Create directory: `skills/<tool-name>/`
2. Write `SKILL.md` with YAML frontmatter:

   ```yaml
   ---
   name: tool-name
   description: Brief description of what this skill teaches
   ---
   ```

3. Add essential patterns in SKILL.md
4. (Optional) Create `reference/` subdirectory for detailed docs
5. Update this README to list the new skill

## Commands

### apply-template

Retroactively applies configuration and development dependencies from [boneskull-template](https://github.com/boneskull/boneskull-template) to an existing project.

**Usage:**

```bash
/tools:apply-template [target-directory]
```

**What it does:**

- Intelligently merges `package.json` dependencies (chooses newest versions)
- Copies missing configuration files (`.editorconfig`, `eslint.config.js`, etc.)
- Handles `.github/` directory without overwriting existing files
- Never overwrites existing files (except `package.json` which is merged)

**Ignores from template:**

- `docs/plans/`, `src/`, `test/`, `package-lock.json`

**When to use:** Setting up tooling on a new project or updating an existing project to match your standard template configuration.

### finish-worktree

Merges a completed feature branch from a git worktree into main while maintaining linear history.

**Usage:**

```bash
/tools:finish-worktree [main-worktree-path]
```

**What it does:**

- Rebases feature branch onto latest main (resolving conflicts as needed)
- Navigates to main worktree (auto-detects or prompts for path)
- Fast-forwards main to feature branch (maintains linear history)
- Deletes the merged feature branch
- Never creates merge commits

**When to use:** When you've completed work in a git worktree and need to merge it back to main with a clean, linear history.

## Available Skills

### git-commit-messages

Teaches proper git commit message formatting, avoiding HEREDOC syntax issues.

**Key patterns:**

- Use `-m` with multiline strings (not HEREDOC)
- Include Claude Code attribution
- Conventional commit format

**When activated:** When creating git commits with body text, footers, or co-author attribution.

### git-directory-management

Teaches proper git directory management - never create `.gitkeep` files in directories that will immediately contain tracked files.

**Key patterns:**

- `.gitkeep` is ONLY for truly empty directories
- Add actual files directly, not `.gitkeep` first
- Git tracks directories through their files

**When activated:** When creating new directories in a git repository.

## Future Skills

Additional skills will be added incrementally as needed. Each tool will follow the structure and conventions documented above.

## License

[Blue Oak Model License 1.0.0](../../LICENSE)
