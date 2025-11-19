---
description: Merge a finished feature branch from a worktree while maintaining linear history
argument-hint: [main-worktree-path]
---

# /finish-worktree

## Purpose

Merge a completed feature branch from a git worktree into main using rebase and fast-forward merge to maintain a linear commit history. This command ensures no merge commits are created.

## Contract

**Inputs:** `main-worktree-path` (optional) — Path to the main worktree directory (prompts user if not provided)
**Outputs:** Summary of merge operation and next steps

## Instructions

### 1. Validate Current State

**Before starting:**

- Verify you're currently in a git worktree (not the main repository)
- Check that working tree is clean: `git status`
- If working tree has uncommitted changes, warn user and exit:

  ```text
  ⚠️  Working tree has uncommitted changes. Please commit or stash before finishing the worktree.
  ```

- Get the current feature branch name: `git branch --show-current`

### 2. Rebase Feature Branch onto Main

**Goal:** Replay feature branch commits on top of latest main

1. **Fetch latest main:**

   ```bash
   git fetch origin main:main
   ```

2. **Start interactive rebase:**

   ```bash
   git rebase main
   ```

3. **Handle rebase conflicts:**
   - If rebase succeeds, proceed to step 3
   - If conflicts occur:
     - List conflicting files: `git status --short | grep '^UU'`
     - Instruct user to resolve conflicts:

       ```text
       ⚠️  Rebase conflicts detected in:
       <list of conflicting files>

       Please resolve these conflicts and run:
         git add <resolved-files>
         git rebase --continue

       Then call /finish-worktree again to continue the merge process.
       ```

     - Exit and wait for user to resolve conflicts

4. **Repeat conflict resolution:**
   - After user runs `git rebase --continue`, conflicts may occur again
   - Repeat conflict resolution instructions until rebase completes
   - **Critical:** Never use `git rebase --skip` — every commit must be preserved
   - **Critical:** Never alter commit messages unless user explicitly requests it

5. **Verify rebase success:**

   ```bash
   git status
   ```

   - Ensure output shows "nothing to commit, working tree clean"
   - Ensure no rebase in progress

### 3. Navigate to Main Worktree

**Goal:** Switch to the worktree containing the main branch

1. **Check for main worktree argument:**
   - If `main-worktree-path` argument was provided, use it
   - If not provided, attempt to auto-detect:

     ```bash
     git worktree list | grep 'main]$'
     ```

   - If auto-detection finds exactly one main worktree, use its path
   - If auto-detection fails or finds multiple, prompt user:

     ```text
     📍 Please provide the path to your main worktree directory.

     Hint: Run `git worktree list` to see all worktrees.
     ```

2. **Validate main worktree path:**
   - Check directory exists
   - Check it's a git repository: `test -d <path>/.git || test -f <path>/.git`
   - Navigate to directory: `cd <main-worktree-path>`
   - Verify branch is main: `git branch --show-current` should output "main"
   - If not on main branch, error and exit:

     ```text
     ❌ Error: Directory is not on main branch (currently on: <branch-name>)
     Please provide the correct path to the main worktree.
     ```

3. **Ensure main is clean:**
   - Check status: `git status`
   - If uncommitted changes exist, warn and exit:

     ```text
     ⚠️  Main worktree has uncommitted changes. Please commit or stash before finishing.
     ```

### 4. Fast-Forward Main to Feature Branch

**Goal:** Update main to point to the rebased feature branch

**Critical constraint:** This operation must be a fast-forward. Any divergence indicates history was not properly rebased.

1. **Attempt fast-forward merge:**

   ```bash
   git merge --ff-only <feature-branch-name>
   ```

2. **Handle fast-forward outcomes:**

   **Success (exit code 0):**
   - Proceed to step 5

   **Failure (non-zero exit code):**
   - Check if feature branch doesn't exist locally:

     ```bash
     git show-ref --verify --quiet refs/heads/<feature-branch-name>
     ```

   - If branch doesn't exist, it might be in the worktree only
   - Attempt to reference it from worktree:

     ```bash
     # Get the commit SHA from the feature worktree
     FEATURE_SHA=$(git rev-parse <feature-branch-name> 2>/dev/null || \
                   cd <feature-worktree-path> && git rev-parse HEAD)
     git merge --ff-only $FEATURE_SHA
     ```

   - If still fails, this indicates history divergence:

     ```text
     ❌ Error: Cannot fast-forward main to feature branch.

     This usually means:
     1. The feature branch was not properly rebased onto main, OR
     2. Main has new commits since the rebase started

     Please choose an option:
     1. Return to feature worktree and rebase again
     2. Inspect the branches with: git log --oneline --graph --all
     3. Abort this operation

     What would you like to do?
     ```

   - Wait for user decision and follow their instruction
   - **Critical:** Do NOT attempt `git merge` without `--ff-only` flag

