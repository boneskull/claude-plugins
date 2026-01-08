/**
 * Tests for trigger-executor.ts
 *
 * These tests create actual executable scripts in a temp directory.
 */

import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, afterEach, before, describe, it, TestContext } from 'node:test';

import { expect } from 'bupkis';

import {
  executeTrigger,
  listTriggers,
  triggerExists,
} from '../trigger-executor.js';

describe('trigger-executor', () => {
  let tempDir: string;

  before(() => {
    // Create temp directory for test triggers
    tempDir = mkdtempSync(join(tmpdir(), 'claude-watcher-triggers-test-'));
  });

  after(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  /** Helper to create an executable trigger script */
  function createTrigger(
    name: string,
    script: string,
    options: { yaml?: string; executable?: boolean } = {},
  ): void {
    const triggerPath = join(tempDir, name);
    writeFileSync(triggerPath, script, 'utf-8');
    if (options.executable !== false) {
      chmodSync(triggerPath, 0o755);
    }
    if (options.yaml) {
      writeFileSync(join(tempDir, `${name}.yaml`), options.yaml, 'utf-8');
    }
  }

  /** Helper to remove a trigger */
  function removeTrigger(name: string): void {
    try {
      rmSync(join(tempDir, name));
    } catch {
      // Ignore if doesn't exist
    }
    try {
      rmSync(join(tempDir, `${name}.yaml`));
    } catch {
      // Ignore if doesn't exist
    }
  }

  describe('executeTrigger', () => {
    afterEach(() => {
      // Clean up triggers after each test
      removeTrigger('test-trigger');
      removeTrigger('json-trigger');
      removeTrigger('invalid-json-trigger');
      removeTrigger('failing-trigger');
      removeTrigger('stderr-trigger');
    });

    it('returns {fired: true, output} when trigger exits 0 with valid JSON', async () => {
      createTrigger(
        'json-trigger',
        `#!/bin/bash
echo '{"status": "ready", "count": 42}'
exit 0`,
      );

      const result = await executeTrigger('json-trigger', [], tempDir);

      expect(result, 'to satisfy', {
        fired: true,
        output: { status: 'ready', count: 42 },
      });
      expect(result.error, 'to be undefined');
    });

    it('returns {fired: true, output: {}, error} when trigger exits 0 with invalid JSON', async () => {
      createTrigger(
        'invalid-json-trigger',
        `#!/bin/bash
echo 'not valid json'
exit 0`,
      );

      const result = await executeTrigger('invalid-json-trigger', [], tempDir);

      expect(result, 'to satisfy', {
        fired: true,
        output: {},
        error: expect.it('to match', /not valid JSON/),
      });
    });

    it('returns {fired: false, output: null} when trigger exits non-zero', async () => {
      createTrigger(
        'failing-trigger',
        `#!/bin/bash
exit 1`,
      );

      const result = await executeTrigger('failing-trigger', [], tempDir);

      expect(result, 'to satisfy', {
        fired: false,
        output: null,
      });
      expect(result.error, 'to be undefined');
    });

    it('returns {fired: false, error} when trigger not found', async () => {
      const result = await executeTrigger('nonexistent-trigger', [], tempDir);

      expect(result, 'to satisfy', {
        fired: false,
        output: null,
        error: expect.it('to match', /not found or not executable/),
      });
    });

    it('passes params to trigger', async () => {
      createTrigger(
        'test-trigger',
        `#!/bin/bash
# Use printf to properly escape JSON
printf '{"arg1": "%s", "arg2": "%s"}' "$1" "$2"
exit 0`,
      );

      const result = await executeTrigger(
        'test-trigger',
        ['hello', 'world'],
        tempDir,
      );

      expect(result, 'to satisfy', {
        fired: true,
        output: { arg1: 'hello', arg2: 'world' },
      });
    });

    it('logs stderr to console.error', async (t: TestContext) => {
      const consoleErrorMock = t.mock.method(console, 'error');

      createTrigger(
        'stderr-trigger',
        `#!/bin/bash
echo '{"ok": true}'
echo "warning message" >&2
exit 0`,
      );

      await executeTrigger('stderr-trigger', [], tempDir);

      expect(
        consoleErrorMock.mock.calls.length,
        'to be greater than or equal to',
        1,
      );
      const calls = consoleErrorMock.mock.calls.map((c) => c.arguments[0]);
      expect(
        calls.some((c: string) => c.includes('[trigger:stderr-trigger]')),
        'to be true',
      );
    });
  });

  describe('listTriggers', () => {
    afterEach(() => {
      removeTrigger('trigger-a');
      removeTrigger('trigger-b');
      removeTrigger('.hidden-trigger');
      removeTrigger('non-exec');
    });

    it('returns trigger names for executables', async () => {
      createTrigger('trigger-a', '#!/bin/bash\nexit 0');
      createTrigger('trigger-b', '#!/bin/bash\nexit 0');

      const triggers = await listTriggers(tempDir);

      expect(triggers, 'to have length', 2);
      expect(triggers.map((t) => t.name).sort(), 'to deep equal', [
        'trigger-a',
        'trigger-b',
      ]);
    });

    it('parses YAML sidecar metadata when present', async () => {
      createTrigger('trigger-a', '#!/bin/bash\nexit 0', {
        yaml: `name: trigger-a
description: A test trigger
args:
  - name: pkg
    description: Package name
defaultInterval: 60s`,
      });

      const triggers = await listTriggers(tempDir);

      expect(triggers[0], 'to satisfy', {
        name: 'trigger-a',
        description: 'A test trigger',
        args: [{ name: 'pkg', description: 'Package name' }],
        defaultInterval: '60s',
      });
    });

    it('skips non-executable files', async () => {
      createTrigger('trigger-a', '#!/bin/bash\nexit 0');
      createTrigger('non-exec', '#!/bin/bash\nexit 0', { executable: false });

      const triggers = await listTriggers(tempDir);

      expect(triggers, 'to have length', 1);
      expect(triggers[0].name, 'to equal', 'trigger-a');
    });

    it('skips hidden files', async () => {
      createTrigger('trigger-a', '#!/bin/bash\nexit 0');
      createTrigger('.hidden-trigger', '#!/bin/bash\nexit 0');

      const triggers = await listTriggers(tempDir);

      expect(triggers, 'to have length', 1);
      expect(triggers[0].name, 'to equal', 'trigger-a');
    });

    it('returns empty array when triggers dir is empty', async () => {
      // Clean up any leftover triggers
      removeTrigger('trigger-a');
      removeTrigger('trigger-b');

      const triggers = await listTriggers(tempDir);
      expect(triggers, 'to be empty');
    });
  });

  describe('triggerExists', () => {
    afterEach(() => {
      removeTrigger('existing-trigger');
      removeTrigger('non-exec');
    });

    it('returns true for executable trigger', async () => {
      createTrigger('existing-trigger', '#!/bin/bash\nexit 0');

      const exists = await triggerExists('existing-trigger', tempDir);

      expect(exists, 'to be true');
    });

    it('returns false for missing trigger', async () => {
      const exists = await triggerExists('missing-trigger', tempDir);

      expect(exists, 'to be false');
    });

    it('returns false for non-executable file', async () => {
      createTrigger('non-exec', '#!/bin/bash\nexit 0', { executable: false });

      const exists = await triggerExists('non-exec', tempDir);

      expect(exists, 'to be false');
    });
  });
});
