# Bingo Skill Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create a skill documenting Bingo template management tool with task-oriented patterns and progressive disclosure.

**Architecture:** Progressive disclosure pattern with main SKILL.md containing common task patterns and reference/ directory with detailed documentation loaded on-demand.

**Tech Stack:** Markdown, YAML frontmatter

---

## Task 1: Create Skill Directory Structure

**Files:**

- Create: `plugins/tools/skills/bingo/`
- Create: `plugins/tools/skills/bingo/reference/`

**Step 1: Create base skill directory**

```bash
mkdir -p plugins/tools/skills/bingo
```

**Step 2: Verify directory created**

Run: `ls -la plugins/tools/skills/ | grep bingo`
Expected: `drwxr-xr-x ... bingo`

**Step 3: Create reference subdirectory**

```bash
mkdir -p plugins/tools/skills/bingo/reference
```

**Step 4: Verify reference directory created**

Run: `ls -la plugins/tools/skills/bingo/ | grep reference`
Expected: `drwxr-xr-x ... reference`

**Step 5: Commit directory structure**

```bash
git add plugins/tools/skills/bingo/.gitkeep plugins/tools/skills/bingo/reference/.gitkeep
git commit -m "feat(tools): create bingo skill directory structure" -m "Add base directories for bingo skill with reference subdirectory." -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create Main SKILL.md

**Files:**

- Create: `plugins/tools/skills/bingo/SKILL.md`

**Step 1: Write SKILL.md with YAML frontmatter and content**

Create `plugins/tools/skills/bingo/SKILL.md` with this content:

````markdown
---
name: bingo
description: Template management for web repositories - creating projects, applying updates, and managing configurations
---

# Bingo: Template Management Tool

Bingo streamlines repository creation and maintenance using customizable templates. Create fully-configured projects and keep them updated with automated transitions.

## Quick Start

Create a new TypeScript app:

\```bash
npx bingo typescript-app
\```

Bingo will prompt for customization options and generate a complete project with tooling configured.

## Common Tasks

### Creating a New Project

**Scenario**: Start a new project from a template

\```bash

# Basic usage with default template

npx bingo typescript-app

# Choose package manager

npx bingo typescript-app --packageManager pnpm

# Specify project directory

npx bingo typescript-app my-project-name
\```

**What happens:**

- Bingo prompts for configuration options
- Generates project with selected tooling
- Installs dependencies
- Sets up git repository

See `reference/common_patterns.md` for more creation scenarios.

### Updating Project from Template

**Scenario**: Apply template updates to an existing project

\```bash

# Update to latest template version

npx bingo update

# Preview changes without applying

npx bingo update --dry-run
\```

**What happens:**

- Bingo detects your template
- Applies updates while preserving customizations
- Shows diff of changes
- Updates dependencies

Template updates maintain your project-specific configurations.

### Choosing a Template

**Available templates:**

- `typescript-app` - TypeScript application with full tooling
- More templates available - see `reference/templates.md`

**Selection criteria:**

- Project type (app, library, etc.)
- Language preference
- Tooling requirements

See `reference/templates.md` for detailed template comparison.

## When to Use What

| Task            | Command                      | When                    |
| --------------- | ---------------------------- | ----------------------- |
| New project     | `npx bingo <template>`       | Starting from scratch   |
| Update existing | `npx bingo update`           | Keeping project current |
| Preview changes | `npx bingo update --dry-run` | Before applying updates |
| Custom options  | Interactive prompts          | During creation         |

## Package Manager Support

Bingo supports multiple package managers:

- npm (default)
- pnpm (`--packageManager pnpm`)
- yarn (`--packageManager yarn`)

Specify during creation or Bingo detects from existing project.

## Key Benefits

- **Eliminate setup friction**: Pre-configured tooling
- **Stay current**: Automated template updates
- **Preserve customizations**: Updates respect your changes
- **Consistency**: Same tooling across projects

## Progressive Disclosure

For detailed information:

- **Command reference**: `reference/README.md`
- **Extended examples**: `reference/common_patterns.md`
- **Template details**: `reference/templates.md`

## Maintainer

Created by Josh Goldberg • [GitHub](https://github.com/JoshuaKGoldberg/create)
\```

**Step 2: Verify SKILL.md created**

Run: `wc -l plugins/tools/skills/bingo/SKILL.md`
Expected: Line count > 80

**Step 3: Verify YAML frontmatter**

Run: `head -5 plugins/tools/skills/bingo/SKILL.md`
Expected: See `---` lines with name and description

**Step 4: Commit SKILL.md**

```bash
git add plugins/tools/skills/bingo/SKILL.md
git commit -m "feat(tools): add bingo skill main documentation" -m "Document common Bingo usage patterns with task-oriented organization." -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```
````

---

## Task 3: Create Command Reference

**Files:**

- Create: `plugins/tools/skills/bingo/reference/README.md`

**Step 1: Write command reference**

Create `plugins/tools/skills/bingo/reference/README.md` with this content:

````markdown
# Bingo Command Reference

Complete reference for Bingo CLI commands and options.

## Installation

Bingo is used via npx (no installation required):

\```bash
npx bingo <template> [options]
\```

## Commands

### Create New Project

\```bash
npx bingo <template> [directory] [options]
\```

**Arguments:**

- `<template>` - Template name (required)
- `[directory]` - Project directory (optional, defaults to current directory)

**Options:**

- `--packageManager <manager>` - Package manager to use (npm, pnpm, yarn)
- `--skipInstall` - Skip dependency installation
- `--skipGit` - Skip git repository initialization

**Examples:**

\```bash

# Create in current directory

npx bingo typescript-app

# Create in specific directory

npx bingo typescript-app my-app

# Use pnpm

npx bingo typescript-app --packageManager pnpm

# Skip installation for manual setup

npx bingo typescript-app --skipInstall
\```

### Update Existing Project

\```bash
npx bingo update [options]
\```

**Options:**

- `--dry-run` - Preview changes without applying
- `--force` - Apply updates without confirmation

**Examples:**

\```bash

# Interactive update with preview

npx bingo update

# Preview changes only

npx bingo update --dry-run

# Force update without prompts

npx bingo update --force
\```

## Return Codes

- `0` - Success
- `1` - Error (command failed, invalid options, etc.)

## Environment Variables

- `BINGO_PACKAGE_MANAGER` - Default package manager
- `BINGO_SKIP_INSTALL` - Skip installation by default

## Output

Bingo provides:

- Progress indicators during generation
- Diff previews for updates
- Confirmation prompts for destructive operations
- Success messages with next steps

## Interactive Mode

When creating projects, Bingo prompts for:

- Project metadata (name, description, author)
- Tooling choices (linters, formatters, test frameworks)
- Configuration options (strict mode, coverage thresholds)

Prompts adapt based on template and previous selections.
\```

**Step 2: Verify README.md created**

Run: `wc -l plugins/tools/skills/bingo/reference/README.md`
Expected: Line count > 60

**Step 3: Commit command reference**

```bash
git add plugins/tools/skills/bingo/reference/README.md
git commit -m "docs(tools): add bingo command reference" -m "Complete command syntax and options reference." -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```
````

---

## Task 4: Create Common Patterns Documentation

**Files:**

- Create: `plugins/tools/skills/bingo/reference/common_patterns.md`

**Step 1: Write common patterns**

Create `plugins/tools/skills/bingo/reference/common_patterns.md` with this content:

````markdown
# Bingo Common Patterns

Detailed examples and patterns for common Bingo workflows.

## Project Creation Patterns

### TypeScript Application

**Full-featured TypeScript app with all tooling:**

\```bash
npx bingo typescript-app my-app --packageManager pnpm
cd my-app
\```

**What you get:**

- TypeScript configuration (tsconfig.json)
- ESLint + Prettier
- Vitest for testing
- Package scripts configured
- Git repository initialized

**Next steps:**
\```bash
pnpm install # Install dependencies (if skipped)
pnpm test # Run tests
pnpm dev # Start development
\```

### Minimal Setup

**Quick project without prompts:**

\```bash
npx bingo typescript-app --skipInstall --defaults
\```

Generates project with default settings, no dependency installation.

### Custom Package Manager

**Using different package managers:**

\```bash

# pnpm (faster, space-efficient)

npx bingo typescript-app --packageManager pnpm

# yarn (classic workflow)

npx bingo typescript-app --packageManager yarn

# npm (default, widely supported)

npx bingo typescript-app --packageManager npm
\```

## Update Patterns

### Safe Update with Preview

**Always preview before applying:**

\```bash

# Step 1: Preview changes

npx bingo update --dry-run

# Step 2: Review diff, check for conflicts

# Step 3: Apply if safe

npx bingo update
\```

### Handling Merge Conflicts

**If updates conflict with customizations:**

1. Preview with `--dry-run`
2. Note conflicting files
3. Backup custom changes
4. Apply update
5. Manually resolve conflicts
6. Test thoroughly

\```bash

# Backup strategy

git stash # Stash local changes
npx bingo update
git stash pop # Restore and merge
\```

### Continuous Updates

**Keep multiple projects current:**

\```bash
#!/bin/bash

# update-all.sh - Update all bingo projects

for dir in \*/; do
if [ -f "$dir/.bingo" ]; then
echo "Updating $dir..."
    cd "$dir"
npx bingo update --dry-run
read -p "Apply? (y/n) " -n 1 -r
if [[$REPLY =~ ^[Yy]$]]; then
npx bingo update
fi
cd ..
fi
done
\```

## Migration Patterns

### Adopting Bingo in Existing Project

**Converting existing project to Bingo template:**

Not directly supported - Bingo is for new projects or projects already using Bingo templates.

**Workaround:**

1. Create fresh Bingo project
2. Copy source files to new project
3. Merge configurations manually
4. Test thoroughly

### Template Transitions

**Switching between templates:**

Bingo preserves template identity - switching templates not supported after creation.

**Alternative:**

- Create new project with desired template
- Migrate code manually
- Consider if template customization achieves goal instead

## Troubleshooting Patterns

### Installation Failures

**Dependencies fail to install:**

\```bash

# Skip install, do manually

npx bingo typescript-app --skipInstall
cd my-app

# Try different package manager

pnpm install

# or

yarn install

# or

npm install
\```

### Update Conflicts

**Template updates conflict with custom changes:**

\```bash

# Preview changes

npx bingo update --dry-run > update-diff.txt

# Review diff

cat update-diff.txt

# Backup customizations

git branch backup-before-update

# Apply update

npx bingo update

# If conflicts occur

git diff # See what changed

# Resolve manually

\```

### Permission Issues

**npx fails with permissions:**

\```bash

# Use explicit npm registry

npx --registry=https://registry.npmjs.org bingo typescript-app

# Or install globally (not recommended)

npm install -g create-bingo
bingo typescript-app
\```

## Best Practices

### Project Creation

1. **Use descriptive directory names**
   - `my-typescript-app` ✓
   - `project1` ✗

2. **Choose package manager early**
   - Consistent across team
   - Match deployment environment

3. **Review generated configuration**
   - Understand what's included
   - Customize before first commit

### Template Updates

1. **Update regularly**
   - Monthly or quarterly
   - Before major feature work

2. **Preview first**
   - Always use `--dry-run`
   - Review changes carefully

3. **Test after updates**
   - Run full test suite
   - Check build process
   - Verify CI/CD pipeline

### Team Workflows

1. **Document template choices**
   - Why this template?
   - What customizations made?
   - Track in project README

2. **Coordinate updates**
   - Update together, not individually
   - Agree on update schedule
   - Share preview results

3. **Preserve customizations**
   - Document custom configurations
   - Use version control
   - Review updates for conflicts
     \```

**Step 2: Verify common_patterns.md created**

Run: `wc -l plugins/tools/skills/bingo/reference/common_patterns.md`
Expected: Line count > 150

**Step 3: Commit common patterns**

```bash
git add plugins/tools/skills/bingo/reference/common_patterns.md
git commit -m "docs(tools): add bingo common patterns" -m "Detailed examples and workflow patterns for Bingo usage." -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```
````

---

## Task 5: Create Templates Documentation

**Files:**

- Create: `plugins/tools/skills/bingo/reference/templates.md`

**Step 1: Write templates documentation**

Create `plugins/tools/skills/bingo/reference/templates.md` with this content:

````markdown
# Bingo Templates

Guide to available Bingo templates and their features.

## Available Templates

### typescript-app

**Full-featured TypeScript application template**

**Includes:**

- TypeScript (latest version)
- ESLint with recommended rules
- Prettier for formatting
- Vitest for testing
- Package scripts
- Git repository
- Comprehensive tsconfig.json

**Best for:**

- New TypeScript projects
- Applications (not libraries)
- Projects needing complete tooling

**Creation:**
\```bash
npx bingo typescript-app
\```

**Generated structure:**
\```
my-app/
├── src/
│ └── index.ts
├── tests/
│ └── index.test.ts
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
└── README.md
\```

## Template Comparison

| Feature       | typescript-app |
| ------------- | -------------- |
| TypeScript    | ✓              |
| ESLint        | ✓              |
| Prettier      | ✓              |
| Testing       | Vitest         |
| Documentation | ✓              |
| CI/CD         | Optional       |

## Customization Options

During creation, templates prompt for:

### typescript-app Customizations

**Project metadata:**

- Name
- Description
- Author
- License

**Tooling choices:**

- Strict TypeScript mode
- ESLint rules (recommended/strict)
- Test coverage thresholds
- Git hooks (Husky)

**Build options:**

- Bundle (esbuild, tsup, etc.)
- Target environment
- Source maps

## Template Selection Guide

### Choose typescript-app when:

- Starting new TypeScript project
- Need complete tooling setup
- Want automated updates
- Building application (not library)

### Consider alternatives when:

- Building library (may need different template)
- Using different language
- Minimal tooling needed
- Very specific requirements

## Template Updates

Templates receive updates for:

- Dependency version bumps
- New tooling improvements
- Security patches
- Configuration optimizations

**Update process:**
\```bash
npx bingo update
\```

Updates preserve:

- Project-specific code
- Custom configurations
- Additional dependencies
- Manual modifications

## Template Customization Philosophy

Bingo templates balance:

- **Completeness**: Include necessary tooling
- **Flexibility**: Allow customization
- **Maintainability**: Easy to update
- **Best practices**: Follow conventions

**What templates DON'T include:**

- Application-specific logic
- Custom business rules
- Proprietary configurations
- Heavy frameworks (by default)

## Future Templates

Templates under consideration:

- JavaScript app
- TypeScript library
- Monorepo structure
- Framework-specific templates

Check [Bingo repository](https://github.com/JoshuaKGoldberg/create) for latest templates.
\```

**Step 2: Verify templates.md created**

Run: `wc -l plugins/tools/skills/bingo/reference/templates.md`
Expected: Line count > 100

**Step 3: Commit templates documentation**

```bash
git add plugins/tools/skills/bingo/reference/templates.md
git commit -m "docs(tools): add bingo templates reference" -m "Document available templates and selection guidance." -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```
````

---

## Task 6: Format and Verify

**Files:**

- Verify: All created files

**Step 1: Run Prettier formatter**

```bash
npm run format
```

**Step 2: Verify formatting didn't break YAML**

Run: `head -5 plugins/tools/skills/bingo/SKILL.md`
Expected: Valid YAML frontmatter with `---` delimiters

**Step 3: Verify skill directory structure**

Run: `tree plugins/tools/skills/bingo -a`
Expected output:

```
plugins/tools/skills/bingo
├── SKILL.md
└── reference
    ├── README.md
    ├── common_patterns.md
    └── templates.md

