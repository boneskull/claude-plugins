# XState v5 Actors Reference

## Actor Model Fundamentals

Actors are independent entities that:

- Maintain private, encapsulated state
- Communicate via asynchronous message passing (events)
- Process messages sequentially from an internal mailbox
- Can create new child actors
- Can only expose internal state through events or snapshots

## Actor Types Overview

| Actor Type    | Receives Events | Sends Events | Spawns Actors | Has Output | Use Case            |
| ------------- | --------------- | ------------ | ------------- | ---------- | ------------------- |
| State Machine | Yes             | Yes          | Yes           | Yes        | Complex state logic |
| Promise       | No              | Yes          | No            | Yes        | Async operations    |
| Transition    | Yes             | Yes          | No            | No         | Pure reducers       |
| Callback      | Yes             | Yes          | No            | No         | Imperative logic    |
| Observable    | No              | Yes          | No            | No         | Streams             |

## Creating and Managing Actors

### Basic Actor Creation

```typescript
import { createActor } from 'xstate';

const actor = createActor(someLogic, {
  id: 'myActor',
  input: { initialData: 'value' },
  snapshot: previousSnapshot, // For restoration
  systemId: 'mySystem',
  logger: console.log,
});

// Lifecycle
actor.start(); // Must call to begin processing
actor.stop(); // Stops actor and all children
```

### Actor Subscription

```typescript
// Simple observer function
const subscription = actor.subscribe((snapshot) => {
  console.log('State:', snapshot.value);
  console.log('Context:', snapshot.context);
});

// Full observer object
actor.subscribe({
  next(snapshot) {
    console.log('New snapshot:', snapshot);
  },
  error(err) {
    console.error('Actor error:', err);
  },
  complete() {
    console.log('Actor completed');
  },
});

// Cleanup
subscription.unsubscribe();
```

### Snapshot Access

```typescript
// Synchronous snapshot access
const currentSnapshot = actor.getSnapshot();

// Persistable snapshot (serializable)
const persistedSnapshot = actor.getPersistedSnapshot();
localStorage.setItem('actor-state', JSON.stringify(persistedSnapshot));
```

## State Machine Actors

The most powerful actor type, implementing full statechart semantics.

```typescript
import { createMachine, createActor } from 'xstate';

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  context: { count: 0 },
  states: {
    inactive: {
      on: {
        TOGGLE: {
          target: 'active',
          actions: assign({ count: ({ context }) => context.count + 1 }),
        },
      },
    },
    active: {
      on: { TOGGLE: 'inactive' },
    },
  },
});

const actor = createActor(toggleMachine);
actor.start();
actor.send({ type: 'TOGGLE' });
```

## Promise Actors

Handle single async operations that resolve or reject.

```typescript
import { fromPromise, createActor } from 'xstate';

// Basic promise actor
const fetchLogic = fromPromise(async () => {
  const response = await fetch('/api/data');
  return response.json();
});

// With input parameter
const fetchWithInput = fromPromise(async ({ input }) => {
  const response = await fetch(`/api/data/${input.id}`);
  return response.json();
});

// With abort signal
const cancellableFetch = fromPromise(async ({ input, signal }) => {
  const response = await fetch('/api/data', { signal });
  return response.json();
});

// Usage
const actor = createActor(fetchWithInput, {
  input: { id: '123' },
});

actor.subscribe({
  next: (snapshot) => {
    if (snapshot.status === 'done') {
      console.log('Result:', snapshot.output);
    }
  },
  error: (err) => console.error('Failed:', err),
});

actor.start();
```

## Transition Actors

Pure reducers that transform state based on events.

```typescript
import { fromTransition, createActor } from 'xstate';

const counterLogic = fromTransition(
  (state, event) => {
    switch (event.type) {
      case 'INC':
        return { ...state, count: state.count + 1 };
      case 'DEC':
        return { ...state, count: state.count - 1 };
      case 'RESET':
        return { count: 0 };
      default:
        return state;
    }
  },
  { count: 0 }, // Initial state
);

const actor = createActor(counterLogic);
actor.start();
actor.send({ type: 'INC' });
console.log(actor.getSnapshot().context.count); // 1
```

