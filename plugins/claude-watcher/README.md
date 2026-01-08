# claude-watcher

Event-driven automation daemon for Claude Code. Polls for conditions and executes Claude prompts when triggers fire.

## Installation

```bash
/plugin install claude-watcher@boneskull-plugins
```

## Usage

Register a watch to be notified when an npm package is published:

```text
Use the register_watch tool to watch for foo@1.2.3 being published to npm.
When it's published, upgrade this project and run tests.
```

## Daemon Setup

The daemon must be running for watches to be polled. See the design doc for launchd/systemd configuration.

## Triggers

Place trigger executables in `~/.config/claude-watcher/triggers/`. A trigger:

- Receives params as CLI arguments
- Exits 0 when condition is met, non-zero otherwise
- Prints JSON to stdout with output variables (only read on exit 0)

## License

BlueOak-1.0.0
