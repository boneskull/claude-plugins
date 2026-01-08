/**
 * Tests for action-executor.ts
 *
 * Uses mock executor to avoid actually calling claude CLI.
 */

import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, afterEach, before, describe, it } from 'node:test';

import { expect } from 'bupkis';

import {
  executeAction,
  executeAndWriteResult,
  writeResult,
} from '../action-executor.js';
import { WatchAction, WatchResult } from '../types.js';

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
    rmSync(tempDir, { recursive: true, force: true });
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
      ): Promise<{ stdout: string; stderr: string }> => {
        capturedArgs = args;
        return { stdout: 'success', stderr: '' };
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
      ): Promise<{ stdout: string; stderr: string }> => {
        capturedFile = file;
        capturedArgs = args;
        return { stdout: 'result', stderr: '' };
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
        stdout: string;
        stderr: string;
      }> => {
        return { stdout: 'output from claude', stderr: 'warning' };
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
        prompt: 'Test prompt',
        exitCode: 0,
        stdout: 'output from claude',
        stderr: 'warning',
      });
      expect(result.completedAt, 'to match', /^\d{4}-\d{2}-\d{2}T/);
    });

    it('appends to log file', async () => {
      const mockExecutor = async (): Promise<{
        stdout: string;
        stderr: string;
      }> => {
        return { stdout: 'claude output here', stderr: '' };
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
          stdout: string;
          stderr: string;
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
        stdout: 'partial output',
        stderr: 'error message',
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
      ): Promise<{ stdout: string; stderr: string }> => {
        capturedCwd = options.cwd;
        return { stdout: '', stderr: '' };
      };

      const action: WatchAction = {
        prompt: 'Test',
        cwd: '/custom/path',
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
        watchId: 'w_test1234',
        trigger: 'npm-publish',
        params: ['lodash', '4.18.0'],
        triggerOutput: { package: 'lodash', version: '4.18.0' },
        action: {
          prompt: 'Test prompt',
          cwd: '/test',
          exitCode: 0,
          stdout: 'success',
          stderr: '',
          completedAt: '2025-01-08T00:00:00.000Z',
        },
        firedAt: '2025-01-08T00:00:00.000Z',
      };

      await writeResult(result, { resultPath });

      const written = JSON.parse(readFileSync(resultPath, 'utf-8'));
      expect(written, 'to satisfy', {
        watchId: 'w_test1234',
        trigger: 'npm-publish',
        params: ['lodash', '4.18.0'],
      });
    });
  });

  describe('executeAndWriteResult', () => {
    it('combines execution and writing', async () => {
      const mockExecutor = async (): Promise<{
        stdout: string;
        stderr: string;
      }> => {
        return { stdout: 'combined output', stderr: '' };
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
        watchId: 'w_combined',
        trigger: 'npm-publish',
        params: ['react', '18.0.0'],
        triggerOutput: { pkg: 'react' },
        firedAt: '2025-01-08T12:00:00.000Z',
      });
      expect(result.action, 'to satisfy', {
        prompt: 'Combined react',
        exitCode: 0,
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