2 directories, 4 files
```

**Step 4: Verify all files exist**

Run: `ls -1 plugins/tools/skills/bingo/reference/`
Expected:

```
README.md
common_patterns.md
templates.md
```

**Step 5: Commit formatting changes if any**

```bash
git add -A
git commit -m "style: format bingo skill documentation" -m "Apply consistent formatting to all files." -m "🤖 Generated with [Claude Code](https://claude.com/claude-code)" -m "Co-Authored-By: Claude <noreply@anthropic.com>"
```

Note: Only commit if git diff shows changes. Skip if working tree is clean.

---

## Verification Checklist

After completing all tasks, verify:

- [ ] Directory `plugins/tools/skills/bingo/` exists
- [ ] File `plugins/tools/skills/bingo/SKILL.md` exists with valid YAML frontmatter
- [ ] Directory `plugins/tools/skills/bingo/reference/` exists
- [ ] File `plugins/tools/skills/bingo/reference/README.md` exists (command reference)
- [ ] File `plugins/tools/skills/bingo/reference/common_patterns.md` exists (patterns)
- [ ] File `plugins/tools/skills/bingo/reference/templates.md` exists (templates)
- [ ] All files formatted with Prettier
- [ ] All changes committed to git
- [ ] Working tree is clean

---

## Next Steps

After implementation:

1. Test the skill by asking Claude about Bingo usage
2. Verify progressive disclosure works (reference files load on-demand)
3. Update based on actual Bingo usage experience
4. Merge feature branch into main
5. Consider adding more templates as they become available
