---
description: Expert guidance for implementing and analyzing XState v5 state machines with TypeScript support and best practices
triggers:
  - xstate
  - state machine
  - statechart
  - createMachine
  - createActor
  - fsm implementation
  - actor model
  - state management xstate
---

# XState v5 Expert Skill

You are an expert in XState v5, a JavaScript/TypeScript library for creating, interpreting, and executing finite state machines and statecharts using the actor model. Use this knowledge to help implement and analyze XState v5 code with precision and adherence to best practices.

## Core Concepts

### State Machines & Statecharts

XState implements event-driven programming through state machines and statecharts, providing predictable and robust logic handling. Always:

- Model application logic as explicit states and transitions
- Use statecharts for complex hierarchical and parallel state management
- Ensure every state transition is intentional and documented

### Actor Model

XState uses the actor model for distributed, concurrent computation:

- **State machine actors**: Primary actors created from state machines
- **Promise actors**: Handle asynchronous operations
- **Transition actors**: Manage pure transitions
- **Callback actors**: Custom imperative logic
- **Observable actors**: Stream-based actors

## Quick Start Example

```typescript
import { setup, createActor, assign } from 'xstate';

const machine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'INCREMENT' } | { type: 'DECREMENT' },
  },
  actions: {
    increment: assign({ count: ({ context }) => context.count + 1 }),
    decrement: assign({ count: ({ context }) => context.count - 1 }),
  },
  guards: {
    isPositive: ({ context }) => context.count > 0,
  },
}).createMachine({
  id: 'counter',
  initial: 'active',
  context: { count: 0 },
  states: {
    active: {
      on: {
        INCREMENT: { actions: 'increment' },
        DECREMENT: {
          actions: 'decrement',
          guard: 'isPositive',
        },
      },
    },
  },
});

const actor = createActor(machine);
actor.subscribe((snapshot) => console.log(snapshot.context));
actor.start();
actor.send({ type: 'INCREMENT' });
```

## 📚 Reference Documentation

For detailed implementation guidance, consult the comprehensive reference documentation:

### [Core API Reference](./references/core-api.md)

Complete API documentation including:

- Machine creation (`createMachine`, `setup`)
- Actor management and lifecycle
- Actions, guards, and services
- Utility functions and type helpers

### [Actors Reference](./references/actors.md)

Deep dive into the actor model:

- All actor types (state machine, promise, callback, transition, observable)
- Actor communication and orchestration
- Spawning vs invoking actors
- Error handling and persistence

### [Common Patterns](./references/patterns.md)

Production-ready patterns and solutions:

- Loading states with retry logic
- Form validation and submission
- Authentication flows
- Pagination, wizards, modals
- Debouncing and queue processing

### [TypeScript Integration](./references/typescript.md)

Complete TypeScript usage guide:

- Setup pattern with strong typing
- Type inference and helpers
- Generic machine factories
- Backend service types

### [Testing Strategies](./references/testing.md)

Backend testing approaches:

- Unit testing state machines
- Using xstate-audition for actor testing
- Mocking external services
- Testing async backend operations

## Best Practices

1. **Always use setup()** for better type inference and reusable logic
2. **Name all actions and guards** for clarity and reusability
3. **Use context for data, states for behavior**
4. **Keep machines focused** - one machine per logical unit
5. **Leverage TypeScript** for compile-time safety
6. **Avoid inline functions** in machine definitions. Used named guards and actions.
7. **Test with `xstate-audition`** for comprehensive coverage
8. **Use Promise actors** for asynchronous operations

## Common Mistakes to Avoid

1. **Don't mutate context directly** - always use `assign`
2. **Don't use side effects in guards** - guards should be pure
3. **Don't overuse nested states** - flatten when possible
4. **Don't ignore TypeScript errors** - they prevent runtime issues
5. **Don't mix concerns** - separate UI from business logic
6. **Don't use string events** when objects provide better typing
7. **Don't forget error handling** in async operations
8. **Don't use `setInterval`** in machine definitions. Use delays instead.

## Performance Tips

1. Use `enqueueActions()` for conditional actions instead of multiple transitions
2. Minimize context updates
3. Use lazy evaluation with function updaters
4. Leverage memoization for expensive computations
5. Split large machines into smaller actors

## Conclusion

Remember: XState excels at making complex logic predictable and maintainable. Always prioritize clarity and correctness over brevity.
