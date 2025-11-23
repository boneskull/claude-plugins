# XState v5 TypeScript Reference

## Requirements

- **TypeScript 5.0 or greater** is required for XState v5
- Enable `strictNullChecks: true` in tsconfig.json (strongly recommended)
- Set `skipLibCheck: true` for better performance

## Setup Pattern (Recommended)

The `setup()` function is the primary way to achieve strong typing in XState v5.

### Basic Setup

```typescript
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as {
      count: number;
      user: User | null;
    },
    events: {} as
      | { type: 'INCREMENT' }
      | { type: 'DECREMENT' }
      | { type: 'SET_USER'; user: User },
    input: {} as {
      initialCount?: number;
    },
    output: {} as {
      finalCount: number;
    },
  },
  actions: {
    incrementCount: assign({
      count: ({ context }) => context.count + 1,
    }),
    setUser: assign({
      user: ({ event }) => {
        // TypeScript knows event has 'user' property here
        assertEvent(event, 'SET_USER');
        return event.user;
      },
    }),
  },
  guards: {
    isPositive: ({ context }) => context.count > 0,
    hasUser: ({ context }) => context.user !== null,
  },
  actors: {
    fetchUser: fromPromise(async ({ input }: { input: { id: string } }) => {
      const response = await fetch(`/api/users/${input.id}`);
      return response.json() as Promise<User>;
    }),
  },
  delays: {
    RETRY_DELAY: ({ context }) => context.count * 1000,
  },
}).createMachine({
  // Machine configuration with full type inference
  id: 'typedMachine',
  initial: 'idle',
  context: ({ input }) => ({
    count: input?.initialCount ?? 0,
    user: null,
  }),
  states: {
    idle: {
      on: {
        INCREMENT: {
          actions: 'incrementCount',
        },
        SET_USER: {
          actions: 'setUser',
        },
      },
    },
  },
});
```

## Type Inference

### Context Type Inference

```typescript
// Context is fully typed in actions, guards, etc.
const machine = setup({
  types: {
    context: {} as {
      items: string[];
      selectedIndex: number;
    },
  },
}).createMachine({
  context: {
    items: [],
    selectedIndex: -1,
  },
  // TypeScript knows context shape everywhere
  entry: ({ context }) => {
    console.log(context.items); // string[]
    console.log(context.selectedIndex); // number
  },
});
```

### Event Type Inference

```typescript
const machine = setup({
  types: {
    events: {} as
      | { type: 'ADD_ITEM'; item: string }
      | { type: 'REMOVE_ITEM'; index: number }
      | { type: 'CLEAR_ALL' },
  },
}).createMachine({
  on: {
    ADD_ITEM: {
      actions: ({ event }) => {
        // TypeScript knows event.item exists and is string
        console.log(event.item.toUpperCase());
      },
    },
    REMOVE_ITEM: {
      actions: ({ event }) => {
        // TypeScript knows event.index exists and is number
        console.log(event.index + 1);
      },
    },
  },
});
```

## Dynamic Parameters

### Typed Action Parameters

```typescript
const machine = setup({
  types: {
    context: {} as { message: string },
  },
  actions: {
    log: (
      { context },
      params: { prefix: string; level?: 'info' | 'warn' | 'error' },
    ) => {
      const level = params.level || 'info';
      console[level](`${params.prefix}: ${context.message}`);
    },
  },
}).createMachine({
  entry: {
    type: 'log',
    params: { prefix: 'Starting', level: 'info' },
  },
});
```

### Typed Guard Parameters

```typescript
const machine = setup({
  types: {
    context: {} as { value: number },
  },
  guards: {
    isGreaterThan: ({ context }, params: { threshold: number }) =>
      context.value > params.threshold,
    isInRange: ({ context }, params: { min: number; max: number }) =>
      context.value >= params.min && context.value <= params.max,
  },
}).createMachine({
  on: {
    CHECK: [
      {
        target: 'high',
        guard: {
          type: 'isGreaterThan',
          params: { threshold: 100 },
        },
      },
      {
        target: 'medium',
        guard: {
          type: 'isInRange',
          params: { min: 50, max: 100 },
        },
      },
    ],
  },
});
```

## Event Assertion

Use `assertEvent()` to narrow event types:

