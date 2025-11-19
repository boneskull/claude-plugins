#!/usr/bin/env node
const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { basename, relative } = require('path');

/**
 * @typedef {Object} HookInput
 * @property {string} [cwd]
 * @property {string} [file_path]
 */

/**
 * @typedef {Object} ESLintMessage
 * @property {number} line
 * @property {number} column
 * @property {string} message
 * @property {number} severity
 * @property {string} [ruleId]
 */

/**
 * @typedef {Object} ESLintResult
 * @property {ESLintMessage[]} [messages]
 */

// Read hook input from stdin
/** @type {HookInput} */
let input;
try {
  input = JSON.parse(readFileSync(0, 'utf-8'));
} catch {
  // Invalid JSON, skip gracefully
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

const { cwd, file_path } = input;

// Validate required file_path field
if (!file_path) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// Only process JS/TS files (including .d.ts declaration files)
const JS_TS_EXTENSIONS = /\.(ts|tsx|js|jsx|cjs|mjs|mts|cts)$/i;
if (!JS_TS_EXTENSIONS.test(file_path)) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// Check if eslint is available
try {
  execSync('npx eslint --version', {
    cwd,
    stdio: 'ignore',
  });
} catch {
  // ESLint not available, skip silently
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// Run eslint --fix with JSON output
// Use relative path to avoid ESLint base path issues
const relativePath = cwd ? relative(cwd, file_path) : file_path;
/** @type {string} */
let output;
try {
  output = execSync(`npx eslint --fix --format json "${relativePath}"`, {
    cwd,
    encoding: 'utf-8',
    stdio: 'pipe',
  });
} catch (error) {
  // ESLint exits with non-zero when errors exist
  const stdout = (error && typeof error === 'object' && 'stdout' in error ? error.stdout : null);
  output = (typeof stdout === 'string' ? stdout : null) || '[]';
}

// Parse results and extract remaining errors
/** @type {ESLintResult[]} */
let results;
try {
  const parsed = JSON.parse(output);
  results = Array.isArray(parsed) ? parsed : [];
} catch {
  // Invalid JSON, assume no errors
  results = [];
}

const errors = results[0]?.messages?.filter((/** @type {ESLintMessage} */ msg) => msg.severity === 2) || [];

// Format and report errors if any exist
if (errors.length > 0) {
  const fileName = basename(file_path);
  const MAX_ERRORS_TO_SHOW = 5;

  let errorList;
  if (errors.length > MAX_ERRORS_TO_SHOW) {
    const shown = errors.slice(0, MAX_ERRORS_TO_SHOW);
    errorList = shown
      .map(
        (/** @type {ESLintMessage} */ e) =>
          `Line ${e.line}:${e.column}: ${e.message} (${e.ruleId || 'unknown'})`,
      )
      .join('\n');
    errorList += `\n...and ${errors.length - MAX_ERRORS_TO_SHOW} more error(s)`;
  } else {
    errorList = errors
      .map(
        (/** @type {ESLintMessage} */ e) =>
          `Line ${e.line}:${e.column}: ${e.message} (${e.ruleId || 'unknown'})`,
      )
      .join('\n');
  }

  const message = `ESLint found ${errors.length} error(s) in ${fileName}:\n${errorList}`;

  console.log(
    JSON.stringify({
      continue: true,
      systemMessage: message,
    }),
  );
} else {
  console.log(JSON.stringify({ continue: true }));
}

process.exit(0);
