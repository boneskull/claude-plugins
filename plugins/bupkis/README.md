# Bupkis Plugin

Idiomatic assertion patterns for the [Bupkis](https://bupkis.zip) assertion library.

## Features

### Skills

- **bupkis-assertion-patterns**: Comprehensive guide to writing expressive, maintainable assertions with Bupkis

## What is Bupkis?

Bupkis is a powerful assertion library for TypeScript and JavaScript that provides an extensive vocabulary of semantic assertions. This plugin teaches you how to write idiomatic Bupkis assertions that make your tests more readable and maintainable.

## Installation

From marketplace:

```bash
/plugin install bupkis@boneskull-plugins
```

## Usage

### Commands

#### `/bupkis [what-to-assert]`

Get guidance on writing idiomatic bupkis assertions. Optionally provide context about what you're trying to test for targeted advice.

**Examples:**

- `/bupkis` - Get general help with assertions
- `/bupkis checking multiple properties` - Get specific guidance for property checks
- `/bupkis testing promise rejections` - Get advice on async assertions

### Using the Skill

The skill is automatically invoked when Claude detects you're working with Bupkis tests. You can also use the `/bupkis` command for on-demand guidance.

### Key Patterns Covered

- **Property Existence**: Use `to have property` instead of truthiness checks
- **Type Checking**: Combine related checks with `to satisfy`
- **Collections**: Use `not to be empty` for semantic collection assertions
- **Object Structure**: Verify structure declaratively with `to satisfy`
- **Promise Rejection**: Use `expectAsync` with `to reject`
- **Chaining**: Combine assertions with `and` keyword

### Example

```typescript
// Instead of multiple separate assertions:
expect(typeof state.filesCompleted, 'to equal', 'number');
expect(typeof state.suitesCompleted, 'to equal', 'number');

// Use to satisfy for clearer structure:
expect(state, 'to satisfy', {
  filesCompleted: expect.it('to be a number'),
  suitesCompleted: expect.it('to be a number'),
});
```

## Reference Files

The skill includes comprehensive reference documentation:

- **api_reference.md**: Complete Bupkis API documentation
- **common_patterns.md**: Collection of common testing patterns
- **README.md**: Quick reference guide

These files are loaded on-demand using progressive disclosure.

## License

[Blue Oak Model License 1.0.0](../../LICENSE)