```typescript
import { assertEvent } from 'xstate';

const machine = setup({
  types: {
    events: {} as
      | { type: 'SUBMIT'; data: FormData }
      | { type: 'CANCEL' }
      | { type: 'RESET'; fields?: string[] },
  },
}).createMachine({
  on: {
    '*': {
      actions: ({ event }) => {
        // Assert single event type
        assertEvent(event, 'SUBMIT');
        console.log(event.data); // TypeScript knows data exists

        // Assert multiple event types
        assertEvent(event, ['SUBMIT', 'RESET']);
        if (event.type === 'SUBMIT') {
          console.log(event.data);
        } else {
          console.log(event.fields);
        }
      },
    },
  },
});
```

## Type Helper Utilities

### ActorRefFrom

Extract actor reference type from machine or logic:

```typescript
import { ActorRefFrom } from 'xstate';

const machine = createMachine({
  /* ... */
});

type MachineActorRef = ActorRefFrom<typeof machine>;

function handleActor(actor: MachineActorRef) {
  actor.send({ type: 'SOME_EVENT' });
  const snapshot = actor.getSnapshot();
}
```

### SnapshotFrom

Extract snapshot type:

```typescript
import { SnapshotFrom } from 'xstate';

type MachineSnapshot = SnapshotFrom<typeof machine>;

function processSnapshot(snapshot: MachineSnapshot) {
  if (snapshot.matches('loading')) {
    // Handle loading state
  }
  console.log(snapshot.context);
}
```

### EventFromLogic

Extract event union type:

```typescript
import { EventFromLogic } from 'xstate';

type MachineEvents = EventFromLogic<typeof machine>;

function createEvent(): MachineEvents {
  return { type: 'INCREMENT' };
}
```

### StateValueFrom

Extract state value type:

```typescript
import { StateValueFrom } from 'xstate';

type MachineStateValue = StateValueFrom<typeof machine>;

function isInState(value: MachineStateValue) {
  // Type-safe state value checking
}
```

### ContextFrom

Extract context type:

```typescript
import { ContextFrom } from 'xstate';

type MachineContext = ContextFrom<typeof machine>;

function processContext(context: MachineContext) {
  // Access typed context properties
}
```

## Actor Types

### Typed Promise Actors

```typescript
interface UserData {
  id: string;
  name: string;
  email: string;
}

const fetchUserLogic = fromPromise(
  async ({ input }: { input: { userId: string } }): Promise<UserData> => {
    const response = await fetch(`/api/users/${input.userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }
    return response.json();
  },
);

// Use in machine
const machine = setup({
  actors: {
    fetchUser: fetchUserLogic,
  },
}).createMachine({
  invoke: {
    src: 'fetchUser',
    input: ({ context }) => ({ userId: context.userId }),
    onDone: {
      actions: assign({
        user: ({ event }) => event.output, // Typed as UserData
      }),
    },
  },
});
```

### Typed Callback Actors

```typescript
interface WebSocketMessage {
  type: 'message' | 'error' | 'close';
  data: any;
}

const websocketLogic = fromCallback<WebSocketMessage, { url: string }>(
  ({ sendBack, receive, input }) => {
    const ws = new WebSocket(input.url);

    ws.onmessage = (event) => {
      sendBack({ type: 'message', data: event.data });
    };

    ws.onerror = (error) => {
      sendBack({ type: 'error', data: error });
    };

    ws.onclose = () => {
      sendBack({ type: 'close', data: null });
    };

    receive((event) => {
      if (event.type === 'SEND') {
        ws.send(event.data);
      }
    });

    return () => ws.close();
  },
);
```

## Generic Machines

### Creating Generic Machine Factories

```typescript
function createCrudMachine<T extends { id: string }>() {
  return setup({
    types: {
      context: {} as {
        items: T[];
        selectedItem: T | null;
        isLoading: boolean;
        error: string | null;
      },
      events: {} as
        | { type: 'FETCH' }
        | { type: 'CREATE'; item: Omit<T, 'id'> }
        | { type: 'UPDATE'; id: string; updates: Partial<T> }
        | { type: 'DELETE'; id: string }
        | { type: 'SELECT'; item: T },
    },
  }).createMachine({
    initial: 'idle',
    context: {
      items: [],
      selectedItem: null,
      isLoading: false,
      error: null,
    },
    states: {
      idle: {
        on: {
          FETCH: 'fetching',
          CREATE: 'creating',
          SELECT: {
            actions: assign({
              selectedItem: ({ event }) => event.item,
            }),
          },
        },
      },
      fetching: {
        // Implementation
      },
      creating: {
        // Implementation
      },
    },
  });
}

