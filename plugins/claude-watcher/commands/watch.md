---
description: Register a new watch to poll a trigger and execute a prompt when it fires
argument-hint: <trigger> [params...] "<prompt>"
---

# Watch Command

Register a new watch that polls a trigger at regular intervals and executes a Claude prompt when the trigger fires.

## Usage

```text
/claude-watcher:watch npm-publish lodash 4.18.0 "Lodash 4.18.0 is out! Update this project's dependencies."
/claude-watcher:watch gh-pr-merged facebook/react 12345 "PR #12345 was merged. Rebase our feature branch on main."
/claude-watcher:watch my-trigger arg1 arg2 "The condition was met. Check the results."
```

## Instructions

Parse $ARGUMENTS to extract:

1. **trigger** - The first word (trigger name)
2. **params** - All words between the trigger and the quoted prompt
3. **prompt** - The quoted string at the end (the action prompt)

Use the `register_watch` MCP tool to create the watch with:

- `trigger`: The extracted trigger name
- `params`: Array of extracted parameters
- `action.prompt`: The extracted prompt (supports `{{variable}}` interpolation from trigger output)
- `action.cwd`: Current working directory (use the user's cwd)
- `ttl`: Default to "48h" unless the user specifies otherwise
- `interval`: Default to "30s" unless the user specifies otherwise

After registering, confirm the watch was created and mention:

- The watch ID
- When it expires
- How often it will poll
- That the daemon must be running (`claude-watcher daemon`)

## Examples

**Input:** `npm-publish @scope/pkg 2.0.0 "Version 2.0.0 of @scope/pkg is published!"`

**Parsed as:**

- trigger: `npm-publish`
- params: `["@scope/pkg", "2.0.0"]`
- prompt: `"Version 2.0.0 of @scope/pkg is published!"`

**Input:** `gh-pr-merged owner/repo 42 "PR #42 merged. Time to rebase."`

**Parsed as:**

- trigger: `gh-pr-merged`
- params: `["owner/repo", "42"]`
- prompt: `"PR #42 merged. Time to rebase."`
