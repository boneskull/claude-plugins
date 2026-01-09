# claude-watcher

Event-driven automation daemon for Claude Code. Polls for conditions and executes Claude prompts when triggers fire.

## Installation

```bash
/plugin install claude-watcher@boneskull-plugins
```

After installing, build the plugin and initialize config:

```bash
cd ~/.claude/plugins/claude-watcher
# install/builds third-party dependencies and compiles sources
npm install
# creates config directories and copies bundled triggers
npx claude-watcher init
```

## Usage

### Quick Start with `/watch`

```text
/claude-watcher:watch npm-publish lodash 4.18.0 "Lodash 4.18.0 is out! Update dependencies in this project."
/claude-watcher:watch gh-pr-merged facebook/react 12345 "PR #12345 merged. Rebase on main."
```

### Natural Language

```text
Use the register_watch tool to watch for foo@1.2.3 being published to npm.
When it's published, upgrade this project and run tests.
```

## MCP Tools

This plugin exposes the following MCP tools to Claude:

| Tool             | Description                                                                   |
| ---------------- | ----------------------------------------------------------------------------- |
| `register_watch` | Register a new watch with a trigger, action prompt, TTL, and polling interval |
| `list_watches`   | List all registered watches, optionally filtered by status                    |
| `watch_status`   | Get detailed status of a specific watch by ID                                 |
| `cancel_watch`   | Cancel an active watch                                                        |
| `list_triggers`  | List available trigger executables with their metadata                        |

### Defaults

- **TTL**: 48 hours (watches automatically expire)
- **Polling interval**: 30 seconds

### Storage

Watches are persisted to a SQLite database at `~/.config/claude-watcher/watches.db`. This allows watches to survive daemon restarts.

## Daemon Setup

The daemon must be running for watches to be polled.

### Manual Start

```bash
claude-watcher daemon
```

### macOS (`launchd`)

> [!IMPORTANT]
> The Node.js version used in the plist **must be the same major version** as the node in your PATH when you ran `npm install`. Native modules (like better-sqlite3) are compiled against a specific Node ABI version and will fail with cryptic errors if there's a mismatch. If you switch Node versions, re-run `npm install` to rebuild native modules.

```bash
# Copy and configure the plist
cp ~/.claude/plugins/claude-watcher/services/com.boneskull.claude-watcher.plist \
   ~/Library/LaunchAgents/

# Edit ~/Library/LaunchAgents/com.boneskull.claude-watcher.plist and replace
# YOUR_USERNAME with your username
# Also update the node path if needed (check with: which node)

# Create logs directory
mkdir -p ~/.config/claude-watcher/logs

# Load and start the service
launchctl load ~/Library/LaunchAgents/com.boneskull.claude-watcher.plist
launchctl start com.boneskull.claude-watcher

# Check status
launchctl list | grep claude-watcher
```

### Linux (`systemd`)

```bash
# Copy the service file
cp ~/.claude/plugins/claude-watcher/services/claude-watcher.service \
   ~/.config/systemd/user/

# Update the node path in ~/.config/systemd/user/claude-watcher.service if needed
# (check with: which node)

# Reload systemd and enable the service
systemctl --user daemon-reload
systemctl --user enable claude-watcher
systemctl --user start claude-watcher

# Check status
systemctl --user status claude-watcher

# View logs
journalctl --user -u claude-watcher -f
```

## Triggers

Triggers are just executables--something with executable permissions (`chmod +x my-trigger.sh`) and a shebang (`#!/bin/bash`, `#!/usr/bin/env node`, etc.) at the top. This allows you to write triggers in JS, TS, Python, Ruby, PHP, Bash—whatever you like.

Triggers live in `~/.config/claude-watcher/triggers/`. A trigger:

- Receives params as positional CLI arguments
- Exits 0 when condition is met, non-zero otherwise
- Prints JSON to stdout with output variables (only read on exit 0)

### Bundled Triggers

Installed via `claude-watcher init`:

#### `npm-publish`

> Fires when an npm package version is published to the registry

```bash
npm-publish <package> <version>
# Example: npm-publish lodash 4.18.0
```

Outputs: `{"package": "...", "version": "...", "slug": "package@version"}`

> **Prerequisite:** Requires `curl`.

#### `gh-pr-merged`

> Fires when a GitHub pull request is merged

```bash
gh-pr-merged <owner/repo> <pr-number>
# Example: gh-pr-merged facebook/react 12345
```

Outputs: `{"repo": "...", "pr": 123, "prUrl": "https://..."}`

> **Prerequisite:** Requires the [GitHub CLI](https://cli.github.com) (`gh`) to be installed and authenticated; requires the [`jq`](https://jqlang.org) CLI installed.

### Creating Custom Triggers

Create an executable script in `~/.config/claude-watcher/triggers/`:

```bash
#!/bin/bash
# my-trigger - Example custom trigger
# Usage: my-trigger <arg1> <arg2>

# Your condition check here
if some_condition; then
  # Output JSON with variables for prompt interpolation
  echo '{"result": "success", "value": 42}'
  exit 0
else
  exit 1
fi
```

> [!TIP]
> Write errors to stderr; they'll be logged to the daemon output with a `[trigger:<name>]` prefix.

Optionally add a YAML sidecar (`my-trigger.yaml`) for metadata:

```yaml
name: my-trigger
description: Description shown in list_triggers
args:
  - name: arg1
    description: First argument
  - name: arg2
    description: Second argument
defaultInterval: 60s
```

### Testing Triggers

Triggers, since they are just executables, can be trivially tested by running them directly from the command-line:

```bash
./my-trigger arg1 arg2
```

If you get your JSON output, you know your trigger is working:

```json
{ "count": 42, "status": "ready", "url": "https://example.com/result" }
```

### Prompt Interpolation

Action prompts support `{{variable}}` template syntax for inserting runtime data from trigger output. When a trigger fires (exits 0), its JSON stdout is parsed and any `{{key}}` placeholders in the prompt are replaced with the corresponding values.

For example, if your trigger outputs:

```json
{ "count": 42, "status": "ready", "url": "https://example.com/result" }
```

You can reference these in your prompt:

```text
/claude-watcher:watch my-trigger arg1 arg2 "Trigger fired with status {{status}}. Found {{count}} items at {{url}}."
```

This is useful when the trigger returns runtime information that wasn't known at registration time—such as timestamps, URLs, computed values, or external state.

## License

Copyright © 2025 [Christopher "boneskull" Hiller](https://github.com/boneskull). Licensed under the [Blue Oak Model License 1.0.0](LICENSE)
