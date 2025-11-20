# Zod v3 to v4 Migration Guide

## Critical Breaking Changes

### 1. Error Customization API (HIGH IMPACT)

**The `message` parameter is replaced with `error`:**

```typescript
// ❌ Zod 3 (deprecated in v4)
z.string().min(5, { message: 'Too short.' });
z.string({ invalid_type_error: 'Must be a string' });
z.string({ required_error: 'Field is required' });

// ✅ Zod 4
z.string().min(5, { error: 'Too short.' });
z.string({ error: 'Must be a string' });
```

**ErrorMap now accepts strings or functions:**

```typescript
// ✅ Zod 4 - Simple string
z.string().min(5, { error: 'Minimum 5 characters required' });

// ✅ Zod 4 - Function for dynamic errors
z.string().min(5, {
  error: (issue) => {
    if (issue.code === 'too_small') {
      return `Minimum ${issue.minimum} characters required`;
    }
  },
});
```

**Error precedence reversed:**: Schema-level error maps now take precedence over contextual ones passed to `.parse()`.

### 2. ZodError Changes

**`.issues` replaces `.errors`:**

```typescript
// ❌ Zod 3
error.errors;

// ✅ Zod 4
error.issues;
```

**Deprecated formatting methods:**

```typescript
// ❌ Zod 3
error.format();
error.flatten();
error.formErrors;

// ✅ Zod 4
z.treeifyError(error);
```

### 3. Number Validation Tightening

```typescript
// ❌ Zod 3 - Accepts Infinity
z.number().parse(Infinity); // passes

// ✅ Zod 4 - Rejects Infinity
z.number().parse(Infinity); // fails
```

**`.int()` now enforces safe integer range:**

```typescript
// ✅ Zod 4 - Only accepts Number.MIN_SAFE_INTEGER to Number.MAX_SAFE_INTEGER
z.number()
  .int()
  .parse(Number.MAX_SAFE_INTEGER + 1); // fails
```

**`.safe()` no longer accepts floats:**

```typescript
// ❌ Zod 3
z.number().safe().parse(1.5); // passes

// ✅ Zod 4 - Use .int() for integers only
z.number().int().parse(1.5); // fails
```

### 4. String Format API Reorganization

**Format validators moved to top-level functions:**

```typescript
// ❌ Zod 3 (deprecated in v4)
z.string().email();
z.string().uuid();
z.string().url();
z.string().datetime();
z.string().ip();
z.string().base64();

// ✅ Zod 4
z.email();
z.uuid();
z.url();
z.datetime();
z.ip();
z.base64();
z.base64url();
```

**UUID validation now stricter (RFC 9562/4122 compliant):**

```typescript
// If you need lenient UUID-like validation
z.guid(); // Less strict than z.uuid()
```

**Base64url no longer allows padding:**

```typescript
// ❌ Zod 3 - Accepts padding
z.string().base64url().parse('abc=');

// ✅ Zod 4 - Rejects padding
z.base64url().parse('abc='); // fails
z.base64url().parse('abc'); // passes
```

### 5. Object Schema Behavior Changes

**Defaults now apply inside optional fields:**

```typescript
const schema = z.object({
  a: z.string().default('tuna').optional(),
});

// Zod 3: {}
// Zod 4: { a: "tuna" }
schema.parse({});
```

**Object methods deprecated:**

```typescript
// ❌ Zod 3
z.object({ a: z.string() }).strict();
z.object({ a: z.string() }).passthrough();
z.object({ a: z.string() }).nonstrict();

// ✅ Zod 4
z.strictObject({ a: z.string() });
z.looseObject({ a: z.string() });
// .nonstrict() removed - use z.looseObject()
```

**`.merge()` and `.extend()` deprecated, use shape spreading:**

The idiomatic Zod v4 pattern is to use shape spreading instead of `.merge()` or `.extend()`.

```typescript
// ❌ Zod 3
schema1.merge(schema2);
schema1.extend({ newField: z.string() });

// ✅ Zod 4 - Idiomatic pattern for merging schemas
z.object({
  ...schema1.shape,
  ...schema2.shape,
});

// ✅ Zod 4 - Idiomatic pattern for extending schemas
z.object({
  ...schema1.shape,
  newField: z.string(),
});
```

**Why shape spreading?**

- More explicit and readable
- Works consistently with TypeScript object spreading semantics
- Avoids method chaining complexity
- Better tree-shaking potential

