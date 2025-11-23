# xstate-audition Core Functions API Reference

Complete API reference for all xstate-audition testing functions.

## Function Naming Conventions

All functions follow consistent naming patterns:

- **`runUntil*()`**: Starts actor, waits for condition, **stops** actor
- **`waitFor*()`**: Starts actor, waits for condition, **keeps** actor running
- **`*With()`**: Accepts `AuditionOptions` as second parameter
- **Without `With()`**: Uses default options (no `AuditionOptions` parameter)

## runUntilDone / waitForDone

Run a Promise Actor or State Machine Actor to completion.

### Signatures

```typescript
function runUntilDone<TLogic extends AnyActorLogic>(
  actor: Actor<TLogic>,
): Promise<OutputFrom<TLogic>>;

function runUntilDoneWith<TLogic extends AnyActorLogic>(
  actor: Actor<TLogic>,
  options: AuditionOptions,
): Promise<OutputFrom<TLogic>>;
```

### Parameters

- **`actor`**: Actor to run (Promise Actor or State Machine Actor)
- **`options`** (With variant only): `AuditionOptions` object

### Returns

`Promise<Output>` - Resolves with actor output when reaching final state

### Behavior

- Starts the actor if not already started
- Waits for actor to reach final state (`type: 'final'`)
- Immediately stops the actor upon completion
- Rejects if timeout expires before completion

### Example

```typescript
const promiseLogic = fromPromise<string>(async () => 'result');
const actor = createActor(promiseLogic);

const output = await runUntilDone(actor);
// output === 'result'

// With timeout
await runUntilDoneWith(actor, { timeout: 100 });
```

### Notes

- Similar to XState's `toPromise()` but with options support
- No `waitForDone()` variant (would be identical to `runUntilDone()`)

---

## runUntilEmitted / waitForEmitted

Run a State Machine until it emits specified events.

### Signatures

```typescript
function runUntilEmitted<TActor extends AnyStateMachineActor>(
  actor: TActor,
  emittedTypes: Array<EmittedFrom<TActor>['type']>,
): Promise<Array<EmittedFrom<TActor>>>;

function runUntilEmittedWith<TActor extends AnyStateMachineActor>(
  actor: TActor,
  options: AuditionOptions,
  emittedTypes: Array<EmittedFrom<TActor>['type']>,
): Promise<Array<EmittedFrom<TActor>>>;

function waitForEmitted<TActor extends AnyStateMachineActor>(
  actor: TActor,
  emittedTypes: Array<EmittedFrom<TActor>['type']>,
): Promise<Array<EmittedFrom<TActor>>>;

function waitForEmittedWith<TActor extends AnyStateMachineActor>(
  actor: TActor,
  options: AuditionOptions,
  emittedTypes: Array<EmittedFrom<TActor>['type']>,
): Promise<Array<EmittedFrom<TActor>>>;
```

### Parameters

- **`actor`**: State Machine Actor
- **`options`** (With variant only): `AuditionOptions` object
- **`emittedTypes`**: Array of event type strings to wait for

### Returns

`Promise<Event[]>` - Resolves with array of emitted events (in order emitted)

### Behavior

- Starts the actor if not already started
- Waits for all specified event types to be emitted (via `emit()` action)
- `runUntil*` stops actor after all events emitted
- `waitFor*` keeps actor running after events emitted
- Order of events in array matches emission order

### Example

```typescript
const machine = setup({
  types: {
    emitted: {} as { type: 'READY' } | { type: 'DONE'; value: string },
  },
}).createMachine({
  entry: [emit({ type: 'READY' }), emit({ type: 'DONE', value: 'success' })],
});

const actor = createActor(machine);
const [readyEvent, doneEvent] = await runUntilEmitted(actor, ['READY', 'DONE']);
// readyEvent.type === 'READY'
// doneEvent.type === 'DONE', doneEvent.value === 'success'
```

### Notes

- Only applies to events emitted via XState's event emitter API (`emit()`)
- Does NOT track events sent between actors (use `runUntilEventSent/Received`)
- Events must be emitted in any order, not necessarily the specified order

