# Tools Plugin Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a new Claude plugin to collect skills and documentation for various tools (CLI, development, and language-specific).

**Architecture:** Minimal plugin structure following the bupkis pattern with self-documenting README, empty skills directory awaiting future tool skills, and proper marketplace integration.

**Tech Stack:** JSON for metadata, Markdown for documentation, Git symlinks for license

---

## Task 1: Create Plugin Directory Structure

**Files:**

- Create: `plugins/tools/`
- Create: `plugins/tools/.claude-plugin/`
- Create: `plugins/tools/skills/`

**Step 1: Create the base plugin directory**

```bash
mkdir -p plugins/tools
```

**Step 2: Verify directory created**

Run: `ls -la plugins/ | grep tools`
Expected: `drwxr-xr-x ... tools`

**Step 3: Create the .claude-plugin subdirectory**

```bash
mkdir -p plugins/tools/.claude-plugin
```

**Step 4: Verify .claude-plugin directory created**

Run: `ls -la plugins/tools/ | grep .claude-plugin`
Expected: `drwxr-xr-x ... .claude-plugin`

**Step 5: Create the empty skills directory**

```bash
mkdir -p plugins/tools/skills
```

**Step 6: Verify skills directory created**

Run: `ls -la plugins/tools/ | grep skills`
Expected: `drwxr-xr-x ... skills`

**Step 7: Commit directory structure**

```bash
git add plugins/tools/.claude-plugin/.gitkeep plugins/tools/skills/.gitkeep
git commit -m "feat(tools): create plugin directory structure

Add base directories for new tools plugin.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

Note: Git doesn't track empty directories, so we need .gitkeep files.

---

## Task 2: Create Plugin Metadata

**Files:**

- Create: `plugins/tools/.claude-plugin/plugin.json`

**Step 1: Write plugin.json**

Create `plugins/tools/.claude-plugin/plugin.json` with this content:

```json
{
  "name": "tools",
  "version": "1.0.0",
  "description": "Skills and documentation for various CLI, development, and language-specific tools",
  "author": {
    "name": "boneskull"
  },
  "license": "BlueOak-1.0.0",
  "keywords": ["tools", "cli", "documentation", "reference", "best-practices"]
}
```

**Step 2: Verify JSON is valid**

Run: `cat plugins/tools/.claude-plugin/plugin.json | jq .`
Expected: Formatted JSON output without errors

**Step 3: Commit plugin metadata**

```bash
git add plugins/tools/.claude-plugin/plugin.json
git commit -m "feat(tools): add plugin metadata

Define tools plugin with name, version, and description.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create Plugin README

**Files:**

- Create: `plugins/tools/README.md`

**Step 1: Write comprehensive README**

Create `plugins/tools/README.md` with this content:

````markdown
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
````

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

```
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

## Future Skills

Skills will be added incrementally as needed. Each tool will follow the structure and conventions documented above.

## License

[Blue Oak Model License 1.0.0](../../LICENSE)

````

**Step 2: Verify README created**

Run: `wc -l plugins/tools/README.md`
Expected: Line count > 50

**Step 3: Commit README**

```bash
git add plugins/tools/README.md
git commit -m "docs(tools): add self-documenting README

Document plugin purpose, skill naming conventions, structure
pattern, and progressive disclosure approach.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
````

---

## Task 4: Create LICENSE Symlink

**Files:**

- Create: `plugins/tools/LICENSE` (symlink to `../../LICENSE`)

**Step 1: Create symlink to repository LICENSE**

```bash
cd plugins/tools && ln -s ../../LICENSE LICENSE && cd ../..
```

**Step 2: Verify symlink created**

Run: `ls -la plugins/tools/LICENSE`
Expected: `lrwxr-xr-x ... LICENSE -> ../../LICENSE`

**Step 3: Verify symlink resolves correctly**

Run: `head -1 plugins/tools/LICENSE`
Expected: Output showing license content (not an error)