**`.deepPartial()` removed (anti-pattern):**

Use explicit partial definitions or refactor your schema design.

**Type optionality fix:**: `z.unknown()` and `z.any()` no longer mark keys as optional in inferred types.

### 6. Array Changes

**`.nonempty()` now behaves like `.min(1)`:**

```typescript
// Zod 3: [string, ...string[]] (tuple type)
// Zod 4: string[] (array type)
z.array(z.string()).nonempty();

// For tuple-like non-empty arrays in v4:
z.tuple([z.string()], z.string());
```

### 7. Function Schema Redesign (MAJOR CHANGE)

```typescript
// ❌ Zod 3
const myFunc = z
  .function()
  .args(z.object({ name: z.string(), age: z.number().int() }))
  .returns(z.string());

// ✅ Zod 4 - Standalone validator factory
const myFunc = z
  .function({
    input: [z.object({ name: z.string(), age: z.number().int() })],
    output: z.string(),
  })
  .implement((input) => `Hello ${input.name}`);

// For async functions
const asyncFunc = z
  .function({
    input: [z.string()],
    output: z.promise(z.number()),
  })
  .implementAsync(async (str) => str.length);
```

### 8. Refinement/Transform Architecture

**`.refine()` ignores type predicates:**

```typescript
// ❌ Zod 3 - Type narrowing worked
const schema = z.string().refine((val): val is 'foo' => val === 'foo');

// ✅ Zod 4 - Type narrowing does not affect schema type
// Use z.literal() or z.enum() for type narrowing
const schema = z.literal('foo');
```

**`ctx.path` removed from refinement context:**

```typescript
// ❌ Zod 3
z.string().refine((val, ctx) => {
  console.log(ctx.path); // Available
  return true;
});

// ✅ Zod 4
// ctx.path no longer available - new parsing architecture for performance
z.string().refine((val, ctx) => {
  // Use ctx.addIssue() to add errors with path
  if (!valid) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Invalid value',
    });
    return z.NEVER;
  }
  return val;
});
```

**Function overload removed from `.refine()`:**

The pattern of passing a function as a second argument is eliminated.

### 9. Record Type Improvements

**Enum keys now enforce exhaustiveness:**

```typescript
// Zod 3: Creates partial type
// Zod 4: Requires all enum keys to exist
const schema = z.record(z.enum(['a', 'b']), z.string());

// For optional keys in v4:
z.partialRecord(z.enum(['a', 'b']), z.string());
```

**Single-argument syntax removed:**

```typescript
// ❌ Zod 3
z.record(z.string());

// ✅ Zod 4 - Must specify both key and value schemas
z.record(z.string(), z.string());
```

### 10. Internal Restructuring

**Generic simplification:**:

```typescript
// Zod 3: ZodType<Output, Def, Input>
// Zod 4: ZodType<Output, Input>
```

**Schema architecture changes:**

- `ZodEffects` deprecated - refinements live within schemas
- `ZodTransform` and `ZodPipe` handle transformations separately

**New `z.core` subpackage:**

```typescript
// Utility functions and types moved to:
import { ... } from "zod/v4/core";
```

**`._def` moved to `._zod.def`:**

```typescript
// ❌ Zod 3
schema._def;

// ✅ Zod 4
schema._zod.def;
```

## Migration Checklist

1. ✅ Replace `message` with `error` in all validation schemas
2. ✅ Update `invalid_type_error` and `required_error` to use `error`
3. ✅ Change `.errors` to `.issues` in error handling
4. ✅ Replace error formatting methods with `z.treeifyError()`
5. ✅ Update string format validators to top-level functions (`.email()` → `z.email()`)
6. ✅ Replace `.merge()` and `.extend()` with shape spreading pattern
7. ✅ Replace `.strict()` and `.passthrough()` with `z.strictObject()` and `z.looseObject()`
8. ✅ Update `z.function()` usage to new API
9. ✅ Review number validation for infinite values
10. ✅ Update record schemas to include key and value schemas
11. ✅ Check for default values inside optional fields
12. ✅ Update `.nonempty()` usage if you need tuple types
13. ✅ Remove usage of `.deepPartial()`
14. ✅ Update refinements that relied on type predicates

## Automated Migration

A community codemod is available to automate some migrations:

```bash
npx zod-v3-to-v4
```

Repository: https://github.com/nicoespeon/zod-v3-to-v4

## Installation

```bash
npm install zod@^4.0.0
```