### Currying

```typescript
// Curry with actor
const runUntilEmit = runUntilEmitted(actor);
const events = await runUntilEmit(['READY', 'DONE']);
```

---

## runUntilTransition / waitForTransition

Run a State Machine until it transitions from one state to another.

### Signatures

```typescript
function runUntilTransition<TActor extends AnyStateMachineActor>(
  actor: TActor,
  fromStateId: string,
  toStateId: string,
): Promise<void>;

function runUntilTransitionWith<TActor extends AnyStateMachineActor>(
  actor: TActor,
  options: AuditionOptions,
  fromStateId: string,
  toStateId: string,
): Promise<void>;

function waitForTransition<TActor extends AnyStateMachineActor>(
  actor: TActor,
  fromStateId: string,
  toStateId: string,
): Promise<void>;

function waitForTransitionWith<TActor extends AnyStateMachineActor>(
  actor: TActor,
  options: AuditionOptions,
  fromStateId: string,
  toStateId: string,
): Promise<void>;
```

### Parameters

- **`actor`**: State Machine Actor
- **`options`** (With variant only): `AuditionOptions` object
- **`fromStateId`**: Full state ID (including machine ID prefix)
- **`toStateId`**: Full state ID (including machine ID prefix)

### Returns

`Promise<void>` - Resolves when transition occurs

### Behavior

- Starts the actor if not already started
- Waits for actor to be in state `fromStateId`
- Then waits for transition to state `toStateId`
- `runUntil*` stops actor after transition
- `waitFor*` keeps actor running after transition
- Rejects if transition doesn't occur within timeout

### Example

```typescript
const machine = createMachine({
  id: 'fetch',
  initial: 'idle',
  states: {
    idle: {
      on: { FETCH: 'loading' },
    },
    loading: {
      on: { SUCCESS: 'success' },
    },
    success: {},
  },
});

const actor = createActor(machine);

// Setup promise
const promise = runUntilTransition(actor, 'fetch.idle', 'fetch.loading');

// Send event
actor.send({ type: 'FETCH' });

// Wait for transition
await promise;
```

### Important Notes

- **State IDs must include machine ID prefix**: `'machineId.stateId'`
- If no machine ID provided in `createMachine()`, default is `'(machine)'`
- Transition must be direct (from → to), not via intermediate states
- Useful for testing explicit transition paths

### Currying

```typescript
// Curry with actor and fromState
const runFromIdle = runUntilTransition(actor, 'fetch.idle');
await runFromIdle('fetch.loading');
```

---

## runUntilSnapshot / waitForSnapshot

Run an Actor until its snapshot satisfies a predicate.

### Signatures

```typescript
function runUntilSnapshot<TActor extends AnyActor>(
  actor: TActor,
  predicate: (snapshot: SnapshotFrom<TActor>) => boolean,
): Promise<SnapshotFrom<TActor>>;

function runUntilSnapshotWith<TActor extends AnyActor>(
  actor: TActor,
  options: AuditionOptions,
  predicate: (snapshot: SnapshotFrom<TActor>) => boolean,
): Promise<SnapshotFrom<TActor>>;

function waitForSnapshot<TActor extends AnyActor>(
  actor: TActor,
  predicate: (snapshot: SnapshotFrom<TActor>) => boolean,
): Promise<SnapshotFrom<TActor>>;

function waitForSnapshotWith<TActor extends AnyActor>(
  actor: TActor,
  options: AuditionOptions,
  predicate: (snapshot: SnapshotFrom<TActor>) => boolean,
): Promise<SnapshotFrom<TActor>>;
```

### Parameters

- **`actor`**: Any Actor type
- **`options`** (With variant only): `AuditionOptions` object
- **`predicate`**: Function that tests snapshot conditions

### Returns

`Promise<Snapshot>` - Resolves with snapshot that satisfied predicate

### Behavior

- Starts the actor if not already started
- Evaluates predicate on each snapshot change
- Resolves when predicate returns `true`
- `runUntil*` stops actor after predicate satisfied
- `waitFor*` keeps actor running after predicate satisfied

