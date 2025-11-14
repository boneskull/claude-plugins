---
name: git-commit-messages
description: Format git commit messages correctly, avoiding HEREDOC syntax issues in favor of multiline strings
---

# Git Commit Message Formatting

## When to Use This Skill

Use this skill when creating git commits with the Bash tool, especially for commits with:

- Multi-line messages
- Body text or explanations
- Co-authored-by footers
- Claude Code attribution

## Core Principle

**Avoid HEREDOC syntax** - Use `-m` with multiline strings instead.

## Pattern to Follow

### ✅ DO - Use multiline string with -m

```bash
git commit -m "feat(github): add github plugin

This adds comprehensive GitHub workflow support including
commands for PR management and review workflows.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Key points:**

- Single `-m` flag with entire message in quotes
- Newlines preserved within the quoted string
- No special syntax or escaping needed
- Works reliably across all environments

### ❌ DON'T - Use HEREDOC syntax

```bash
# This FAILS in Claude Code's Bash tool
git commit -m "$(cat <<'EOF'
feat(github): add github plugin

This adds comprehensive GitHub workflow support.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Why this fails:**

- HEREDOC syntax has shell interpretation issues
- Fails in certain execution contexts
- More complex than necessary
- Unreliable across environments

## Examples

### Simple commit

```bash
git commit -m "fix: resolve path configuration issue"
```

### Commit with body

```bash
git commit -m "feat: add progressive disclosure pattern

Skills now support references/ subdirectory for
detailed documentation that loads on-demand."
```

### Commit with footer

```bash
git commit -m "chore: update dependencies

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Full conventional commit

```bash
git commit -m "feat(tools): add git commit message skill

This skill teaches Claude to format git commit messages
using multiline strings instead of HEREDOC syntax, which
fails in certain shell environments.

The pattern uses a single -m flag with the entire message
in quotes, preserving newlines naturally.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Why It Matters

Using `-m` with multiline strings is:

- **Reliable:** Works consistently in all environments
- **Simple:** No complex shell syntax needed
- **Portable:** Standard git behavior
- **Direct:** Git handles newlines correctly

HEREDOC syntax causes issues because:

- Shell interpretation varies by environment
- Execution context in Claude Code differs from terminal
- Quote handling becomes complex
- Unnecessary complexity for the task

## Quick Reference

**Template for commits with Claude Code attribution:**

```bash
git commit -m "<type>[optional scope]: <description>

[optional body]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

**Remember:**

- One `-m` flag
- Entire message in double quotes
- Newlines work naturally
- No HEREDOC needed
