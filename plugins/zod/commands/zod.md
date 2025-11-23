---
description: Get expert guidance on Zod v4 validation, schemas, and migrations
argument-hint: '[what-you-need]'
---

# Zod v4 Expert Guidance

Provide expert guidance on using Zod v4 validation library, including schemas, migrations from v3, and validation patterns.

## Usage

```bash
/zod [optional: what you need help with]
```

**Arguments:**

- `what-you-need` (optional): Describe what you're trying to do with Zod or paste code you need help with

## Instructions

When this command is invoked:

1. **Load the zod-v4 skill** from `skills/zod-v4/SKILL.md`

2. **If the user provided context**, analyze their needs and:
   - Identify which Zod v4 patterns or APIs apply to their situation
   - Provide specific code examples using Zod v4 syntax
   - If they mention v3 or have v3 code, reference the migration guide
   - Explain breaking changes if relevant
   - Show type inference examples when helpful
   - Reference the appropriate documentation from `references/`

3. **If no context was provided**, offer to help by:
   - Asking what they're trying to validate or what problem they're solving
   - Listing common scenarios:
     - Creating validation schemas
     - Migrating from Zod v3 to v4
     - Validating forms, API responses, or configs
     - Type inference from schemas
     - Custom validation logic
     - Debugging validation errors
   - Offering to show examples of specific patterns

4. **Always emphasize key Zod v4 patterns**:
   - Use `.safeParse()` for user input (never crash on bad data)
   - Use top-level format validators: `z.email()` not `z.string().email()` (v4 breaking change)
   - Use `error` parameter not `message` for custom errors (v4 breaking change)
   - Use `z.strictObject()` instead of `.strict()` (v4 breaking change)
   - Leverage `z.infer<typeof schema>` for TypeScript types
   - Keep refinements simple; complex business logic should be separate

5. **When discussing migrations from v3**:
   - Highlight the 9 major breaking changes
   - Show before/after examples
   - Reference the migration guide: `references/migration-from-v3.md`

## Example Interactions

**With context - creating a schema:**

```text
User: /zod I need to validate user registration with email, password, and age

Agent: Here's a Zod v4 schema for user registration:

\`\`\`typescript
import { z } from 'zod/v4';

const registrationSchema = z.object({
  email: z.email(), // v4: top-level format validator
  password: z
    .string()
    .min(8, { error: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { error: 'Must contain uppercase letter' })
    .regex(/[0-9]/, { error: 'Must contain number' }),
  age: z.number().int().positive().min(13, {
    error: 'Must be at least 13 years old',
  }),
});

// Type inference
type Registration = z.infer<typeof registrationSchema>;

// Safe parsing
const result = registrationSchema.safeParse(userData);
if (!result.success) {
  // Handle validation errors
  console.error(result.error.issues);
} else {
  // result.data is fully typed and validated
  createUser(result.data);
}
\`\`\`

Key v4 features used:
- `z.email()` - top-level format validator (breaking change from v3)
- `error` parameter - replaces `message` from v3
- `.safeParse()` - never throws, always handle errors gracefully
- `z.infer` - automatic TypeScript types from your schema
```

**With context - migration:**

```text
User: /zod How do I migrate this v3 code?
z.string().email().min(5, { message: 'Too short' })

Agent: Here's the Zod v4 equivalent:

\`\`\`typescript
// ❌ Zod v3
z.string().email().min(5, { message: 'Too short' })

// ✅ Zod v4
z.email().min(5, { error: 'Too short' })
\`\`\`

Two breaking changes here:
1. **String formats** moved to top-level: `z.email()` instead of `z.string().email()`
2. **Error messages** now use `error` parameter instead of `message`

This applies to all format validators:
- `z.email()` not `z.string().email()`
- `z.url()` not `z.string().url()`
- `z.uuid()` not `z.string().uuid()`
- etc.

See the migration guide for all breaking changes: [references/migration-from-v3.md]
```

**With context - debugging:**

```text
User: /zod Why is my validation failing?
const schema = z.object({ name: z.string() }).strict();

Agent: In Zod v4, the `.strict()` method has been removed. Use `z.strictObject()` instead:

\`\`\`typescript
// ❌ Zod v3 syntax (won't work in v4)
z.object({ name: z.string() }).strict()

// ✅ Zod v4 syntax
z.strictObject({ name: z.string() })
\`\`\`

Similarly:
- Use `z.looseObject()` instead of `.passthrough()`
- Use shape spreading for extending: `z.object({ ...Base.shape, newField: z.string() })`

This is one of 9 major breaking changes in v4. Want to see the complete list?
```

**Without context:**

```text
User: /zod

Agent: I can help you with Zod v4! What are you trying to do?

Common scenarios:
- **Creating schemas** - validating forms, API responses, configs, user input
- **Migrating from v3** - upgrading existing Zod code to v4
- **Type inference** - getting TypeScript types from your schemas
- **Custom validation** - adding business logic and custom error messages
- **Debugging** - fixing validation errors or understanding failures
- **Advanced patterns** - recursive schemas, discriminated unions, transforms

You can also paste your existing code and I'll help you improve it or migrate it to v4!

For reference, I have access to:
- Complete v3 → v4 migration guide
- Full v4 API reference
- Real-world validation patterns
```

## Related Files

- [Zod v4 Skill](../skills/zod-v4/SKILL.md)
- [Migration from v3](../skills/zod-v4/references/migration-from-v3.md)
- [Core API Reference](../skills/zod-v4/references/core-api.md)
- [Common Patterns](../skills/zod-v4/references/common-patterns.md)