### Example

```typescript
const machine = setup({
  types: {
    context: {} as { count: number; status: string },
  },
}).createMachine({
  context: { count: 0, status: 'idle' },
  on: {
    INCREMENT: {
      actions: assign({ count: ({ context }) => context.count + 1 }),
    },
  },
});

const actor = createActor(machine);

const promise = runUntilSnapshot(
  actor,
  (snapshot) => snapshot.context.count >= 3,
);

actor.send({ type: 'INCREMENT' });
actor.send({ type: 'INCREMENT' });
actor.send({ type: 'INCREMENT' });

const snapshot = await promise;
// snapshot.context.count === 3
```

### Use Cases

- Testing complex context conditions
- Waiting for computed values
- Combining multiple state/context checks
- Testing conditions not tied to specific states

### Notes

- Similar to XState's `waitFor()` but with stop behavior
- Predicate called on every snapshot change
- Keep predicates performant (called frequently)

---

## runUntilSpawn / waitForSpawn

Run a State Machine until it spawns a child actor.

### Signatures

```typescript
function runUntilSpawn<TLogic extends AnyActorLogic = AnyActorLogic>(
  actor: AnyStateMachineActor,
  childId: string | RegExp,
): Promise<ActorRefFrom<TLogic>>;

function runUntilSpawnWith<TLogic extends AnyActorLogic = AnyActorLogic>(
  actor: AnyStateMachineActor,
  options: AuditionOptions,
  childId: string | RegExp,
): Promise<ActorRefFrom<TLogic>>;

function waitForSpawn<TLogic extends AnyActorLogic = AnyActorLogic>(
  actor: AnyStateMachineActor,
  childId: string | RegExp,
): Promise<ActorRefFrom<TLogic>>;

function waitForSpawnWith<TLogic extends AnyActorLogic = AnyActorLogic>(
  actor: AnyStateMachineActor,
  options: AuditionOptions,
  childId: string | RegExp,
): Promise<ActorRefFrom<TLogic>>;
```

### Parameters

- **`actor`**: State Machine Actor (parent)
- **`options`** (With variant only): `AuditionOptions` object
- **`childId`**: String or RegExp to match spawned child ID

### Type Parameters

- **`TLogic`**: Type of the spawned child's logic (for type safety)

### Returns

`Promise<ActorRef>` - Resolves with reference to spawned child actor

### Behavior

- Starts the actor if not already started
- Waits for any actor in the system to spawn child with matching ID
- `runUntil*` stops parent actor after spawn detected
- `waitFor*` keeps parent actor running after spawn detected
- Can match child spawned by parent or any descendant

### Example

```typescript
const childLogic = fromPromise<string>(async () => 'child result');

const parentMachine = setup({
  actors: { child: childLogic },
}).createMachine({
  on: {
    SPAWN: {
      actions: spawnChild('child', { id: 'myChild' }),
    },
  },
});

const actor = createActor(parentMachine);

// Provide explicit type for child
const promise = waitForSpawn<typeof childLogic>(actor, 'myChild');

actor.send({ type: 'SPAWN' });

const childRef = await promise;
// childRef.id === 'myChild'
// childRef has correct typing based on childLogic
```

### Important Notes

- **Always provide type parameter** for proper TypeScript typing
- Without type parameter, returns `AnyActorRef` (not useful)
- Cannot specify which parent should spawn the child
- Useful for testing actor hierarchies and dynamic spawning

### Currying

```typescript
const waitForChild = waitForSpawn<typeof childLogic>(actor);
const childRef = await waitForChild('myChild');
```

---

## runUntilEventReceived / waitForEventReceived

Run an Actor until it receives specified events.

### Signatures

