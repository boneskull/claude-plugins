# Bingo Command Reference

Complete reference for Bingo CLI commands and options.

## Installation

Bingo is used via npx (no installation required):

```bash
npx bingo <template> [options]
```

## Commands

### Create New Project

```bash
npx bingo <template> [directory] [options]
```

**Arguments:**

- `<template>` - Template name (required)
- `[directory]` - Project directory (optional, defaults to current directory)

**Options:**

- `--packageManager <manager>` - Package manager to use (npm, pnpm, yarn)
- `--skipInstall` - Skip dependency installation
- `--skipGit` - Skip git repository initialization

**Examples:**

```bash
# Create in current directory
npx bingo typescript-app

# Create in specific directory
npx bingo typescript-app my-app

# Use pnpm
npx bingo typescript-app --packageManager pnpm

# Skip installation for manual setup
npx bingo typescript-app --skipInstall
```

### Update Existing Project

```bash
npx bingo update [options]
```

**Options:**

- `--dry-run` - Preview changes without applying
- `--force` - Apply updates without confirmation

**Examples:**

```bash
# Interactive update with preview
npx bingo update

# Preview changes only
npx bingo update --dry-run

# Force update without prompts
npx bingo update --force
```

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