**Step 4: Commit LICENSE symlink**

```bash
git add plugins/tools/LICENSE
git commit -m "chore(tools): add LICENSE symlink

Link to repository root license file.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Update Marketplace Catalog

**Files:**

- Modify: `.claude-plugin/marketplace.json:34-35`

**Step 1: Add tools plugin entry to marketplace.json**

Edit `.claude-plugin/marketplace.json` and add this entry to the `plugins` array (after the bupkis entry):

```json
{
  "name": "tools",
  "source": "./plugins/tools",
  "description": "Skills and documentation for various CLI, development, and language-specific tools",
  "version": "1.0.0",
  "author": {
    "name": "boneskull"
  },
  "category": "development",
  "tags": ["tools", "cli", "documentation", "reference"],
  "strict": true
}
```

**Step 2: Verify JSON is still valid**

Run: `cat .claude-plugin/marketplace.json | jq .`
Expected: Formatted JSON output without errors

**Step 3: Verify tools entry exists**

Run: `jq '.plugins[] | select(.name == "tools")' .claude-plugin/marketplace.json`
Expected: JSON object for tools plugin

**Step 4: Commit marketplace update**

```bash
git add .claude-plugin/marketplace.json
git commit -m "feat(marketplace): add tools plugin to catalog

Register tools plugin in marketplace with version 1.0.0.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Update Repository README

**Files:**

- Modify: `README.md:27-48`

**Step 1: Add tools plugin section to README**

Edit `README.md` and add this section after the bupkis section (around line 27):

````markdown
### tools

Skills and documentation for various CLI, development, and language-specific tools.

- **Skills**: One skill per tool (to be added incrementally)
- **Category**: Development/Tools

Learn best practices and common patterns for the tools you use every day.

#### Installing the Tools Plugin

```bash
/plugin install tools@boneskull-plugins
```
````

````

**Step 2: Verify README updated**

Run: `grep -A 8 "^### tools" README.md`
Expected: The tools section content

**Step 3: Commit README update**

```bash
git add README.md
git commit -m "docs: add tools plugin to README

Document the new tools plugin in the main README.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
````

---

## Task 7: Verify Complete Plugin Structure

**Files:**

- Verify: All files created correctly

**Step 1: Verify directory tree structure**

Run: `tree plugins/tools -a`
Expected output:

```
plugins/tools
├── .claude-plugin
│   └── plugin.json
├── LICENSE -> ../../LICENSE
├── README.md
└── skills
```

**Step 2: Verify all files are tracked by git**

Run: `git status`
Expected: "nothing to commit, working tree clean"

**Step 3: Verify marketplace entry**

Run: `jq '.plugins | length' .claude-plugin/marketplace.json`
Expected: `3` (example-plugin, bupkis, tools)

**Step 4: Run formatter to ensure consistency**

```bash
npm run format
```

**Step 5: Verify formatting didn't change anything**

Run: `git diff`
Expected: No output (no changes)

**Step 6: Create final verification commit if formatting changed anything**

```bash
git add -A
git commit -m "style: format code with prettier

Apply consistent formatting to all files.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Directory `plugins/tools/` exists
- [ ] File `plugins/tools/.claude-plugin/plugin.json` exists with valid JSON
- [ ] Directory `plugins/tools/skills/` exists (empty)
- [ ] File `plugins/tools/README.md` exists with comprehensive documentation
- [ ] Symlink `plugins/tools/LICENSE` points to `../../LICENSE`
- [ ] Marketplace file `.claude-plugin/marketplace.json` includes tools entry
- [ ] Repository `README.md` documents the tools plugin
- [ ] All files formatted with Prettier
- [ ] All changes committed to git
- [ ] Working tree is clean

---

## Next Steps

After implementation:

1. Merge the feature branch into main
2. Tag the release with version 1.0.0
3. Add individual tool skills incrementally as needed

The plugin is now ready to collect tool skills following the documented structure and conventions.
