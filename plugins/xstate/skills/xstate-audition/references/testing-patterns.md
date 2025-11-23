# xstate-audition Testing Patterns

Advanced patterns, best practices, and real-world examples for testing XState actors with xstate-audition.

## Table of Contents

- [Test Organization Patterns](#test-organization-patterns)
- [Currying Patterns](#currying-patterns)
- [Hierarchical Actor Testing](#hierarchical-actor-testing)
- [Event Communication Patterns](#event-communication-patterns)
- [Timeout and Error Testing](#timeout-and-error-testing)
- [Integration Testing Patterns](#integration-testing-patterns)
- [Debugging Failed Tests](#debugging-failed-tests)
- [Performance Testing](#performance-testing)
- [Advanced TypeScript Patterns](#advanced-typescript-patterns)

---

## Test Organization Patterns

### Pattern: Describe Block with Shared Setup

Organize tests with shared actor creation and curried functions.

```typescript
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { createActor } from 'xstate';
import {
  runUntilDone,
  runUntilTransition,
  type CurryTransitionP2,
} from 'xstate-audition';

describe('FetchMachine', () => {
  let actor: Actor<typeof fetchMachine>;
  let runFromIdle: CurryTransitionP2<typeof actor>;

  beforeEach(() => {
    actor = createActor(fetchMachine);
    runFromIdle = runUntilTransition(actor, 'fetch.idle');
  });

  describe('successful fetch', () => {
    it('should transition from idle to loading', async () => {
      actor.send({ type: 'FETCH' });
      await runFromIdle('fetch.loading');
    });

    it('should complete with data', async () => {
      actor.send({ type: 'FETCH' });
      actor.send({ type: 'SUCCESS', data: 'test' });

      const snapshot = await runUntilSnapshot(actor, (s) =>
        s.matches('success'),
      );

      assert.equal(snapshot.context.data, 'test');
    });
  });

  describe('failed fetch', () => {
    it('should transition to error state', async () => {
      actor.send({ type: 'FETCH' });
      actor.send({ type: 'ERROR', error: new Error('Network error') });

      await runFromIdle('fetch.error');
    });
  });
});
```

### Pattern: Factory Functions for Test Actors

Create reusable factory functions for common test scenarios.

```typescript
import { createActorFromLogic } from 'xstate-audition';

// Factory with preset configuration
function createTestActor(input: string) {
  return createActor(myMachine, {
    input,
    logger: process.env.DEBUG ? console.log : undefined,
  });
}

// Factory with currying
const createActorWithInput = createActorFromLogic(myMachine);

describe('myMachine', () => {
  it('should work with input A', async () => {
    const actor = createActorWithInput({ input: 'A' });
    const output = await runUntilDone(actor);
    assert.equal(output, 'processed-A');
  });

  it('should work with input B', async () => {
    const actor = createActorWithInput({ input: 'B' });
    const output = await runUntilDone(actor);
    assert.equal(output, 'processed-B');
  });
});
```

### Pattern: Parameterized Tests

Test multiple scenarios with the same logic.

```typescript
const testCases = [
  { input: 'hello', expected: 'HELLO' },
  { input: 'world', expected: 'WORLD' },
  { input: '', expected: '' },
];

describe('StringTransformMachine', () => {
  testCases.forEach(({ input, expected }) => {
    it(`should transform "${input}" to "${expected}"`, async () => {
      const actor = createActor(transformMachine, { input });
      const output = await runUntilDone(actor);
      assert.equal(output, expected);
    });
  });
});
```

---

## Currying Patterns

### Pattern: Multi-Level Currying

Create increasingly specific test helpers through currying.

```typescript
describe('TransitionMachine', () => {
  let actor: Actor<typeof machine>;
  let runWithActor: ReturnType<typeof runUntilTransition>;
  let runFromIdle: CurryTransitionP2<typeof actor>;

  beforeEach(() => {
    actor = createActor(machine);

    // Level 1: Curry with actor
    runWithActor = runUntilTransition(actor);

    // Level 2: Curry with actor + fromState
    runFromIdle = runWithActor('machine.idle');
  });

  it('should transition to loading', async () => {
    actor.send({ type: 'LOAD' });
    // Level 3: Only provide toState
    await runFromIdle('machine.loading');
  });

  it('should transition to success', async () => {
    actor.send({ type: 'LOAD' });
    actor.send({ type: 'SUCCESS' });
    await runFromIdle('machine.success');
  });
});
```

### Pattern: Shared Options with Currying

Create curried functions with preset options.

```typescript
import { runUntilSnapshotWith } from 'xstate-audition';

describe('SlowMachine', () => {
  const options = {
    timeout: 5000,
    logger: console.log,
  };

  it('should eventually reach done state', async () => {
    const actor = createActor(slowMachine);

    const snapshot = await runUntilSnapshotWith(actor, options, (s) =>
      s.matches('done'),
    );

    assert.ok(snapshot.matches('done'));
  });
});
```

---

## Hierarchical Actor Testing

### Pattern: Parent-Child Communication

Test parent-child actor interactions.

```typescript
import { waitForSpawn, waitForSnapshot } from 'xstate-audition';

const childLogic = fromPromise<string, string>(async ({ input }) => {
  return `processed: ${input}`;
});

const parentMachine = setup({
  actors: { child: childLogic },
  types: {
    context: {} as { result?: string },
    events: {} as { type: 'START'; value: string },
  },
}).createMachine({
  initial: 'idle',
  context: { result: undefined },
  states: {
    idle: {
      on: {
        START: 'processing',
      },
    },
    processing: {
      invoke: {
        id: 'worker',
        src: 'child',
        input: ({ event }) => event.value,
        onDone: {
          target: 'done',
          actions: assign({
            result: ({ event }) => event.output,
          }),
        },
      },
    },
    done: {
      type: 'final',
    },
  },
});

describe('Parent-Child Communication', () => {
  it('should spawn child and receive result', async () => {
    const parent = createActor(parentMachine);

    // Setup spawn detection
    const childPromise = waitForSpawn<typeof childLogic>(parent, 'worker');

    // Trigger spawning
    parent.send({ type: 'START', value: 'test' });

    // Wait for child to spawn
    const child = await childPromise;
    assert.equal(child.id, 'worker');

    // Wait for parent to complete
    const snapshot = await waitForSnapshot(parent, (s) => s.matches('done'));
    assert.equal(snapshot.context.result, 'processed: test');

    // Cleanup
    parent.stop();
  });
});
```

### Pattern: Testing Actor Hierarchies

Test complex multi-level actor systems.

```typescript
describe('Three-Level Hierarchy', () => {
  it('should coordinate grandparent-parent-child', async () => {
    const grandparent = createActor(grandparentMachine);

    // Wait for parent to spawn
    const parent = await waitForSpawn<typeof parentLogic>(
      grandparent,
      'parentActor',
    );

    // Wait for child to spawn (spawned by parent)
    const child = await waitForSpawn<typeof childLogic>(
      grandparent, // Detectable from root
      'childActor',
    );

    // Send event to child
    child.send({ type: 'WORK', value: 42 });

    // Wait for result to propagate to grandparent
    const snapshot = await waitForSnapshot(
      grandparent,
      (s) => s.context.finalResult !== undefined,
    );

    assert.equal(snapshot.context.finalResult, 42);

    grandparent.stop();
  });
});
```

---

## Event Communication Patterns

### Pattern: Inter-Actor Event Flow

Test event communication between actors.

```typescript
describe('Ping-Pong Actors', () => {
  it('should exchange events', async () => {
    const ping = createActor(pingMachine);
    const pong = createActor(pongMachine);

    // Start both actors
    ping.start();
    pong.start();

    try {
      // Setup detection for pong receiving PING
      const pongPromise = waitForEventReceived(pong, ['PING']);

      // Send PING from ping to pong
      ping.send({ type: 'START_PING', target: pong });

      // Wait for pong to receive
      const [receivedEvent] = await pongPromise;
      assert.equal(receivedEvent.type, 'PING');

      // Setup detection for ping receiving PONG
      const pingPromise = waitForEventReceived(ping, ['PONG']);

      // Pong responds
      pong.send({ type: 'RESPOND', target: ping });

      // Wait for ping to receive
      const [pongEvent] = await pingPromise;
      assert.equal(pongEvent.type, 'PONG');
    } finally {
      ping.stop();
      pong.stop();
    }
  });
});
```

### Pattern: Event Source Filtering

Test events from specific actor sources.

```typescript
describe('Multi-Child Event Filtering', () => {
  it('should filter events by source actor', async () => {
    const parent = createActor(parentMachine);

    // Parent spawns multiple children: child-1, child-2, child-3
    parent.send({ type: 'SPAWN_CHILDREN', count: 3 });

    // Wait for events only from child-2
    const events = await runUntilEventReceivedWith(
      parent,
      { otherActorId: 'child-2', timeout: 2000 },
      ['READY', 'COMPLETE'],
    );

    // Should only have events from child-2
    assert.equal(events.length, 2);
    assert.equal(events[0].type, 'READY');
    assert.equal(events[1].type, 'COMPLETE');
  });

  it('should filter events by pattern', async () => {
    const parent = createActor(parentMachine);

    // Filter events from any child matching pattern
    const events = await runUntilEventReceivedWith(
      parent,
      { otherActorId: /^child-\d+$/ },
      ['STATUS'],
    );

    assert.equal(events[0].type, 'STATUS');
  });
});
```

---

## Timeout and Error Testing

### Pattern: Testing Timeout Scenarios

Verify actors handle timeouts correctly.

```typescript
describe('Timeout Handling', () => {
  it('should timeout if actor takes too long', async () => {
    const actor = createActor(slowMachine);

    await assert.rejects(
      runUntilDoneWith(actor, { timeout: 100 }),
      (err: Error) => {
        assert.match(err.message, /did not complete in 100ms/);
        return true;
      },
    );
  });

  it('should complete within timeout', async () => {
    const actor = createActor(fastMachine);

    // Should not timeout
    const output = await runUntilDoneWith(actor, { timeout: 1000 });
    assert.ok(output);
  });

  it('should work with infinite timeout', async () => {
    const actor = createActor(unpredictableMachine);

    // No timeout
    const output = await runUntilDoneWith(actor, { timeout: Infinity });
    assert.ok(output);
  });
});
```

### Pattern: Error State Testing

Test error handling and recovery.

```typescript
describe('Error Handling', () => {
  it('should transition to error state on failure', async () => {
    const actor = createActor(fetchMachine);

    actor.send({ type: 'FETCH' });
    actor.send({ type: 'ERROR', error: new Error('Network failed') });

    const snapshot = await runUntilSnapshot(actor, (s) => s.matches('error'));

    assert.ok(snapshot.context.error);
    assert.match(snapshot.context.error.message, /Network failed/);
  });

  it('should retry after error', async () => {
    const actor = createActor(retryMachine);

    actor.send({ type: 'FETCH' });
    actor.send({ type: 'ERROR' });

    // Should transition to error
    await waitForSnapshot(actor, (s) => s.matches('error'));

    // Send retry
    actor.send({ type: 'RETRY' });

    // Should transition back to loading
    const snapshot = await waitForSnapshot(actor, (s) => s.matches('loading'));

    assert.ok(snapshot.matches('loading'));
    actor.stop();
  });
});
```

---

## Integration Testing Patterns

### Pattern: End-to-End Flow Testing

Test complete user flows through state machines.

```typescript
describe('User Registration Flow', () => {
  it('should complete full registration', async () => {
    const actor = createActor(registrationMachine);

    // Start registration
    const idleToForm = waitForTransition(
      actor,
      'registration.idle',
      'registration.form',
    );
    actor.send({ type: 'START_REGISTRATION' });
    await idleToForm;

    // Fill form
    actor.send({
      type: 'SUBMIT_FORM',
      data: { email: 'user@example.com', password: 'secure123' },
    });

    // Wait for validation
    await waitForSnapshot(actor, (s) => s.matches('validating'));

    // Simulate validation success
    actor.send({ type: 'VALIDATION_SUCCESS' });

    // Wait for API call
    await waitForSnapshot(actor, (s) => s.matches('submitting'));

    // Simulate API success
    actor.send({
      type: 'API_SUCCESS',
      userId: '123',
    });

    // Should reach success state
    const snapshot = await waitForSnapshot(actor, (s) => s.matches('success'));

    assert.equal(snapshot.context.userId, '123');
    actor.stop();
  });
});
```

### Pattern: Testing with External Services

Test actors that interact with external services.

```typescript
import { vi } from 'vitest';

describe('API Integration', () => {
  it('should call API and handle response', async () => {
    // Mock API
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({ id: '123', name: 'Test' }),
    });

    const machine = setup({
      actors: {
        fetchUser: fromPromise(async ({ input }) => {
          const response = await mockFetch(`/api/users/${input.id}`);
          return response.json();
        }),
      },
    }).createMachine({...});

    const actor = createActor(machine);

    actor.send({ type: 'FETCH_USER', id: '123' });

    const snapshot = await runUntilSnapshot(
      actor,
      (s) => s.context.userData !== null
    );

    assert.ok(mockFetch.calledOnce);
    assert.equal(snapshot.context.userData.id, '123');
  });
});
```

---

## Debugging Failed Tests

### Pattern: Adding Debug Logging

Use logger and inspector for debugging.

```typescript
describe('Debugging Failed Test', () => {
  it('should debug with logger', async () => {
    const actor = createActor(problemMachine);

    const snapshot = await runUntilSnapshotWith(
      actor,
      {
        logger: (...args) => console.log('[DEBUG]', ...args),
        timeout: 5000,
      },
      (s) => s.matches('targetState'),
    );

    // Logs will show all state transitions and actions
  });

  it('should debug with inspector', async () => {
    const actor = createActor(problemMachine);
    const events: any[] = [];

    const snapshot = await runUntilSnapshotWith(
      actor,
      {
        inspector: (event) => {
          events.push(event);
          console.log('Inspection:', event.type);
        },
        timeout: 5000,
      },
      (s) => s.matches('targetState'),
    );

    // Inspect collected events
    console.log('All events:', events);
  });
});
```

### Pattern: Incremental Testing

Break complex tests into smaller steps.

```typescript
describe('Complex Flow - Incremental', () => {
  it('Step 1: should start correctly', async () => {
    const actor = createActor(complexMachine);
    actor.send({ type: 'START' });

    await waitForSnapshot(actor, (s) => s.matches('started'));
    actor.stop();
  });

  it('Step 2: should process data', async () => {
    const actor = createActor(complexMachine);
    actor.send({ type: 'START' });
    await waitForSnapshot(actor, (s) => s.matches('started'));

    actor.send({ type: 'PROCESS', data: 'test' });
    await waitForSnapshot(actor, (s) => s.matches('processing'));

    actor.stop();
  });

  it('Step 3: should complete', async () => {
    const actor = createActor(complexMachine);
    actor.send({ type: 'START' });
    await waitForSnapshot(actor, (s) => s.matches('started'));

    actor.send({ type: 'PROCESS', data: 'test' });
    await waitForSnapshot(actor, (s) => s.matches('processing'));

    actor.send({ type: 'COMPLETE' });
    const snapshot = await runUntilSnapshot(actor, (s) => s.matches('done'));

    assert.ok(snapshot.matches('done'));
  });
});
```

---

## Performance Testing

### Pattern: Testing Timing Constraints

Verify actors meet performance requirements.

```typescript
describe('Performance', () => {
  it('should complete within 100ms', async () => {
    const start = Date.now();
    const actor = createActor(fastMachine);

    await runUntilDoneWith(actor, { timeout: 100 });

    const elapsed = Date.now() - start;
    assert.ok(elapsed < 100, `Took ${elapsed}ms, expected < 100ms`);
  });

  it('should handle burst of events', async () => {
    const actor = createActor(eventHandlerMachine);

    // Send many events rapidly
    const promise = waitForSnapshot(
      actor,
      (s) => s.context.processedCount === 1000,
    );

    for (let i = 0; i < 1000; i++) {
      actor.send({ type: 'PROCESS', id: i });
    }

    const snapshot = await promise;
    assert.equal(snapshot.context.processedCount, 1000);

    actor.stop();
  });
});
```

### Pattern: Memory Leak Detection

Test for memory leaks in long-running actors.

```typescript
describe('Memory Leaks', () => {
  it('should not leak memory with many iterations', async () => {
    const iterations = 1000;

    for (let i = 0; i < iterations; i++) {
      const actor = createActor(myMachine);
      await runUntilDone(actor);
      // Actor is stopped by runUntilDone
    }

    // If test completes, no obvious leaks
    // Use memory profiling tools for deeper analysis
  });
});
```

---

## Advanced TypeScript Patterns

### Pattern: Generic Test Helpers

Create reusable, type-safe test utilities.

```typescript
async function testMachineOutput<TLogic extends AnyActorLogic>(
  logic: TLogic,
  input: InputFrom<TLogic>,
  expectedOutput: OutputFrom<TLogic>,
) {
  const actor = createActor(logic, { input });
  const output = await runUntilDone(actor);

  assert.deepEqual(output, expectedOutput);
}

// Usage
await testMachineOutput(promiseMachine, 'input', 'expected-output');
```

### Pattern: Type-Safe Event Testing

Create helpers with full type inference.

```typescript
function createEmittedTester<TMachine extends AnyStateMachineActor>(
  machine: TMachine,
) {
  return async (
    emittedTypes: Array<EmittedFrom<TMachine>['type']>,
    assertions: (events: Array<EmittedFrom<TMachine>>) => void,
  ) => {
    const actor = createActor(machine);
    const events = await runUntilEmitted(actor, emittedTypes);
    assertions(events);
  };
}

// Usage with full type safety
const testEmitted = createEmittedTester(myMachine);

await testEmitted(['EVENT1', 'EVENT2'], (events) => {
  // events is fully typed as Array<EmittedFrom<typeof myMachine>>
  assert.equal(events[0].type, 'EVENT1');
  assert.equal(events[1].type, 'EVENT2');
});
```

### Pattern: Conditional Type Guards

Use type guards for snapshot testing.

```typescript
function isErrorState(
  snapshot: SnapshotFrom<typeof machine>,
): snapshot is SnapshotFrom<typeof machine> & { context: { error: Error } } {
  return snapshot.matches('error') && snapshot.context.error !== null;
}

it('should reach error state with error', async () => {
  const actor = createActor(machine);

  actor.send({ type: 'TRIGGER_ERROR' });

  const snapshot = await runUntilSnapshot(actor, isErrorState);

  // TypeScript knows snapshot.context.error is Error
  assert.equal(snapshot.context.error.message, 'Expected error');
});
```

---

## Best Practice Checklist

### Test Organization

- ✅ Use `describe` blocks for logical grouping
- ✅ Extract shared setup to `beforeEach`
- ✅ Clean up actors in `afterEach` if using `waitFor*`
- ✅ Use factory functions for actor creation
- ✅ Keep tests focused on single behavior

### Currying

- ✅ Curry repeated patterns in `beforeEach`
- ✅ Type curried functions explicitly
- ✅ Use multi-level currying for complex scenarios
- ✅ Create reusable helpers with preset options

### Assertions

- ✅ Assert on specific values, not just truthiness
- ✅ Use snapshot matchers for complex state
- ✅ Test both success and error paths
- ✅ Verify context changes, not just state values

### Performance

- ✅ Set explicit timeouts for slow operations
- ✅ Keep timeouts < test framework timeout
- ✅ Test timing constraints when critical
- ✅ Profile for memory leaks in long-running tests

### Debugging

- ✅ Add logger for failing tests
- ✅ Use inspector to see all events
- ✅ Break complex tests into steps
- ✅ Increase timeout to isolate timing issues

---

## See Also

- [Core Functions Reference](./core-functions.md) - Detailed API documentation
- [Options & Types](./options-types.md) - AuditionOptions and TypeScript types
