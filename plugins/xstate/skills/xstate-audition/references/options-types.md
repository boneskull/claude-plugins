# xstate-audition Options & Types Reference

Complete reference for AuditionOptions and TypeScript types used throughout xstate-audition.

## AuditionOptions

Configuration object accepted by all functions ending in `With()`.

### Type Definition

```typescript
interface AuditionOptions {
  /**
   * Inspector callback or observer to attach to actor Will not overwrite
   * existing inspectors
   */
  inspector?: ((event: InspectionEvent) => void) | Observer<InspectionEvent>;

  /**
   * Custom logger function Default: no-op (no logging) XState default:
   * console.log
   */
  logger?: (...args: any[]) => void;

  /**
   * Maximum milliseconds to wait for condition Default: 1000 Set to 0,
   * negative, or Infinity to disable
   */
  timeout?: number;
}
```

### Properties

#### `inspector`

**Type**: `((event: InspectionEvent) => void) | Observer<InspectionEvent>`
**Default**: `undefined`
**Optional**: Yes

Attaches a custom inspector to the actor for debugging and monitoring.

**Callback signature**:

```typescript
(event: InspectionEvent) => void;
```

**Observer signature**:

```typescript
interface Observer<T> {
  next: (value: T) => void;
  error?: (error: any) => void;
  complete?: () => void;
}
```

**Behavior**:

