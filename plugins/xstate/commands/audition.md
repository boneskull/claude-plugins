---
description: Get expert guidance on testing XState v5 actors with xstate-audition
argument-hint: '[what-to-test]'
---

# XState Audition Testing Guidance

Provide expert guidance on testing XState v5 actors using the xstate-audition library for comprehensive state machine and actor testing.

## Usage

```bash
/audition [optional: what you need to test]
```

**Arguments:**

- `what-to-test` (optional): Describe what you're trying to test or paste test code you need help with

## Instructions

When this command is invoked:

1. **Load the xstate-audition skill** from `skills/xstate-audition/SKILL.md`

2. **If the user provided context**, analyze their needs and:
   - Identify which xstate-audition functions apply to their testing scenario
   - Provide specific test examples using xstate-audition APIs
   - Explain the testing pattern and timing considerations
   - Show best practices for the specific test case
   - Reference the appropriate documentation from `references/`:
     - Core Functions for API documentation
     - Options & Types for configuration details
     - Testing Patterns for advanced examples

3. **If no context was provided**, offer to help by:
   - Asking what they're trying to test or what actor behavior needs verification
   - Listing common test scenarios:
     - Testing state transitions
     - Testing promise actors and async operations
     - Testing event emissions and actor communication
     - Testing hierarchical actors and spawning
     - Testing with timeouts and error handling
     - Integration testing of actor systems
   - Offering to show examples of specific patterns

4. **Always emphasize xstate-audition best practices**:
   - Use currying for repeated patterns to reduce boilerplate
   - Set external input BEFORE awaiting (avoid race conditions)
   - Use `waitFor*()` for multi-stage tests (keeps actor alive)
   - Provide explicit type arguments (especially for `runUntilSpawn`)
   - Use appropriate timeouts (less than test framework timeout)
   - Test state transitions explicitly with `runUntilTransition()`
   - Use `runUntilSnapshot()` for complex conditions

5. **Explain the core testing pattern**:
   1. Create an Actor using `createActor(logic)`
   2. Create a Promise using a condition function (e.g., `runUntilDone(actor)`)
   3. If the actor needs external input, perform that operation BEFORE awaiting
   4. Await the Promise
   5. Make assertions about the result

6. **Clarify `runUntil*()` vs `waitFor*()`**:
   - `runUntil*()` - Starts actor, waits for condition, then STOPS the actor
   - `waitFor*()` - Starts actor, waits for condition, but KEEPS the actor running

## Example Interactions

**With context - testing a promise actor:**

```text
User: /audition How do I test this promise actor?
const fetchLogic = fromPromise(async ({ input }) => {
  const res = await fetch(input.url);
  return res.json();
});

Agent: Here's how to test your promise actor with xstate-audition:

\`\`\`typescript
import { createActor, fromPromise } from 'xstate';
import { runUntilDone } from 'xstate-audition';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

const fetchLogic = fromPromise<any, { url: string }>(
  async ({ input }) => {
    const res = await fetch(input.url);
    return res.json();
  }
);

describe('fetchLogic', () => {
  it('should complete with fetched data', async () => {
    const actor = createActor(fetchLogic, {
      input: { url: 'https://api.example.com/data' }
    });

    const result = await runUntilDone(actor);

    assert.ok(result);
    assert.equal(typeof result, 'object');
  });

  it('should handle errors', async () => {
    const actor = createActor(fetchLogic, {
      input: { url: 'https://invalid.url' }
    });

    await assert.rejects(
      runUntilDone(actor),
      (err: Error) => {
        assert.ok(err.message.includes('fetch'));
        return true;
      }
    );
  });
});
\`\`\`

Key patterns:
- `runUntilDone()` waits for the promise actor to complete
- Pass input via actor options
- Use `assert.rejects()` to test error cases
- The actor automatically starts when you await the promise
```

**With context - testing state transitions:**

```text
User: /audition I need to test that my machine transitions from idle to loading when FETCH is sent

Agent: Use `runUntilTransition()` to test explicit state changes:

\`\`\`typescript
import { createActor } from 'xstate';
import { runUntilTransition } from 'xstate-audition';
import { describe, it, beforeEach } from 'node:test';
import { strict as assert } from 'node:assert';

describe('fetchMachine transitions', () => {
  let actor: Actor<typeof fetchMachine>;
  let runFromIdle: CurryTransitionP2<typeof actor>;

  beforeEach(() => {
    actor = createActor(fetchMachine);
    // Curry with actor and fromState for reusability
    runFromIdle = runUntilTransition(actor, 'fetchMachine.idle');
  });

  it('should transition from idle to loading', async () => {
    // Setup the promise FIRST
    const promise = runFromIdle('fetchMachine.loading');

    // THEN send the event that triggers the transition
    actor.send({ type: 'FETCH' });

    // Finally await the result
    await promise;
  });

  it('should transition through loading to success', async () => {
    actor.send({ type: 'FETCH' });
    await runFromIdle('fetchMachine.success');
  });
});
\`\`\`

Important timing note:
1. Create the promise BEFORE sending the event
2. Send the event that triggers the transition
3. Then await the promise

This pattern avoids race conditions. The curried form (`runFromIdle`) reduces boilerplate!
```