```typescript
function runUntilEventReceived<TActor extends EventReceivingActor>(
  actor: TActor,
  eventTypes: Array<EventReceivedFrom<TActor>['type']>,
): Promise<Array<EventReceivedFrom<TActor>>>;

function runUntilEventReceivedWith<TActor extends EventReceivingActor>(
  actor: TActor,
  options: AuditionOptions & { otherActorId?: string | RegExp },
  eventTypes: Array<EventReceivedFrom<TActor>['type']>,
): Promise<Array<EventReceivedFrom<TActor>>>;

function waitForEventReceived<TActor extends EventReceivingActor>(
  actor: TActor,
  eventTypes: Array<EventReceivedFrom<TActor>['type']>,
): Promise<Array<EventReceivedFrom<TActor>>>;

function waitForEventReceivedWith<TActor extends EventReceivingActor>(
  actor: TActor,
  options: AuditionOptions & { otherActorId?: string | RegExp },
  eventTypes: Array<EventReceivedFrom<TActor>['type']>,
): Promise<Array<EventReceivedFrom<TActor>>>;
```

### Parameters

- **`actor`**: State Machine, Callback, or Transition Actor
- **`options`** (With variant only): `AuditionOptions` with optional `otherActorId`
- **`eventTypes`**: Array of event type strings to wait for

### Options Extension

- **`otherActorId`**: Filter events to only those received FROM actor with this ID

### Returns

`Promise<Event[]>` - Resolves with array of received events

### Behavior

- Starts the actor if not already started
- Waits for all specified event types to be received
- `runUntil*` stops actor after all events received
- `waitFor*` keeps actor running after events received
- If `otherActorId` provided, only counts events from that sender

### Example

```typescript
const machine = setup({
  types: {
    events: {} as { type: 'PING' } | { type: 'PONG' },
  },
}).createMachine({
  on: {
    PING: { actions: /* respond */ },
    PONG: { actions: /* respond */ },
  },
});

const actor = createActor(machine);
const promise = runUntilEventReceived(actor, ['PING', 'PONG']);

actor.send({ type: 'PING' });
actor.send({ type: 'PONG' });

const [pingEvent, pongEvent] = await promise;
```

### Use Cases

- Testing event handling
- Verifying inter-actor communication
- Testing event sources and filters

---

## runUntilEventSent / waitForEventSent

Run an Actor until it sends specified events to other actors.

### Signatures

```typescript
function runUntilEventSent<TActor extends AnyActor>(
  actor: TActor,
  eventTypes: string[],
): Promise<Array<EventObject>>;

function runUntilEventSentWith<TActor extends AnyActor>(
  actor: TActor,
  options: AuditionOptions & { otherActorId?: string | RegExp },
  eventTypes: string[],
): Promise<Array<EventObject>>;

function waitForEventSent<TActor extends AnyActor>(
  actor: TActor,
  eventTypes: string[],
): Promise<Array<EventObject>>;

function waitForEventSentWith<TActor extends AnyActor>(
  actor: TActor,
  options: AuditionOptions & { otherActorId?: string | RegExp },
  eventTypes: string[],
): Promise<Array<EventObject>>;
```

### Parameters

- **`actor`**: Any Actor type
- **`options`** (With variant only): `AuditionOptions` with optional `otherActorId`
- **`eventTypes`**: Array of event type strings to wait for

### Options Extension

- **`otherActorId`**: Filter events to only those sent TO actor with this ID

### Returns

`Promise<Event[]>` - Resolves with array of sent events

### Behavior

- Starts the actor if not already started
- Waits for actor to send all specified event types
- `runUntil*` stops actor after all events sent
- `waitFor*` keeps actor running after events sent
- If `otherActorId` provided, only counts events to that recipient

### Example

```typescript
const childLogic = fromPromise<string>(async () => 'done');

const parentMachine = setup({
  actors: { child: childLogic },
}).createMachine({
  invoke: {
    id: 'child',
    src: 'child',
    onDone: {
      actions: sendTo('child', { type: 'COMPLETE' }),
    },
  },
});

const actor = createActor(parentMachine);
const [sentEvent] = await runUntilEventSent(actor, ['COMPLETE']);
// sentEvent.type === 'COMPLETE'
```

---

## createActorFromLogic

Curried function to create actors from logic.

### Signature

```typescript
function createActorFromLogic<TLogic extends AnyActorLogic>(
  logic: TLogic,
  options?: ActorOptions<TLogic>,
): Actor<TLogic>;

// Curried
const createActor = createActorFromLogic(logic);
const actor = createActor(options);
```

