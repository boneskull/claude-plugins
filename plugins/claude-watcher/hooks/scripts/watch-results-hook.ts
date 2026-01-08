#!/usr/bin/env node
/**
 * UserPromptSubmit hook that reads pending watch results and injects them into
 * the Claude session context.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
} from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';

interface HookInput {
  session_id: string;
  transcript_path: string;
  cwd: string;
  permission_mode: string;
  prompt: string;
}

interface HookOutput {
  continue: boolean;
  systemMessage?: string;
  hookSpecificOutput?: {
    hookEventName: string;
    additionalContext?: string;
  };
}

interface WatchResult {
  watchId: string;
  trigger: string;
  params: string[];
  triggerOutput: Record<string, unknown>;
  action: {
    prompt: string;
    cwd: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    completedAt: string;
  };
  firedAt: string;
}

const CONFIG_DIR = join(homedir(), '.config', 'claude-watcher');
const RESULTS_DIR = join(CONFIG_DIR, 'results');
const ARCHIVE_DIR = join(CONFIG_DIR, 'results', 'archive');

function main(): void {
  // Read input from stdin
  let inputJson = '';
  try {
    inputJson = readFileSync(0, 'utf-8');
  } catch {
    // No stdin, exit gracefully
    outputResult({ continue: true });
    return;
  }

  let _input: HookInput;
  try {
    _input = JSON.parse(inputJson) as HookInput;
  } catch {
    outputResult({ continue: true });
    return;
  }

  // Check if results directory exists
  if (!existsSync(RESULTS_DIR)) {
    outputResult({ continue: true });
    return;
  }

  // Find pending result files
  let files: string[];
  try {
    files = readdirSync(RESULTS_DIR).filter(
      (f) => f.endsWith('.json') && !f.startsWith('.'),
    );
  } catch {
    outputResult({ continue: true });
    return;
  }

  if (files.length === 0) {
    outputResult({ continue: true });
    return;
  }

  // Ensure archive directory exists
  if (!existsSync(ARCHIVE_DIR)) {
    mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  // Process each result
  const summaries: string[] = [];

  for (const file of files) {
    const filePath = join(RESULTS_DIR, file);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const result = JSON.parse(content) as WatchResult;

      const status =
        result.action.exitCode === 0
          ? 'succeeded'
          : `failed (exit ${result.action.exitCode})`;

      const params = result.params.join(' ');
      const stdout = result.action.stdout.slice(0, 500); // Truncate long output

      summaries.push(
        `**${result.trigger} ${params}** - ${status}\n` +
          '```\n' +
          stdout +
          (result.action.stdout.length > 500 ? '\n...(truncated)' : '') +
          '\n```',
      );

      // Move to archive
      const archivePath = join(ARCHIVE_DIR, basename(file));
      renameSync(filePath, archivePath);
    } catch (err) {
      // Skip files we can't process
      console.error(`Error processing ${file}:`, err);
    }
  }

  if (summaries.length === 0) {
    outputResult({ continue: true });
    return;
  }

  // Build notification message
  const message =
    '---\n' + '## Completed Watches\n\n' + summaries.join('\n\n') + '\n---';

  outputResult({
    continue: true,
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: message,
    },
  });
}

function outputResult(result: HookOutput): void {
  console.log(JSON.stringify(result));
}

main();
