---
description: Expert guidance on testing XState v5 Actors using xstate-audition library for comprehensive state machine and actor testing
triggers:
  - xstate-audition
  - testing state machines
  - testing actors
  - actor testing
  - state machine testing
  - xstate test
  - runUntilDone
  - waitForSnapshot
---

# XState Audition Testing Skill

You are an expert in testing XState v5 Actors using **xstate-audition**, a dependency-free library for testing XState actor behavior. Use this knowledge to guide test implementation with best practices for state machine and actor testing.

## When to Use xstate-audition

Use **xstate-audition** when:

- ✅ Testing XState v5 Actors (state machines, promise actors, callback actors, etc.)
- ✅ Verifying state transitions and actor lifecycle behavior
- ✅ Testing event handling, emissions, and inter-actor communication
- ✅ Validating actor spawning and hierarchical actor systems
- ✅ Testing asynchronous actor behavior with timeouts
- ✅ Comprehensive actor integration testing

**Do NOT use xstate-audition for:**

- ❌ Unit testing pure functions (guards, actions in isolation)
- ❌ Testing UI components directly (use framework-specific testing tools)
- ❌ XState v4 actors (this library is v5-only)

## Core Testing Pattern

All xstate-audition functions follow this pattern:

1. Create an `Actor` using `createActor(logic)`
2. Create a `Promise<T>` using a condition function (e.g., `runUntilDone(actor)`)
3. **If** the actor needs external input, perform that operation _before_ awaiting
4. `await` the `Promise<T>`
5. Make assertions about `T`

```typescript
import { createActor } from 'xstate';
import { runUntilDone } from 'xstate-audition';

const actor = createActor(myMachine);
const result = await runUntilDone(actor); // starts and runs to completion
assert.equal(result, expectedOutput);
```

## Key Functions Overview

### `runUntil*()` vs `waitFor*()`

- **`runUntil*()`**: Starts the actor, waits for condition, then **stops** the actor
- **`waitFor*()`**: Starts the actor, waits for condition, but **keeps** the actor running

Use `runUntil*()` for isolated tests, `waitFor*()` when you need to continue testing.

### Function Categories

1. **Completion Testing**: `runUntilDone()` - Wait for final state
2. **Emission Testing**: `runUntilEmitted()` - Wait for event emissions
3. **Transition Testing**: `runUntilTransition()` - Wait for specific state changes
4. **Snapshot Testing**: `runUntilSnapshot()` - Wait for snapshot predicate
5. **Spawn Testing**: `runUntilSpawn()` - Wait for child actor spawning
6. **Event Testing**: `runUntilEventReceived()`, `runUntilEventSent()` - Inter-actor communication

## Common Testing Patterns

### Pattern 1: Testing Promise Actors

```typescript
import { createActor, fromPromise } from 'xstate';
import { runUntilDone } from 'xstate-audition';

const promiseLogic = fromPromise<string, string>(async ({ input }) => {
  return `hello ${input}`;
});

it('should complete with expected output', async () => {
  const actor = createActor(promiseLogic, { input: 'world' });
  const result = await runUntilDone(actor);

  assert.equal(result, 'hello world');
});
```

### Pattern 2: Testing State Transitions

```typescript
import { runUntilTransition } from 'xstate-audition';

it('should transition from idle to loading', async () => {
  const actor = createActor(fetchMachine);

  // Curried form for reusability
  const waitFromIdle = runUntilTransition(actor, 'fetchMachine.idle');

  actor.send({ type: 'FETCH' });
  await waitFromIdle('fetchMachine.loading');
});
```

### Pattern 3: Testing Event Emissions

```typescript
import { emit, setup } from 'xstate';
import { runUntilEmitted } from 'xstate-audition';

const emitterMachine = setup({
  types: {
    emitted: {} as { type: 'READY'; value: string },
  },
}).createMachine({
  entry: emit({ type: 'READY', value: 'initialized' }),
});

it('should emit READY event on entry', async () => {
  const actor = createActor(emitterMachine);
  const [event] = await runUntilEmitted(actor, ['READY']);

  assert.deepEqual(event, { type: 'READY', value: 'initialized' });
});
```

