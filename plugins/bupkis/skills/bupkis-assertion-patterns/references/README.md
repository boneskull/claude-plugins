# Bupkis References

This directory contains reference documentation for the Bupkis assertion library.

## Available References

### 1. api_reference.md - Complete API Documentation

**Comprehensive reference for all built-in Bupkis assertions** organized by category:

- **Core Concepts** - Natural language assertions, negation, concatenation, embeddable assertions
- **Primitive Assertions** - Type checks (string, number, boolean, null, undefined, etc.)
- **Numeric Assertions** - Number comparisons, ranges, special values (NaN, Infinity)
- **String & Pattern Assertions** - String matching, RegExp, substring operations
- **Collection Assertions** - Arrays, Maps, Sets, WeakMap, WeakSet operations
- **Object Assertions** - Property checks, object matching, `to satisfy` patterns
- **Function Assertions** - Function type checks, arity, throw behavior
- **Equality & Comparison Assertions** - Deep equality, instance checks
- **Error Assertions** - Error type and message validation
- **Date & Time Assertions** - Date comparisons, durations, weekday/weekend checks
- **Promise Assertions** - Async resolution and rejection testing
- **Other Assertions** - Truthy, falsy, defined checks

**When to use:** When you need to look up the exact syntax for an assertion, understand what parameters it accepts, or see all available aliases.

### 2. common_patterns.md - Practical Usage Patterns

**Real-world examples and best practices** for common testing scenarios:

- **API Response Validation** - REST API, pagination, error responses
- **Configuration Validation** - App config, environment-specific config, feature flags
- **Error Testing Patterns** - Standard errors, custom errors, promise rejections
- **Async Operation Patterns** - Promise resolution, async functions, race conditions
- **Complex Nested Structures** - Deep object validation, arrays of objects, optional properties
- **Test Data Validation** - Factory data, fixtures, mock data consistency
- **Type Safety Patterns** - Discriminated unions, generic validation, branded types
- **Real-World Scenarios** - Database queries, forms, file system, HTTP headers, events

**When to use:** When implementing tests and need examples of idiomatic Bupkis patterns for common use cases.

## How These References Are Used

When Claude loads this skill and you ask about Bupkis assertions, it will:

1. **Load SKILL.md first** (always in context) - Provides the core patterns and workflow
2. **Load references as needed** - Fetches specific reference files based on your question:
   - Questions about "what assertions are available" → `api_reference.md`
   - Questions about "how to test API responses" → `common_patterns.md`
   - Questions about specific assertion syntax → `api_reference.md`

This three-level progressive disclosure keeps context usage efficient while ensuring comprehensive information is available when needed.

## Reference File Organization

Both reference files use:

- Clear table of contents for quick navigation
- Consistent formatting (heading hierarchy, code blocks)
- Success ✓ and failure ✗ examples for each assertion
- Inline comments explaining key concepts
- Cross-references between related sections

## Extending These References

If you discover new patterns or need to document additional use cases:

1. **Add patterns to common_patterns.md** - Keep examples practical and well-commented
2. **Update api_reference.md** - If Bupkis adds new assertions
3. **Keep files under 10k words each** - Split into subtopics if growing too large
