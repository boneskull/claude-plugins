/**
 * Executes actions by spawning claude -p
 */

import { execFile } from 'node:child_process';
import { appendFile, writeFile } from 'node:fs/promises';
import { promisify } from 'node:util';

import {
  type ActionResult,
  type TriggerOutput,
  type WatchAction,
  type WatchResult,
} from './types.js';
import { getLogPath, getResultPath, interpolatePrompt } from './utils.js';

const execFileAsync = promisify(execFile);

/** Options for action execution (for testing) */
export interface ExecuteActionOptions {
  /** Custom executor function (defaults to execFileAsync) */
  executor?: (
    file: string,
    args: string[],
    options: { cwd: string; env: NodeJS.ProcessEnv },
  ) => Promise<{ stderr: string; stdout: string; }>;
  /** Custom log path (defaults to getLogPath(watchId)) */
  logPath?: string;
}

/** Options for executeAndWriteResult (for testing) */
export interface ExecuteAndWriteResultOptions
  extends ExecuteActionOptions, WriteResultOptions {}

/** Options for writeResult (for testing) */
export interface WriteResultOptions {
  /** Custom result path (defaults to getResultPath(watchId)) */
  resultPath?: string;
}

/** Execute an action and return the result */
export const executeAction = async (
  watchId: string,
  action: WatchAction,
  triggerOutput: TriggerOutput,
  options: ExecuteActionOptions = {},
): Promise<ActionResult> => {
  const interpolatedPrompt = interpolatePrompt(action.prompt, triggerOutput);
  const cwd = action.cwd ?? process.cwd();
  const logPath = options.logPath ?? getLogPath(watchId);
  const executor = options.executor ?? execFileAsync;

  // Log the action start
  await appendFile(
    logPath,
    `\n=== Action started at ${new Date().toISOString()} ===\n` +
      `Prompt: ${interpolatedPrompt}\n` +
      `CWD: ${cwd}\n\n`,
  );

  try {
    const { stderr, stdout } = await executor(
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
      completedAt: new Date().toISOString(),
      cwd,
      exitCode: 0,
      prompt: interpolatedPrompt,
      stderr,
      stdout,
    };
  } catch (err) {
    // execFile rejects on non-zero exit or execution error
    const execErr = err as {
      code?: number;
      message: string;
      stderr?: string;
      stdout?: string;
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
      completedAt: new Date().toISOString(),
      cwd,
      exitCode,
      prompt: interpolatedPrompt,
      stderr,
      stdout,
    };
  }
};

/** Full action execution: run action and write result */
export const executeAndWriteResult = async (
  watchId: string,
  trigger: string,
  params: string[],
  action: WatchAction,
  triggerOutput: TriggerOutput,
  firedAt: string,
  options: ExecuteAndWriteResultOptions = {},
): Promise<WatchResult> => {
  const actionResult = await executeAction(watchId, action, triggerOutput, {
    executor: options.executor,
    logPath: options.logPath,
  });

  const result: WatchResult = {
    action: actionResult,
    firedAt,
    params,
    trigger,
    triggerOutput,
    watchId,
  };

  await writeResult(result, { resultPath: options.resultPath });
  return result;
};

/** Write a watch result to the results directory */
export const writeResult = async (
  result: WatchResult,
  options: WriteResultOptions = {},
): Promise<void> => {
  const resultPath = options.resultPath ?? getResultPath(result.watchId);
  await writeFile(resultPath, JSON.stringify(result, null, 2), 'utf-8');
};