**With context - testing event emissions:**

```text
User: /audition How do I test that my machine emits events?

Agent: Use `runUntilEmitted()` to test event emissions:

\`\`\`typescript
import { createActor, setup, emit } from 'xstate';
import { runUntilEmitted } from 'xstate-audition';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

const notifierMachine = setup({
  types: {
    emitted: {} as
      | { type: 'READY'; message: string }
      | { type: 'ERROR'; error: Error },
  },
}).createMachine({
  initial: 'initializing',
  states: {
    initializing: {
      entry: emit({ type: 'READY', message: 'System initialized' }),
      on: {
        START: 'running',
      },
    },
    running: {},
  },
});

describe('notifierMachine emissions', () => {
  it('should emit READY on initialization', async () => {
    const actor = createActor(notifierMachine);

    // Wait for READY event
    const [readyEvent] = await runUntilEmitted(actor, ['READY']);

    assert.equal(readyEvent.type, 'READY');
    assert.equal(readyEvent.message, 'System initialized');
  });

  it('should emit multiple events', async () => {
    const actor = createActor(notifierMachine);

    // Wait for any of these events
    const events = await runUntilEmitted(actor, ['READY', 'ERROR']);

    assert.ok(events.length > 0);
    assert.equal(events[0].type, 'READY');
  });
});
\`\`\`

The function returns an array of emitted events. Test the ones you care about!
```

**With context - testing hierarchical actors:**

```text
User: /audition How do I test parent/child actor communication?

Agent: Use `waitForSpawn()` to test hierarchical actors:

\`\`\`typescript
import { createActor } from 'xstate';
import { waitForSpawn, waitForSnapshot } from 'xstate-audition';
import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';

describe('parent-child communication', () => {
  it('should spawn child and communicate', async () => {
    const parent = createActor(parentMachine);

    // Wait for child to spawn (parent stays running)
    const child = await waitForSpawn<typeof childLogic>(
      parent,
      'childActor'
    );

    assert.ok(child);
    assert.equal(child.id, 'childActor');

    // Send event to child
    child.send({ type: 'CHILD_EVENT' });

    // Wait for parent to react to child's output
    const parentSnapshot = await waitForSnapshot(
      parent,
      (snapshot) => snapshot.matches('parentReacted')
    );

    assert.ok(parentSnapshot.matches('parentReacted'));
  });
});
\`\`\`

Key points:
- Use `waitForSpawn()` not `runUntilSpawn()` to keep parent running
- Provide type argument `<typeof childLogic>` for proper typing
- Parent stays alive so you can continue testing interactions
```

**Without context:**

```text
User: /audition

Agent: I can help you test XState v5 actors with xstate-audition! What do you need to test?

Common testing scenarios:
- **State transitions** - Test explicit state changes with `runUntilTransition()`
- **Promise actors** - Test async operations with `runUntilDone()`
- **Event emissions** - Test emitted events with `runUntilEmitted()`
- **Actor spawning** - Test child actors with `runUntilSpawn()` / `waitForSpawn()`
- **Complex conditions** - Test multiple conditions with `runUntilSnapshot()`
- **Event communication** - Test inter-actor events with `runUntilEventReceived()`
- **Timeout handling** - Test with custom timeouts using `*With()` functions
- **Integration tests** - Test complete actor systems with `waitFor*()` functions

You can also:
- Paste your existing test code for review
- Ask about specific xstate-audition functions
- Request help debugging timeout issues
- Learn about currying patterns for cleaner tests

Core testing pattern:
1. Create actor with `createActor(logic)`
2. Create promise with condition (e.g., `runUntilDone(actor)`)
3. If actor needs input, send events BEFORE awaiting
4. Await the promise
5. Make assertions

Key distinction:
- `runUntil*()` - stops actor after condition
- `waitFor*()` - keeps actor running

What would you like to test?
```

## Related Files

- [XState Audition Skill](../skills/xstate-audition/SKILL.md)
- [Core Functions Reference](../skills/xstate-audition/references/core-functions.md)
- [Options & Types Reference](../skills/xstate-audition/references/options-types.md)
- [Testing Patterns Reference](../skills/xstate-audition/references/testing-patterns.md)
