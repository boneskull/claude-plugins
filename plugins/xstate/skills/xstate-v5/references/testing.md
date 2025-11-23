# XState v5 Testing Reference (Backend Focus)

This reference covers testing XState v5 actors and state machines for **backend applications**. For comprehensive actor testing patterns, see the [xstate-audition skill](../../xstate-audition/SKILL.md).

## Testing Strategy Overview

XState v5 testing for backend applications focuses on:

- Actor lifecycle and behavior testing
- State transition verification
- Event handling and inter-actor communication
- Asynchronous operation testing
- Error handling and recovery

## Recommended Testing Library: xstate-audition

For comprehensive actor testing, use **[xstate-audition](https://boneskull.github.io/xstate-audition/)**, which provides:

- Dependency-free XState v5 actor testing
- Async-first testing utilities
- Comprehensive actor lifecycle testing
- Built-in timeout handling
- Curried functions for test reusability

See the [xstate-audition skill documentation](../../xstate-audition/SKILL.md) for detailed usage patterns.

## Basic Unit Testing

While xstate-audition excels at actor testing, you may need to unit test individual pieces:

### Testing Guards in Isolation

```typescript
import { describe, test, expect } from 'vitest';

// Guard function
const isValidThreshold = ({ context }: { context: { value: number } }) =>
  context.value > 10;

describe('guards', () => {
  test('isValidThreshold returns true for values > 10', () => {
    expect(isValidThreshold({ context: { value: 15 } })).toBe(true);
    expect(isValidThreshold({ context: { value: 5 } })).toBe(false);
  });
});
```

### Testing Action Functions

```typescript
import { vi, describe, test, expect } from 'vitest';

// Action function
const logMessage = ({ context, event }: any) => {
  console.log(`Event: ${event.type}, Count: ${context.count}`);
};

test('logMessage action logs correctly', () => {
  const consoleSpy = vi.spyOn(console, 'log');

  logMessage({
    context: { count: 5 },
    event: { type: 'TEST_EVENT' },
  });

  expect(consoleSpy).toHaveBeenCalledWith('Event: TEST_EVENT, Count: 5');
});
```

## Backend-Specific Testing Patterns

### Testing Database Transaction States

```typescript
import { createActor } from 'xstate';
import { runUntilDone, waitForSnapshot } from 'xstate-audition';

const dbTransactionMachine = createMachine({
  initial: 'idle',
  states: {
    idle: {
      on: { BEGIN: 'transaction' },
    },
    transaction: {
      initial: 'processing',
      states: {
        processing: {
          invoke: {
            src: 'executeQuery',
            onDone: 'committing',
            onError: 'rollingBack',
          },
        },
        committing: {
          invoke: {
            src: 'commitTransaction',
            onDone: '#db.success',
            onError: '.rollingBack',
          },
        },
        rollingBack: {
          invoke: {
            src: 'rollbackTransaction',
            onDone: '#db.failed',
          },
        },
      },
    },
    success: { type: 'final' },
    failed: { type: 'final' },
  },
});

test('successful database transaction', async () => {
  const actor = createActor(dbTransactionMachine);
  const promise = waitForSnapshot(actor, (s) => s.matches('success'));

  actor.send({ type: 'BEGIN' });
  await promise;

  expect(actor.getSnapshot().value).toBe('success');
});
```

### Testing Message Queue Processing

```typescript
const queueProcessorMachine = createMachine({
  context: {
    messages: [],
    processed: 0,
    failed: 0,
  },
  initial: 'polling',
  states: {
    polling: {
      invoke: {
        src: 'pollQueue',
        onDone: {
          target: 'processing',
          actions: assign({
            messages: ({ event }) => event.output,
          }),
        },
      },
    },
    processing: {
      always: [
        {
          target: 'idle',
          guard: ({ context }) => context.messages.length === 0,
        },
        {
          target: 'processingMessage',
        },
      ],
    },
    processingMessage: {
      invoke: {
        src: 'processMessage',
        input: ({ context }) => context.messages[0],
        onDone: {
          target: 'processing',
          actions: assign({
            messages: ({ context }) => context.messages.slice(1),
            processed: ({ context }) => context.processed + 1,
          }),
        },
        onError: {
          target: 'processing',
          actions: assign({
            messages: ({ context }) => context.messages.slice(1),
            failed: ({ context }) => context.failed + 1,
          }),
        },
      },
    },
    idle: {
      after: {
        5000: 'polling',
      },
    },
  },
});

test('processes queue messages', async () => {
  const actor = createActor(queueProcessorMachine);

  await waitForSnapshot(actor, (snapshot) => snapshot.context.processed >= 3);

  expect(actor.getSnapshot().context.failed).toBe(0);
});
```

### Testing API Rate Limiting States

```typescript
const rateLimiterMachine = createMachine({
  context: {
    requestCount: 0,
    resetTime: null,
  },
  initial: 'ready',
  states: {
    ready: {
      on: {
        REQUEST: [
          {
            target: 'throttled',
            guard: ({ context }) => context.requestCount >= 100,
            actions: assign({
              resetTime: () => Date.now() + 60000,
            }),
          },
          {
            target: 'processing',
            actions: assign({
              requestCount: ({ context }) => context.requestCount + 1,
            }),
          },
        ],
      },
    },
    processing: {
      invoke: {
        src: 'handleRequest',
        onDone: 'ready',
        onError: 'ready',
      },
    },
    throttled: {
      after: {
        60000: {
          target: 'ready',
          actions: assign({
            requestCount: 0,
            resetTime: null,
          }),
        },
      },
    },
  },
});

test('enforces rate limits', async () => {
  const actor = createActor(rateLimiterMachine);

  // Send 100 requests
  for (let i = 0; i < 100; i++) {
    actor.send({ type: 'REQUEST' });
  }

  // 101st request should be throttled
  actor.send({ type: 'REQUEST' });

  await waitForSnapshot(actor, (s) => s.matches('throttled'));
  expect(actor.getSnapshot().context.resetTime).toBeDefined();
});
```

## Testing with Mock Services

### Mocking External Services

```typescript
import { vi } from 'vitest';
import { fromPromise } from 'xstate';

test('handles service failures gracefully', async () => {
  const mockService = vi
    .fn()
    .mockRejectedValue(new Error('Service unavailable'));

  const machine = setup({
    actors: {
      externalService: fromPromise(mockService),
    },
  }).createMachine({
    initial: 'calling',
    states: {
      calling: {
        invoke: {
          src: 'externalService',
          onError: {
            target: 'fallback',
            actions: assign({
              error: ({ event }) => event.error.message,
            }),
          },
        },
      },
      fallback: {
        type: 'final',
      },
    },
  });

  const actor = createActor(machine);
  const result = await runUntilDone(actor);

  expect(actor.getSnapshot().context.error).toBe('Service unavailable');
  expect(mockService).toHaveBeenCalledTimes(1);
});
```

## Testing Async Behavior

### Using waitFor from xstate

```typescript
import { waitFor } from 'xstate';

test('waits for async completion', async () => {
  const actor = createActor(asyncMachine);
  actor.start();

  actor.send({ type: 'START_ASYNC' });

  const snapshot = await waitFor(
    actor,
    (snapshot) => snapshot.context.isComplete === true,
    { timeout: 5000 },
  );

  expect(snapshot.context.result).toBeDefined();
});
```

### Testing with Fake Timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest';

describe('delayed transitions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('transitions after delay', () => {
    const actor = createActor(delayedMachine);
    actor.start();

    expect(actor.getSnapshot().value).toBe('waiting');

    vi.advanceTimersByTime(5000);

    expect(actor.getSnapshot().value).toBe('ready');
  });
});
```

## Testing Actor Communication

### Testing Parent-Child Actors

```typescript
import { spawn, sendTo } from 'xstate';
import { runUntilSpawn, waitForSnapshot } from 'xstate-audition';

