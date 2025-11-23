---
description: Get expert guidance on XState v5 state machines and actor model implementation
argument-hint: '[what-you-need]'
---

# XState v5 Expert Guidance

Provide expert guidance on implementing XState v5 state machines, actors, and statecharts with TypeScript best practices for backend applications.

## Usage

```bash
/xstate [optional: what you need help with]
```

**Arguments:**

- `what-you-need` (optional): Describe what you're trying to implement or paste code you need help with

## Instructions

When this command is invoked:

1. **Load the xstate-v5 skill** from `skills/xstate-v5/SKILL.md`

2. **If the user provided context**, analyze their needs and:
   - Identify which XState patterns or APIs apply to their situation
   - Provide specific code examples using XState v5 APIs
   - Show TypeScript integration when relevant
   - Explain best practices and common pitfalls
   - Reference the appropriate documentation from `references/`:
     - Core API Reference for function documentation
     - Actors Reference for actor model guidance
     - Common Patterns for production-ready examples
     - TypeScript Integration for typing help
     - Testing Strategies for test guidance

3. **If no context was provided**, offer to help by:
   - Asking what they're trying to implement or what problem they're solving
   - Listing common scenarios:
     - Creating state machines with `createMachine` and `setup`
     - Managing actor lifecycle and communication
     - Implementing loading states, authentication flows, or wizards
     - Adding TypeScript types to machines
     - Testing with xstate-audition
     - Performance optimization
   - Offering to show examples of specific patterns

4. **Always emphasize XState v5 best practices**:
   - Always use `setup()` for better type inference and reusable logic
   - Name all actions and guards (avoid inline functions)
   - Use context for data, states for behavior
   - Keep machines focused - one machine per logical unit
   - Leverage TypeScript for compile-time safety
   - Don't mutate context directly - always use `assign`
   - Don't use side effects in guards - guards should be pure
   - Use Promise actors for asynchronous operations

5. **Focus on backend use cases**:
   - This plugin is tailored for Node.js/Deno/Bun backend applications
   - Emphasize server-side patterns: database transactions, API orchestration, rate limiting
   - Reference backend-specific patterns from the Common Patterns reference

## Example Interactions

**With context - creating a machine:**

```text
User: /xstate I need to implement a loading state pattern with retry logic

Agent: Here's an XState v5 loading pattern with retry logic:

\`\`\`typescript
import { setup, assign, fromPromise } from 'xstate';

const fetchMachine = setup({
  types: {
    context: {} as {
      data: string | null;
      error: Error | null;
      retryCount: number;
    },
    events: {} as
      | { type: 'FETCH' }
      | { type: 'RETRY' }
      | { type: 'RESET' },
  },
  actors: {
    fetchData: fromPromise<string, void>(async () => {
      const response = await fetch('https://api.example.com/data');
      return response.text();
    }),
  },
  actions: {
    assignData: assign({
      data: ({ event }) => (event as any).output,
      error: null,
    }),
    assignError: assign({
      error: ({ event }) => (event as any).error,
    }),
    incrementRetry: assign({
      retryCount: ({ context }) => context.retryCount + 1,
    }),
    resetRetry: assign({
      retryCount: 0,
    }),
  },
  guards: {
    canRetry: ({ context }) => context.retryCount < 3,
  },
}).createMachine({
  id: 'fetch',
  initial: 'idle',
  context: {
    data: null,
    error: null,
    retryCount: 0,
  },
  states: {
    idle: {
      on: {
        FETCH: 'loading',
      },
    },
    loading: {
      invoke: {
        src: 'fetchData',
        onDone: {
          target: 'success',
          actions: ['assignData', 'resetRetry'],
        },
        onError: {
          target: 'failure',
          actions: 'assignError',
        },
      },
    },
    success: {
      on: {
        RESET: 'idle',
      },
    },
    failure: {
      on: {
        RETRY: {
          target: 'loading',
          guard: 'canRetry',
          actions: 'incrementRetry',
        },
        RESET: 'idle',
      },
    },
  },
});
\`\`\`

Key XState v5 patterns used:
- `setup()` for type-safe configuration and reusable logic
- Named actions and guards for clarity
- Promise actors with `fromPromise` for async operations
- Context for data management (data, error, retryCount)
- Guards for conditional transitions (retry limit)
- `assign` for immutable context updates

This pattern is common for backend API calls. See [references/patterns.md] for more examples.
```

