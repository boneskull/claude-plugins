# Zod v4 Core API Reference

## Basic Usage

### Importing Zod

```typescript
import * as z from 'zod';
// or
import { z } from 'zod/v4';
```

### Creating and Parsing Schemas

```typescript
// Define a schema
const schema = z.string();

// Parse data (throws on validation failure)
const result = schema.parse('hello'); // "hello"

// Safe parse (returns result object)
const safeResult = schema.safeParse('hello');
if (safeResult.success) {
  console.log(safeResult.data); // "hello"
} else {
  console.log(safeResult.error); // ZodError
}
```

## Primitive Types

### String

```typescript
z.string();

// With validation
z.string().min(5);
z.string().max(10);
z.string().length(8);
z.string().regex(/^\d+$/);
z.string().startsWith('https://');
z.string().endsWith('.com');
z.string().trim(); // Trims whitespace
z.string().toLowerCase();
z.string().toUpperCase();

// Error customization
z.string().min(5, { error: 'Must be at least 5 characters' });
```

### String Formats (NEW in v4 - Top-Level Functions)

```typescript
z.email();
z.url();
z.uuid();
z.guid(); // Lenient UUID-like validation
z.nanoid();
z.cuid();
z.cuid2();
z.ulid();
z.datetime();
z.ip(); // IPv4 or IPv6
z.base64();
z.base64url(); // No padding allowed
```

### Number

```typescript
z.number();

// Validation
z.number().int(); // Integer only, safe range enforced
z.number().positive(); // > 0
z.number().nonnegative(); // >= 0
z.number().negative(); // < 0
z.number().nonpositive(); // <= 0
z.number().min(5);
z.number().max(10);
z.number().multipleOf(5);

// NEW in v4: Infinity rejected by default
z.number().finite(); // Explicitly reject Infinity/NaN

// Error customization
z.number().int({ error: 'Must be an integer' });
```

### Boolean

```typescript
z.boolean();
```

### Date

```typescript
z.date();

// Validation
z.date().min(new Date('2020-01-01'));
z.date().max(new Date('2030-12-31'));
```

### BigInt

```typescript
z.bigint();

// Validation
z.bigint().positive();
z.bigint().nonnegative();
z.bigint().negative();
z.bigint().nonpositive();
```

### Null, Undefined, Void

```typescript
z.null();
z.undefined();
z.void(); // Accepts undefined only
```

### Literal

```typescript
z.literal('exact-string');
z.literal(42);
z.literal(true);
```

### Symbol

```typescript
z.symbol();
```

## Complex Types

### Object

```typescript
// Basic object
const User = z.object({
  name: z.string(),
  age: z.number().int(),
  email: z.email(),
});

// Type inference
type User = z.infer<typeof User>;
// { name: string; age: number; email: string }

// Accessing shape
User.shape.name; // z.string()

// Extending objects (idiomatic v4 pattern)
const UserWithId = z.object({
  ...User.shape,
  id: z.string().uuid(),
});

// Partial, Required, Pick, Omit
User.partial(); // All fields optional
User.required(); // All fields required
User.pick({ name: true }); // Only name field
User.omit({ age: true }); // All except age

// Deep partial (removed in v4 - anti-pattern)
// Use explicit definitions instead
```

### Object Handling Modes (NEW in v4)

```typescript
// Strict: Reject unknown keys (default)
z.strictObject({ name: z.string() });

// Loose: Allow unknown keys
z.looseObject({ name: z.string() });

// Legacy methods still available but deprecated:
// z.object({ ... }).strict()
// z.object({ ... }).passthrough()
```

### Array

```typescript
z.array(z.string());

// Validation
z.array(z.string()).min(1);
z.array(z.string()).max(10);
z.array(z.string()).length(5);

// Non-empty array (v4: returns string[], not tuple)
z.array(z.string()).nonempty();
z.array(z.string()).min(1); // Equivalent

// For tuple-like non-empty arrays:
z.tuple([z.string()], z.string()); // [string, ...string[]]
```

### Tuple

```typescript
// Fixed-length tuple
z.tuple([z.string(), z.number()]);

// Tuple with rest element
z.tuple([z.string()], z.number()); // [string, ...number[]]
```

### Union

```typescript
z.union([z.string(), z.number()]);

// Discriminated unions
const Shape = z.union([
  z.object({ type: z.literal('circle'), radius: z.number() }),
  z.object({ type: z.literal('square'), side: z.number() }),
]);
```

### Enum

```typescript
// Native TypeScript enum
enum Color {
  Red = 'red',
  Blue = 'blue',
}
z.nativeEnum(Color);

// Zod enum
z.enum(['red', 'blue', 'green']);

// Get options
const colors = z.enum(['red', 'blue']);
colors.options; // ["red", "blue"]
```

### Record

**BREAKING in v4: Must specify both key and value schemas:**

```typescript
// ✅ Zod 4
z.record(z.string(), z.number());
z.record(z.enum(['a', 'b']), z.string());

// Partial record (optional keys)
z.partialRecord(z.enum(['a', 'b']), z.string());
```

### Map and Set

```typescript
z.map(z.string(), z.number());
z.set(z.string());

// Validation
z.set(z.string()).min(1);
z.set(z.string()).max(10);
```

### Intersection

