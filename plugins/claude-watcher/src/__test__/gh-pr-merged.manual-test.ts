/**
 * Manual tests for gh-pr-merged trigger
 *
 * These tests require the gh CLI to be installed and authenticated. Run
 * manually: npm run test:triggers
 *
 * Prerequisites:
 *
 * - Gh CLI installed
 * - Gh auth login (authenticated)
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { expect } from 'bupkis';

import { executeTrigger } from '../trigger-executor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const triggersDir = join(__dirname, '..', '..', 'triggers');

// Known merged PR for testing
const MERGED_PR_REPO = 'boneskull/claude-plugins';
const MERGED_PR_NUMBER = '82';

// Known open PR for testing (we'll use a high number that likely doesn't exist or is open)
const OPEN_OR_NONEXISTENT_PR_NUMBER = '999999';

describe('gh-pr-merged trigger (manual)', () => {
  it('exits 0 and outputs JSON for merged PR', async () => {
    const result = await executeTrigger(
      'gh-pr-merged',
      [MERGED_PR_REPO, MERGED_PR_NUMBER],
      triggersDir,
    );

    expect(result.fired, 'to be true');
    expect(result.output, 'to satisfy', {
      repo: MERGED_PR_REPO,
      pr: parseInt(MERGED_PR_NUMBER, 10),
      prUrl: `https://github.com/${MERGED_PR_REPO}/pull/${MERGED_PR_NUMBER}`,
    });
    expect(result.error, 'to be undefined');
  });

  it('exits 1 for non-existent PR', async () => {
    const result = await executeTrigger(
      'gh-pr-merged',
      [MERGED_PR_REPO, OPEN_OR_NONEXISTENT_PR_NUMBER],
      triggersDir,
    );

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
  });

  it('exits 1 for open/unmerged PR', async () => {
    // Using a currently open PR in facebook/react
    // Note: This test may need updating if the PR gets merged
    const result = await executeTrigger(
      'gh-pr-merged',
      ['facebook/react', '35471'],
      triggersDir,
    );

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
  });

  it('exits 1 with stderr for missing args', async () => {
    const result = await executeTrigger('gh-pr-merged', [], triggersDir);

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
  });

  it('exits 1 with stderr for missing PR number arg', async () => {
    const result = await executeTrigger(
      'gh-pr-merged',
      [MERGED_PR_REPO],
      triggersDir,
    );

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
  });

  it('JSON output has correct shape', async () => {
    const result = await executeTrigger(
      'gh-pr-merged',
      [MERGED_PR_REPO, MERGED_PR_NUMBER],
      triggersDir,
    );

    expect(result.fired, 'to be true');
    expect(result.output, 'to have property', 'repo');
    expect(result.output, 'to have property', 'pr');
    expect(result.output, 'to have property', 'prUrl');
    expect(Object.keys(result.output!).sort(), 'to deep equal', [
      'pr',
      'prUrl',
      'repo',
    ]);
  });

  it('handles invalid repo format gracefully', async () => {
    const result = await executeTrigger(
      'gh-pr-merged',
      ['invalid-repo-format', '1'],
      triggersDir,
    );

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
  });
});
