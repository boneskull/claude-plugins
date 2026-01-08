# Test Plan: claude-watcher

## Overview

Add comprehensive tests for the `claude-watcher` plugin using `node:test` and `bupkis` for assertions.

## Test Infrastructure

### Task 1: Add test dependencies

Add `bupkis` as a dev dependency to `plugins/claude-watcher/package.json`.

**Verification:** `npm install` succeeds

---

## Unit Tests

### Task 2: Test utils.ts

Create `src/utils.test.ts` with tests for:

- `generateWatchId()` - returns string matching `w_[8-char-hex]` pattern
- `parseDuration()` - parses valid durations (`30s`, `5m`, `48h`, `7d`), throws on invalid
- `calculateExpiry()` - returns ISO timestamp in future
- `getIntervalMs()` - returns ms value, uses default when undefined
- `interpolatePrompt()` - replaces `{{var}}` with values, leaves unknown vars intact
- `formatWatch()` - returns expected string format

**Verification:** `npm test` passes

---

### Task 3: Test db.ts

Create `src/db.test.ts` with tests for `WatchDatabase`:

- `insert()` and `getById()` - round-trip a watch
- `list()` - returns all watches, filters by status
- `getActiveWatches()` - only returns active watches
- `updateStatus()` - changes status correctly
- `updateLastCheck()` - updates timestamp
- `markFired()` - sets status to 'fired' and firedAt timestamp
- `expireOldWatches()` - expires watches past their expiresAt, returns count
- `delete()` - removes watch, returns boolean

Use temp db path (`:memory:` or temp file) to avoid polluting real data.

**Verification:** `npm test` passes

---

### Task 4: Test trigger-executor.ts

Create `src/trigger-executor.test.ts` with tests for:

- `executeTrigger()`:
  - Returns `{fired: true, output}` when trigger exits 0 with valid JSON
  - Returns `{fired: true, output: {}, error}` when trigger exits 0 with invalid JSON
  - Returns `{fired: false, output: null}` when trigger exits non-zero
  - Returns `{fired: false, error}` when trigger not found/not executable
  - Logs stderr to console.error (spy/mock)
- `listTriggers()`:
  - Returns empty array when triggers dir empty
  - Returns trigger names for executables
  - Parses YAML sidecar metadata when present
  - Skips non-executable files and hidden files
- `triggerExists()`:
  - Returns true for executable trigger
  - Returns false for missing trigger

Use a temp triggers directory with test fixtures.

**Verification:** `npm test` passes

---

### Task 5: Test action-executor.ts

Create `src/action-executor.test.ts` with tests for:

- `executeAction()`:
  - Interpolates prompt with trigger output
  - Executes `claude -p` with correct args
  - Returns ActionResult with stdout/stderr/exitCode
  - Appends to log file
  - Handles non-zero exit codes
- `writeResult()`:
  - Writes JSON to correct path
- `executeAndWriteResult()`:
  - Combines execution and writing

Mock `execFile` to avoid actually calling `claude`. Use temp directories for logs/results.

**Verification:** `npm test` passes

---

## Integration Tests

### Task 6: Test MCP server tools

Create `src/mcp-server.test.ts` with tests for each tool:

- `register_watch`:
  - Creates watch with valid trigger
  - Returns error for invalid trigger
  - Respects TTL and interval params
- `list_watches`:
  - Returns empty message when no watches
  - Lists watches with correct formatting
  - Filters by status
- `watch_status`:
  - Returns watch details as JSON
  - Returns error for unknown watchId
- `cancel_watch`:
  - Cancels active watch
  - Returns error for non-active watch
  - Returns error for unknown watchId
- `list_triggers`:
  - Lists available triggers with metadata
  - Returns empty message when no triggers

Test by calling the tool handlers directly (extract them or use the McpServer test utilities).

**Verification:** `npm test` passes

---

## Summary

| Task | File | Focus |
|------|------|-------|
| 1 | package.json | Add bupkis |
| 2 | utils.test.ts | Pure utility functions |
| 3 | db.test.ts | Database CRUD operations |
| 4 | trigger-executor.test.ts | Trigger execution and listing |
| 5 | action-executor.test.ts | Action execution with mocks |
| 6 | mcp-server.test.ts | MCP tool handlers |

## Notes

- Use `node:test`'s `describe`, `it`, `before`, `after`, `beforeEach`, `afterEach`
- Use `bupkis` for assertions—follow patterns in `plugins/bupkis/skills/bupkis-assertion-patterns/SKILL.md`
  - Prefer `to satisfy` for object structure verification
  - Use `to have property` / `to have properties` for property checks
  - Use `not to be empty` for collection assertions
  - Chain with `and` for multiple assertions on the same subject
- Create helper to set up/tear down temp directories
- For db tests, use in-memory SQLite or temp file
- For trigger tests, create executable test fixtures
- For action tests, mock `execFile` to avoid calling real `claude`

---

## Manual Trigger Tests (Not in CI)

The bundled triggers make network calls and require external tools (`curl`, `gh` CLI with auth). These are isolated from the main test suite and run manually during development.

### Task 7: Test npm-publish trigger

Create `src/triggers/npm-publish.manual-test.ts`:

- Exits 0 and outputs JSON for published package (e.g., `lodash@4.17.21`)
- Exits 1 for non-existent version (e.g., `lodash@99.99.99`)
- Exits 1 with stderr for missing args
- JSON output has correct shape: `{package, version, slug}`

**Run manually:** `node --test dist/triggers/npm-publish.manual-test.js`

---

### Task 8: Test gh-pr-merged trigger

Create `src/triggers/gh-pr-merged.manual-test.ts`:

- Exits 0 and outputs JSON for merged PR (find a known merged PR)
- Exits 1 for unmerged/open PR
- Exits 1 for non-existent PR
- Exits 1 with stderr for missing args
- Exits 1 with stderr when `gh` not installed (mock PATH)
- JSON output has correct shape: `{repo, pr, prUrl}`

**Prerequisites:** `gh` CLI installed and authenticated.

**Run manually:** `node --test dist/triggers/gh-pr-merged.manual-test.js`