```typescript
const Person = z.object({ name: z.string() });
const Employee = z.object({ role: z.string() });

const EmployeePerson = z.intersection(Person, Employee);
// or
const EmployeePerson = Person.and(Employee);
```

### Optional and Nullable

```typescript
z.string().optional(); // string | undefined
z.string().nullable(); // string | null
z.string().nullish(); // string | null | undefined
```

### Default Values

```typescript
z.string().default('default value');
z.number().default(() => Math.random());

// NEW in v4: Defaults apply inside optional fields
z.object({
  name: z.string().default('Anonymous').optional(),
}).parse({}); // { name: "Anonymous" }
```

### Promise

```typescript
z.promise(z.string());

// Parse async
const promise = z.promise(z.string()).parse(Promise.resolve('hello'));
```

### Any and Unknown

```typescript
z.any(); // No validation, type is any
z.unknown(); // No validation, type is unknown

// v4: These no longer mark object keys as optional
```

### Never

```typescript
z.never(); // Never accepts any value
```

## Type Inference

```typescript
const User = z.object({
  name: z.string(),
  age: z.number(),
});

// Infer output type
type User = z.infer<typeof User>;
// { name: string; age: number }

// Infer input type (before transforms)
type UserInput = z.input<typeof User>;
```

## Validation Methods

### Refinements

```typescript
// Basic refinement
z.string().refine((val) => val.length > 0, {
  error: 'String cannot be empty',
});

// Multiple refinements
z.number()
  .refine((n) => n >= 0, { error: 'Must be non-negative' })
  .refine((n) => n <= 100, { error: 'Must be at most 100' });

// With dynamic error messages
z.string().refine((val) => val.length > 0, {
  error: (val) => `Expected non-empty string, got: ${val}`,
});
```

### Transforms

```typescript
// Transform value
z.string().transform((val) => val.length);
// Input: string, Output: number

// Chained transforms
z.string()
  .transform((val) => val.trim())
  .transform((val) => val.toUpperCase());
```

### Preprocessing

```typescript
// Preprocess before validation
z.preprocess((val) => String(val), z.string());

// Common use case: coercion
z.preprocess((val) => Number(val), z.number());
```

## Error Handling

### Parsing Errors

```typescript
try {
  schema.parse(invalidData);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(error.issues); // Array of validation issues
  }
}
```

### Safe Parse

```typescript
const result = schema.safeParse(data);

if (!result.success) {
  console.log(result.error.issues);
  // [
  //   {
  //     code: "too_small",
  //     minimum: 5,
  //     type: "string",
  //     inclusive: true,
  //     exact: false,
  //     message: "String must contain at least 5 character(s)",
  //     path: ["name"]
  //   }
  // ]
}
```

### Custom Error Messages

```typescript
// Simple string
z.string().min(5, { error: 'Too short!' });

// Function for dynamic errors
z.string().min(5, {
  error: (issue) => {
    if (issue.code === 'too_small') {
      return `Minimum ${issue.minimum} characters required`;
    }
  },
});

// Global error map
z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: 'Too small!' };
  }
  return { message: ctx.defaultError };
});
```

### Error Formatting (v4)

```typescript
const error = schema.safeParse(data).error;

// Tree format
const tree = z.treeifyError(error);

// Note: .format(), .flatten(), .formErrors deprecated in v4
```

## Function Validation (REDESIGNED in v4)

```typescript
// Define function schema
const myFunc = z
  .function({
    input: [z.string(), z.number()],
    output: z.string(),
  })
  .implement((name, age) => {
    return `${name} is ${age} years old`;
  });

// Async functions
const asyncFunc = z
  .function({
    input: [z.string()],
    output: z.promise(z.number()),
  })
  .implementAsync(async (str) => {
    return str.length;
  });

// Function is now type-safe and validates inputs/outputs
myFunc('Alice', 30); // Valid
myFunc(123, '30'); // Throws ZodError
```

## File Validation (NEW in v4)

```typescript
z.file()
  .min(10_000) // Min bytes
  .max(1_000_000) // Max bytes
  .mime(['image/png', 'image/jpeg']);
```

## Recursive Types (IMPROVED in v4)

```typescript
// Using getters
const Category = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(Category);
  },
});

// Using z.lazy()
const Node = z.object({
  value: z.string(),
  children: z.lazy(() => z.array(Node)),
});
```

## Standalone Transforms (NEW in v4)

```typescript
const transform = z.transform((input) => String(input));

// Use in schemas
const schema = z.number().pipe(transform);
```

## Best Practices

1. **Always use type inference** instead of manually typing
2. **Prefer `.safeParse()`** over `.parse()` for user input
3. **Use top-level format validators** (z.email(), not z.string().email())
4. **Leverage error customization** for better user experience
5. **Avoid `.deepPartial()`** - use explicit schema design
6. **Use `z.strictObject()`** by default to catch typos
7. **Keep refinements simple** - complex logic should be separate
8. **Document schemas** with JSDoc comments for better DX

## Performance Tips

1. Reuse schema instances - they're immutable
2. Use `.transform()` sparingly - adds overhead
3. Use shape spreading (`z.object({ ...Base.shape, ... })`) to extend schemas
4. Use discriminated unions for better error messages
5. Consider Zod Mini for tree-shakable builds
