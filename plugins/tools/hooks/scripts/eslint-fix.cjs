#!/usr/bin/env node
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

// Read hook input from stdin
const input = JSON.parse(readFileSync(0, 'utf-8'));
const { file_path, cwd } = input;

// Only process JS/TS files
const JS_TS_EXTENSIONS = /\.(ts|tsx|js|jsx|cjs|mjs|mts|cts)$/;
if (!JS_TS_EXTENSIONS.test(file_path)) {
  console.log(JSON.stringify({ continue: true }));
  process.exit(0);
}

// TODO: Check eslint availability and run fix
console.log(JSON.stringify({ continue: true }));
process.exit(0);
