---
description: Retroactively apply configuration and dev dependencies from a GitHub template repository to an existing JavaScript/TypeScript project
argument-hint: <org/repo> [target-directory]
---

# /apply-template

## Purpose

Retroactively apply configuration files and development dependencies from a GitHub template repository to an existing JavaScript/TypeScript project, intelligently merging `package.json` and copying missing configuration files.

## Contract

**Inputs:**

- `org/repo` (required) — GitHub repository slug of the template (e.g., `boneskull/boneskull-template`)
- `target-directory` (optional) — Target project directory (defaults to current working directory)

**Outputs:** Summary of changes made

## Instructions

### 1. Preparation

- Parse the `org/repo` argument to extract the organization and repository name
- Validate target directory exists and contains a `package.json`
- Verify git working tree is clean in target (warn user if not)
- Fetch or clone the latest template:
  - **Cache location:** `~/.cache/apply-template/<org>/<repo>`
  - If cache exists: `cd ~/.cache/apply-template/<org>/<repo> && git pull origin main`
  - If cache doesn't exist: `git clone https://github.com/<org>/<repo>.git ~/.cache/apply-template/<org>/<repo>`
  - This avoids repeated clones and speeds up subsequent runs

### 2. Ignore List

**Never copy these from template:**

- `docs/plans/`
- `src/`
- `test/`
- `package-lock.json`
- Any file that already exists in target project (EXCEPT `package.json`)

### 3. Merge package.json

**Strategy:** Use the `merge-package.js` script to intelligently merge dependencies

1. **Create backup:** `cp package.json package.json.backup`
2. **Run merge script:**

   ```bash
   node plugins/tools/scripts/merge-package.js \
     <target-directory>/package.json \
     ~/.cache/apply-template/<org>/<repo>/package.json
   ```

3. **Install dependencies:** Run `npm install` to install newly added dependencies
4. **Clean up:** Delete `package.json.backup` after successful merge and install

The merge script automatically:

- Compares versions between template and target
- Chooses the most recent semantic version
- Adds any dependencies that exist only in template
- Keeps any dependencies that exist only in target
- Adds scripts from template that don't exist in target (preserves user customizations)
- Adds missing fields like `engines`, `knip`, `lint-staged`, etc.
- Merges prettier config and adds plugins

**Version comparison logic (handled by `merge-package.js`):**

```javascript
// Use semver comparison - choose higher version
// Examples:
//   "1.2.3" vs "1.2.4" → choose "1.2.4"
//   "^1.0.0" vs "^2.0.0" → choose "^2.0.0"
//   "~1.2.3" vs "1.2.4" → choose "1.2.4" (prefer exact)
//   "latest" vs "1.0.0" → choose "latest"
```

### 4. Copy Configuration Files

**Strategy:** Copy files from template only if they don't exist in target

1. Get list of all files in template root (excluding ignored paths)
2. For each file:
   - Skip if in ignore list
   - Skip if already exists in target
   - Copy to target if missing
3. Handle `.github/` directory specially:
   - Copy `.github/` files that don't exist in target
   - Don't overwrite existing workflow files
   - Preserve target's existing .github structure

**Files to copy (if missing):**

- `.editorconfig`
- `.gitattributes`
- `.gitignore` (careful - may want to merge)
- `.eslintrc.*` / `eslint.config.js`
- `.prettierrc.*` / `prettier.config.js`
- `.prettierignore`
- `.commitlintrc.*`
- `.markdownlint*`
- `.npmrc`
- `tsconfig.json`
- `cspell.json`
- `.husky/` directory and contents
- `.github/` directory (non-overlapping files only)
- `LICENSE` or `LICENSE.md` (only if missing)
- `.config/` directory and contents (if present)
- Other dotfiles in root

### 5. Post-Application Steps

After all changes are complete, inform user they should:

1. **Review changes:**

   ```bash
   git diff package.json
   git status  # See new files
   ```

2. **Initialize tools if needed:**

   ```bash
   # If Husky was added:
   npm run prepare  # or: npx husky install
   ```

3. **Review and customize:**
   - Check new configuration files match project needs
   - Adjust scripts in `package.json`
   - Customize ESLint/Prettier rules
   - Update README with new tooling info

**Note:** Dependencies are automatically installed during step 3 (after merging `package.json`), so no separate `npm install` is needed unless the user wants to run it again.

### 6. Output Format

Provide clear summary of actions taken:

```text
✅ Applied <org>/<repo> template to project

Package.json changes:
  📦 Added dependencies: prettier, eslint, typescript
  📦 Updated dependencies: husky (8.0.0 → 9.0.0), lint-staged (15.0.0 → 16.0.0)
  📝 Added scripts: lint, format, test

Configuration files added:
  ✨ .editorconfig
  ✨ .prettierrc.json
  ✨ eslint.config.js
  ✨ tsconfig.json
  ✨ .husky/pre-commit
  ✨ .github/workflows/ci.yml

Files skipped (already exist):
  ⏭️  .gitignore
  ⏭️  LICENSE
  ⏭️  .github/workflows/release.yml

Next steps:
  1. Review changes: git diff package.json && git status
  2. Initialize Husky: npm run prepare
  3. Customize configs as needed
```

## Example Usage

```bash
# Apply a template to current directory
/tools:apply-template boneskull/boneskull-template

# Apply to specific project
/tools:apply-template boneskull/boneskull-template ../my-project

# Apply to absolute path
/tools:apply-template myorg/node-template /Users/me/projects/my-app

# Use any GitHub template repository
/tools:apply-template sindresorhus/node-module-boilerplate
```

## Constraints

- **Never overwrite existing files** (except `package.json`)
- **Always choose newer version** when merging dependencies
- **Preserve user customizations** in scripts and configs
- **Git working tree must be clean** (warn and exit if not)
- **Validate `package.json`** after merge (must be valid JSON)
- **Create backup** of original `package.json` before modifying
- **Handle errors gracefully** (missing template, network issues, etc.)

## Edge Cases

1. **Invalid org/repo format:**
   - Error: "Invalid template format. Expected 'org/repo' (e.g., 'boneskull/boneskull-template')"
   - Exit without making changes

2. **Git not clean:**
   - Warn user: "Working tree has uncommitted changes. Commit or stash before applying template."
   - Exit without making changes

3. **No package.json in target:**
   - Error: "Target directory is not a JavaScript/TypeScript project (no package.json found)"
   - Exit

4. **Template repository not found:**
   - Error: "Template repository '<org>/<repo>' not found on GitHub"
   - Exit

5. **Network error fetching template:**
   - Try local cached copy if available
   - Error if no cached copy: "Cannot fetch template. Check network connection."

6. **Version comparison ambiguity:**
   - If versions are equivalent (e.g., "^1.0.0" vs "~1.0.2"), prefer exact version
   - If can't parse version, keep target's version and warn user

7. **.gitignore conflicts:**
   - If target has `.gitignore`, DON'T overwrite
   - Consider offering to merge (show diff, ask user)

## Implementation Notes

- **Template cache:** `~/.cache/apply-template/<org>/<repo>`
- **Template URL:** `https://github.com/<org>/<repo>.git`
- **Merge script:** `plugins/tools/scripts/merge-package.js` - handles all package.json merging logic
- **Workflow:**
  1. Parse `org/repo` slug from arguments
  2. Ensure template cache exists (clone if needed, pull if exists)
  3. Create `package.json.backup`
  4. Run `node plugins/tools/scripts/merge-package.js <target-package.json> <template-package.json>`
  5. Run `npm install`
  6. Copy missing configuration files
  7. Delete `package.json.backup`
  8. Display summary of changes
