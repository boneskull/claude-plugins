#!/usr/bin/env node
const { execSync } = require('child_process');
const { readFileSync } = require('fs');
const { relative } = require('path');

// Read hook input from stdin
let input;
try {
  input = JSON.parse(readFileSync(0, 'utf-8'));
} catch (error) {
  // Invalid JSON, skip gracefully
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

const { file_path, cwd } = input;

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
    stdio: 'ignore'
  });
} catch {
  // ESLint not available, skip silently
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// Run eslint --fix with JSON output
// Use relative path to avoid ESLint base path issues
const relativePath = cwd ? relative(cwd, file_path) : file_path;
let output;
try {
  output = execSync(`npx eslint --fix --format json "${relativePath}"`, {
    cwd,
    encoding: 'utf-8',
    stdio: 'pipe'
  });
} catch (error) {
  // ESLint exits with non-zero when errors exist
  output = error.stdout || '[]';
}

// Parse results and extract remaining errors
let results;
try {
  results = JSON.parse(output);
} catch {
  // Invalid JSON, assume no errors
  results = [];
}

const errors = results[0]?.messages?.filter(msg => msg.severity === 2) || [];

// TODO: Format and report errors
console.log(JSON.stringify({ continue: true }));
process.exit(0);
