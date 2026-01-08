/**
 * Tests for utils.ts
 */

import { describe, it } from 'node:test';

import { expect } from 'bupkis';

import {
  calculateExpiry,
  formatWatch,
  generateWatchId,
  getIntervalMs,
  interpolatePrompt,
  parseDuration,
} from '../utils.js';

describe('generateWatchId', () => {
  it('returns a string matching w_[8-char] pattern', () => {
    const id = generateWatchId();
    expect(id, 'to match', /^w_[a-f0-9]{8}$/);
  });

  it('generates unique IDs', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateWatchId());
    }
    expect(ids.size, 'to equal', 100);
  });
});

describe('parseDuration', () => {
  it('parses seconds', () => {
    expect(parseDuration('30s'), 'to equal', 30000);
  });

  it('parses minutes', () => {
    expect(parseDuration('5m'), 'to equal', 300000);
  });

  it('parses hours', () => {
    expect(parseDuration('48h'), 'to equal', 172800000);
  });

  it('parses days', () => {
    expect(parseDuration('7d'), 'to equal', 604800000);
  });

  it('throws on invalid duration', () => {
    expect(
      () => parseDuration('invalid'),
      'to throw',
      'Invalid duration: invalid',
    );
  });

  it('throws on empty string', () => {
    // ms library throws its own error for empty string
    expect(() => parseDuration(''), 'to throw');
  });
});

describe('calculateExpiry', () => {
  it('returns ISO timestamp in future', () => {
    const before = Date.now();
    const expiry = calculateExpiry('1h');
    const after = Date.now();

    const expiryMs = new Date(expiry).getTime();
    const oneHour = 3600000;

    expect(expiryMs, 'to be greater than or equal to', before + oneHour);
    expect(expiryMs, 'to be less than or equal to', after + oneHour);
  });

  it('uses default TTL when no argument', () => {
    const before = Date.now();
    const expiry = calculateExpiry();
    const expiryMs = new Date(expiry).getTime();
    const fortyEightHours = 48 * 3600000;

    // Should be approximately 48h from now
    expect(expiryMs - before, 'to be close to', fortyEightHours, 1000);
  });

  it('returns valid ISO string', () => {
    const expiry = calculateExpiry('1h');
    expect(expiry, 'to match', /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/);
  });
});

describe('getIntervalMs', () => {
  it('returns milliseconds for provided interval', () => {
    expect(getIntervalMs('1m'), 'to equal', 60000);
  });

  it('uses default interval when undefined', () => {
    // DEFAULT_INTERVAL is '30s' = 30000ms
    expect(getIntervalMs(), 'to equal', 30000);
  });
});

describe('interpolatePrompt', () => {
  it('replaces {{var}} with values', () => {
    const result = interpolatePrompt('Hello {{name}}!', { name: 'World' });
    expect(result, 'to equal', 'Hello World!');
  });

  it('handles multiple variables', () => {
    const result = interpolatePrompt('{{a}} + {{b}} = {{c}}', {
      a: 1,
      b: 2,
      c: 3,
    });
    expect(result, 'to equal', '1 + 2 = 3');
  });

  it('leaves unknown vars intact', () => {
    const result = interpolatePrompt('{{known}} and {{unknown}}', {
      known: 'yes',
    });
    expect(result, 'to equal', 'yes and {{unknown}}');
  });

  it('handles empty variables object', () => {
    const result = interpolatePrompt('No {{vars}} here', {});
    expect(result, 'to equal', 'No {{vars}} here');
  });

  it('converts non-string values to strings', () => {
    const result = interpolatePrompt('Count: {{count}}, Active: {{active}}', {
      count: 42,
      active: true,
    });
    expect(result, 'to equal', 'Count: 42, Active: true');
  });

  it('handles undefined values by leaving placeholder', () => {
    const result = interpolatePrompt('Value: {{val}}', { val: undefined });
    expect(result, 'to equal', 'Value: {{val}}');
  });
});

describe('formatWatch', () => {
  it('returns expected string format', () => {
    const watch = {
      id: 'w_abc12345',
      trigger: 'npm-publish',
      params: ['lodash', '4.18.0'],
      status: 'active',
      expiresAt: '2025-01-10T00:00:00.000Z',
    };

    const result = formatWatch(watch);

    expect(
      result,
      'to equal',
      'w_abc12345: npm-publish lodash 4.18.0 [active] (expires 2025-01-10T00:00:00.000Z)',
    );
  });

  it('handles empty params', () => {
    const watch = {
      id: 'w_xyz98765',
      trigger: 'my-trigger',
      params: [],
      status: 'fired',
      expiresAt: '2025-01-09T12:00:00.000Z',
    };

    const result = formatWatch(watch);

    expect(
      result,
      'to equal',
      'w_xyz98765: my-trigger  [fired] (expires 2025-01-09T12:00:00.000Z)',
    );
  });
});