// Use with specific type
interface User {
  id: string;
  name: string;
  email: string;
}

const userMachine = createCrudMachine<User>();
```

## Discriminated Unions

### State-based Discrimination

```typescript
type MachineState =
  | {
      value: 'idle';
      context: { data: null; error: null };
    }
  | {
      value: 'loading';
      context: { data: null; error: null };
    }
  | {
      value: 'success';
      context: { data: string; error: null };
    }
  | {
      value: 'failure';
      context: { data: null; error: Error };
    };

const machine = setup({
  types: {
    context: {} as MachineState['context'],
  },
}).createMachine({
  initial: 'idle',
  states: {
    idle: {},
    loading: {},
    success: {},
    failure: {},
  },
});

// Type-safe state checking
function handleState(state: SnapshotFrom<typeof machine>) {
  if (state.matches('success')) {
    // TypeScript should know data is string here
    console.log(state.context.data);
  }
}
```

## Common TypeScript Patterns

### Exhaustive Event Handling

```typescript
const machine = setup({
  types: {
    events: {} as { type: 'A' } | { type: 'B' } | { type: 'C' },
  },
}).createMachine({
  on: {
    '*': {
      actions: ({ event }) => {
        switch (event.type) {
          case 'A':
            // Handle A
            break;
          case 'B':
            // Handle B
            break;
          case 'C':
            // Handle C
            break;
          default:
            // TypeScript ensures this is never reached
            const exhaustive: never = event;
            throw new Error(`Unhandled event: ${exhaustive}`);
        }
      },
    },
  },
});
```

### Branded Types for IDs

```typescript
type UserId = string & { __brand: 'UserId' };
type PostId = string & { __brand: 'PostId' };

const machine = setup({
  types: {
    context: {} as {
      userId: UserId | null;
      postId: PostId | null;
    },
    events: {} as
      | { type: 'SET_USER'; id: UserId }
      | { type: 'SET_POST'; id: PostId },
  },
}).createMachine({
  on: {
    SET_USER: {
      actions: assign({
        userId: ({ event }) => event.id, // Type-safe: only UserId accepted
      }),
    },
    SET_POST: {
      actions: assign({
        postId: ({ event }) => event.id, // Type-safe: only PostId accepted
      }),
    },
  },
});
```

### Const Assertions for Events

```typescript
// Define events with const assertion for literal types
const EVENTS = {
  INCREMENT: { type: 'INCREMENT' } as const,
  DECREMENT: { type: 'DECREMENT' } as const,
  RESET: { type: 'RESET' } as const,
  SET_VALUE: (value: number) => ({ type: 'SET_VALUE', value }) as const,
} as const;

type MachineEvent = ReturnType<(typeof EVENTS)[keyof typeof EVENTS]>;

const machine = setup({
  types: {
    events: {} as MachineEvent,
  },
}).createMachine({
  // Machine configuration
});

// Usage
actor.send(EVENTS.INCREMENT);
actor.send(EVENTS.SET_VALUE(42));
```

## Migration from v4 Types

### Replacing Typegen

v4 used typegen for type safety. In v5, use `setup()` instead:

```typescript
// v4 with typegen
import { createMachine } from 'xstate';
import { typegen } from './machine.typegen';

const machine = createMachine({
  tsTypes: typegen,
  // ...
});

// v5 with setup
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as ContextType,
    events: {} as EventsUnion,
  },
}).createMachine({
  // ...
});
```

## Best Practices

1. **Always use setup()** for new machines
2. **Define types first** in the setup configuration
3. **Use const assertions** for literal types
4. **Enable strict mode** in tsconfig.json
5. **Use branded types** for domain-specific IDs
6. **Leverage type helpers** (ActorRefFrom, SnapshotFrom, etc.)
7. **Assert events** when needed with assertEvent()
8. **Create generic factories** for reusable patterns
9. **Type external actors** properly with input/output types
10. **Use discriminated unions** for complex state variations
