# XState v5 Core API Reference

## Machine Creation

### `createMachine(config)`

Creates a state machine configuration.

```typescript
import { createMachine } from 'xstate';

const machine = createMachine({
  id: 'machineId', // Unique identifier
  initial: 'stateName', // Initial state
  context: {}, // Initial context data
  types: {}, // TypeScript type definitions
  states: {}, // State definitions
  on: {}, // Global transitions
  entry: [], // Entry actions
  exit: [], // Exit actions
  after: {}, // Delayed transitions
  always: [], // Eventless transitions
  invoke: {}, // Invoked services
  tags: [], // State tags
  description: '', // Machine description
});
```

### `setup(config)`

Configures reusable machine logic with strong typing.

```typescript
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as ContextType,
    events: {} as EventType,
    input: {} as InputType,
    output: {} as OutputType,
  },
  actions: {
    // Named action implementations
    actionName: (context, event, meta) => {
      /* ... */
    },
  },
  guards: {
    // Named guard implementations
    guardName: (context, event, meta) => boolean,
  },
  actors: {
    // Actor logic definitions
    actorName: fromPromise(() => fetch('/api')),
  },
  delays: {
    // Named delay functions
    delayName: (context, event) => 1000,
  },
}).createMachine({
  // Machine configuration
});
```

## Actor Creation and Management

### `createActor(logic, options?)`

Creates an actor instance from machine or actor logic.

```typescript
const actor = createActor(machine, {
  id: 'actorId', // Actor identifier
  input: {}, // Initial input
  snapshot: {}, // Restored snapshot
  systemId: 'systemId', // Actor system ID
  logger: console.log, // Custom logger
  inspect: (event) => {}, // Inspection handler
});
```

### Actor Methods

```typescript
// Lifecycle
actor.start(); // Start the actor
actor.stop(); // Stop the actor
actor.getSnapshot(); // Get current snapshot
actor.getPersistedSnapshot(); // Get persistable snapshot

// Communication
actor.send(event); // Send an event
actor.send({ type: 'EVENT' }); // Send event object

// Subscription
const subscription = actor.subscribe(observer);
subscription.unsubscribe();

// System
actor.system; // Access actor system
```

## State Configuration

### State Node Properties

```typescript
{
  type: 'atomic' | 'compound' | 'parallel' | 'final' | 'history',
  initial: 'childStateName',        // For compound states
  context: {},                      // State-specific context
  states: {},                      // Child states
  on: {},                         // Transitions
  entry: [],                     // Entry actions
  exit: [],                     // Exit actions
  always: [],                  // Eventless transitions
  after: {},                  // Delayed transitions
  invoke: {},                // Invoked services
  tags: [],                 // State tags
  description: '',         // State description
  meta: {},              // Metadata
  history: 'shallow' | 'deep',  // For history states
}
```

### Transition Configuration

```typescript
{
  target: 'stateName' | ['state1', 'state2'],  // Target state(s)
  guard: 'guardName' | guardFunction,          // Condition
  actions: ['action1', 'action2'],            // Actions to execute
  reenter: boolean,                           // Re-enter state
  description: 'Transition description',     // Documentation
}
```

## Actions

### `assign(assignment)`

Updates machine context immutably.

```typescript
// Function updater
assign({
  count: ({ context }) => context.count + 1,
  user: ({ context, event }) => event.user,
});

// Object updater
assign({ count: 5, user: null });

// Single property
assign(({ context }) => ({
  ...context,
  modified: true,
}));
```

### `raise(event)`

Raises an event internally.

```typescript
raise({ type: 'INTERNAL_EVENT' });
raise(({ context }) => ({
  type: 'DYNAMIC_EVENT',
  data: context.someValue,
}));
```

### `sendTo(actor, event)`

Sends event to another actor.

```typescript
sendTo('actorId', { type: 'MESSAGE' });
sendTo(({ context }) => context.someActor, { type: 'EVENT' });
```

### `emit(event)`

Emits an event to parent actor.

```typescript
emit({ type: 'CHILD_EVENT', data: value });
```

### `log(message)`

Logs a message (for debugging).

```typescript
log('State entered');
log(({ context }) => `Count: ${context.count}`);
```

### `stop(actorId)`

Stops a spawned actor.

```typescript
stop('childActorId');
```

### `cancel(sendId)`

Cancels a delayed send.

```typescript
cancel('delayedSendId');
```

### `enqueueActions(callback)`

Enqueues actions conditionally at runtime. Replaces v4's `pure()` and `choose()`.

```typescript
import { enqueueActions } from 'xstate';

// Basic conditional actions
entry: enqueueActions(({ context, event, enqueue, check }) => {
  // Conditionally enqueue actions
  if (context.count > 0) {
    enqueue('logPositive');
  }

  // Use check() for guards
  if (check({ type: 'hasPermission' })) {
    enqueue('performSecureAction');
  }

  // Enqueue multiple actions
  enqueue([
    { type: 'log', params: { message: 'Processing' } },
    'processData',
    assign({ processing: true }),
  ]);
});

// With parameters
enqueueActions(({ context, enqueue }, params: { threshold: number }) => {
  if (context.value > params.threshold) {
    enqueue('handleHighValue');
  }
});
```

