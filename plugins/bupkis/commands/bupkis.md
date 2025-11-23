---
description: Get guidance on writing idiomatic bupkis assertions
argument-hint: '[what-to-assert]'
---

# Bupkis Assertion Guidance

Provide guidance on writing idiomatic assertions using the bupkis testing library.

## Usage

```bash
/bupkis [optional: what you're trying to assert]
```

**Arguments:**

- `what-to-assert` (optional): Describe what you're trying to test or assert

## Instructions

When this command is invoked:

1. **Load the bupkis assertion patterns skill** from `skills/bupkis-assertion-patterns/SKILL.md`

2. **If the user provided context**, analyze their needs and:
   - Identify which patterns from the skill apply to their situation
   - Provide specific code examples using those patterns
   - Explain why the recommended approach is better
   - Show before/after comparisons from the skill when helpful

3. **If no context was provided**, offer to help by:
   - Asking what they're trying to test or assert
   - Listing common scenarios:
     - Checking if properties exist on objects
     - Verifying object structure and types
     - Testing arrays or collections
     - Validating promise behavior
     - Type checking values
   - Offering to show examples of specific patterns

4. **Always emphasize key principles**:
   - Using semantic assertions over indirect checks
   - Combining related checks with `to satisfy`
   - Choosing positive assertions when possible (e.g., `to be defined` vs `not to be undefined`)
   - Letting assertions imply related checks (e.g., `to be an object` implies non-null)
   - Using `expectAsync` for promise-based assertions

## Example Interactions

**With context:**

```text
User: /bupkis checking if an object has multiple numeric properties

Agent: For checking multiple properties with specific types, use `to satisfy`
with nested `expect.it()` assertions:

✅ DO - concise, shows structure at a glance:
expect(state, 'to satisfy', {
  filesCompleted: expect.it('to be a number'),
  suitesCompleted: expect.it('to be a number'),
  tasksCompleted: expect.it('to be a number'),
});

This is better than separate assertions because:
- Shows the expected structure clearly
- Better error messages show exactly which properties failed
- More maintainable - all related checks in one place
```

**With specific code:**

```text
User: /bupkis
How can I improve this?
expect('filesCompleted' in state, 'to be truthy');

Agent: Instead of checking property existence with the `in` operator,
use the semantic `to have property` assertion:

✅ DO - clear, semantic assertion:
expect(state, 'to have property', 'filesCompleted');

This is clearer because it directly expresses your intent and provides
better error messages when the property is missing.
```

**Without context:**

```text
User: /bupkis

Agent: I can help you write idiomatic bupkis assertions! What are you trying to test?

Common scenarios:
- Checking if properties exist on objects
- Verifying object structure and types
- Testing arrays or collections
- Validating promise behavior
- Type checking values

You can also paste your current test code and I'll suggest improvements,
or ask about a specific assertion pattern!
```

## Related Files

- [Bupkis Assertion Patterns Skill](../skills/bupkis-assertion-patterns/SKILL.md)
- [API Reference](../skills/bupkis-assertion-patterns/references/api_reference.md)
- [Common Patterns](../skills/bupkis-assertion-patterns/references/common_patterns.md)
