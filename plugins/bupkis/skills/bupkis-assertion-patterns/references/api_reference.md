# Bupkis API Reference

Complete reference for all built-in Bupkis assertions. This document is organized by assertion category.

## Table of Contents

- [Core Concepts](#core-concepts)
- [Primitive Assertions](#primitive-assertions)
- [Numeric Assertions](#numeric-assertions)
- [String & Pattern Assertions](#string--pattern-assertions)
- [Collection Assertions](#collection-assertions)
- [Object Assertions](#object-assertions)
- [Function Assertions](#function-assertions)
- [Equality & Comparison Assertions](#equality--comparison-assertions)
- [Error Assertions](#error-assertions)
- [Date & Time Assertions](#date--time-assertions)
- [Promise Assertions](#promise-assertions)
- [Other Assertions](#other-assertions)

---

## Core Concepts

### Natural Language Assertions

Bupkis uses natural language phrases instead of method chaining:

```typescript
// Instead of:
expect(actual).toEqual(expected);

// Write:
expect(actual, 'to equal', expected);
expect(actual, 'is', expected);
expect(actual, 'to be', expected);
```

### Anatomy of an Assertion

```typescript
expect(subject, 'phrase', [parameter?, phrase?, parameter?, ...]);
```

- **Subject**: The value being tested (first parameter)
- **Phrase**: String describing the assertion (e.g., 'to be', 'to equal')
- **Parameter**: Optional values for comparison or validation

### Negation

ANY assertion can be negated by prepending `not` to the first phrase:

```typescript
expect(42, 'to be', 42); // passes
expect(42, 'not to be', '42'); // passes
expect('hello', 'not to be a number'); // passes
```

### Concatenation with 'and'

Chain multiple assertions on the same subject:

```typescript
expect(
  user,
  'to be an object',
  'and',
  'to have property',
  'name',
  'and',
  'to satisfy',
  { age: expect.it('to be greater than', 18) },
);
```

### Embeddable Assertions with expect.it()

Use `expect.it()` to embed assertions within "to satisfy" patterns:

```typescript
expect(user, 'to satisfy', {
  name: expect.it('to be a string'),
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // RegExp works too
  age: expect.it('to be greater than', 18),
  roles: [expect.it('to be a string')], // Each element must be a string
});
```

---

## Primitive Assertions

### `{unknown} to be a string`

**Aliases:** None

**Checks:** Value is a string primitive or String object

```typescript
expect('hello', 'to be a string'); // ✓
expect(42, 'to be a string'); // ✗
expect(42, 'not to be a string'); // ✓
```

### `{unknown} to be a boolean`

**Aliases:** `to be a bool`, `to be boolean`

**Checks:** Value is a boolean primitive or Boolean object

```typescript
expect(true, 'to be a boolean'); // ✓
expect(0, 'to be a boolean'); // ✗
expect(0, 'not to be a boolean'); // ✓
```

### `{unknown} to be a number`

**Aliases:** `to be finite`

**Checks:** Value is a finite number (NaN and Infinity excluded)

```typescript
expect(42, 'to be a number'); // ✓
expect(NaN, 'to be a number'); // ✗ (NaN not considered a number)
expect(Infinity, 'to be a number'); // ✗ (Infinity not considered a number)
```

### `{unknown} to be a bigint`

**Aliases:** None

**Checks:** Value is a BigInt

```typescript
expect(9007199254741991n, 'to be a bigint'); // ✓
expect(42, 'to be a bigint'); // ✗
```

### `{unknown} to be a symbol`

**Aliases:** None

**Checks:** Value is a Symbol

```typescript
expect(Symbol('foo'), 'to be a symbol'); // ✓
expect('foo', 'to be a symbol'); // ✗
```

### `{unknown} to be null`

**Aliases:** None

**Checks:** Value is exactly null

```typescript
expect(null, 'to be null'); // ✓
expect(undefined, 'to be null'); // ✗
```

### `{unknown} to be undefined`

**Aliases:** None

**Checks:** Value is exactly undefined

```typescript
expect(undefined, 'to be undefined'); // ✓
expect(null, 'to be undefined'); // ✗
```

### `{unknown} to be a primitive`

**Aliases:** None

**Checks:** Value is a primitive (string, number, boolean, null, undefined, symbol, bigint)

```typescript
expect('hello', 'to be a primitive'); // ✓
expect(42, 'to be a primitive'); // ✓
expect({}, 'to be a primitive'); // ✗
```

---

## Numeric Assertions

### `{unknown} to be infinite`

**Aliases:** None

**Checks:** Value is Infinity or -Infinity

```typescript
expect(Infinity, 'to be infinite'); // ✓
expect(-Infinity, 'to be infinite'); // ✓
expect(42, 'to be infinite'); // ✗
```

### `{unknown} to be Infinity`

**Aliases:** None

**Checks:** Value is exactly positive Infinity

```typescript
expect(Infinity, 'to be Infinity'); // ✓
expect(-Infinity, 'to be Infinity'); // ✗
```

### `{unknown} to be -Infinity`

**Aliases:** None

**Checks:** Value is exactly negative Infinity

```typescript
expect(-Infinity, 'to be -Infinity'); // ✓
expect(Infinity, 'to be -Infinity'); // ✗
```

### `{unknown} to be positive`

**Aliases:** `to be a positive number`

**Checks:** Value is a positive finite number (excludes 0)

```typescript
expect(42, 'to be positive'); // ✓
expect(0, 'to be positive'); // ✗ (zero is not positive)
expect(-5, 'to be positive'); // ✗
```

### `{unknown} to be a positive integer`

**Aliases:** `to be a positive int`

**Checks:** Value is a positive integer (excludes 0)

```typescript
expect(42, 'to be a positive integer'); // ✓
expect(3.14, 'to be a positive integer'); // ✗ (not an integer)
expect(0, 'to be a positive integer'); // ✗ (zero excluded)
```

### `{unknown} to be negative`

**Aliases:** `to be a negative number`

**Checks:** Value is a negative finite number (excludes 0)

```typescript
expect(-42, 'to be negative'); // ✓
expect(0, 'to be negative'); // ✗
expect(5, 'to be negative'); // ✗
```

### `{unknown} to be a negative integer`

**Aliases:** `to be a negative int`

**Checks:** Value is a negative integer (excludes 0)

```typescript
expect(-42, 'to be a negative integer'); // ✓
expect(-3.14, 'to be a negative integer'); // ✗ (not an integer)
```

### `{unknown} to be NaN`

**Aliases:** None

**Checks:** Value is NaN

```typescript
expect(NaN, 'to be NaN'); // ✓
expect(42, 'to be NaN'); // ✗
```

### `{unknown} to be an integer`

**Aliases:** `to be a safe integer`, `to be an int`, `to be a safe int`

**Checks:** Value is a safe integer

```typescript
expect(42, 'to be an integer'); // ✓
expect(3.14, 'to be an integer'); // ✗
```

### `{unknown} to be greater than {number}`

**Aliases:** None

**Checks:** Value is strictly greater than the parameter

```typescript
expect(10, 'to be greater than', 5); // ✓
expect(5, 'to be greater than', 10); // ✗
```

### `{unknown} to be less than {number}`

**Aliases:** `to be lt`

**Checks:** Value is strictly less than the parameter

```typescript
expect(5, 'to be less than', 10); // ✓
expect(10, 'to be less than', 5); // ✗
```

### `{unknown} to be greater than or equal to {number}`

**Aliases:** `to be at least`, `to be gte`

**Checks:** Value is greater than or equal to the parameter

```typescript
expect(10, 'to be at least', 10); // ✓
expect(15, 'to be at least', 10); // ✓
expect(5, 'to be at least', 10); // ✗
```

### `{unknown} to be less than or equal to {number}`

**Aliases:** `to be at most`, `to be lte`

**Checks:** Value is less than or equal to the parameter

```typescript
expect(10, 'to be at most', 10); // ✓
expect(5, 'to be at most', 10); // ✓
expect(15, 'to be at most', 10); // ✗
```

### `{number} to be between {number} and {number}`

**Aliases:** `to be within`

**Checks:** Value is between two numbers (inclusive)

```typescript
expect(5, 'to be between', 1, 10); // ✓
expect(15, 'to be between', 1, 10); // ✗
```

### `{number} to be close to {number} within {number}`

**Aliases:** None

**Checks:** Value is within tolerance of target

**Parameters:** (subject, target, tolerance)

```typescript
expect(1.0, 'to be close to', 1.1, 0.2); // ✓ (diff = 0.1)
expect(3.14159, 'to be close to', 3.14, 0.01); // ✓
expect(1.0, 'to be close to', 2.0, 0.5); // ✗ (diff = 1.0)
```

---

## String & Pattern Assertions

### `{string} to begin with {string}`

**Aliases:** `to start with`

**Checks:** String starts with the specified prefix

```typescript
expect('hello world', 'to begin with', 'hello'); // ✓
expect('hello world', 'to start with', 'world'); // ✗
```

### `{string} to end with {string}`

**Aliases:** None

**Checks:** String ends with the specified suffix

```typescript
expect('hello world', 'to end with', 'world'); // ✓
expect('hello world', 'to end with', 'hello'); // ✗
```

### `{string} to match {RegExp}`

**Aliases:** None

**Checks:** String matches the regular expression

```typescript
expect('hello123', 'to match', /\d+/); // ✓
expect('JavaScript', 'to match', /^Java/); // ✓
expect('hello', 'to match', /\d+/); // ✗
```

### `{string} to be empty`

**Aliases:** None

**Checks:** String has zero length

```typescript
expect('', 'to be empty'); // ✓
expect('hello', 'to be empty'); // ✗
```

### `{string} to be non-empty`

**Aliases:** None

**Checks:** String has at least one character

```typescript
expect('hello', 'to be non-empty'); // ✓
expect(' ', 'to be non-empty'); // ✓ (whitespace counts)
expect('', 'to be non-empty'); // ✗
```

### `{string} includes {string}`

**Aliases:** `contains`

**Checks:** String contains the substring

```typescript
expect('hello world', 'includes', 'world'); // ✓
expect('hello', 'includes', 'world'); // ✗
```

### `{unknown} to be a RegExp`

**Aliases:** `to be a regex`, `to be a regexp`

**Checks:** Value is a RegExp object

```typescript
expect(/hello/, 'to be a RegExp'); // ✓
expect(new RegExp('world'), 'to be a regex'); // ✓
expect('hello', 'to be a RegExp'); // ✗
```

---

## Collection Assertions

### `{unknown} to be an array`

**Aliases:** `to be array`

**Checks:** Value is an Array

```typescript
expect([], 'to be an array'); // ✓
expect([1, 2, 3], 'to be an array'); // ✓
expect('hello', 'to be an array'); // ✗
```

### `{arraylike} to be empty`

**Aliases:** None

**Checks:** Array/string/collection has zero length

```typescript
expect([], 'to be empty'); // ✓
expect([1, 2, 3], 'to be empty'); // ✗
```

### `{array} to have length {nonnegative-integer}`

**Aliases:** `to have size`

**Checks:** Array/string has exact length

```typescript
expect([1, 2, 3], 'to have length', 3); // ✓
expect('hello', 'to have length', 5); // ✓
expect([1, 2], 'to have length', 3); // ✗
```

### `{arraylike} to be non-empty`

**Aliases:** None

**Checks:** Array/string has at least one element

```typescript
expect([1, 2, 3], 'to be non-empty'); // ✓
expect([], 'to be non-empty'); // ✗
```

### `{array} to contain {any}`

**Aliases:** `to include`

**Checks:** Array contains the value

```typescript
expect([1, 2, 3], 'to contain', 2); // ✓
expect(['a', 'b'], 'to include', 'c'); // ✗
```

### `{Map} to contain {any}`

**Aliases:** `to include`

**Checks:** Map contains the key

```typescript
const map = new Map([['key1', 'value1']]);
expect(map, 'to contain', 'key1'); // ✓
expect(map, 'to contain', 'key2'); // ✗
```

### `{Map} to have size {nonnegative-integer}`

**Aliases:** None

**Checks:** Map has exact size

```typescript
const map = new Map([
  ['a', 1],
  ['b', 2],
]);
expect(map, 'to have size', 2); // ✓
expect(map, 'to have size', 3); // ✗
```

### `{Map} to be empty`

**Aliases:** None

**Checks:** Map has no entries

```typescript
expect(new Map(), 'to be empty'); // ✓
expect(new Map([['a', 1]]), 'to be empty'); // ✗
```

### `{Set} to contain {any}`

**Aliases:** `to include`

**Checks:** Set contains the value

```typescript
const set = new Set([1, 2, 3]);
expect(set, 'to contain', 2); // ✓
expect(set, 'to contain', 5); // ✗
```

### `{Set} to have size {nonnegative-integer}`

**Aliases:** None

**Checks:** Set has exact size

```typescript
const set = new Set([1, 2, 3]);
expect(set, 'to have size', 3); // ✓
expect(set, 'to have size', 5); // ✗
```

### `{Set} to be empty`

**Aliases:** None

**Checks:** Set has no elements

```typescript
expect(new Set(), 'to be empty'); // ✓
expect(new Set([1]), 'to be empty'); // ✗
```

### `{unknown} to be a Set`

**Aliases:** None

**Checks:** Value is a Set

```typescript
expect(new Set(), 'to be a Set'); // ✓
expect([1, 2, 3], 'to be a Set'); // ✗
```

### `{WeakMap} to contain {object | symbol}`

**Aliases:** `to include`

**Checks:** WeakMap contains the key

```typescript
const obj = {};
const wm = new WeakMap([[obj, 'value']]);
expect(wm, 'to contain', obj); // ✓
```

### `{unknown} to be a WeakMap`

**Aliases:** None

**Checks:** Value is a WeakMap

```typescript
expect(new WeakMap(), 'to be a WeakMap'); // ✓
expect(new Map(), 'to be a WeakMap'); // ✗
```

### `{WeakSet} to contain {object | symbol}`

**Aliases:** `to include`

**Checks:** WeakSet contains the value

```typescript
const obj = {};
const ws = new WeakSet([obj]);
expect(ws, 'to contain', obj); // ✓
```

### `{unknown} to be a WeakSet`

**Aliases:** None

**Checks:** Value is a WeakSet

```typescript
expect(new WeakSet(), 'to be a WeakSet'); // ✓
expect(new Set(), 'to be a WeakSet'); // ✗
```

---

## Object Assertions

### `{unknown} to be an object`

**Aliases:** None

**Checks:** Value is an object (includes arrays, excludes null)

```typescript
expect({}, 'to be an object'); // ✓
expect([], 'to be an object'); // ✓ (arrays are objects)
expect(new Date(), 'to be an object'); // ✓
expect(null, 'to be an object'); // ✗
expect('hello', 'to be an object'); // ✗
```

**Note:** `to be an object` already implies non-null. No need for redundant null checks.

### `{unknown} to be a record`

**Aliases:** `to be a plain object`

**Checks:** Value is a plain object (excludes arrays, dates, etc.)

```typescript
expect({}, 'to be a record'); // ✓
expect({ a: 1 }, 'to be a plain object'); // ✓
expect([], 'to be a record'); // ✗
expect(new Date(), 'to be a record'); // ✗
```

### `{object} to be empty`

**Aliases:** None

**Checks:** Object has no own enumerable properties

```typescript
expect({}, 'to be empty'); // ✓
expect({ a: 1 }, 'to be empty'); // ✗
```

### `{object} to have keys {array}`

**Aliases:** `to have properties`, `to have props`, `to include keys`, `to include properties`, `to include props`, `to contain keys`, `to contain properties`, `to contain props`

**Checks:** Object has all specified keys

```typescript
expect({ a: 1, b: 2 }, 'to have keys', ['a', 'b']); // ✓
expect({ a: 1 }, 'to have keys', ['a', 'b']); // ✗ (missing 'b')
```

### `{object} to have key {keypath}`

**Aliases:** `to have property`, `to have prop`, `to include key`, `to include property`, `to include prop`, `to contain key`, `to contain property`, `to contain prop`

**Checks:** Object has property at keypath (supports dot/bracket notation)

**Keypath formats:**

- Dot notation: `'prop.nested'`
- Bracket notation: `'arr[0]'`, `'obj["key"]'`
- Mixed: `'data.items[1].name'`

```typescript
const obj = {
  foo: { bar: [{ baz: 'value' }] },
  items: [{ id: 1 }, { id: 2 }],
};

expect(obj, 'to have property', 'foo.bar'); // ✓
expect(obj, 'to have key', 'foo.bar[0].baz'); // ✓
expect(obj, 'to have property', 'items[1].id'); // ✓
expect(obj, 'to have key', 'nonexistent.path'); // ✗
```

### `{object} to have exact key {string | number | symbol}`

**Aliases:** `to have exact property`, `to have exact prop`

**Checks:** Object has direct property (no keypath traversal)

```typescript
const sym = Symbol('test');
const obj = {
  'key.with.dots': 'value', // literal key, not nested
  'key[with]brackets': 'value', // literal key, not array
  [sym]: 'symbol value',
};

expect(obj, 'to have exact key', 'key.with.dots'); // ✓ (literal key)
expect(obj, 'to have exact property', 'key[with]brackets'); // ✓
expect(obj, 'to have exact key', sym); // ✓
```

### `{object} to satisfy {any}`

**Aliases:** `to be like`

**Checks:** Object contains at least the specified properties (partial match)

**Special features:**

- RegExp values test corresponding property as string
- `expect.it()` embeds assertions
- Ignores extra properties

```typescript
expect({ a: 1, b: 2, c: 3 }, 'to satisfy', { a: 1, b: 2 }); // ✓

// Using RegExp
expect({ email: 'user@example.com', phone: '+1-555-0123' }, 'to satisfy', {
  email: /^user@/,
  phone: /^\+1-555/,
}); // ✓

// Using expect.it()
expect({ name: 'John', age: 30 }, 'to satisfy', {
  name: expect.it('to be a string'),
  age: expect.it('to be greater than', 18),
}); // ✓
```

### `{object} to have a null prototype`

**Aliases:** `to be a dictionary`

**Checks:** Object was created with Object.create(null)

```typescript
const obj = Object.create(null);
expect(obj, 'to have a null prototype'); // ✓
expect({}, 'to have a null prototype'); // ✗
```

### `{string | number | symbol} to be an enumerable property of {non-null}`

**Aliases:** `{non-null} to have enumerable property {string | number | symbol}`

**Checks:** Property exists and is enumerable

```typescript
const obj = { a: 1, b: 2 };
expect('a', 'to be an enumerable property of', obj); // ✓

Object.defineProperty(obj, 'c', { value: 3, enumerable: false });
expect('c', 'to be an enumerable property of', obj); // ✗
```

### `{unknown} to be sealed`

**Aliases:** None

**Checks:** Object is sealed (Object.seal())

```typescript
const obj = { a: 1 };
Object.seal(obj);
expect(obj, 'to be sealed'); // ✓
expect({}, 'to be sealed'); // ✗
```

### `{unknown} to be frozen`

**Aliases:** None

**Checks:** Object is frozen (Object.freeze())

```typescript
const obj = { a: 1 };
Object.freeze(obj);
expect(obj, 'to be frozen'); // ✓
expect({}, 'to be frozen'); // ✗
```

### `{unknown} to be extensible`

**Aliases:** None

**Checks:** New properties can be added to object

```typescript
expect({}, 'to be extensible'); // ✓

const obj = {};
Object.preventExtensions(obj);
expect(obj, 'to be extensible'); // ✗
```

---

## Function Assertions

### `{unknown} to be a function`

**Aliases:** None

**Checks:** Value is a function

```typescript
expect(() => {}, 'to be a function'); // ✓
expect(Math.max, 'to be a function'); // ✓
expect('hello', 'to be a function'); // ✗
```

### `{unknown} to be an async function`

**Aliases:** None

**Checks:** Value is an async function

```typescript
expect(async () => {}, 'to be an async function'); // ✓
expect(() => {}, 'to be an async function'); // ✗
```

### `{unknown} to be a constructor`

**Aliases:** `to be constructible`, `to be a class`

**Checks:** Function can be called with 'new'

**Warning:** Cannot reliably distinguish classes from regular functions

```typescript
class MyClass {}
expect(MyClass, 'to be a class'); // ✓
expect(Date, 'to be a constructor'); // ✓
```

### `{function} to have arity {nonnegative-integer}`

**Aliases:** None

**Checks:** Function has exact number of parameters

```typescript
function add(a, b) {
  return a + b;
}
expect(add, 'to have arity', 2); // ✓
expect(add, 'to have arity', 3); // ✗
```

### `{function} to throw [{any}]`

**Aliases:** `to throw an error satisfying`

**Checks:** Function throws when called

**Optional parameter:** Uses "to satisfy" semantics (string/RegExp/object matching)

```typescript
expect(() => {
  throw new Error('oops');
}, 'to throw'); // ✓

// String matching
expect(
  () => {
    throw new Error('Specific error');
  },
  'to throw',
  'Specific error',
); // ✓

// RegExp matching
expect(
  () => {
    throw new Error('Error: failed');
  },
  'to throw',
  /failed/,
); // ✓

// Object matching
expect(
  () => {
    throw new Error('Custom error');
  },
  'to throw',
  { message: 'Custom error' },
); // ✓
```

### `{function} to throw a {constructor}`

**Aliases:** `to throw an`

**Checks:** Function throws specific error type

```typescript
expect(
  () => {
    throw new TypeError('type error');
  },
  'to throw a',
  TypeError,
); // ✓

expect(
  () => {
    throw new TypeError('type error');
  },
  'to throw a',
  RangeError,
); // ✗
```

### `{function} to throw a {constructor} satisfying {any}`

**Aliases:** `to throw an {constructor} satisfying`

**Checks:** Function throws specific error type matching pattern

```typescript
expect(
  () => {
    const err = new Error('Custom error');
    err.code = 'CUSTOM_CODE';
    throw err;
  },
  'to throw a',
  Error,
  'satisfying',
  { code: 'CUSTOM_CODE' },
); // ✓
```

---

## Equality & Comparison Assertions

### `{unknown} to equal {any}`

**Aliases:** `to be`, `equals`, `is`, `is equal to`, `to strictly equal`, `is strictly equal to`

**Checks:** Values are strictly equal (===)

```typescript
expect(42, 'to be', 42); // ✓
expect('hello', 'to equal', 'hello'); // ✓
expect(42, 'is', '42'); // ✗ (different types)
expect({}, 'to equal', {}); // ✗ (different references)
```

### `{unknown} to deep equal {any}`

**Aliases:** `to deeply equal`

**Checks:** Values are deeply equal (recursive comparison)

```typescript
expect({ a: 1, b: 2 }, 'to deep equal', { a: 1, b: 2 }); // ✓
expect([1, 2, 3], 'to deeply equal', [1, 2, 3]); // ✓
expect({ a: 1 }, 'to deep equal', { a: 1, b: 2 }); // ✗
```

### `{unknown} to be one of {array}`

**Aliases:** None

**Checks:** Value is in the array

```typescript
expect(2, 'to be one of', [1, 2, 3]); // ✓
expect('blue', 'to be one of', ['red', 'green', 'blue']); // ✓
expect(5, 'to be one of', [1, 2, 3]); // ✗
```

### `{unknown} to be an instance of {constructor}`

**Aliases:** `to be a`, `to be an`

**Checks:** Value is instance of constructor

```typescript
expect(new Date(), 'to be an instance of', Date); // ✓
expect([], 'to be a', Array); // ✓
expect('hello', 'to be an instance of', Number); // ✗
```

### `{unknown} to be a {intrinsic-type}`

**Aliases:** `to be an`, `to have type`

**Checks:** Value is of intrinsic type (case-insensitive)

**Intrinsic types:** string, number, boolean, bigint, symbol, undefined, object, function, null, Map, Set, WeakMap, WeakSet, WeakRef, Date, Error, Array, RegExp, Promise

```typescript
expect(new Date(), 'to be a', 'Date'); // ✓
expect([], 'to be an', 'Array'); // ✓
expect(1, 'to be a', 'number'); // ✓
```

---

## Error Assertions

### `{unknown} to be an Error`

**Aliases:** `to be a Error`

**Checks:** Value is an Error instance

```typescript
expect(new Error(), 'to be an Error'); // ✓
expect(new TypeError(), 'to be an Error'); // ✓
expect('error message', 'to be an Error'); // ✗
```

### `{Error} to have message {string}`

**Aliases:** None

**Checks:** Error has exact message

```typescript
const error = new Error('Something went wrong');
expect(error, 'to have message', 'Something went wrong'); // ✓
expect(error, 'to have message', 'Different message'); // ✗
```

### `{Error} to have message matching {RegExp}`

**Aliases:** None

**Checks:** Error message matches pattern

```typescript
const error = new Error('File not found: /path/to/file.txt');
expect(error, 'to have message matching', /File not found/); // ✓
expect(error, 'to have message matching', /\.txt$/); // ✓
```

---

## Date & Time Assertions

### `{unknown} to be a Date`

**Aliases:** `to be a date`

**Checks:** Value is a Date object

```typescript
expect(new Date(), 'to be a Date'); // ✓
expect('2024-01-01', 'to be a Date'); // ✗
expect(1704067200000, 'to be a Date'); // ✗ (timestamp)
```

### `{unknown} to be a valid date`

**Aliases:** `to be date-like`

**Checks:** Value can be converted to a valid date

```typescript
expect(new Date(), 'to be a valid date'); // ✓
expect('2024-01-01', 'to be date-like'); // ✓
expect(1704067200000, 'to be a valid date'); // ✓ (timestamp)
expect('invalid-date', 'to be a valid date'); // ✗
```

### `{date-like} to be before {date-like}`

**Aliases:** None

**Checks:** Date is before another date

```typescript
expect(new Date('2022-01-01'), 'to be before', new Date('2023-01-01')); // ✓
expect('2022-01-01', 'to be before', '2023-01-01'); // ✓
```

### `{date-like} to be after {date-like}`

**Aliases:** None

**Checks:** Date is after another date

```typescript
expect(new Date('2023-01-01'), 'to be after', new Date('2022-01-01')); // ✓
expect(Date.now(), 'to be after', new Date('2020-01-01')); // ✓
```

### `{date-like} to be between {date-like} and {date-like}`

**Aliases:** None

**Checks:** Date is between two dates (inclusive)

```typescript
expect(
  new Date('2022-06-01'),
  'to be between',
  new Date('2022-01-01'),
  new Date('2022-12-31'),
); // ✓
```

### `{date-like} to be the same date as {date-like}`

**Aliases:** None

**Checks:** Dates represent the same calendar day (ignores time)

```typescript
expect(
  new Date('2023-01-01T10:00:00'),
  'to be the same date as',
  new Date('2023-01-01T15:30:00'),
); // ✓ (same date, different times)
```

### `{date-like} to equal {date-like} within {duration}`

**Aliases:** None

**Checks:** Dates are within specified duration

**Duration formats:** "100 milliseconds", "30 seconds", "5 minutes", "2 hours", "7 days"

```typescript
const date1 = new Date('2023-01-01T10:00:00.000Z');
const date2 = new Date('2023-01-01T10:00:00.500Z');
expect(date1, 'to equal', date2, 'within', '1 second'); // ✓ (500ms diff)
```

### `{unknown} to be a weekend`

**Aliases:** None

**Checks:** Date is Saturday or Sunday (in UTC)

```typescript
expect(new Date('2023-01-07'), 'to be a weekend'); // ✓ (Saturday)
expect(new Date('2023-01-09'), 'to be a weekend'); // ✗ (Monday)
```

### `{unknown} to be a weekday`

**Aliases:** None

**Checks:** Date is Monday-Friday (in UTC)

```typescript
expect(new Date('2023-01-09'), 'to be a weekday'); // ✓ (Monday)
expect(new Date('2023-01-07'), 'to be a weekday'); // ✗ (Saturday)
```

---

## Promise Assertions

**Note:** All promise assertions require `expectAsync()` instead of `expect()`

### `{Promise} to resolve`

**Aliases:** `to fulfill`

**Checks:** Promise resolves successfully

```typescript
await expectAsync(Promise.resolve(42), 'to resolve'); // ✓
await expectAsync(async () => 'result', 'to resolve'); // ✓
await expectAsync(Promise.reject('error'), 'to resolve'); // ✗
```

### `{Promise} to reject`

**Aliases:** None

**Checks:** Promise rejects

```typescript
await expectAsync(Promise.reject('error'), 'to reject'); // ✓
await expectAsync(async () => {
  throw new Error('failed');
}, 'to reject'); // ✓
await expectAsync(Promise.resolve(42), 'to reject'); // ✗
```

### `{Promise} to reject with a {constructor}`

**Aliases:** `to reject with an`

**Checks:** Promise rejects with specific error type

```typescript
await expectAsync(
  Promise.reject(new TypeError('Type error')),
  'to reject with a',
  TypeError,
); // ✓
```

### `{Promise} to reject with error satisfying {any}`

**Aliases:** None

**Checks:** Promise rejection matches pattern (string/RegExp/object)

```typescript
// String matching
await expectAsync(
  Promise.reject(new Error('Specific error')),
  'to reject with',
  'Specific error',
); // ✓

// RegExp matching
await expectAsync(
  Promise.reject(new Error('Error: Something failed')),
  'to reject with',
  /Something failed/,
); // ✓

// Object matching
await expectAsync(
  Promise.reject({ message: 'Custom error', code: 500 }),
  'to reject with',
  { message: 'Custom error' },
); // ✓
```

### `{Promise} to resolve with value satisfying {any}`

**Aliases:** `to fulfill with value satisfying`

**Checks:** Promise resolves to value matching pattern

```typescript
// String matching
await expectAsync(
  Promise.resolve('Hello World'),
  'to fulfill with value satisfying',
  'Hello World',
); // ✓

// RegExp matching
await expectAsync(
  Promise.resolve('Success: Operation completed'),
  'to resolve to value satisfying',
  /Success/,
); // ✓

// Object matching
await expectAsync(
  Promise.resolve({ status: 'ok', data: [1, 2, 3] }),
  'to fulfill with value satisfying',
  { status: 'ok' },
); // ✓
```

---

## Other Assertions

### `{unknown} to be truthy`

**Aliases:** `to exist`, `to be ok`

**Checks:** Value is truthy

```typescript
expect(1, 'to be truthy'); // ✓
expect('hello', 'to be truthy'); // ✓
expect(true, 'to exist'); // ✓
expect(0, 'to be truthy'); // ✗
expect('', 'to exist'); // ✗
expect(null, 'to be ok'); // ✗
```

### `{unknown} to be falsy`

**Aliases:** None

**Checks:** Value is falsy

```typescript
expect(0, 'to be falsy'); // ✓
expect('', 'to be falsy'); // ✓
expect(false, 'to be falsy'); // ✓
expect(null, 'to be falsy'); // ✓
expect(undefined, 'to be falsy'); // ✓
expect(1, 'to be falsy'); // ✗
```

### `{unknown} to be defined`

**Aliases:** None

**Checks:** Value is not undefined

```typescript
expect(0, 'to be defined'); // ✓
expect('', 'to be defined'); // ✓
expect(null, 'to be defined'); // ✓
expect(undefined, 'to be defined'); // ✗
```

---

## Quick Reference Tables

### Type Checking

| Phrase             | Checks                  |
| ------------------ | ----------------------- |
| `to be a string`   | Is a string             |
| `to be a number`   | Is a finite number      |
| `to be a boolean`  | Is a boolean            |
| `to be a bigint`   | Is a BigInt             |
| `to be a symbol`   | Is a Symbol             |
| `to be an object`  | Is an object (non-null) |
| `to be a function` | Is a function           |
| `to be an array`   | Is an Array             |
| `to be a Date`     | Is a Date object        |
| `to be an Error`   | Is an Error             |
| `to be null`       | Is null                 |
| `to be undefined`  | Is undefined            |
| `to be defined`    | Is not undefined        |

### Comparisons

| Phrase                    | Checks                   |
| ------------------------- | ------------------------ |
| `to equal`, `to be`, `is` | Strict equality (===)    |
| `to deep equal`           | Deep structural equality |
| `to be greater than`      | Numeric > comparison     |
| `to be less than`         | Numeric < comparison     |
| `to be between`           | Within range (inclusive) |
| `to be one of`            | Value in array           |

### Collections

| Phrase                               | Checks                         |
| ------------------------------------ | ------------------------------ |
| `to be empty`                        | Length/size is 0               |
| `to have length`                     | Exact length/size              |
| `to contain`, `to include`           | Contains value                 |
| `to have property`, `to have key`    | Has property (keypath support) |
| `to have properties`, `to have keys` | Has all specified keys         |

### Object Patterns

| Phrase       | Checks                                               |
| ------------ | ---------------------------------------------------- |
| `to satisfy` | Partial object match with RegExp/expect.it() support |
| `to be like` | Alias for `to satisfy`                               |

### Promises

| Phrase                             | Requires        | Checks                     |
| ---------------------------------- | --------------- | -------------------------- |
| `to resolve`                       | `expectAsync()` | Promise resolves           |
| `to reject`                        | `expectAsync()` | Promise rejects            |
| `to reject with`                   | `expectAsync()` | Rejection matches pattern  |
| `to resolve with value satisfying` | `expectAsync()` | Resolution matches pattern |

### Functions

| Phrase              | Checks                              |
| ------------------- | ----------------------------------- |
| `to throw`          | Function throws                     |
| `to throw a {Type}` | Function throws specific error type |
| `to have arity`     | Function parameter count            |