## Guards

### Guard Functions

```typescript
// Inline guard
guard: ({ context, event }) => context.count > 0;

// Named guard
guard: 'isValid';

// Negated guard
guard: not('isInvalid');

// Combined guards
guard: and(['isValid', 'isAuthorized']);
guard: or(['isAdmin', 'isOwner']);
```

### Guard Helpers

```typescript
import { not, and, or, stateIn } from 'xstate';

not(guard); // Negates a guard
and([guard1, guard2]); // All must be true
or([guard1, guard2]); // At least one must be true
stateIn('state.path'); // Checks if in state
```

## Invoked Services

### Service Configuration

```typescript
invoke: {
  id: 'serviceId',
  src: 'serviceName' | actorLogic,
  input: ({ context, event }) => ({}),
  onDone: {
    target: 'success',
    actions: assign({ data: ({ event }) => event.output }),
  },
  onError: {
    target: 'failure',
    actions: assign({ error: ({ event }) => event.error }),
  },
  onSnapshot: {
    actions: ({ event }) => console.log(event.snapshot),
  },
}
```

### Multiple Invocations

```typescript
invoke: [
  { id: 'service1', src: 'api1' },
  { id: 'service2', src: 'api2' },
];
```

## Spawning Actors

### `spawn(logic, options?)`

Spawns a child actor.

```typescript
import { spawn } from 'xstate';

// In an action
spawn(childMachine, {
  id: 'childId',
  systemId: 'childSystem',
  input: { initial: 'data' },
  syncSnapshot: true,
});
```

### `stopChild(actorId)`

Stops a spawned child actor.

```typescript
stopChild('childId');
```

## Delayed Transitions

### After Configuration

```typescript
after: {
  1000: 'timeout',                    // Fixed delay
  DELAY_NAME: 'delayed',             // Named delay
  [({ context }) => context.delay]: 'dynamic',  // Dynamic delay
}
```

## Eventless Transitions

### Always Configuration

```typescript
always: [
  { target: 'state1', guard: 'condition1' },
  { target: 'state2', guard: 'condition2' },
  { target: 'default' }, // Fallback
];
```

## Utility Functions

### `waitFor(actor, predicate, options?)`

Waits for an actor to reach a specific condition.

```typescript
const snapshot = await waitFor(actor, (snapshot) => snapshot.matches('done'), {
  timeout: 5000,
});
```

### `toPromise(actor)`

Converts an actor to a Promise.

```typescript
const result = await toPromise(actor);
```

### `createEmptyActor()`

Creates an actor that does nothing.

```typescript
const emptyActor = createEmptyActor();
```

## Type Helpers

### `ActorRefFrom<T>`

Gets the ActorRef type from logic.

```typescript
type MyActorRef = ActorRefFrom<typeof machine>;
```

### `SnapshotFrom<T>`

Gets the Snapshot type from logic or ActorRef.

```typescript
type MySnapshot = SnapshotFrom<typeof machine>;
```

### `EventFromLogic<T>`

Gets the event union type from logic.

```typescript
type MyEvents = EventFromLogic<typeof machine>;
```

### `StateValueFrom<T>`

Gets the state value type from logic.

```typescript
type MyStateValue = StateValueFrom<typeof machine>;
```

### `ContextFrom<T>`

Gets the context type from logic.

```typescript
type MyContext = ContextFrom<typeof machine>;
```

## Inspection and Debugging

### Inspector API

```typescript
const actor = createActor(machine, {
  inspect: (inspectionEvent) => {
    if (inspectionEvent.type === '@xstate.snapshot') {
      console.log('Snapshot:', inspectionEvent.snapshot);
    }
  },
});
```

### Inspection Event Types

- `@xstate.actor` - Actor created/stopped
- `@xstate.snapshot` - Snapshot updated
- `@xstate.event` - Event processed
- `@xstate.microstep` - Microstep taken

## State Methods

### `state.matches(stateValue)`

Checks if in a specific state.

```typescript
if (state.matches('loading')) {
  /* ... */
}
if (state.matches({ form: 'valid' })) {
  /* ... */
}
```

### `state.hasTag(tag)`

Checks if state has a tag.

```typescript
if (state.hasTag('loading')) {
  /* ... */
}
```

### `state.can(event)`

Checks if an event can cause a transition.

```typescript
if (state.can({ type: 'SUBMIT' })) {
  /* ... */
}
```

### `state.nextEvents`

Gets available events from current state.

```typescript
const events = state.nextEvents; // ['SUBMIT', 'CANCEL']
```
