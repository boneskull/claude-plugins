# XState v5 Reference Documentation

Comprehensive reference materials for XState v5 implementation and analysis in **backend applications**.

## Available References

### [Core API](./core-api.md)

Complete API reference for XState v5 including:

- Machine creation (`createMachine`, `setup`)
- Actor management (`createActor`, lifecycle methods)
- State configuration and transitions
- Actions, guards, and services
- Utility functions and type helpers

### [Actors](./actors.md)

Deep dive into the actor model:

- Actor types (state machine, promise, callback, transition, observable)
- Actor lifecycle and communication
- Spawning vs invoking actors
- Actor systems and orchestration
- Error handling and persistence

### [Common Patterns](./patterns.md)

Production-ready patterns and solutions:

- Loading states with retry logic
- Form validation and submission
- Authentication flows
- Pagination and data fetching
- Wizard/stepper interfaces
- Parallel states and history
- Debouncing and queue processing
- Modal/dialog management
- Connection handling with reconnection

### [TypeScript Integration](./typescript.md)

Complete TypeScript usage guide:

- Setup pattern with strong typing
- Type inference and helpers
- Generic machine factories
- Event assertions and discriminated unions
- Backend service types
- Migration from v4 typegen

### [Testing Strategies](./testing.md)

Backend testing approaches:

- Unit testing state machines
- Testing with xstate-audition
- Mocking external services and databases
- Testing async backend operations
- Performance testing for server environments
- Best practices for backend testing

## Quick Start

For new XState v5 implementations, start with:

1. **[TypeScript Integration](./typescript.md)** - Set up proper typing
2. **[Core API](./core-api.md)** - Learn the fundamental APIs
3. **[Common Patterns](./patterns.md)** - Apply proven solutions
4. **[Testing Strategies](./testing.md)** - Ensure reliability

## External Resources

- [Official XState Documentation](https://stately.ai/docs/xstate)
- [XState Visualizer](https://stately.ai/viz)
- [XState Catalog](https://xstate-catalogue.com/)
- [xstate-audition](https://boneskull.github.io/xstate-audition/) - Model-based testing

## Version Requirements

- **XState**: v5.x
- **TypeScript**: 5.0 or greater
- **Node.js**: 18+ recommended

## Contributing

To add or update reference documentation:

1. Follow the existing markdown structure
2. Include practical code examples
3. Document both best practices and anti-patterns
4. Keep examples TypeScript-first
5. Test all code examples for accuracy