### Parameters

- **`logic`**: Actor logic (machine, promise logic, etc.)
- **`options`**: XState actor options (input, inspect, logger, etc.)

### Returns

Curried function or Actor

### Use Case

Reduce boilerplate when testing same logic with different inputs:

```typescript
const createActor = createActorFromLogic(myLogic);

it('should work with input A', async () => {
  const actor = createActor({ input: 'A' });
  await runUntilDone(actor);
});

it('should work with input B', async () => {
  const actor = createActor({ input: 'B' });
  await runUntilDone(actor);
});
```

---

## createActorWith

Curried function to create actors with options.

### Signature

```typescript
function createActorWith<TLogic extends AnyActorLogic>(
  options: ActorOptions<TLogic>,
  logic: TLogic,
): Actor<TLogic>;

// Curried
const createActor = createActorWith(options);
const actor = createActor(logic);
```

### Parameters

- **`options`**: XState actor options (input, inspect, logger, etc.)
- **`logic`**: Actor logic (machine, promise logic, etc.)

### Returns

Curried function or Actor

### Use Case

Reduce boilerplate when testing different logic with same input:

```typescript
const createActor = createActorWith({ input: 'testInput' });

it('should work with machineA', async () => {
  const actor = createActor(machineA);
  await runUntilDone(actor);
});

it('should work with machineB', async () => {
  const actor = createActor(machineB);
  await runUntilDone(actor);
});
```

---

## patchActor

Modify an Actor for use with xstate-audition.

### Signature

```typescript
function patchActor<TActor extends AnyActor>(
  actor: TActor,
  options?: AuditionOptions,
): TActor;
```

### Parameters

- **`actor`**: Actor to modify
- **`options`**: Optional `AuditionOptions`

### Returns

Modified actor (same reference)

### Notes

- Used internally by all other functions
- Mutates the actor (adds internal tracking)
- Generally not needed in user code
- All other xstate-audition functions call this automatically

---

## unpatchActor

Revert modifications made by xstate-audition.

### Signature

```typescript
function unpatchActor<TActor extends AnyActor>(actor: TActor): TActor;
```

### Parameters

- **`actor`**: Actor to revert

### Returns

Reverted actor (same reference)

### Notes

- **Experimental** - may be removed in future
- Undoes internal mutations from `patchActor()`
- No-op if actor was never patched
- Rarely needed in practice

---

## Quick Reference Table

| Function                | Condition          | Stops Actor | Keeps Running | Options Support |
| ----------------------- | ------------------ | ----------- | ------------- | --------------- |
| `runUntilDone`          | Final state        | Yes         | No            | With variant    |
| `runUntilEmitted`       | Events emitted     | Yes         | No            | With variant    |
| `waitForEmitted`        | Events emitted     | No          | Yes           | With variant    |
| `runUntilTransition`    | State transition   | Yes         | No            | With variant    |
| `waitForTransition`     | State transition   | No          | Yes           | With variant    |
| `runUntilSnapshot`      | Snapshot predicate | Yes         | No            | With variant    |
| `waitForSnapshot`       | Snapshot predicate | No          | Yes           | With variant    |
| `runUntilSpawn`         | Child spawned      | Yes         | No            | With variant    |
| `waitForSpawn`          | Child spawned      | No          | Yes           | With variant    |
| `runUntilEventReceived` | Events received    | Yes         | No            | With variant    |
| `waitForEventReceived`  | Events received    | No          | Yes           | With variant    |
| `runUntilEventSent`     | Events sent        | Yes         | No            | With variant    |
| `waitForEventSent`      | Events sent        | No          | Yes           | With variant    |
| `createActorFromLogic`  | N/A (utility)      | N/A         | N/A           | No              |
| `createActorWith`       | N/A (utility)      | N/A         | N/A           | No              |
| `patchActor`            | N/A (internal)     | N/A         | N/A           | Yes             |
| `unpatchActor`          | N/A (internal)     | N/A         | N/A           | No              |