- Merges with any existing inspectors (doesn't replace)
- Called for every inspection event from the actor
- Useful for debugging failed tests
- Similar to `inspect` option in `createActor()`

**Example**:

```typescript
await runUntilDoneWith(actor, {
  inspector: (event) => {
    console.log('Inspection event:', event.type);
  },
});

// Or with observer
await runUntilDoneWith(actor, {
  inspector: {
    next: (event) => console.log('Event:', event),
    error: (err) => console.error('Error:', err),
    complete: () => console.log('Complete'),
  },
});
```

**InspectionEvent types**:

```typescript
type InspectionEvent =
  | { type: 'actor.snapshot'; actorRef: AnyActorRef; snapshot: Snapshot }
  | { type: 'actor.event'; actorRef: AnyActorRef; event: EventObject }
  | { type: 'actor.state'; actorRef: AnyActorRef; state: StateValue };
// ... and more
```

---

#### `logger`

**Type**: `(...args: any[]) => void`
**Default**: `() => {}` (no-op)
**Optional**: Yes

Sets a custom logger for the actor and all its children.

**Behavior**:

- Replaces actor's default logger
- Cascades to all child actors
- XState's default logger is `console.log`
- xstate-audition's default is no-op (silent)
- Useful for debugging test failures

**Example**:

```typescript
await runUntilDoneWith(actor, {
  logger: console.log, // Use console.log
});

await runUntilDoneWith(actor, {
  logger: (...args) => {
    // Custom formatting
    console.log('[XState]', ...args);
  },
});

// With test framework logger
await runUntilDoneWith(actor, {
  logger: vi.fn(), // Vitest mock
});
```

**What gets logged**:

- State transitions
- Action executions
- Event handling
- Context updates
- Guard evaluations

---

#### `timeout`

**Type**: `number`
**Default**: `1000` (milliseconds)
**Optional**: Yes

Maximum time to wait for condition before rejecting the promise.

**Behavior**:

- Measured in milliseconds
- Default is 1000ms (1 second)
- Set to `0`, negative number, or `Infinity` to disable timeout
- Should be **less than your test framework's timeout**
- Timeout error message includes elapsed time

**Example**:

```typescript
// 5 second timeout
await runUntilDoneWith(actor, { timeout: 5000 });

// No timeout
await runUntilDoneWith(actor, { timeout: 0 });
await runUntilDoneWith(actor, { timeout: Infinity });

// Will reject after 100ms
await assert.rejects(
  runUntilDoneWith(slowActor, { timeout: 100 }),
  (err: Error) => {
    assert.match(err.message, /did not complete in 100ms/);
    return true;
  },
);
```

**Timeout error format**:

```typescript
// Error message pattern
`Actor did not complete in ${timeout}ms`;
`Actor did not emit [${types}] in ${timeout}ms`;
`Actor did not transition from ${from} to ${to} in ${timeout}ms`;
// etc.
```

**Best practices**:

1. Set explicit timeouts for slow operations
2. Keep timeout < test framework timeout
3. Use longer timeouts in CI environments
4. Disable timeout for debugging (set to `Infinity`)

---

### Extended Options

Some functions accept additional options beyond `AuditionOptions`.

#### Event Filtering Options

Used by `runUntilEventReceivedWith` and `runUntilEventSentWith`:

```typescript
interface EventFilterOptions extends AuditionOptions {
  /**
   * Filter events by source/target actor ID String: exact match RegExp: pattern
   * match
   */
  otherActorId?: string | RegExp;
}
```

**Example**:

```typescript
// Only events received FROM actor with ID 'child'
await runUntilEventReceivedWith(actor, { otherActorId: 'child' }, ['PING']);

// Events from any actor matching pattern
await runUntilEventReceivedWith(actor, { otherActorId: /^child-\d+$/ }, [
  'PING',
]);

// Only events sent TO actor with ID 'parent'
await runUntilEventSentWith(actor, { otherActorId: 'parent' }, ['RESPONSE']);
```

---

## TypeScript Types

### Curried Function Types

xstate-audition exports types for curried function variants.

#### Example: `CurryEmittedP1`

Type for partially applied `runUntilEmitted()`:

```typescript
type CurryEmittedP1<TActor extends AnyStateMachineActor> = (
  emittedTypes: Array<EmittedFrom<TActor>['type']>,
) => Promise<Array<EmittedFrom<TActor>>>;

// Usage
let actor: Actor<typeof machine>;
let runUntilEmit: CurryEmittedP1<typeof actor>;

runUntilEmit = runUntilEmitted(actor);
const events = await runUntilEmit(['EVENT1', 'EVENT2']);
```

#### Example: `CurryTransitionP2`

Type for partially applied `runUntilTransition()`:

```typescript
type CurryTransitionP2<TActor extends AnyStateMachineActor> = (
  toStateId: string,
) => Promise<void>;

// Usage
let actor: Actor<typeof machine>;
let runFromIdle: CurryTransitionP2<typeof actor>;

runFromIdle = runUntilTransition(actor, 'machine.idle');
await runFromIdle('machine.loading');
```

### Actor Type Constraints

Types that constrain which actors can be used with specific functions.

#### `AnyStateMachineActor`

```typescript
type AnyStateMachineActor = Actor<
  StateMachine<any, any, any, any, any, any, any, any, any>
>;
```

Used by: `runUntilEmitted`, `runUntilTransition`, `runUntilSpawn`

#### `EventReceivingActor`

```typescript
type EventReceivingActor =
  | AnyStateMachineActor
  | CallbackActor
  | TransitionActor;
```

Used by: `runUntilEventReceived`, `waitForEventReceived`

#### `AnyActor`

```typescript
type AnyActor = Actor<AnyActorLogic>;
```

Used by: `runUntilSnapshot`, `runUntilEventSent`, and most other functions

### Utility Types from XState

xstate-audition leverages XState's utility types:

#### `SnapshotFrom<TActor>`

Extracts snapshot type from actor:

```typescript
import { SnapshotFrom } from 'xstate';

const machine = createMachine({...});
type MachineSnapshot = SnapshotFrom<typeof machine>;
```

#### `OutputFrom<TLogic>`

Extracts output type from logic:

```typescript
import { OutputFrom } from 'xstate';

const promiseLogic = fromPromise<string>(async () => 'result');
type Output = OutputFrom<typeof promiseLogic>; // string
```

#### `EmittedFrom<TActor>`

Extracts emitted event types from actor:

```typescript
import { EmittedFrom } from 'xstate';

const machine = setup({
  types: {
    emitted: {} as { type: 'READY' } | { type: 'DONE' },
  },
}).createMachine({...});

type Emitted = EmittedFrom<typeof machine>;
// { type: 'READY' } | { type: 'DONE' }
```

#### `ActorRefFrom<TLogic>`

Extracts actor reference type from logic:

```typescript
import { ActorRefFrom } from 'xstate';

const childLogic = fromPromise<string>(async () => 'done');
type ChildRef = ActorRefFrom<typeof childLogic>;

const child = await runUntilSpawn<typeof childLogic>(parent, 'childId');
// child has type ActorRefFrom<typeof childLogic>
```

---

## Type Parameter Patterns

### Providing Explicit Type Parameters

Some functions benefit from explicit type parameters for better type inference.

#### `runUntilSpawn` with Type Parameter

**Why needed**: Child actor type cannot be inferred from ID alone

```typescript
// ❌ Without type parameter - returns AnyActorRef
const child = await runUntilSpawn(parent, 'childId');
// child: AnyActorRef (not useful)

// ✅ With type parameter - returns properly typed ActorRef
const childLogic = fromPromise<string>(async () => 'result');
const child = await runUntilSpawn<typeof childLogic>(parent, 'childId');
// child: ActorRefFrom<typeof childLogic>
// child.getSnapshot() returns Promise<string>
```

#### Generic Actor Testing

```typescript
function testActor<TLogic extends AnyActorLogic>(
  logic: TLogic,
  input: InputFrom<TLogic>,
) {
  return async () => {
    const actor = createActor(logic, { input });
    const output = await runUntilDone(actor);
    return output;
  };
}
```

---

## Type Safety Best Practices

### 1. Use `setup()` for Type Inference

```typescript
// ✅ Good - full type inference
const machine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'INC' } | { type: 'DEC' },
    emitted: {} as { type: 'CHANGED'; count: number },
  },
}).createMachine({...});

// Now all xstate-audition functions have proper types
const [event] = await runUntilEmitted(machine, ['CHANGED']);
// event.type is 'CHANGED'
// event.count is number
```

### 2. Explicitly Type Actors in Tests

```typescript
// ✅ Good - explicit typing
let actor: Actor<typeof machine>;

beforeEach(() => {
  actor = createActor(machine);
});

// Now all uses of actor have correct type
```

### 3. Use Curried Types

```typescript
// ✅ Good - type curried functions
let runFromIdle: CurryTransitionP2<typeof actor>;

beforeEach(() => {
  actor = createActor(machine);
  runFromIdle = runUntilTransition(actor, 'machine.idle');
});
```

---

## Common Type Errors and Solutions

### Error: "Type 'string' is not assignable to type 'never'"

**Cause**: Event or emitted types not properly defined

**Solution**:

```typescript
// ❌ Wrong - no types defined
const machine = createMachine({...});

// ✅ Fixed - define types with setup()
const machine = setup({
  types: {
    events: {} as { type: 'FETCH' } | { type: 'SUCCESS' },
  },
}).createMachine({...});
```

### Error: "Property 'X' does not exist on type 'AnyActorRef'"

**Cause**: Missing type parameter on `runUntilSpawn`

**Solution**:

```typescript
// ❌ Wrong - no type parameter
const child = await runUntilSpawn(parent, 'childId');

// ✅ Fixed - provide type parameter
const child = await runUntilSpawn<typeof childLogic>(parent, 'childId');
```

### Error: "Argument of type 'Promise<...>' is not assignable"

**Cause**: Forgetting to `await` the promise

**Solution**:

```typescript
// ❌ Wrong - not awaiting
const result = runUntilDone(actor);

// ✅ Fixed - await the promise
const result = await runUntilDone(actor);
```

---

## Configuration Defaults

Quick reference for all default values:

| Option         | Default Value           | Type                   |
| -------------- | ----------------------- | ---------------------- |
| `timeout`      | `1000` (ms)             | `number`               |
| `logger`       | `() => {}` (no-op)      | `Function`             |
| `inspector`    | `undefined` (none)      | `Function \| Observer` |
| `otherActorId` | `undefined` (any actor) | `string \| RegExp`     |

---

## Creating Custom Wrappers

You can create your own wrappers with preset options:

```typescript
import { runUntilDoneWith, AuditionOptions } from 'xstate-audition';

// Custom wrapper with defaults
function runWithDefaults<TLogic extends AnyActorLogic>(
  actor: Actor<TLogic>,
  overrides?: Partial<AuditionOptions>,
) {
  const options: AuditionOptions = {
    timeout: 5000, // 5 seconds default
    logger: console.log, // Always log
    ...overrides,
  };

  return runUntilDoneWith(actor, options);
}

// Usage
await runWithDefaults(actor); // Uses 5s timeout + console.log
await runWithDefaults(actor, { timeout: 10000 }); // Override timeout
```

---

## See Also

- [Core Functions Reference](./core-functions.md) - Detailed API for all functions
- [Testing Patterns](./testing-patterns.md) - Advanced usage patterns and examples
