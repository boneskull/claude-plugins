/**
 * Executes actions by spawning claude -p
 */

import { spawn } from 'node:child_process';
import { appendFile, writeFile } from 'node:fs/promises';

import {
  ActionResult,
  TriggerOutput,
  WatchAction,
  WatchResult,
} from './types.js';
import { getLogPath, getResultPath, interpolatePrompt } from './utils.js';

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

  return new Promise((resolve) => {
    const proc = spawn('claude', ['-p', interpolatedPrompt], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      // Stream to log file
      appendFile(logPath, chunk).catch(() => {});
    });

    proc.stderr.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      appendFile(logPath, `[stderr] ${chunk}`).catch(() => {});
    });

    proc.on('error', (err) => {
      const result: ActionResult = {
        prompt: interpolatedPrompt,
        cwd,
        exitCode: 1,
        stdout: '',
        stderr: err.message,
        completedAt: new Date().toISOString(),
      };
      appendFile(logPath, `\n=== Action failed: ${err.message} ===\n`).catch(
        () => {},
      );
      resolve(result);
    });

    proc.on('close', (code) => {
      const result: ActionResult = {
        prompt: interpolatedPrompt,
        cwd,
        exitCode: code ?? 1,
        stdout,
        stderr,
        completedAt: new Date().toISOString(),
      };
      appendFile(
        logPath,
        `\n=== Action completed with exit code ${code} ===\n`,
      ).catch(() => {});
      resolve(result);
    });
  });
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