### 5. Delete Feature Branch

**Goal:** Clean up the feature branch after successful merge

1. **Delete the local feature branch:**

   ```bash
   git branch -d <feature-branch-name>
   ```

2. **Handle deletion outcomes:**

   **Success:**
   - Branch deleted successfully, proceed to output

   **Failure (branch not fully merged):**
   - This shouldn't happen since we just fast-forwarded
   - If it does, check if there's a remote tracking branch issue
   - Offer force deletion only if user confirms:

     ```text
     ⚠️  Git reports the branch is not fully merged.
     This is unexpected after a successful fast-forward.

     Use `git branch -D <feature-branch-name>` to force delete? (y/n)
     ```

3. **Clean up remote branch (optional):**
   - Check if feature branch exists on remote:

     ```bash
     git ls-remote --heads origin <feature-branch-name>
     ```

   - If exists, ask user:

     ```text
     📡 Feature branch exists on remote.
     Delete remote branch? (y/n)

     If yes, run: git push origin --delete <feature-branch-name>
     ```

### 6. Delete Feature Worktree

**Goal:** Clean up the feature worktree directory after successful merge

1. **Store the feature worktree path:**
   - Before switching to main worktree in step 3, store the feature worktree path
   - Example: `FEATURE_WORKTREE_PATH=$(pwd)`

2. **Attempt to remove worktree:**

   ```bash
   git worktree remove <feature-worktree-path>
   ```

3. **Handle removal outcomes:**

   **Success (exit code 0):**
   - Worktree removed successfully, proceed to step 7

   **Failure - Untracked files (common):**
   - Git will refuse with error like: "fatal: '<path>' contains modified or untracked files, use --force to delete it"
   - Check for untracked files:

     ```bash
     cd <feature-worktree-path>
     git status --porcelain | grep '^??'
     ```

   - If untracked files exist, prompt user:

     ```text
     ⚠️  Feature worktree contains untracked files:
     <list of untracked files>

     How would you like to proceed?
     1. Create a new commit with these files
     2. Amend the last commit to include these files
     3. Force-delete the worktree (rm -rf) - files will be lost
     4. Abort - leave worktree intact for manual cleanup

     Enter your choice (1-4):
     ```

   - Wait for user input and proceed accordingly:

     **Option 1 - Create new commit:**

     ```bash
     cd <feature-worktree-path>
     git add -A
     git commit -m "chore: add remaining untracked files"
     # Now need to update main again with this commit
     cd <main-worktree-path>
     git merge --ff-only <feature-branch-name>
     git branch -d <feature-branch-name>
     git worktree remove <feature-worktree-path>
     ```

     **Option 2 - Amend last commit:**

     ```bash
     cd <feature-worktree-path>
     git add -A
     git commit --amend --no-edit
     # Now need to update main again with amended commit
     cd <main-worktree-path>
     # Use reset since history was rewritten
     FEATURE_SHA=$(cd <feature-worktree-path> && git rev-parse HEAD)
     git reset --hard $FEATURE_SHA
     git branch -d <feature-branch-name>
     git worktree remove <feature-worktree-path>
     ```

     **Option 3 - Force delete:**

     ```bash
     rm -rf <feature-worktree-path>
     git worktree prune
     ```

     - Warn user: "⚠️ Untracked files have been permanently deleted."

     **Option 4 - Abort:**
     - Leave worktree intact
     - Inform user in output that worktree still exists
     - User can manually investigate and decide later

   **Failure - Other errors:**
   - Display git error message
   - Offer force delete with `git worktree remove --force` or manual `rm -rf`
   - Ask user for guidance

4. **Verify worktree removal:**

   ```bash
   git worktree list
   ```

   - Ensure feature worktree no longer appears in list
   - If it still appears, run `git worktree prune`

### 7. Output Format

Provide clear summary of the completed operation:

```text
✅ Successfully merged feature branch '<feature-branch-name>' into main

Actions completed:
  1. ✅ Rebased <feature-branch-name> onto main
  2. ✅ Fast-forwarded main to <feature-branch-name>
  3. ✅ Deleted local branch <feature-branch-name>
  4. ✅ Removed feature worktree <feature-worktree-path>

Current state:
  📍 Location: <main-worktree-path>
  🌿 Branch: main
  📝 Commits: <commit-summary>

Next steps:
  1. Push to remote: git push origin main
  2. (Optional) Delete remote branch: git push origin --delete <feature-branch-name>

✨ Linear history preserved — no merge commits created!
```

**Note:** If worktree removal was skipped (user chose option 4), modify output to say:

```text
⚠️  Feature worktree was NOT removed (user choice)
   📁 Worktree location: <feature-worktree-path>
   Manual cleanup: git worktree remove <feature-worktree-path> --force
```

