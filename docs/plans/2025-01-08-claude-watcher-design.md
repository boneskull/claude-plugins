# claude-watcher: Event-Driven Automation for Claude Code

## Overview

A daemon-based system that enables "when X happens, do Y" automation for Claude Code. Triggers are user-defined executables that poll for conditions; actions are prompts executed autonomously via `claude -p`. Results are reported back via hook injection on your next session.

**Primary use case:** "When `foo@1.2.3` is published to npm, upgrade the current project and run tests."

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    claude-watcher daemon                     │
│  - Runs continuously (launchd/systemd managed)              │
│  - Loads triggers from ~/.config/claude-watcher/triggers/   │
│  - Polls active watches on their defined intervals          │
│  - Spawns `claude -p` when triggers fire                    │
│  - Writes results to ~/.config/claude-watcher/results/      │
│  - SQLite for watch state persistence                       │
└─────────────────────────────────────────────────────────────┘
        ▲                                      │
        │ IPC (unix socket or HTTP)            │ writes
        │                                      ▼
┌───────────────────┐              ┌───────────────────────────┐
│   MCP Server      │              │ ~/.config/claude-watcher/ │
│                   │              │   watches.db              │
│ Tools:            │              │   results/*.json          │
│ - register_watch  │              │   results/archive/        │
│ - list_watches    │              │   logs/                   │
│ - cancel_watch    │              │   triggers/               │
│ - list_triggers   │              └───────────────────────────┘
│ - watch_status    │                          │
└───────────────────┘                          │ reads
        ▲                                      ▼
        │                          ┌───────────────────────────┐
        │                          │ UserPromptSubmit Hook     │
        │                          │ - Reads unread results    │
┌───────────────────┐              │ - Injects into context    │
│  Claude Session   │◄─────────────│ - Moves to archive/       │
└───────────────────┘              └───────────────────────────┘
```

### Data Flow

**Registration (Claude → Daemon):**

```
Claude session
     │
     │ tool call: register_watch(...)
     ▼
MCP Server ──────► Daemon ──────► watches.db
     │
     │ tool result: "watch w_abc123 registered"
     ▼
Claude session
```

**Trigger Fires (Daemon → Disk → Hook → Claude):**

```
Daemon (polling)
     │
     │ condition met!
     ▼
Daemon spawns: claude -p "do the action"
     │
     │ captures stdout
     ▼
Daemon writes result to ~/.config/claude-watcher/results/w_abc123.json

════════════════════════════════════════
LATER, you start a new Claude session...
════════════════════════════════════════

Hook (UserPromptSubmit) reads results/
     │
     │ finds w_abc123.json
     ▼
Hook injects into context, moves file to archive/
     │
     ▼
Claude sees notification, tells you
```

## Triggers

### Definition

A trigger is an executable file in `~/.config/claude-watcher/triggers/`. It:

- Receives params as CLI arguments
- Exits `0` when condition is met, non-zero otherwise
- Prints JSON to stdout with output variables (only read on exit 0)

### Example: npm-publish (bash)

```bash
#!/bin/bash
# ~/.config/claude-watcher/triggers/npm-publish
# Usage: npm-publish <package> <version>

PACKAGE="$1"
VERSION="$2"

if curl -sf "https://registry.npmjs.org/${PACKAGE}/${VERSION}" > /dev/null; then
  echo "{\"package\": \"${PACKAGE}\", \"version\": \"${VERSION}\", \"slug\": \"${PACKAGE}@${VERSION}\"}"
  exit 0
else
  exit 1
fi
```

### Example: npm-publish (TypeScript)

```typescript
#!/usr/bin/env tsx
// ~/.config/claude-watcher/triggers/npm-publish.ts

const [pkg, version] = process.argv.slice(2);

const res = await fetch(`https://registry.npmjs.org/${pkg}/${version}`);

if (res.ok) {
  console.log(
    JSON.stringify({ package: pkg, version, slug: `${pkg}@${version}` }),
  );
  process.exit(0);
} else {
  process.exit(1);
}
```

### Example: gh-pr-merged

```bash
#!/bin/bash
# ~/.config/claude-watcher/triggers/gh-pr-merged
# Usage: gh-pr-merged <owner/repo> <pr-number>

REPO="$1"
PR="$2"

MERGED=$(gh pr view "$PR" --repo "$REPO" --json merged --jq '.merged')

if [[ "$MERGED" == "true" ]]; then
  echo "{\"repo\": \"${REPO}\", \"pr\": ${PR}, \"prUrl\": \"https://github.com/${REPO}/pull/${PR}\"}"
  exit 0
else
  exit 1
fi
```

### Metadata Sidecar (Optional)

Each trigger can have a `.yaml` sidecar for discoverability:

```yaml
# ~/.config/claude-watcher/triggers/npm-publish.yaml
name: npm-publish
description: Fires when a specific npm package version is published to the registry
args:
  - name: package
    description: Package name (e.g., "foo" or "@scope/foo")
  - name: version
    description: Exact version to watch for (e.g., "1.2.3")
defaultInterval: 30s
```

The daemon pairs executables with their YAML if present. YAML is optional but helps Claude understand available triggers via `list_triggers`.

## Watch Lifecycle

### 1. Registration

Claude calls MCP tool:

```typescript
register_watch({
  trigger: 'npm-publish',
  params: ['foo', '1.2.3'],
  action: {
    prompt: 'Upgrade foo to {{slug}} in this project and run tests',
    cwd: '/Users/you/projects/my-app',
  },
  ttl: '48h', // optional, defaults to 48h
});
```

### 2. Watch Record Created

```typescript
{
  id: "w_abc123",
  trigger: "npm-publish",
  params: ["foo", "1.2.3"],
  action: {
    prompt: "Upgrade foo to {{slug}} in this project and run tests",
    cwd: "/Users/you/projects/my-app"
  },
  status: "active",
  createdAt: "2025-01-08T14:30:00Z",
  expiresAt: "2025-01-10T14:30:00Z",
  interval: "30s",
  lastCheck: null,
  firedAt: null
}
```

### 3. Polling

```
[14:30:30] npm-publish foo 1.2.3 → exit 1 (not yet)
[14:31:00] npm-publish foo 1.2.3 → exit 1 (not yet)
[14:31:30] npm-publish foo 1.2.3 → exit 0! → {"slug": "foo@1.2.3", ...}
```

### 4. Action Execution

Daemon spawns Claude with the interpolated prompt:

```bash
cd /Users/you/projects/my-app
claude -p "Upgrade foo to foo@1.2.3 in this project and run tests"
```

### 5. Result Written

```json
// ~/.config/claude-watcher/results/w_abc123.json
{
  "action": {
    "prompt": "Upgrade foo to foo@1.2.3 in this project and run tests",
    "cwd": "/Users/you/projects/my-app",
    "exitCode": 0,
    "stdout": "Updated foo to 1.2.3. Tests pass.",
    "completedAt": "2025-01-08T14:32:15Z"
  },
  "firedAt": "2025-01-08T14:31:30Z",
  "params": ["foo", "1.2.3"],
  "trigger": "npm-publish",
  "triggerOutput": {
    "package": "foo",
    "version": "1.2.3",
    "slug": "foo@1.2.3"
  },
  "watchId": "w_abc123"
}
```

Full Claude transcript logged to `~/.config/claude-watcher/logs/w_abc123.log`.

### Status Transitions

```
active → fired (trigger condition met, action executed)
active → expired (TTL reached without trigger firing)
fired → (terminal, result written)
expired → (terminal, no result)
```

## MCP Server Tools

| Tool             | Description                           |
| ---------------- | ------------------------------------- |
| `register_watch` | Create a new watch                    |
| `list_watches`   | List watches by status                |
| `watch_status`   | Get details on a specific watch       |
| `cancel_watch`   | Cancel an active watch                |
| `list_triggers`  | List available triggers with metadata |

### register_watch

```typescript
{
  trigger: string,        // "npm-publish"
  params: string[],       // ["foo", "1.2.3"]
  action: {
    prompt: string,       // "Upgrade {{slug}} in this project..."
    cwd?: string          // defaults to session's cwd
  },
  ttl?: string,           // "48h" (default), "1h", "7d", etc.
  interval?: string       // override trigger's defaultInterval
}
// Returns: { watchId: string, expiresAt: string }
```

### list_watches

```typescript
{
  status?: "active" | "fired" | "expired" | "all"  // default "all"
}
// Returns: { watches: Watch[] }
```

### cancel_watch

```typescript
{
  watchId: string;
}
// Returns: { success: boolean }
```

### list_triggers

```typescript
{
}
// Returns: { triggers: TriggerInfo[] }
// TriggerInfo = { name, description?, args?, defaultInterval? }
```

## Hook

The `UserPromptSubmit` hook reads pending results and injects them into context.

````bash
#!/bin/bash
# Installed by plugin to appropriate hook location

RESULTS_DIR="$HOME/.config/claude-watcher/results"
ARCHIVE_DIR="$HOME/.config/claude-watcher/results/archive"

shopt -s nullglob
results=("$RESULTS_DIR"/*.json)

if [[ ${#results[@]} -eq 0 ]]; then
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"

echo "---"
echo "## Completed Watches"
echo ""

for f in "${results[@]}"; do
  watchId=$(jq -r '.watchId' "$f")
  trigger=$(jq -r '.trigger' "$f")
  params=$(jq -r '.params | join(" ")' "$f")
  exitCode=$(jq -r '.action.exitCode' "$f")
  stdout=$(jq -r '.action.stdout' "$f")

  if [[ "$exitCode" == "0" ]]; then
    status="succeeded"
  else
    status="failed (exit $exitCode)"
  fi

  echo "**${trigger} ${params}** - ${status}"
  echo '```'
  echo "$stdout" | head -20
  echo '```'
  echo ""

  mv "$f" "$ARCHIVE_DIR/"
done

echo "---"
````

## Action Permissions

- **If `cwd` specified:** Uses that project's `.claude/settings.json`, sandboxed to that directory
- **If no `cwd`:** Uses user config (`~/.claude/settings.json`)

This mirrors how Claude Code normally handles project vs. user permissions.

## Installation & Distribution

### What the Plugin Provides (Automatic)

- MCP server (registered via plugin config)
- Hook script (registered via plugin config)
- Bundled daemon binary/script
- Example service descriptors in README

### What Gets Created on First Run

The daemon creates on startup if not present:

- `~/.config/claude-watcher/` directory
- `~/.config/claude-watcher/watches.db`
- `~/.config/claude-watcher/results/`
- `~/.config/claude-watcher/results/archive/`
- `~/.config/claude-watcher/logs/`
- `~/.config/claude-watcher/triggers/` (seeded with bundled examples)

### Manual Setup: Daemon Service

**macOS (launchd):**

Save to `~/Library/LaunchAgents/com.claude-watcher.daemon.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.claude-watcher.daemon</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/claude-watcher</string>
        <string>daemon</string>
    </array>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardOutPath</key>
    <string>/usr/local/var/log/claude-watcher.log</string>

    <key>StandardErrorPath</key>
    <string>/usr/local/var/log/claude-watcher.err</string>
</dict>
</plist>
```

Then:

```bash
launchctl load ~/Library/LaunchAgents/com.claude-watcher.daemon.plist
```

**Linux (systemd):**

Save to `~/.config/systemd/user/claude-watcher.service`:

```ini
[Unit]
Description=Claude Watcher Daemon
After=network.target

[Service]
Type=simple
ExecStart=/usr/local/bin/claude-watcher daemon
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
```

Then:

```bash
systemctl --user enable claude-watcher
systemctl --user start claude-watcher
```

## Design Decisions

| Decision                                | Rationale                                                   |
| --------------------------------------- | ----------------------------------------------------------- |
| Triggers are executables                | Language-agnostic, easy to write, easy to test in isolation |
| File-based result delivery              | Simple, debuggable, no timing issues with MCP startup       |
| Separate daemon process                 | Watches must survive session boundaries                     |
| 48h default TTL                         | Prevents orphaned watches from polling forever              |
| Hook for notifications, MCP for queries | Clean separation of push vs. pull                           |
| One action per trigger                  | Keep it simple; register multiple watches if needed         |

## Future Considerations (Out of Scope for v1)

- Watch trigger types (filesystem, webhook) beyond polling
- Action types beyond prompts (scripts, webhooks)
- Watch chaining (trigger A fires, then watch for B)
- Web UI for watch management
- Retry policies for failed actions
