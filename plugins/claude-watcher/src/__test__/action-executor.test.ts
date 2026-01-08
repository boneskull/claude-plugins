/**
 * Tests for action-executor.ts
 *
 * Uses mock executor to avoid actually calling claude CLI.
 */

import { expect } from 'bupkis';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, afterEach, before, describe, it } from 'node:test';

import {
  executeAction,
  executeAndWriteResult,
  writeResult,
} from '../action-executor.js';
import { type WatchAction, type WatchResult } from '../types.js';

describe('action-executor', () => {
  let tempDir: string;
  let logPath: string;
  let resultPath: string;

  before(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'claude-watcher-action-test-'));
    logPath = join(tempDir, 'test.log');
    resultPath = join(tempDir, 'test-result.json');
  });

  after(() => {
    rmSync(tempDir, { force: true, recursive: true });
  });

  afterEach(() => {
    // Clean up test files
    try {
      rmSync(logPath);
    } catch {
      // Ignore
    }
    try {
      rmSync(resultPath);
    } catch {
      // Ignore
    }
  });

  describe('executeAction', () => {
    it('interpolates prompt with trigger output', async () => {
      let capturedArgs: string[] = [];

      const mockExecutor = async (
        file: string,
        args: string[],
      ): Promise<{ stderr: string; stdout: string; }> => {
        capturedArgs = args;
        return { stderr: '', stdout: 'success' };
      };

      const action: WatchAction = {
        prompt: 'Package {{package}} version {{version}} is ready',
      };
      const triggerOutput = { package: 'lodash', version: '4.18.0' };

      await executeAction('w_test1234', action, triggerOutput, {
        executor: mockExecutor,
        logPath,
      });

      expect(capturedArgs, 'to satisfy', [
        '-p',
        'Package lodash version 4.18.0 is ready',
      ]);
    });

    it('executes claude -p with correct args', async () => {
      let capturedFile = '';
      let capturedArgs: string[] = [];

      const mockExecutor = async (
        file: string,
        args: string[],
      ): Promise<{ stderr: string; stdout: string; }> => {
        capturedFile = file;
        capturedArgs = args;
        return { stderr: '', stdout: 'result' };
      };

      const action: WatchAction = { prompt: 'Do something' };

      await executeAction(
        'w_test1234',
        action,
        {},
        {
          executor: mockExecutor,
          logPath,
        },
      );

      expect(capturedFile, 'to equal', 'claude');
      expect(capturedArgs[0], 'to equal', '-p');
    });

    it('returns ActionResult with stdout/stderr/exitCode on success', async () => {
      const mockExecutor = async (): Promise<{
        stderr: string;
        stdout: string;
      }> => {
        return { stderr: 'warning', stdout: 'output from claude' };
      };

      const action: WatchAction = { prompt: 'Test prompt' };

      const result = await executeAction(
        'w_test1234',
        action,
        {},
        {
          executor: mockExecutor,
          logPath,
        },
      );

      expect(result, 'to satisfy', {
        exitCode: 0,
        prompt: 'Test prompt',
        stderr: 'warning',
        stdout: 'output from claude',
      });
      expect(result.completedAt, 'to match', /^\d{4}-\d{2}-\d{2}T/);
    });

    it('appends to log file', async () => {
      const mockExecutor = async (): Promise<{
        stderr: string;
        stdout: string;
      }> => {
        return { stderr: '', stdout: 'claude output here' };
      };

      const action: WatchAction = { prompt: 'Log test' };

      await executeAction(
        'w_test1234',
        action,
        {},
        {
          executor: mockExecutor,
          logPath,
        },
      );

      const logContent = readFileSync(logPath, 'utf-8');
      expect(logContent, 'to contain', 'Action started');
      expect(logContent, 'to contain', 'Prompt: Log test');
      expect(logContent, 'to contain', 'claude output here');
      expect(logContent, 'to contain', 'exit code 0');
    });

    it('handles non-zero exit codes', async () => {
      const mockExecutor = async (): Promise<never> => {
        const err = new Error('Command failed') as Error & {
          code: number;
          stderr: string;
          stdout: string;
        };
        err.code = 1;
        err.stdout = 'partial output';
        err.stderr = 'error message';
        throw err;
      };

      const action: WatchAction = { prompt: 'Failing prompt' };

      const result = await executeAction(
        'w_test1234',
        action,
        {},
        {
          executor: mockExecutor,
          logPath,
        },
      );

      expect(result, 'to satisfy', {
        exitCode: 1,
        stderr: 'error message',
        stdout: 'partial output',
      });

      const logContent = readFileSync(logPath, 'utf-8');
      expect(logContent, 'to contain', 'exit code 1');
    });

    it('uses custom cwd from action', async () => {
      let capturedCwd = '';

      const mockExecutor = async (
        _file: string,
        _args: string[],
        options: { cwd: string },
      ): Promise<{ stderr: string; stdout: string; }> => {
        capturedCwd = options.cwd;
        return { stderr: '', stdout: '' };
      };

      const action: WatchAction = {
        cwd: '/custom/path',
        prompt: 'Test',
      };

      await executeAction(
        'w_test1234',
        action,
        {},
        {
          executor: mockExecutor,
          logPath,
        },
      );

      expect(capturedCwd, 'to equal', '/custom/path');
    });
  });

  describe('writeResult', () => {
    it('writes JSON to correct path', async () => {
      const result: WatchResult = {
        action: {
          completedAt: '2025-01-08T00:00:00.000Z',
          cwd: '/test',
          exitCode: 0,
          prompt: 'Test prompt',
          stderr: '',
          stdout: 'success',
        },
        firedAt: '2025-01-08T00:00:00.000Z',
        params: ['lodash', '4.18.0'],
        trigger: 'npm-publish',
        triggerOutput: { package: 'lodash', version: '4.18.0' },
        watchId: 'w_test1234',
      };

      await writeResult(result, { resultPath });

      const written = JSON.parse(readFileSync(resultPath, 'utf-8'));
      expect(written, 'to satisfy', {
        params: ['lodash', '4.18.0'],
        trigger: 'npm-publish',
        watchId: 'w_test1234',
      });
    });
  });

  describe('executeAndWriteResult', () => {
    it('combines execution and writing', async () => {
      const mockExecutor = async (): Promise<{
        stderr: string;
        stdout: string;
      }> => {
        return { stderr: '', stdout: 'combined output' };
      };

      const action: WatchAction = { prompt: 'Combined {{pkg}}' };
      const triggerOutput = { pkg: 'react' };

      const result = await executeAndWriteResult(
        'w_combined',
        'npm-publish',
        ['react', '18.0.0'],
        action,
        triggerOutput,
        '2025-01-08T12:00:00.000Z',
        {
          executor: mockExecutor,
          logPath,
          resultPath,
        },
      );

      // Check return value
      expect(result, 'to satisfy', {
        firedAt: '2025-01-08T12:00:00.000Z',
        params: ['react', '18.0.0'],
        trigger: 'npm-publish',
        triggerOutput: { pkg: 'react' },
        watchId: 'w_combined',
      });
      expect(result.action, 'to satisfy', {
        exitCode: 0,
        prompt: 'Combined react',
        stdout: 'combined output',
      });

      // Check written file
      const written = JSON.parse(readFileSync(resultPath, 'utf-8'));
      expect(written.watchId, 'to equal', 'w_combined');
      expect(written.action.stdout, 'to equal', 'combined output');

      // Check log file
      const logContent = readFileSync(logPath, 'utf-8');
      expect(logContent, 'to contain', 'Combined react');
    });
  });
});
