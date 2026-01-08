/**
 * Manual tests for npm-publish trigger
 *
 * These tests make network calls to the npm registry. Run manually: npm run
 * test:triggers
 *
 * Prerequisites: curl must be available
 */

import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

import { expect } from 'bupkis';

import { executeTrigger } from '../trigger-executor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const triggersDir = join(__dirname, '..', '..', 'triggers');

describe('npm-publish trigger (manual)', () => {
  it('exits 0 and outputs JSON for published package', async () => {
    // lodash@4.17.21 is a well-known, stable version that won't be unpublished
    const result = await executeTrigger(
      'npm-publish',
      ['lodash', '4.17.21'],
      triggersDir,
    );

    expect(result.fired, 'to be true');
    expect(result.output, 'to satisfy', {
      package: 'lodash',
      version: '4.17.21',
      slug: 'lodash@4.17.21',
    });
    expect(result.error, 'to be undefined');
  });

  it('exits 1 for non-existent version', async () => {
    const result = await executeTrigger(
      'npm-publish',
      ['lodash', '99.99.99'],
      triggersDir,
    );

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
    expect(result.error, 'to be undefined');
  });

  it('exits 1 for non-existent package', async () => {
    const result = await executeTrigger(
      'npm-publish',
      ['this-package-definitely-does-not-exist-xyz123abc', '1.0.0'],
      triggersDir,
    );

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
  });

  it('exits 1 with stderr for missing args', async () => {
    const result = await executeTrigger('npm-publish', [], triggersDir);

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
    // The trigger writes usage to stderr, which we log but don't capture in result
  });

  it('exits 1 with stderr for missing version arg', async () => {
    const result = await executeTrigger('npm-publish', ['lodash'], triggersDir);

    expect(result.fired, 'to be false');
    expect(result.output, 'to be null');
  });

  it('JSON output has correct shape', async () => {
    const result = await executeTrigger(
      'npm-publish',
      ['express', '4.18.2'],
      triggersDir,
    );

    expect(result.fired, 'to be true');
    expect(result.output, 'to have property', 'package');
    expect(result.output, 'to have property', 'version');
    expect(result.output, 'to have property', 'slug');
    expect(Object.keys(result.output!).sort(), 'to deep equal', [
      'package',
      'slug',
      'version',
    ]);
  });
});