## Callback Actors

Imperative actors for complex side effects and cleanup.

```typescript
import { fromCallback, createActor } from 'xstate';

const intervalLogic = fromCallback(({ sendBack, receive, input }) => {
  // Setup
  console.log('Starting with input:', input);

  const interval = setInterval(() => {
    sendBack({ type: 'TICK', timestamp: Date.now() });
  }, 1000);

  // Event handler
  receive((event) => {
    if (event.type === 'STOP_TICKING') {
      clearInterval(interval);
    }
  });

  // Cleanup function (called on stop)
  return () => {
    clearInterval(interval);
    console.log('Cleaned up');
  };
});

const actor = createActor(intervalLogic, {
  input: { message: 'Timer started' },
});

actor.subscribe((snapshot) => {
  console.log('Snapshot:', snapshot);
});

actor.start();
// Later: actor.send({ type: 'STOP_TICKING' });
// Or: actor.stop();
```

## Observable Actors

Integration with reactive streams (RxJS, etc.).

```typescript
import { fromObservable, createActor } from 'xstate';
import { interval } from 'rxjs';
import { map } from 'rxjs/operators';

const timerLogic = fromObservable(() =>
  interval(1000).pipe(map((i) => ({ type: 'TICK', count: i }))),
);

const actor = createActor(timerLogic);
actor.subscribe((snapshot) => {
  console.log('Event from observable:', snapshot.context);
});
actor.start();
```

## Invoking vs Spawning Actors

### Invoked Actors (State-based)

Tied to state lifecycle - start on entry, stop on exit.

```typescript
const machine = createMachine({
  states: {
    loading: {
      invoke: {
        id: 'fetcher',
        src: fromPromise(async () => {
          const res = await fetch('/api');
          return res.json();
        }),
        input: ({ context }) => ({ url: context.apiUrl }),
        onDone: {
          target: 'success',
          actions: assign({
            data: ({ event }) => event.output,
          }),
        },
        onError: {
          target: 'failure',
          actions: assign({
            error: ({ event }) => event.error,
          }),
        },
        onSnapshot: {
          actions: ({ event }) => {
            console.log('Invoked actor snapshot:', event.snapshot);
          },
        },
      },
    },
    success: {},
    failure: {},
  },
});
```

### Spawned Actors (Action-based)

Created dynamically, managed manually.

```typescript
import { spawn, stopChild } from 'xstate';

const parentMachine = createMachine({
  context: {
    todos: [],
    todoActors: {},
  },
  on: {
    ADD_TODO: {
      actions: assign({
        todoActors: ({ context, spawn }) => {
          const id = Math.random().toString();
          const todoActor = spawn(todoMachine, {
            id: `todo-${id}`,
            input: { text: event.text },
            syncSnapshot: true, // Sync snapshots with parent
          });

          return {
            ...context.todoActors,
            [id]: todoActor,
          };
        },
      }),
    },
    REMOVE_TODO: {
      actions: [
        stopChild(({ context, event }) => `todo-${event.id}`),
        assign({
          todoActors: ({ context, event }) => {
            const { [event.id]: removed, ...rest } = context.todoActors;
            return rest;
          },
        }),
      ],
    },
  },
});
```

## Actor Communication

### Sending Between Actors

```typescript
import { sendTo, sendParent } from 'xstate';

const childMachine = createMachine({
  entry: [
    // Send to parent
    sendParent({ type: 'CHILD_READY' }),
    // Or use emit (preferred in v5)
    emit({ type: 'CHILD_READY' }),
  ],
  on: {
    PING: {
      actions: emit({ type: 'PONG' }),
    },
  },
});

const parentMachine = createMachine({
  invoke: {
    id: 'child',
    src: childMachine,
  },
  on: {
    SEND_TO_CHILD: {
      actions: sendTo('child', { type: 'PING' }),
    },
    PONG: {
      actions: log('Received pong from child'),
    },
  },
});
```

