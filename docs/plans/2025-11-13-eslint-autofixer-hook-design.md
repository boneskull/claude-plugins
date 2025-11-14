# ESLint Auto-Fixer Hook Design

**Date:** 2025-11-13
**Plugin:** @plugins/tools
**Status:** Approved

## Purpose

Auto-fix JavaScript and TypeScript files with ESLint after Write and Edit operations. The hook runs silently when fixes succeed, but reports unfixable errors to Claude for manual correction.

## Requirements

- **Target files:** .ts, .tsx, .js, .jsx, .cjs, .mjs, .mts, .cts
- **Trigger:** PostToolUse hook (after Write/Edit operations)
- **Behavior:** Run `eslint --fix`, report unfixable errors to Claude
- **Error handling:** Claude fixes manually what eslint cannot
- **Missing eslint:** Skip silently without error
- **Output visibility:** Silent on success, report only unfixable errors

## Architecture

### Hook Configuration

The hook uses Claude Code's PostToolUse event system:

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node ./hooks/scripts/eslint-fix.js",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

**Configuration details:**
- Matcher filters Write and Edit tool uses
- 30-second timeout handles large files
- Node.js script processes hook input

### Data Flow

```
Write/Edit → Hook receives file_path & cwd
          → Filter by extension (.ts, .tsx, etc.)
          → Check eslint availability
          → Run eslint --fix --format json
          → Parse JSON output for unfixable errors
          → Report errors to Claude via systemMessage
          → Return continue: true
```

### Script Implementation

**Language:** JavaScript (Node.js)

**Key components:**

1. **Input parsing:** Read JSON from stdin containing file_path and cwd
2. **Extension filtering:** Regex test for JS/TS extensions
3. **ESLint check:** Test `npx eslint --version` availability
4. **Fix execution:** Run `eslint --fix --format json` with structured output
5. **Error parsing:** Extract severity 2 (error) messages from JSON
6. **Error formatting:** Build readable message with line, column, rule, description
7. **Response:** Return JSON with `continue: true` and optional `systemMessage`

**Error response format:**
```
ESLint found 3 error(s) in component.tsx:
Line 15:7: 'useState' is not defined (no-undef)
Line 23:5: Missing return type on function (explicit-function-return-type)
Line 45:12: Unexpected any. Specify a different type (no-explicit-any)
```

## Implementation Details

### File Extension Filtering

```javascript
const JS_TS_EXTENSIONS = /\.(ts|tsx|js|jsx|cjs|mjs|mts|cts)$/;
if (!JS_TS_EXTENSIONS.test(file_path)) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}
```

### ESLint Availability Check

```javascript
try {
  execSync('npx eslint --version', { stdio: 'ignore' });
} catch {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}
```

Skip silently if eslint unavailable. No error message to user.

### Running ESLint with JSON Output

```javascript
try {
  output = execSync(`npx eslint --fix --format json "${file_path}"`, {
    cwd,
    encoding: 'utf-8',
    stdio: 'pipe'
  });
} catch (error) {
  output = error.stdout || '[]';
}
```

ESLint exits with non-zero status when errors exist. Catch the error and extract stdout for JSON parsing.

### Error Extraction and Formatting

```javascript
const results = JSON.parse(output);
const errors = results[0]?.messages?.filter(msg => msg.severity === 2) || [];

if (errors.length > 0) {
  const formatted = errors.map(e =>
    `Line ${e.line}:${e.column}: ${e.message} (${e.ruleId})`
  ).join('\n');

  console.log(JSON.stringify({
    continue: true,
    systemMessage: `ESLint found ${errors.length} error(s) in ${file_path}:\n${formatted}`
  }));
}
```

Filter severity 2 (errors), ignore severity 1 (warnings). Format with line, column, message, and rule ID.

## Edge Cases

### Large Error Counts

If eslint reports 10+ errors, show first 5 and add summary:

```javascript
if (errors.length > 10) {
  const shown = errors.slice(0, 5);
  const formatted = shown.map(/* format */).join('\n');
  const remaining = errors.length - 5;
  formatted += `\n...and ${remaining} more error(s)`;
}
```

### Missing Configuration

Projects without `.eslintrc.*` files use ESLint defaults or skip linting. The script handles this gracefully.

### File Deletion

If the file is deleted between Write and hook execution, `execSync` throws an error. The catch block returns `continue: true`, allowing the operation to complete.

### Invalid JSON Output

If ESLint returns malformed JSON, `JSON.parse()` throws. Wrap in try/catch and default to empty array:

```javascript
try {
  const results = JSON.parse(output);
} catch {
  const results = [];
}
```

### Script Timeout

30-second timeout allows processing of large files. If timeout occurs, Claude Code shows timeout message to user. The hook does not block the operation.

## Testing Strategy

### Auto-Fixable Issues

Create test file with spacing, semicolons, quotes errors. Verify hook fixes them silently.

```javascript
// test.js - before
const  x=1
let y =   2

// test.js - after (auto-fixed)
const x = 1;
let y = 2;
```

### Unfixable Errors

Create test file with undefined variables, type errors. Verify Claude receives systemMessage with error details.

```javascript
// test.ts
console.log(undefinedVar); // Error: 'undefinedVar' is not defined
const x: any = 5;          // Error: Unexpected any
```

Expected systemMessage:
```
ESLint found 2 error(s) in test.ts:
Line 1:13: 'undefinedVar' is not defined (no-undef)
Line 2:10: Unexpected any. Specify a different type (no-explicit-any)
```

### Non-JS/TS Files

Write .md, .json, .py files. Verify hook skips them silently.

### Projects Without ESLint

Test in directory without eslint installed. Verify hook skips silently.

## Installation

Copy files to plugin directory:

```
plugins/tools/
├── hooks/
│   ├── hooks.json
│   └── scripts/
│       └── eslint-fix.js
```

Hook activates automatically when plugin loads. No user configuration required.

## Future Enhancements

- Support other linters (prettier, biome)
- Per-project timeout configuration
- File pattern exclusions (.gitignore integration)
- Summary statistics in systemMessage
- Option to treat warnings as errors
