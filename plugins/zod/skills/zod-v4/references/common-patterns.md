# Zod v4 Common Patterns and Use Cases

## Form Validation

### Basic Form Schema

```typescript
const signupSchema = z
  .object({
    username: z.string().min(3).max(20),
    email: z.email(),
    password: z.string().min(8).regex(/[A-Z]/, {
      error: 'Password must contain at least one uppercase letter',
    }),
    confirmPassword: z.string(),
    age: z.number().int().min(13),
    terms: z.literal(true, { error: 'You must accept the terms' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupForm = z.infer<typeof signupSchema>;
```

### Conditional Fields

```typescript
const formSchema = z
  .object({
    accountType: z.enum(['personal', 'business']),
    businessName: z.string().optional(),
    taxId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.accountType === 'business') {
        return !!data.businessName && !!data.taxId;
      }
      return true;
    },
    {
      error: 'Business accounts require business name and tax ID',
    },
  );
```

### File Upload Validation

```typescript
const imageUploadSchema = z.object({
  file: z
    .file()
    .min(1000) // Min 1KB
    .max(5_000_000) // Max 5MB
    .mime(['image/png', 'image/jpeg', 'image/webp']),
  alt: z.string().min(1).max(200),
  caption: z.string().max(500).optional(),
});
```

## API Response Validation

### Typed API Client

```typescript
// Define response schemas
const UserResponse = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    email: z.email(),
    createdAt: z.string().datetime(),
  })
  .transform((data) => ({
    ...data,
    createdAt: new Date(data.createdAt),
  }));

const ApiError = z.object({
  error: z.string(),
  code: z.string(),
  details: z.unknown().optional(),
});

// Use in API client
async function getUser(id: string) {
  const response = await fetch(`/api/users/${id}`);
  const data = await response.json();

  if (!response.ok) {
    return ApiError.parse(data);
  }

  return UserResponse.parse(data);
}
```

### Paginated Responses

```typescript
function createPaginatedSchema<T extends z.ZodType>(itemSchema: T) {
  return z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      pageSize: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      hasNext: z.boolean(),
    }),
  });
}

const UserListResponse = createPaginatedSchema(
  z.object({
    id: z.string(),
    name: z.string(),
    email: z.email(),
  }),
);

type UserList = z.infer<typeof UserListResponse>;
```

## Environment Variables