### Actor System

```typescript
// Access system from any actor
const actor = createActor(machine);
actor.start();

// Get actor from system
const childActor = actor.system.get('childId');

// Inspect all actors in system
actor.system._set.forEach((actor, id) => {
  console.log(`Actor ${id}:`, actor.getSnapshot());
});
```

## Waiting for Actors

```typescript
import { waitFor } from 'xstate';

// Wait for condition
const doneSnapshot = await waitFor(
  actor,
  (snapshot) => snapshot.status === 'done',
  { timeout: 5000 }, // Optional timeout
);

// Convert to promise
import { toPromise } from 'xstate';

const result = await toPromise(actor);
// Resolves with output when done
// Rejects with error when failed
```

## Error Handling

### Promise Actor Errors

```typescript
const errorProneLogic = fromPromise(async () => {
  throw new Error('Something went wrong');
});

const machine = createMachine({
  invoke: {
    src: errorProneLogic,
    onError: {
      target: 'errorState',
      actions: ({ event }) => {
        console.error('Error:', event.error);
      },
    },
  },
});
```

### Callback Actor Error Reporting

```typescript
const callbackWithErrors = fromCallback(({ sendBack }) => {
  try {
    // risky operation
  } catch (error) {
    sendBack({ type: 'error.platform', error });
  }
});
```

## Actor Persistence

```typescript
// Save actor state
const actor = createActor(machine);
actor.subscribe(() => {
  const snapshot = actor.getPersistedSnapshot();
  localStorage.setItem('actor-state', JSON.stringify(snapshot));
});
actor.start();

// Restore actor state
const savedState = localStorage.getItem('actor-state');
if (savedState) {
  const restoredActor = createActor(machine, {
    snapshot: JSON.parse(savedState),
  });
  restoredActor.start();
}
```

## Best Practices

### 1. Choose the Right Actor Type

- **State machines**: Complex logic with multiple states
- **Promises**: Single async operations
- **Transitions**: Pure state reducers
- **Callbacks**: Imperative code with cleanup
- **Observables**: Stream integrations

### 2. Actor Lifecycle Management

```typescript
// Always subscribe before starting
const subscription = actor.subscribe(observer);
actor.start();

// Clean up properly
subscription.unsubscribe();
actor.stop();
```

### 3. Error Boundaries

```typescript
// Always handle errors in parent
const parentMachine = createMachine({
  invoke: {
    src: childLogic,
    onError: {
      actions: [
        log('Child failed'),
        assign({ error: ({ event }) => event.error }),
      ],
    },
  },
});
```

### 4. Input Validation

```typescript
const actorWithInput = fromPromise(async ({ input }) => {
  // Validate input
  if (!input?.id) {
    throw new Error('ID required');
  }
  return fetchData(input.id);
});
```

### 5. Sync vs Async Snapshots

```typescript
// Spawned actors can sync snapshots with parent
spawn(childMachine, {
  id: 'child',
  syncSnapshot: true, // Parent re-renders on child changes
});
```

## Testing Actors

```typescript
import { createActor } from 'xstate';
import { expect, test } from 'vitest';

test('actor processes events correctly', async () => {
  const actor = createActor(machine);

  const states = [];
  actor.subscribe((snapshot) => {
    states.push(snapshot.value);
  });

  actor.start();
  actor.send({ type: 'EVENT1' });
  actor.send({ type: 'EVENT2' });

  expect(states).toEqual(['initial', 'state1', 'state2']);
});

test('promise actor resolves', async () => {
  const actor = createActor(promiseLogic);
  actor.start();

  const result = await toPromise(actor);
  expect(result).toEqual({ data: 'expected' });
});
```
