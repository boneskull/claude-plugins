---
name: git-rebase-interactive
description: Use this skill when asked to perform an interactive git rebase programmatically, absorb/fixup commits into other commits, squash commits together, reorder commits, or drop commits. Provides a portable approach that works on macOS and Linux without interactive user input.
---

# Programmatic Interactive Git Rebase

This skill enables non-interactive execution of git interactive rebases. Use this when you need to:

- Absorb/fixup commits into earlier commits
- Squash multiple commits together
- Reorder commits
- Drop commits
- Reword commit messages (limited support)

## The Problem

Git's interactive rebase (`git rebase -i`) normally opens an editor for the user to modify a "todo" file. The `GIT_SEQUENCE_EDITOR` environment variable can override this, but:

1. **macOS BSD sed** has different syntax than GNU sed for multi-line operations
2. **Complex todo modifications** (reordering, inserting lines) are error-prone with sed

## The Solution

Write the complete todo file using a temporary shell script:

```bash
# 1. Create a temp editor script that writes the desired todo
EDITOR_SCRIPT=$(mktemp)
cat > "$EDITOR_SCRIPT" << 'SCRIPT'
#!/bin/bash
cat > "$1" << 'TODO'
pick abc1234 First commit message
fixup def5678 Commit to absorb into first
pick ghi9012 Third commit stays separate
TODO
SCRIPT
chmod +x "$EDITOR_SCRIPT"

# 2. Run the rebase with our custom editor
GIT_SEQUENCE_EDITOR="$EDITOR_SCRIPT" git rebase -i <base-commit>

# 3. Clean up
rm "$EDITOR_SCRIPT"
```

## Step-by-Step Process

### 1. Identify the commits

```bash
git log --oneline -10
```

Note the commit hashes and messages you want to work with.

### 2. Determine the base commit

The base commit is the parent of the oldest commit you want to modify:

```bash
# If oldest commit to modify is abc1234
git rebase -i 'abc1234^'  # Note: quote the caret for zsh
```

### 3. Plan the todo list

The todo file format is:

```text
<action> <hash> <message>
```

Available actions:

| Action   | Short | Description                                        |
| -------- | ----- | -------------------------------------------------- |
| `pick`   | `p`   | Use commit as-is                                   |
| `reword` | `r`   | Use commit but edit message (requires interaction) |
| `edit`   | `e`   | Stop for amending (requires interaction)           |
| `squash` | `s`   | Meld into previous, combine messages               |
| `fixup`  | `f`   | Meld into previous, discard this message           |
| `drop`   | `d`   | Remove commit entirely                             |

### 4. Build and execute

```bash
EDITOR_SCRIPT=$(mktemp)
cat > "$EDITOR_SCRIPT" << 'SCRIPT'
#!/bin/bash
cat > "$1" << 'TODO'
# Your todo list here - one line per commit
pick abc1234 First commit
fixup def5678 Second commit (will be absorbed)
pick ghi9012 Third commit
TODO
SCRIPT
chmod +x "$EDITOR_SCRIPT"

GIT_SEQUENCE_EDITOR="$EDITOR_SCRIPT" git rebase -i '<base>^'
rm "$EDITOR_SCRIPT"
```

## Common Operations

### Absorb fix commits into a feature commit

Scenario: You have a feature commit followed by fix commits that should be part of it.

```text
abc1234 feat: add user authentication
def5678 fix: correct token validation  <- absorb this
ghi9012 fix: handle edge case          <- and this
jkl3456 chore: update deps             <- keep separate
```

Todo:

```text
pick abc1234 feat: add user authentication
fixup def5678 fix: correct token validation
fixup ghi9012 fix: handle edge case
pick jkl3456 chore: update deps
```

### Squash multiple commits with combined message

Use `squash` instead of `fixup` to keep all commit messages:

```text
pick abc1234 feat: add user model
squash def5678 feat: add user controller
squash ghi9012 feat: add user routes
```

This will combine all three into one commit and open an editor to combine messages (or use `GIT_EDITOR` to automate).

### Reorder commits

Simply list commits in the desired order:

```text
pick ghi9012 Third commit (now first)
pick abc1234 First commit (now second)
pick def5678 Second commit (now third)
```

### Drop a commit

Use `drop` or simply omit the line:

```text
pick abc1234 Keep this
drop def5678 Remove this
pick ghi9012 Keep this too
```

## Handling Conflicts

If the rebase encounters conflicts:

1. The rebase will pause with a message
2. Resolve conflicts in the affected files
3. Stage the resolved files: `git add <files>`
4. Continue: `git rebase --continue`
5. Or abort: `git rebase --abort`

## Complete Example Script

Here's a reusable function:

```bash
# Programmatic interactive rebase
# Usage: git_rebase_todo '<base>^' 'pick abc123 msg' 'fixup def456 msg' ...
git_rebase_todo() {
  local base="$1"
  shift

  local EDITOR_SCRIPT
  EDITOR_SCRIPT=$(mktemp)

  {
    echo '#!/bin/bash'
    echo 'cat > "$1" << '\''TODO'\'''
    for line in "$@"; do
      echo "$line"
    done
    echo 'TODO'
  } > "$EDITOR_SCRIPT"

  chmod +x "$EDITOR_SCRIPT"
  GIT_SEQUENCE_EDITOR="$EDITOR_SCRIPT" git rebase -i "$base"
  local result=$?
  rm "$EDITOR_SCRIPT"
  return $result
}

# Example usage:
git_rebase_todo 'abc1234^' \
  'pick abc1234 feat: add feature' \
  'fixup def5678 fix: correct issue' \
  'pick ghi9012 chore: update deps'
```

## Limitations

1. **`reword` and `edit` actions** still require user interaction for the actual editing
2. **Conflict resolution** requires manual intervention
3. **Complex rebases** with many commits may be easier to do interactively

## Troubleshooting

### "fatal: could not read file..."

The todo file path wasn't passed correctly. Ensure the script uses `"$1"`.

### Rebase doesn't seem to do anything

Check that commit hashes in the todo match actual commits. Use short hashes (7+ chars).

### zsh: no matches found: abc^

Quote the caret: `'abc1234^'` or escape it: `abc1234\^`
