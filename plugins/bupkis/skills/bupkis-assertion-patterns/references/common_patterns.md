# Common Bupkis Patterns

Practical patterns and real-world examples for using Bupkis assertions effectively.

## Table of Contents

- [API Response Validation](#api-response-validation)
- [Configuration Validation](#configuration-validation)
- [Error Testing Patterns](#error-testing-patterns)
- [Async Operation Patterns](#async-operation-patterns)
- [Complex Nested Structures](#complex-nested-structures)
- [Test Data Validation](#test-data-validation)
- [Type Safety Patterns](#type-safety-patterns)

---

## API Response Validation

### REST API Success Response

```typescript
const response = await fetch('/api/users/1');
const data = await response.json();

// Validate response structure
expect(data, 'to satisfy', {
  id: expect.it('to be a number'),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  name: expect.it('to be a string', 'and', 'not to be empty'),
  createdAt: expect.it('to be a valid date'),
  roles: expect.it('to be an array', 'and', 'not to be empty'),
});
```

### Paginated API Response

```typescript
const response = await fetchPaginatedUsers({ page: 1, limit: 10 });

expect(response, 'to satisfy', {
  data: expect.it('to be an array', 'and', 'to have length', 10),
  meta: {
    currentPage: 1,
    totalPages: expect.it('to be a positive integer'),
    totalItems: expect.it('to be a positive integer'),
    hasNextPage: expect.it('to be a boolean'),
  },
});

// Validate each user in the array
expect(response.data, 'to have items satisfying', {
  id: expect.it('to be a positive integer'),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  name: expect.it('to be a string'),
});
```

### Error Response Validation

```typescript
const response = await fetchWithError('/api/invalid');

expect(response, 'to satisfy', {
  error: {
    code: expect.it('to be a string'),
    message: expect.it('to be a string', 'and', 'not to be empty'),
    statusCode: expect.it('to be between', 400, 599),
  },
});
```

---

## Configuration Validation

### Application Config

```typescript
const config = loadAppConfig();

expect(config, 'to satisfy', {
  port: expect.it('to be between', 1024, 65535),
  host: expect.it('to be a string'),
  database: {
    url: /^postgresql:\/\//,
    poolSize: expect.it('to be a positive integer'),
  },
  logging: {
    level: expect.it('to be one of', ['debug', 'info', 'warn', 'error']),
    format: expect.it('to be one of', ['json', 'text']),
  },
});
```

### Environment-Specific Config

```typescript
const prodConfig = loadConfig('production');

expect(prodConfig, 'to satisfy', {
  env: 'production',
  debug: false,
  apiUrl: /^https:\/\//, // Must be HTTPS in production
  rateLimiting: {
    enabled: true,
    maxRequests: expect.it('to be a positive integer'),
  },
});
```

### Feature Flags

```typescript
const featureFlags = getFeatureFlags();

expect(featureFlags, 'to be an object', 'and', 'not to be empty');

expect(featureFlags, 'to satisfy', {
  newDashboard: expect.it('to be a boolean'),
  betaFeatures: expect.it('to be a boolean'),
  experimentalApi: expect.it('to be a boolean'),
});
```

---

## Error Testing Patterns

### Standard Error Handling

```typescript
// Function that should throw
expect(() => parseJSON('invalid json'), 'to throw a', SyntaxError);

// With message matching
expect(
  () => parseJSON('invalid json'),
  'to throw a',
  SyntaxError,
  'satisfying',
  { message: /Unexpected token/ },
);
```

### Custom Error Properties

```typescript
expect(
  () => {
    const err = new Error('Database connection failed');
    err.code = 'ECONNREFUSED';
    err.port = 5432;
    throw err;
  },
  'to throw an error satisfying',
  {
    message: /connection failed/,
    code: 'ECONNREFUSED',
    port: 5432,
  },
);
```

### Promise Rejection

```typescript
// Simple rejection
await expectAsync(fetchData('/api/invalid'), 'to reject');

// With error type
await expectAsync(fetchData('/api/invalid'), 'to reject with a', HttpError);

// With error properties
await expectAsync(
  fetchData('/api/invalid'),
  'to reject with error satisfying',
  {
    statusCode: 404,
    message: /not found/,
  },
);
```

### Try-Catch Alternative

```typescript
// ❌ DON'T use try-catch for expected errors
try {
  await riskyOperation();
  expect(true, 'to be truthy'); // Maybe it works?
} catch (error) {
  expect(error, 'to be an', Error); // Or maybe it throws?
}

// ✅ DO use expectAsync with explicit contract
await expectAsync(riskyOperation(), 'to reject with a', ValidationError);
```

---

## Async Operation Patterns

### Promise Resolution

```typescript
// Basic resolution
await expectAsync(fetchUser(123), 'to resolve');

// With value validation
await expectAsync(fetchUser(123), 'to resolve with value satisfying', {
  id: 123,
  name: expect.it('to be a string'),
  email: /^[^\s@]+@/,
});
```

### Async Function Testing

```typescript
async function processData(input) {
  // ... processing
  return result;
}

await expectAsync(
  async () => processData({ valid: true }),
  'to resolve with value satisfying',
  { success: true },
);

await expectAsync(
  async () => processData({ invalid: true }),
  'to reject with error satisfying',
  { code: 'INVALID_INPUT' },
);
```

### Race Conditions

```typescript
// Ensure operation completes within timeout
const promise = Promise.race([slowOperation(), timeout(5000)]);

await expectAsync(promise, 'to resolve with value satisfying', {
  completed: true,
});
```

---

## Complex Nested Structures

### Deep Object Validation

```typescript
const benchmark = {
  name: 'Array.sort performance',
  date: '2024-01-15',
  results: {
    samples: [1.2, 1.3, 1.1, 1.4, 1.2],
    statistics: {
      mean: 1.24,
      median: 1.2,
      stdDev: 0.11,
      min: 1.1,
      max: 1.4,
    },
  },
  metadata: {
    platform: 'Node.js v20.10.0',
    arch: 'x64',
  },
};

expect(benchmark, 'to satisfy', {
  name: expect.it('to be a string', 'and', 'not to be empty'),
  date: /^\d{4}-\d{2}-\d{2}$/,
  results: {
    samples: expect.it('to be an array', 'and', 'to be non-empty'),
    statistics: {
      mean: expect.it('to be a number', 'and', 'to be positive'),
      median: expect.it('to be a number', 'and', 'to be positive'),
      stdDev: expect.it('to be a number'),
      min: expect.it('to be a number'),
      max: expect.it('to be a number'),
    },
  },
  metadata: expect.it('to be an object'),
});
```

### Array of Complex Objects

```typescript
const transactions = [
  { id: 1, amount: 100.5, currency: 'USD', status: 'completed' },
  { id: 2, amount: 250.0, currency: 'EUR', status: 'pending' },
  { id: 3, amount: 75.25, currency: 'GBP', status: 'completed' },
];

// Validate array structure
expect(transactions, 'to be an array', 'and', 'not to be empty');

// Validate each transaction
expect(transactions, 'to have items satisfying', {
  id: expect.it('to be a positive integer'),
  amount: expect.it('to be a positive number'),
  currency: expect.it('to be one of', ['USD', 'EUR', 'GBP']),
  status: expect.it('to be one of', ['pending', 'completed', 'failed']),
});
```

### Optional Properties

```typescript
const user = {
  id: 123,
  name: 'Alice',
  email: 'alice@example.com',
  // phone is optional
};

// Use `to satisfy` to ignore missing optional properties
expect(user, 'to satisfy', {
  id: expect.it('to be a positive integer'),
  name: expect.it('to be a string'),
  email: /^[^\s@]+@/,
  // phone not required, will pass if missing
});

// Explicitly check for optional property if present
if ('phone' in user) {
  expect(user.phone, 'to match', /^\+?\d{10,15}$/);
}
```

---

## Test Data Validation

### Factory-Generated Data

```typescript
const user = UserFactory.create();

// Validate factory output
expect(user, 'to satisfy', {
  id: expect.it('to be a positive integer'),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  createdAt: expect.it('to be a Date'),
  roles: expect.it('to be an array', 'and', 'not to be empty'),
});
```

### Fixture Data

```typescript
const fixtures = loadFixtures('users.json');

expect(fixtures, 'to be an array', 'and', 'to be non-empty');

// Validate all fixtures
expect(fixtures, 'to have items satisfying', {
  id: expect.it('to be a number'),
  email: expect.it('to be a string'),
  name: expect.it('to be a string'),
});
```

### Mock Data Consistency

```typescript
const mockResponse = {
  users: [
    /* ... */
  ],
  meta: { total: 50 },
};

// Ensure mock data is consistent
expect(
  mockResponse.users.length,
  'to be less than or equal to',
  mockResponse.meta.total,
);
```

---

## Type Safety Patterns

### Discriminated Unions

```typescript
type SuccessResult = { success: true; data: any };
type ErrorResult = { success: false; error: string };
type Result = SuccessResult | ErrorResult;

const result: Result = processOperation();

if (result.success) {
  expect(result, 'to satisfy', {
    success: true,
    data: expect.it('to be defined'),
  });
} else {
  expect(result, 'to satisfy', {
    success: false,
    error: expect.it('to be a string', 'and', 'not to be empty'),
  });
}
```

### Generic Type Validation

```typescript
function validateResponse<T>(
  response: unknown,
  shape: Record<string, any>,
): asserts response is T {
  expect(response, 'to satisfy', shape);
}

// Usage
const response = await fetchData();
validateResponse<User>(response, {
  id: expect.it('to be a number'),
  email: expect.it('to be a string'),
});

// TypeScript now knows response is User
console.log(response.email);
```

### Branded Types

```typescript
type UserId = number & { __brand: 'UserId' };

function assertUserId(value: number): asserts value is UserId {
  expect(value, 'to be a positive integer');
}

const id: number = 123;
assertUserId(id);
// id is now UserId
```

---

## Real-World Scenarios

### Database Query Results

```typescript
const users = await db.query('SELECT * FROM users WHERE active = true');

expect(users, 'to be an array');
expect(users, 'to have items satisfying', {
  id: expect.it('to be a positive integer'),
  email: expect.it('to be a string'),
  active: true,
  created_at: expect.it('to be a Date'),
});
```

### Form Validation

```typescript
const formData = {
  username: 'alice123',
  email: 'alice@example.com',
  password: 'securePassword123!',
  age: 25,
};

expect(formData, 'to satisfy', {
  username: expect.it('to be a string', 'and', 'to have length between', 3, 20),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: expect.it('to be a string', 'and', 'to have length at least', 8),
  age: expect.it('to be between', 13, 120),
});
```

### File System Operations

```typescript
const stats = await fs.stat('package.json');

expect(stats, 'to satisfy', {
  size: expect.it('to be a positive number'),
  isFile: expect.it('to be a function'),
  isDirectory: expect.it('to be a function'),
  mtime: expect.it('to be a Date'),
});

expect(stats.isFile(), 'to be true');
```

### HTTP Headers Validation

```typescript
const headers = response.headers;

expect(headers, 'to satisfy', {
  'content-type': /^application\/json/,
  'cache-control': expect.it('to be a string'),
  'x-request-id': expect.it('to be a string', 'and', 'not to be empty'),
});

// Check CORS headers
expect(headers, 'to have property', 'access-control-allow-origin');
```

### Event Emission Validation

```typescript
const emitter = new EventEmitter();
const events: any[] = [];

emitter.on('data', (data) => events.push(data));

emitter.emit('data', { id: 1, value: 'test' });
emitter.emit('data', { id: 2, value: 'test2' });

expect(events, 'to have length', 2);
expect(events, 'to have items satisfying', {
  id: expect.it('to be a positive integer'),
  value: expect.it('to be a string'),
});
```

---

## Anti-Patterns to Avoid

### ❌ Don't: Overly Specific Assertions

```typescript
// Too brittle - breaks if order changes
expect(users, 'to deep equal', [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
]);
```

### ✅ Do: Use Partial Matching

```typescript
// More flexible - only checks what matters
expect(users, 'to have items satisfying', {
  id: expect.it('to be a number'),
  name: expect.it('to be a string'),
});
```

### ❌ Don't: Redundant Checks

```typescript
// Redundant - `to be an object` already implies non-null
expect(config, 'to be an object');
expect(config, 'not to be null'); // Unnecessary!
```

### ✅ Do: Rely on Implied Checks

```typescript
// Object check already ensures non-null
expect(config, 'to be an object');
```

### ❌ Don't: Multiple Separate Assertions

```typescript
// Fragmented - hard to see the expected structure
expect(result.exitCode, 'to equal', 0);
expect(result.stdout, 'to match', /success/);
expect(result.stderr, 'to be empty');
```

### ✅ Do: Use `to satisfy` for Related Properties

```typescript
// Clear - shows expected structure at a glance
expect(result, 'to satisfy', {
  exitCode: 0,
  stdout: /success/,
  stderr: expect.it('to be empty'),
});
```

---

## Tips for Writing Better Assertions

1. **Use `to satisfy` for complex objects** - It's more maintainable than multiple assertions
2. **Leverage `expect.it()` for nested validation** - Embed assertions within object patterns
3. **Use RegExp for flexible string matching** - More robust than exact string comparisons
4. **Chain related assertions with 'and'** - Keeps related checks together
5. **Prefer semantic assertions** - Use `to have property` instead of `'key' in obj`
6. **Use `to have properties` for multiple keys** - More concise than chaining
7. **Let assertions imply related checks** - Don't redundantly check for null after object check
8. **Use `expectAsync` for promises** - Makes contract explicit: resolve or reject
