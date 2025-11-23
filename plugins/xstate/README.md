# XState Plugin

Expert guidance for implementing and analyzing XState v5 state machines with TypeScript support and best practices for **backend applications**.

> **Note:** This plugin is tailored for using XState to manage state in application backends (Node.js, Deno, Bun) rather than frontend frameworks. Focus is on server-side state management, workflow orchestration, and backend service coordination.

## Installation

```bash
/plugin install xstate@boneskull-plugins
```

## Components

### Skills

- **xstate-v5**: Comprehensive XState v5 implementation and analysis skill
  - Triggered when working with XState code, state machines, or statecharts
  - Provides expert guidance on:
    - State machine creation and configuration
    - Actor model implementation
    - TypeScript integration
    - Testing strategies
    - Performance optimization
    - Common patterns and best practices

- **xstate-audition**: Testing XState v5 Actors skill
  - Triggered when testing state machines and actors
  - Provides expert guidance on:
    - Testing actor behavior and lifecycle
    - State transition testing
    - Event emission and communication testing
    - Hierarchical actor testing
    - Timeout and error handling in tests
    - Integration testing patterns

### Commands

- **`/xstate [what-you-need]`**: Get expert guidance on XState v5 state machines, actors, and implementation
  - Triggered manually when you want on-demand XState help
  - Provides guidance on:
    - State machine creation with `setup()` and `createMachine()`
    - Actor model and lifecycle management
    - TypeScript integration and type safety
    - Backend patterns and best practices
    - Performance optimization
    - Common patterns (loading, auth, forms, etc.)

- **`/audition [what-to-test]`**: Get expert guidance on testing XState actors with xstate-audition
  - Triggered manually when you need testing help
  - Provides guidance on:
    - Testing state transitions and actor behavior
    - Testing promise actors and async operations
    - Testing event emissions and communication
    - Testing hierarchical actors and spawning
    - Timeout and error handling in tests
    - Best practices and common patterns

### Agents

(None yet)

### Hooks

(None yet)

### MCP Servers

(None yet)

## Usage

### Commands

You can explicitly invoke XState guidance using slash commands:

#### `/xstate [what-you-need]`

Get expert guidance on XState v5 implementation. Optionally provide context about what you're trying to implement.

**Examples:**

- `/xstate` - Get general help with XState v5
- `/xstate implement loading pattern with retry` - Get specific pattern guidance
- `/xstate add TypeScript types` - Get help with TypeScript integration
- `/xstate debug context not updating` - Get help troubleshooting

#### `/audition [what-to-test]`

Get expert guidance on testing with xstate-audition. Optionally provide context about what you're testing.

**Examples:**

- `/audition` - Get general help with xstate-audition
- `/audition test state transitions` - Get guidance on transition testing
- `/audition test promise actor` - Get help testing async actors
- `/audition test parent-child communication` - Get help with hierarchical actors

### Automatic Skill Activation

The XState skills also automatically activate when you're working with XState code or discussing state machine implementations. They provide:

### Automatic Activation

The xstate-v5 skill triggers on keywords like:

- `xstate`
- `state machine`
- `statechart`
- `createMachine`
- `createActor`
- `fsm implementation`
- `actor model`

The xstate-audition skill triggers on keywords like:

- `xstate-audition`
- `testing state machines`
- `testing actors`
- `actor testing`
- `runUntilDone`
- `waitForSnapshot`

### Example Prompts

**XState v5 Implementation:**

- "Help me implement a loading state pattern with XState"
- "Convert this Redux logic to an XState machine"
- "Add TypeScript types to my XState machine"
- "Implement parallel states for upload and download"

**XState Audition Testing:**

- "How do I test this state machine with xstate-audition?"
- "Help me write tests for actor transitions"
- "Test that my machine emits the correct events"
- "How do I test hierarchical actors with xstate-audition?"
- "Write tests for timeout and error handling"

### Key Features

1. **Full XState v5 API Coverage**: Complete knowledge of the latest XState v5 APIs and patterns
2. **TypeScript Support**: Strong typing patterns and best practices for TypeScript projects
3. **Comprehensive Testing**: Actor testing with xstate-audition library
   - State transition testing
   - Event emission and communication testing
   - Hierarchical actor testing
   - Timeout and error handling
4. **Backend Patterns**: Database transactions, message queues, API orchestration, rate limiting
5. **Performance Optimization**: Tips for efficient state machine implementation in server environments

### Customization

The skill includes a section for user-specific patterns. You can update the skill to add your personal preferences and patterns:

```bash
# Edit the skill to add your patterns
vim plugins/xstate/skills/xstate-v5/SKILL.md
```

Look for the "User-Specific Patterns" section and add your do's and don'ts.

## Examples

### Basic State Machine

```typescript
import { createMachine, createActor } from 'xstate';

const toggleMachine = createMachine({
  id: 'toggle',
  initial: 'inactive',
  states: {
    inactive: {
      on: { TOGGLE: 'active' },
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

### With TypeScript

```typescript
import { setup } from 'xstate';

const machine = setup({
  types: {
    context: {} as { count: number },
    events: {} as { type: 'INCREMENT' } | { type: 'DECREMENT' },
  },
}).createMachine({
  context: { count: 0 },
  on: {
    INCREMENT: {
      actions: assign({ count: ({ context }) => context.count + 1 }),
    },
    DECREMENT: {
      actions: assign({ count: ({ context }) => context.count - 1 }),
    },
  },
});
```

## Development

See [DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for development guidelines.

## Resources

- [XState Documentation](https://stately.ai/docs/xstate)
- [XState Visualizer](https://stately.ai/viz)
- [XState Catalog](https://xstate-catalogue.com/)
- [xstate-audition Documentation](https://boneskull.github.io/xstate-audition/)
- [xstate-audition GitHub](https://github.com/boneskull/xstate-audition)

## License

[Blue Oak Model License 1.0.0](../../LICENSE)