test('parent spawns and communicates with child', async () => {
  const parentMachine = createMachine({
    initial: 'idle',
    context: {
      childResponse: null,
    },
    states: {
      idle: {
        on: {
          START: {
            actions: spawn(childMachine, { id: 'child' }),
            target: 'waiting',
          },
        },
      },
      waiting: {
        on: {
          CHILD_RESPONSE: {
            actions: assign({
              childResponse: ({ event }) => event.data,
            }),
            target: 'done',
          },
        },
        entry: sendTo('child', { type: 'PROCESS' }),
      },
      done: { type: 'final' },
    },
  });

  const actor = createActor(parentMachine);
  const childRef = await runUntilSpawn(actor, 'child');

  await waitForSnapshot(actor, (s) => s.matches('done'));

  expect(actor.getSnapshot().context.childResponse).toBeDefined();
});
```

## Performance Testing

```typescript
test('handles high throughput', async () => {
  const start = performance.now();
  const actor = createActor(highThroughputMachine);

  actor.start();

  // Send many events rapidly
  for (let i = 0; i < 10000; i++) {
    actor.send({ type: 'PROCESS', data: i });
  }

  await waitFor(actor, (s) => s.context.processedCount === 10000);

  const duration = performance.now() - start;
  expect(duration).toBeLessThan(5000); // Should process within 5 seconds
});
```

## Error Handling Tests

```typescript
test('recovers from errors with retry', async () => {
  let attempts = 0;
  const mockService = vi.fn().mockImplementation(() => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Temporary failure');
    }
    return { success: true };
  });

  const retryMachine = createMachine({
    context: { retries: 0, maxRetries: 3 },
    initial: 'attempting',
    states: {
      attempting: {
        invoke: {
          src: fromPromise(mockService),
          onDone: 'success',
          onError: [
            {
              target: 'attempting',
              guard: ({ context }) => context.retries < context.maxRetries,
              actions: assign({
                retries: ({ context }) => context.retries + 1,
              }),
            },
            {
              target: 'failed',
            },
          ],
        },
      },
      success: { type: 'final' },
      failed: { type: 'final' },
    },
  });

  const actor = createActor(retryMachine);
  await runUntilDone(actor);

  expect(actor.getSnapshot().value).toBe('success');
  expect(mockService).toHaveBeenCalledTimes(3);
});
```

## Test Organization Best Practices

1. **Separate unit tests from integration tests** - Test guards and actions separately from full actor behavior
2. **Use xstate-audition for actor tests** - Leverage its powerful async utilities
3. **Mock external dependencies** - Database, APIs, message queues
4. **Test error paths explicitly** - Ensure graceful degradation
5. **Use descriptive test names** - Clearly indicate what behavior is being tested
6. **Keep tests focused** - One behavior per test
7. **Use fake timers for time-dependent logic** - Control time progression explicitly

## Summary

For backend XState v5 testing:

- Use **[xstate-audition](../../xstate-audition/SKILL.md)** for comprehensive actor testing
- Focus on actor behavior, not UI interactions
- Test database transactions, message processing, and API interactions
- Mock external services appropriately
- Handle async behavior with proper utilities
- Ensure error recovery and retry logic works correctly