### Pattern 4: Testing with External Input

When actors need events to satisfy conditions:

```typescript
import { waitForSpawn } from 'xstate-audition';

it('should spawn child when event received', async () => {
  const actor = createActor(spawnerMachine);

  // Setup the promise BEFORE sending the event
  const promise = waitForSpawn(actor, 'childId');

  // Now send the event that triggers spawning
  actor.send({ type: 'SPAWN' });

  // Finally await the result
  const childRef = await promise;
  assert.equal(childRef.id, 'childId');
});
```

### Pattern 5: Testing Snapshot Predicates

```typescript
import { runUntilSnapshot } from 'xstate-audition';

it('should reach error state with error in context', async () => {
  const actor = createActor(fetchMachine);

  actor.send({ type: 'FETCH', url: 'invalid' });

  const snapshot = await runUntilSnapshot(
    actor,
    (snapshot) => snapshot.matches('error') && snapshot.context.error !== null,
  );

  assert.ok(snapshot.context.error);
  assert.equal(snapshot.value, 'error');
});
```

## Using AuditionOptions

All functions ending in `With()` accept `AuditionOptions` as the second parameter:

```typescript
import { runUntilDoneWith } from 'xstate-audition';

it('should timeout if takes too long', async () => {
  const actor = createActor(slowMachine);

  await assert.rejects(
    runUntilDoneWith(actor, { timeout: 100 }), // 100ms timeout
    (err: Error) => {
      assert.match(err.message, /did not complete in 100ms/);
      return true;
    },
  );
});
```

### AuditionOptions Properties

- **`timeout`** (default: 1000ms): Maximum wait time. Set to `0`, negative, or `Infinity` to disable.
- **`logger`** (default: no-op): Custom logger function for debugging.
- **`inspector`**: Custom inspector callback or observer for actor events.

## Currying Pattern

All functions are curried for reusability:

```typescript
import { runUntilTransition } from 'xstate-audition';

describe('stateMachine', () => {
  let actor: Actor<typeof machine>;
  let runFromIdle: CurryTransitionP2<typeof actor>;

  beforeEach(() => {
    actor = createActor(machine);
    // Curry with actor and fromState
    runFromIdle = runUntilTransition(actor, 'machine.idle');
  });

  it('should transition to loading', async () => {
    actor.send({ type: 'FETCH' });
    await runFromIdle('machine.loading');
  });

  it('should transition to success', async () => {
    actor.send({ type: 'FETCH' });
    actor.send({ type: 'SUCCESS' });
    await runFromIdle('machine.success');
  });
});
```

## Best Practices

### ✅ DO

1. **Use currying for repeated patterns** - Reduce boilerplate in test suites
2. **Set external input before awaiting** - Avoid race conditions
3. **Use `waitFor*()` for multi-stage tests** - Keep actor alive for sequential assertions
4. **Provide explicit type arguments** - Especially for `runUntilSpawn()` to get correct types
5. **Use appropriate timeouts** - Set timeout less than test framework timeout
6. **Test state transitions explicitly** - Use `runUntilTransition()` for clear intent
7. **Use `runUntilSnapshot()` for complex conditions** - When multiple conditions must be met

### ❌ DON'T

1. **Don't await immediately for event-driven actors** - Setup promise, send event, then await
2. **Don't use xstate-audition for unit testing** - Test guards and actions separately
3. **Don't rely on default timeout** - Be explicit when tests are expected to be slow
4. **Don't mix v4 and v5** - This library is v5-only
5. **Don't forget type parameters** - Especially for spawned actors
6. **Don't test UI directly** - Use framework-specific testing tools
7. **Don't use string event types** - Use typed event objects for better type safety

## Testing Hierarchical Actors

When testing parent/child actor systems:

```typescript
import { runUntilSpawn, waitForSnapshot } from 'xstate-audition';

it('should spawn child and communicate', async () => {
  const parent = createActor(parentMachine);

  // Wait for child to spawn
  const child = await waitForSpawn<typeof childLogic>(parent, 'childActor');

  // Parent still running, send event to child
  child.send({ type: 'CHILD_EVENT' });

  // Wait for parent to react to child's output
  await waitForSnapshot(parent, (snapshot) =>
    snapshot.matches('parentReacted'),
  );
});
```

## Integration with Test Frameworks

### Node.js test (built-in)

```typescript
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

describe('myMachine', () => {
  let actor: Actor<typeof myMachine>;

  beforeEach(() => {
    actor = createActor(myMachine);
  });

  it('should complete successfully', async () => {
    const result = await runUntilDone(actor);
    assert.equal(result, 'expected');
  });
});
```

### Jest/Vitest

```typescript
import { describe, it, beforeEach, expect } from 'vitest';

describe('myMachine', () => {
  it('should reach error state', async () => {
    const actor = createActor(myMachine);
    actor.send({ type: 'ERROR' });

    const snapshot = await runUntilSnapshot(actor, (s) => s.matches('error'));
    expect(snapshot.context.error).toBeDefined();
  });
});
```

## Debugging Failed Tests

When tests fail or timeout:

1. **Use custom logger**: Pass `{ logger: console.log }` to see actor activity
2. **Use inspector**: Pass `{ inspector: (event) => console.log(event) }` for detailed events
3. **Increase timeout**: Start with longer timeout to identify if it's a timing issue
4. **Check state IDs**: Ensure state IDs match (use machine ID prefix)
5. **Verify event types**: Ensure event type strings match exactly
6. **Test incrementally**: Break complex tests into smaller steps

```typescript
import { runUntilSnapshotWith } from 'xstate-audition';

const snapshot = await runUntilSnapshotWith(
  actor,
  {
    logger: console.log,
    timeout: 5000,
    inspector: (event) => console.log('Inspector:', event),
  },
  (snapshot) => snapshot.matches('targetState'),
);
```

## Reference Documentation

For detailed API documentation, see the [references](./references/) directory:

- [Core Functions](./references/core-functions.md) - Detailed API for all main functions
- [Options & Types](./references/options-types.md) - AuditionOptions and TypeScript types
- [Testing Patterns](./references/testing-patterns.md) - Advanced patterns and examples

## Common Mistakes

1. **Awaiting before sending required event**:

   ```typescript
   // ❌ WRONG - promise created but never satisfied
   const promise = waitForSnapshot(actor, (s) => s.matches('done'));
   await promise; // hangs forever, no event sent!

   // ✅ CORRECT
   const promise = waitForSnapshot(actor, (s) => s.matches('done'));
   actor.send({ type: 'COMPLETE' }); // send before await
   await promise;
   ```

2. **Wrong state ID format**:

   ```typescript
   // ❌ WRONG - missing machine ID prefix
   await runUntilTransition(actor, 'idle', 'loading');

   // ✅ CORRECT - include machine ID
   await runUntilTransition(actor, 'myMachine.idle', 'myMachine.loading');
   ```

3. **Not providing type parameters for spawn**:

   ```typescript
   // ❌ WRONG - type is AnyActorRef (not useful)
   const child = await runUntilSpawn(actor, 'childId');
   // ✅ CORRECT - explicit type
   const child = await runUntilSpawn<typeof childLogic>(actor, 'childId');
   ```

When implementing tests with xstate-audition:

- Start with simple `runUntilDone()` tests for basic actor behavior
- Use specific condition functions (`runUntilTransition`, `runUntilEmitted`) for targeted tests
- Leverage currying to reduce test boilerplate
- Always consider timing - setup promises before triggering conditions
- Use TypeScript types for better test reliability

Remember: xstate-audition excels at testing actor behavior and interactions. It complements (not replaces) unit testing of individual guards, actions, and services.