## Example Usage

```bash
# Let auto-detect find main worktree
/tools:finish-worktree

# Specify main worktree path explicitly
/tools:finish-worktree ~/projects/my-project

# From within a feature worktree
cd ~/projects/my-project-feature
/tools:finish-worktree ../my-project
```

## Constraints

- **NEVER create merge commits** — linear history is paramount
- **NEVER skip commits** during rebase
- **NEVER alter commit messages** without explicit user permission
- **NEVER use `git merge` without `--ff-only` flag**
- **ALWAYS verify working tree is clean** before operations
- **ALWAYS use rebase for history integration**
- **ALWAYS validate fast-forward is possible** before merging

## Edge Cases

### 1. Rebase Conflicts

**Scenario:** Feature branch conflicts with main during rebase

**Handling:**

- Stop and list conflicting files
- Provide clear instructions for resolution
- Wait for user to resolve and continue
- Resume from step 2 after `git rebase --continue`
- Never automatically skip or abort rebase

### 2. No Main Worktree Found

**Scenario:** Auto-detection cannot find main worktree

**Handling:**

- Prompt user for path
- Validate provided path thoroughly
- Show `git worktree list` output to help user
- Accept either absolute or relative paths

### 3. Fast-Forward Impossible

**Scenario:** Main has diverged from feature branch

**Handling:**

- Show detailed error message
- Offer three options: re-rebase, inspect history, abort
- Never attempt regular merge
- Explain why fast-forward failed
- Guide user through resolution

### 4. Working Tree Not Clean

**Scenario:** Uncommitted changes in current or main worktree

**Handling:**

- Detect before any operations begin
- Show clear error message
- Suggest `git stash` or committing changes
- Exit without making any changes

### 5. Multiple Main Worktrees

**Scenario:** User has multiple worktrees checked out to main (unusual but possible)

**Handling:**

- List all candidates
- Ask user to specify which one to use
- Validate selection before proceeding

### 6. Feature Branch Doesn't Exist Locally in Main Worktree

**Scenario:** Feature branch only exists in its worktree, not visible from main worktree

**Handling:**

- Attempt to resolve branch reference from feature worktree
- Get commit SHA and use that for fast-forward merge
- If that fails, explain that branch needs to be visible
- Suggest pushing feature branch to remote first

### 7. Worktree Contains Untracked Files

**Scenario:** Git refuses to delete worktree because it contains untracked files

**Handling:**

- Detect untracked files with `git status --porcelain | grep '^??'`
- List all untracked files to user
- Provide four clear options:
  1. Create new commit with untracked files (then update main)
  2. Amend last commit to include untracked files (then update main)
  3. Force-delete worktree with `rm -rf` (permanent data loss)
  4. Abort and leave worktree for manual inspection
- Wait for explicit user choice
- Execute chosen option carefully
- If option 1 or 2: Must update main branch again since new commits were added
- If option 3: Warn about permanent deletion before executing
- If option 4: Document worktree location in output for later cleanup
- Never automatically force-delete without user permission

**Important:** Options 1 and 2 require going back to update the main branch since new commits were created after the initial fast-forward merge. This maintains the guarantee of linear history.

## Implementation Notes

### Git Worktree Primer

- **Worktree:** Separate working directory for the same repository
- **Main worktree:** Original checkout (typically on main branch)
- **Linked worktree:** Additional checkouts for feature branches

### Fast-Forward Merge Requirement

A fast-forward merge is only possible when:

- Target branch (main) is an ancestor of source branch (feature)
- No divergent commits exist
- History is linear after rebase

### Why Linear History Matters

- Easier to understand project evolution
- Simpler to bisect and revert
- Cleaner git log output
- No "merge commit noise"

### Command Reference

```bash
# List all worktrees
git worktree list

# Show current branch
git branch --show-current

# Rebase onto main
git rebase main

# Fast-forward only merge
git merge --ff-only <branch>

# Delete merged branch
git branch -d <branch>

# Force delete branch
git branch -D <branch>
```

## Troubleshooting

### "fatal: Needed a single revision"

**Cause:** Branch name is ambiguous or doesn't exist in current context

**Fix:** Use full commit SHA or ensure branch is visible in current worktree

### "fatal: Not possible to fast-forward, aborting"

**Cause:** Main has commits not in feature branch (history diverged)

**Fix:** Return to feature worktree, pull latest main, rebase again

### "error: Cannot delete branch (not fully merged)"

**Cause:** Git detects commits in feature branch not in main

**Fix:** Verify fast-forward actually succeeded with `git log --oneline --graph`

## Related Commands

- `git worktree list` — View all worktrees
- `git worktree remove <path>` — Remove worktree after merge
- `git rebase --abort` — Cancel rebase if needed
- `git reflog` — Recover from mistakes