**With context - TypeScript help:**

```text
User: /xstate How do I add strong typing to my machine?

Agent: Use the `setup()` pattern for strong typing in XState v5:

\`\`\`typescript
import { setup, assign } from 'xstate';

// Define your types
interface UserContext {
  userId: string | null;
  userData: User | null;
  error: Error | null;
}

type UserEvents =
  | { type: 'LOGIN'; userId: string }
  | { type: 'LOGOUT' }
  | { type: 'FETCH_USER' };

// Use setup for type inference
const userMachine = setup({
  types: {
    context: {} as UserContext,
    events: {} as UserEvents,
  },
  actions: {
    setUserId: assign({
      userId: ({ event }) => {
        // TypeScript knows event can be LOGIN
        if (event.type === 'LOGIN') {
          return event.userId;
        }
        return null;
      },
    }),
    clearUser: assign({
      userId: null,
      userData: null,
    }),
  },
}).createMachine({
  id: 'user',
  initial: 'loggedOut',
  context: {
    userId: null,
    userData: null,
    error: null,
  },
  states: {
    loggedOut: {
      on: {
        LOGIN: {
          target: 'loggedIn',
          actions: 'setUserId',
        },
      },
    },
    loggedIn: {
      on: {
        LOGOUT: {
          target: 'loggedOut',
          actions: 'clearUser',
        },
      },
    },
  },
});
\`\`\`

Key TypeScript patterns:
- Define context and event types explicitly
- Use `{} as Type` syntax in `types` config
- TypeScript infers types throughout the machine
- Event types are narrowed in action implementations
- No `any` types needed

See [references/typescript.md] for advanced patterns including generic machine factories.
```

**With context - debugging:**

```text
User: /xstate Why is my context not updating?
const machine = createMachine({
  context: { count: 0 },
  on: {
    INC: { actions: (ctx) => ctx.context.count++ }
  }
});

Agent: The issue is that you're mutating context directly, which XState doesn't detect. Always use `assign` for context updates:

\`\`\`typescript
// ❌ WRONG - mutating context directly
on: {
  INC: { actions: (ctx) => ctx.context.count++ }
}

// ✅ CORRECT - use assign for immutable updates
import { assign } from 'xstate';

on: {
  INC: {
    actions: assign({
      count: ({ context }) => context.count + 1
    })
  }
}
\`\`\`

This is a common mistake! XState requires immutable context updates to:
1. Maintain predictable state transitions
2. Enable time-travel debugging
3. Support snapshot serialization
4. Ensure proper actor communication

Other common mistakes to avoid:
- Don't use side effects in guards (guards should be pure)
- Don't overuse nested states (flatten when possible)
- Don't use `setInterval` in machines (use delays instead)

Want to see more best practices?
```

**Without context:**

```text
User: /xstate

Agent: I can help you with XState v5! What are you trying to implement?

Common use cases:
- **State machines** - Model application logic with explicit states and transitions
- **Actor systems** - Manage concurrent actors and communication
- **Loading patterns** - Implement fetch/retry/timeout logic
- **Authentication flows** - Handle login/logout/session management
- **Wizards & forms** - Multi-step forms with validation
- **Backend workflows** - Database transactions, message queue processing, rate limiting
- **TypeScript integration** - Add strong typing to your machines
- **Testing** - Test actors with xstate-audition

You can also:
- Paste your existing state machine code for review
- Ask about specific XState v5 APIs
- Request examples of common patterns
- Get help debugging issues

I have access to comprehensive documentation:
- Core API reference (setup, createMachine, actors, actions, guards)
- Actor model guide (all actor types, spawning, communication)
- Common patterns (loading, auth, forms, pagination, etc.)
- TypeScript integration patterns
- Testing strategies with xstate-audition

What would you like to work on?
```

## Related Files

- [XState v5 Skill](../skills/xstate-v5/SKILL.md)
- [Core API Reference](../skills/xstate-v5/references/core-api.md)
- [Actors Reference](../skills/xstate-v5/references/actors.md)
- [Common Patterns](../skills/xstate-v5/references/patterns.md)
- [TypeScript Integration](../skills/xstate-v5/references/typescript.md)
- [Testing Strategies](../skills/xstate-v5/references/testing.md)
