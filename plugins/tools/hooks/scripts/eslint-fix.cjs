#!/usr/bin/env node
const { execSync } = require('child_process');
const { readFileSync } = require('fs');

// Script will receive JSON input via stdin
// Format: { "tool_name": "Write", "file_path": "/path/to/file.ts", "cwd": "/project/root", ... }

console.log(JSON.stringify({ continue: true }));
process.exit(0);
