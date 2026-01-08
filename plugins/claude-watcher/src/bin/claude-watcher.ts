#!/usr/bin/env node
/**
 * CLI entry point for claude-watcher
 */

import { startDaemon } from '../daemon.js';

const VERSION = '1.0.0';

function printUsage(): void {
  console.log(`
claude-watcher v${VERSION}

Usage:
  claude-watcher daemon    Start the daemon process
  claude-watcher version   Print version
  claude-watcher help      Show this help

The daemon polls registered watches and executes actions when triggers fire.
Configure it to run at startup with launchd (macOS) or systemd (Linux).

For more information, see:
  ~/.config/claude-watcher/README.md
`);
}

async function main(): Promise<void> {
  const command = process.argv[2];

  switch (command) {
    case 'daemon':
      await startDaemon();
      break;

    case 'version':
    case '-v':
    case '--version':
      console.log(VERSION);
      break;

    case 'help':
    case '-h':
    case '--help':
    case undefined:
      printUsage();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
