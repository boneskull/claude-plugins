---
name: bingo
description: Template management for web repositories - creating projects, applying updates, and managing configurations
---

# Bingo: Template Management Tool

Bingo streamlines repository creation and maintenance using customizable templates. Create fully-configured projects and keep them updated with automated transitions.

## Quick Start

Create a new TypeScript app:

```bash
npx bingo typescript-app
```

Bingo will prompt for customization options and generate a complete project with tooling configured.

## Common Tasks

### Creating a New Project

**Scenario**: Start a new project from a template

```bash
# Basic usage with default template
npx bingo typescript-app

# Choose package manager
npx bingo typescript-app --packageManager pnpm

# Specify project directory
npx bingo typescript-app my-project-name
```

**What happens:**

- Bingo prompts for configuration options
- Generates project with selected tooling
- Installs dependencies
- Sets up git repository

See `reference/common_patterns.md` for more creation scenarios.

### Updating Project from Template

**Scenario**: Apply template updates to an existing project

```bash
# Update to latest template version
npx bingo update

# Preview changes without applying
npx bingo update --dry-run
```

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
