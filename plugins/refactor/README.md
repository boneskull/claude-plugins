# Refactor

General-purpose software development refactoring and reorganization

## Installation

```bash
/plugin install refactor@boneskull-plugins
```

## Components

### Commands

- `/simplify` - Launch the code-simplifier agent to refactor code

### Agents

- `code-simplifier` - Refactor code to improve readability and maintainability without changing behavior

## Usage

### Using the /simplify command

```
/simplify
```

Then describe what code needs simplification:

```
The calculateTotalPrice function in src/cart.ts has too many nested conditionals
```

The agent will analyze the code and propose refactorings.

### What the code-simplifier does

The code-simplifier agent improves code through systematic refactoring:

- **Reduces complexity** - Simplifies conditionals, extracts complex expressions, uses early returns
- **Eliminates redundancy** - Removes duplicate code, applies DRY principles
- **Improves naming** - Uses descriptive, consistent names that reveal intent
- **Extracts methods** - Breaks large functions into smaller, focused ones
- **Removes dead code** - Eliminates unreachable or unused code
- **Clarifies logic flow** - Makes the happy path obvious, handles edge cases clearly

**Important:** The agent preserves all public APIs and external behavior unless you explicitly authorize changes.

### Example

**Before:**

```typescript
function processOrder(order: Order) {
  if (order.items.length > 0) {
    if (order.customer.isPremium) {
      if (order.total > 100) {
        order.discount = 0.2;
      } else {
        order.discount = 0.1;
      }
    } else {
      if (order.total > 100) {
        order.discount = 0.05;
      }
    }
  }
  return calculateTotal(order);
}
```

**After:**

```typescript
function processOrder(order: Order) {
  if (order.items.length === 0) {
    return calculateTotal(order);
  }

  order.discount = calculateDiscount(order);
  return calculateTotal(order);
}

function calculateDiscount(order: Order): number {
  const isPremium = order.customer.isPremium;
  const isLargeOrder = order.total > 100;

  if (isPremium && isLargeOrder) return 0.2;
  if (isPremium) return 0.1;
  if (isLargeOrder) return 0.05;
  return 0;
}
```

## How It Works

The code-simplifier agent follows a systematic refactoring methodology:

1. **Analyzes before acting** - Understands the code's behavior and public interfaces
2. **Preserves behavior** - Maintains all external contracts, side effects, and error handling
3. **Applies techniques** - Uses proven refactoring patterns to improve clarity
4. **Verifies quality** - Ensures changes genuinely reduce complexity
5. **Communicates clearly** - Explains each change and its benefits

The agent uses Claude Opus for maximum code understanding and refactoring intelligence.

## Development

See [DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for development guidelines.

## License

[Blue Oak Model License 1.0.0](../../LICENSE)