### Type-Safe Environment Config

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number).pipe(z.number().int().positive()),
  DATABASE_URL: z.url(),
  API_KEY: z.string().min(1),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int())
    .default('6379'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  ENABLE_METRICS: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

// Parse and validate
const env = envSchema.parse(process.env);

type Env = z.infer<typeof envSchema>;
```

## Configuration Files

### JSON Config Validation

```typescript
const configSchema = z.object({
  version: z.string(),
  database: z.object({
    host: z.string(),
    port: z.number().int().positive(),
    name: z.string(),
    ssl: z.boolean().default(false),
    pool: z
      .object({
        min: z.number().int().nonnegative().default(2),
        max: z.number().int().positive().default(10),
      })
      .optional(),
  }),
  cache: z
    .object({
      enabled: z.boolean(),
      ttl: z.number().int().positive().default(3600),
    })
    .optional(),
  features: z.record(z.string(), z.boolean()).default({}),
});

// Load and validate config
import fs from 'fs';

function loadConfig(path: string) {
  const raw = JSON.parse(fs.readFileSync(path, 'utf-8'));
  return configSchema.parse(raw);
}
```

## Data Coercion

### String to Number/Date

```typescript
// Coerce string to number
const numericSchema = z.preprocess((val) => {
  if (typeof val === 'string') {
    const num = Number(val);
    return isNaN(num) ? val : num;
  }
  return val;
}, z.number());

// Coerce string to date
const dateSchema = z.preprocess((val) => {
  if (typeof val === 'string' || typeof val === 'number') {
    return new Date(val);
  }
  return val;
}, z.date());

// URL search params to typed object
const searchParamsSchema = z.object({
  page: z.preprocess(Number, z.number().int().positive()),
  limit: z.preprocess(Number, z.number().int().positive().max(100)),
  sort: z.enum(['asc', 'desc']).default('asc'),
  query: z.string().optional(),
});

const params = new URLSearchParams(window.location.search);
const parsed = searchParamsSchema.parse(Object.fromEntries(params));
```

## Discriminated Unions

### Event System

```typescript
const BaseEvent = z.object({
  timestamp: z.date(),
  userId: z.string().uuid(),
});

const UserCreatedEvent = z.object({
  ...BaseEvent.shape,
  type: z.literal('user.created'),
  data: z.object({
    email: z.email(),
    name: z.string(),
  }),
});

const UserDeletedEvent = z.object({
  ...BaseEvent.shape,
  type: z.literal('user.deleted'),
  data: z.object({
    reason: z.string().optional(),
  }),
});

const OrderPlacedEvent = z.object({
  ...BaseEvent.shape,
  type: z.literal('order.placed'),
  data: z.object({
    orderId: z.string(),
    total: z.number().positive(),
  }),
});

const Event = z.union([UserCreatedEvent, UserDeletedEvent, OrderPlacedEvent]);

type Event = z.infer<typeof Event>;

// Type-safe event handler
function handleEvent(event: Event) {
  switch (event.type) {
    case 'user.created':
      // event.data.email is available and typed
      console.log('User created:', event.data.email);
      break;
    case 'user.deleted':
      console.log('User deleted');
      break;
    case 'order.placed':
      // event.data.orderId is available and typed
      console.log('Order placed:', event.data.orderId);
      break;
  }
}
```

## Recursive Schemas

### Nested Comments

```typescript
const CommentBase = z.object({
  id: z.string().uuid(),
  author: z.string(),
  content: z.string(),
  createdAt: z.date(),
});

type Comment = z.infer<typeof CommentBase> & {
  replies: Comment[];
};

const Comment: z.ZodType<Comment> = z.object({
  ...CommentBase.shape,
  get replies() {
    return z.array(Comment);
  },
});
```

### File System Tree

```typescript
const FileNode = z.object({
  name: z.string(),
  type: z.literal('file'),
  size: z.number().int().nonnegative(),
  content: z.string().optional(),
});

type DirectoryNode = {
  name: string;
  type: 'directory';
  children: (FileNode | DirectoryNode)[];
};

const DirectoryNode: z.ZodType<DirectoryNode> = z.object({
  name: z.string(),
  type: z.literal('directory'),
  get children() {
    return z.array(z.union([FileNode, DirectoryNode]));
  },
});

const FileSystemNode = z.union([FileNode, DirectoryNode]);
```

## Database Models

### Type-Safe ORM Integration

```typescript
// Database schema with transforms
const UserDbSchema = z
  .object({
    id: z.string().uuid(),
    email: z.email(),
    name: z.string(),
    age: z.number().int().positive().nullable(),
    role: z.enum(['user', 'admin', 'moderator']),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
  })
  .transform((data) => ({
    id: data.id,
    email: data.email,
    name: data.name,
    age: data.age,
    role: data.role,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at),
  }));

// Create/Update schema (no id, timestamps optional)
const UserCreateSchema = z.object({
  email: z.email(),
  name: z.string().min(1),
  age: z.number().int().positive().nullable().optional(),
  role: z.enum(['user', 'admin', 'moderator']).default('user'),
});

const UserUpdateSchema = UserCreateSchema.partial();

type User = z.infer<typeof UserDbSchema>;
type UserCreate = z.infer<typeof UserCreateSchema>;
type UserUpdate = z.infer<typeof UserUpdateSchema>;
```

## Validation Utilities

### Email List Validation

```typescript
const emailListSchema = z
  .string()
  .transform((str) => str.split(',').map((s) => s.trim()))
  .pipe(z.array(z.email()));

