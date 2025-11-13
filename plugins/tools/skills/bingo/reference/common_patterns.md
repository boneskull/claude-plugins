# Bingo Common Patterns

Detailed examples and patterns for common Bingo workflows.

## Project Creation Patterns

### TypeScript Application

**Full-featured TypeScript app with all tooling:**

```bash
npx bingo typescript-app my-app --packageManager pnpm
cd my-app
```

**What you get:**

- TypeScript configuration (tsconfig.json)
- ESLint + Prettier
- Vitest for testing
- Package scripts configured
- Git repository initialized

**Next steps:**

```bash
pnpm install    # Install dependencies (if skipped)
pnpm test       # Run tests
pnpm dev        # Start development
```

### Minimal Setup

**Quick project without prompts:**

```bash
npx bingo typescript-app --skipInstall --defaults
```

Generates project with default settings, no dependency installation.

### Custom Package Manager

**Using different package managers:**

```bash
# pnpm (faster, space-efficient)
npx bingo typescript-app --packageManager pnpm

# yarn (classic workflow)
npx bingo typescript-app --packageManager yarn

# npm (default, widely supported)
npx bingo typescript-app --packageManager npm
```

## Update Patterns

### Safe Update with Preview

**Always preview before applying:**

```bash
# Step 1: Preview changes
npx bingo update --dry-run

# Step 2: Review diff, check for conflicts

# Step 3: Apply if safe
npx bingo update
```

### Handling Merge Conflicts

**If updates conflict with customizations:**

1. Preview with `--dry-run`
2. Note conflicting files
3. Backup custom changes
4. Apply update
5. Manually resolve conflicts
6. Test thoroughly

```bash
# Backup strategy
git stash      # Stash local changes
npx bingo update
git stash pop  # Restore and merge
```

### Continuous Updates

**Keep multiple projects current:**

```bash
#!/bin/bash
# update-all.sh - Update all bingo projects

for dir in */; do
  if [ -f "$dir/.bingo" ]; then
    echo "Updating $dir..."
    cd "$dir"
    npx bingo update --dry-run
    read -p "Apply? (y/n) " -n 1 -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      npx bingo update
    fi
    cd ..
  fi
done
```

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

```bash
# Skip install, do manually
npx bingo typescript-app --skipInstall
cd my-app

# Try different package manager
pnpm install
# or
yarn install
# or
npm install
```

### Update Conflicts

**Template updates conflict with custom changes:**

```bash
# Preview changes
npx bingo update --dry-run > update-diff.txt

# Review diff
cat update-diff.txt

# Backup customizations
git branch backup-before-update

# Apply update
npx bingo update

# If conflicts occur
git diff  # See what changed
# Resolve manually
```

### Permission Issues

**npx fails with permissions:**

```bash
# Use explicit npm registry
npx --registry=https://registry.npmjs.org bingo typescript-app

# Or install globally (not recommended)
npm install -g create-bingo
bingo typescript-app
```

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
