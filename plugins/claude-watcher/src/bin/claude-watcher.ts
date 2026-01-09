#!/usr/bin/env node
/**
 * CLI entry point for claude-watcher
 */

import { copyFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { startDaemon } from '../daemon.js';
import { ensureConfigDirs, getTriggersDir } from '../utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = join(__dirname, '..', '..', 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as { version: string };
const VERSION = pkg.version;

/** Path to bundled triggers in the plugin directory */
const BUNDLED_TRIGGERS_DIR = join(__dirname, '..', '..', 'triggers');

/** Initialize config directories and copy bundled triggers */
const init = (): void => {
  console.log('Initializing claude-watcher...');

  // Ensure all config directories exist
  ensureConfigDirs();
  console.log('  Created config directories');

  // Copy bundled triggers if they don't already exist
  const userTriggersDir = getTriggersDir();

  if (!existsSync(BUNDLED_TRIGGERS_DIR)) {
    console.log('  No bundled triggers found');
    return;
  }

  const files = readdirSync(BUNDLED_TRIGGERS_DIR);
  let copied = 0;

  for (const file of files) {
    const src = join(BUNDLED_TRIGGERS_DIR, file);
    const dest = join(userTriggersDir, file);

    if (existsSync(dest)) {
      console.log(`  Skipping ${file} (already exists)`);
      continue;
    }

    copyFileSync(src, dest);
    copied++;
    console.log(`  Copied ${file}`);
  }

  if (copied > 0) {
    console.log(`\nCopied ${copied} trigger(s) to ${userTriggersDir}`);
  } else {
    console.log('\nNo new triggers to copy');
  }

  console.log('\nInitialization complete!');
  console.log('Run "claude-watcher daemon" to start polling.');
};

const main = async (): Promise<void> => {
  const command = process.argv[2];

  switch (command) {
    case '--help':
    // falls through
    case '-h':
    // falls through
    case 'help':
    case undefined:
      printUsage();
      break;
    case '--version':
    // falls through
    case '-v':
    case 'version':
      console.log(VERSION);
      break;
    case 'daemon':
      await startDaemon();
      break;
    case 'init':
      init();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
};

const printUsage = (): void => {
  console.log(`
claude-watcher v${VERSION}

Usage:
  claude-watcher init      Initialize config and copy example triggers
  claude-watcher daemon    Start the daemon process
  claude-watcher version   Print version
  claude-watcher help      Show this help

The daemon polls registered watches and executes actions when triggers fire.
Configure it to run at startup with launchd (macOS) or systemd (Linux).

For more information, see:
  ~/.config/claude-watcher/README.md
`);
};

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