// Input: "user1@example.com, user2@example.com"
// Output: ["user1@example.com", "user2@example.com"]
```

### Phone Number Validation

```typescript
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, { error: 'Invalid phone number format' })
  .transform((val) => val.replace(/\s+/g, ''));
```

### Credit Card Validation

```typescript
const creditCardSchema = z.object({
  number: z
    .string()
    .regex(/^\d{13,19}$/, { error: 'Invalid card number' })
    .refine(
      (num) => {
        // Luhn algorithm
        let sum = 0;
        let isEven = false;
        for (let i = num.length - 1; i >= 0; i--) {
          let digit = parseInt(num[i]);
          if (isEven) {
            digit *= 2;
            if (digit > 9) digit -= 9;
          }
          sum += digit;
          isEven = !isEven;
        }
        return sum % 10 === 0;
      },
      { error: 'Invalid card number (failed checksum)' },
    ),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, {
    error: 'Expiry must be MM/YY',
  }),
  cvv: z.string().regex(/^\d{3,4}$/, { error: 'Invalid CVV' }),
});
```

## Testing Helpers

### Mock Data Generation

```typescript
const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.email(),
  name: z.string(),
  age: z.number().int().positive(),
});

function createMockUser(overrides?: Partial<z.infer<typeof UserSchema>>) {
  const mock = {
    id: crypto.randomUUID(),
    email: 'test@example.com',
    name: 'Test User',
    age: 30,
    ...overrides,
  };

  // Validate mock data
  return UserSchema.parse(mock);
}
```

### Schema Testing

```typescript
describe('UserSchema', () => {
  it('accepts valid user data', () => {
    const result = UserSchema.safeParse({
      id: crypto.randomUUID(),
      email: 'test@example.com',
      name: 'John',
      age: 25,
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = UserSchema.safeParse({
      id: crypto.randomUUID(),
      email: 'not-an-email',
      name: 'John',
      age: 25,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['email']);
    }
  });
});
```

## Performance Patterns

### Schema Reuse

```typescript
// ✅ Define once, reuse everywhere
const EmailSchema = z.email();

const UserSchema = z.object({
  email: EmailSchema,
  backupEmail: EmailSchema.optional(),
});

// ❌ Don't recreate schemas
function validateEmail(email: string) {
  return z.email().parse(email); // Creates new schema each call
}
```

### Lazy Validation

```typescript
// Only validate when needed
const expensiveSchema = z.lazy(() =>
  z.object({
    // Complex nested validation
  }),
);
```

### Partial Validation

```typescript
// Validate only specific fields
const FullSchema = z.object({
  field1: z.string(),
  field2: z.number(),
  field3: z.boolean(),
});

// Validate subset
const Field1Only = FullSchema.pick({ field1: true });
Field1Only.parse({ field1: 'value' });
```

## Migration Patterns

### Gradual Type Safety

```typescript
// Start with loose validation
const LegacySchema = z.object({
  data: z.unknown(),
});

// Gradually tighten
const IntermediateSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

// Final strict schema
const StrictSchema = z.object({
  data: z.object({
    id: z.string(),
    value: z.number(),
  }),
});
```

### Version Compatibility

```typescript
const ConfigV1 = z.object({
  version: z.literal('1.0'),
  apiUrl: z.url(),
});

const ConfigV2 = z.object({
  version: z.literal('2.0'),
  apiUrl: z.url(),
  timeout: z.number().int().positive(),
});

const Config = z.union([ConfigV1, ConfigV2]);

function loadConfig(raw: unknown) {
  const config = Config.parse(raw);

  // Migrate v1 to v2
  if (config.version === '1.0') {
    return {
      ...config,
      version: '2.0' as const,
      timeout: 5000,
    };
  }

  return config;
}
```
