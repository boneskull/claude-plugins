#!/usr/bin/env node
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

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

// TODO: Run eslint --fix and parse output
console.log(JSON.stringify({ continue: true }));
process.exit(0);
