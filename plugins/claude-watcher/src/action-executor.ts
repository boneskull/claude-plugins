/**
 * Executes actions by spawning claude -p
 */

import { execFile } from 'node:child_process';
import { appendFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import {
  ActionResult,
  TriggerOutput,
  WatchAction,
  WatchResult,
} from './types.js';
import { getLogPath, getResultPath, interpolatePrompt } from './utils.js';

const execFileAsync = promisify(execFile);

/** Execute an action and return the result */
export async function executeAction(
  watchId: string,
  action: WatchAction,
  triggerOutput: TriggerOutput,
): Promise<ActionResult> {
  const interpolatedPrompt = interpolatePrompt(action.prompt, triggerOutput);
  const cwd = action.cwd ?? process.cwd();
  const logPath = getLogPath(watchId);

  // Log the action start
  await appendFile(
    logPath,
    `\n=== Action started at ${new Date().toISOString()} ===\n` +
      `Prompt: ${interpolatedPrompt}\n` +
      `CWD: ${cwd}\n\n`,
  );

  try {
    const { stdout, stderr } = await execFileAsync(
      'claude',
      ['-p', interpolatedPrompt],
      { cwd, env: process.env },
    );

    // Log output after completion
    await appendFile(logPath, stdout);
    if (stderr) {
      await appendFile(logPath, `[stderr] ${stderr}`);
    }
    await appendFile(logPath, `\n=== Action completed with exit code 0 ===\n`);

    return {
      prompt: interpolatedPrompt,
      cwd,
      exitCode: 0,
      stdout,
      stderr,
      completedAt: new Date().toISOString(),
    };
  } catch (err) {
    // execFile rejects on non-zero exit or execution error
    const execErr = err as {
      code?: number;
      stdout?: string;
      stderr?: string;
      message: string;
    };

    const stdout = execErr.stdout ?? '';
    const stderr = execErr.stderr ?? execErr.message;
    const exitCode = execErr.code ?? 1;

    await appendFile(logPath, stdout);
    if (stderr) {
      await appendFile(logPath, `[stderr] ${stderr}`);
    }
    await appendFile(
      logPath,
      `\n=== Action completed with exit code ${exitCode} ===\n`,
    );

    return {
      prompt: interpolatedPrompt,
      cwd,
      exitCode,
      stdout,
      stderr,
      completedAt: new Date().toISOString(),
    };
  }
}

/** Write a watch result to the results directory */
export async function writeResult(result: WatchResult): Promise<void> {
  const resultPath = getResultPath(result.watchId);
  await writeFile(resultPath, JSON.stringify(result, null, 2), 'utf-8');
}

/** Full action execution: run action and write result */
export async function executeAndWriteResult(
  watchId: string,
  trigger: string,
  params: string[],
  action: WatchAction,
  triggerOutput: TriggerOutput,
  firedAt: string,
): Promise<WatchResult> {
  const actionResult = await executeAction(watchId, action, triggerOutput);

  const result: WatchResult = {
    watchId,
    trigger,
    params,
    triggerOutput,
    action: actionResult,
    firedAt,
  };

  await writeResult(result);
  return result;
}
