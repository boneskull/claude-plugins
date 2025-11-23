# Zod v4 Plugin for Claude Code

Expert guidance for using Zod v4, TypeScript's leading validation library. This plugin provides comprehensive documentation on breaking changes from v3, migration patterns, core API usage, and real-world validation patterns.

## What's Included

This plugin provides:

- **Migration Guide**: Complete guide for upgrading from Zod v3 to v4 with all breaking changes
- **Core API Reference**: Comprehensive reference for all Zod v4 primitives and methods
- **Common Patterns**: Real-world validation patterns for forms, APIs, configs, and more
- **Expert Skill**: AI assistant skill that helps you write correct Zod v4 code

## Installation

### For Local Development/Testing

1. Add the development marketplace:

   ```bash
   /plugin marketplace add /Users/boneskull/projects/boneskull/claude-plugins/plugins/zod
   ```

2. Install the plugin:

   ```bash
   /plugin install zod@zod-dev
   ```

3. Restart Claude Code

### For Distribution (GitHub)

Users can install directly from your repository:

```bash
/plugin marketplace add <your-github-username>/claude-plugins
/plugin install zod@<marketplace-name>
```

Or if distributing as a standalone plugin:

```bash
/plugin marketplace add <your-github-username>/zod-plugin
/plugin install zod
```

## Usage

### Commands

#### `/zod [what-you-need]`

Get expert guidance on Zod v4 validation, schemas, and migrations. Optionally provide context about what you're trying to do for targeted advice.

**Examples:**

- `/zod` - Get general help with Zod v4
- `/zod validate user registration form` - Get specific schema examples
- `/zod migrate from v3` - Get migration guidance
- `/zod debugging validation errors` - Get help troubleshooting

### Automatic Skill Activation

The `zod-v4` skill automatically activates when you:

- Mention "Zod" in your requests
- Work with validation schemas
- Ask about type inference or validation patterns
- Need help migrating from Zod v3

### Example Requests

You can ask for help in natural language:

```text
Can you help me create a Zod schema for user registration?
```

```text
I need to migrate this Zod v3 code to v4
```

```text
How do I validate API responses with Zod v4?
```

### Reference Documentation

The skill has access to three comprehensive reference documents:

1. **Migration from v3** ([references/migration-from-v3.md](skills/zod-v4/references/migration-from-v3.md))
   - All breaking changes with before/after examples
   - Migration checklist
   - Automated migration tools

2. **Core API** ([references/core-api.md](skills/zod-v4/references/core-api.md))
   - Complete API reference for all primitives
   - Type inference patterns
   - Validation methods and transforms
   - Error handling
   - Best practices

3. **Common Patterns** ([references/common-patterns.md](skills/zod-v4/references/common-patterns.md))
   - Form validation
   - API response validation
   - Environment variables
   - Configuration files
   - Recursive schemas
   - Database models
   - Testing helpers

## Key Zod v4 Changes

The most important breaking changes to be aware of:

### Error Customization

```typescript
// ❌ Zod 3
z.string().min(5, { message: 'Too short' });

// ✅ Zod 4
z.string().min(5, { error: 'Too short' });
```

### String Formats

```typescript
// ❌ Zod 3
z.string().email();

// ✅ Zod 4
z.email();
```

### Function Schemas

```typescript
// ✅ Zod 4
const myFunc = z
  .function({
    input: [z.string()],
    output: z.number(),
  })
  .implement((str) => str.length);
```

### Object Methods

```typescript
// ❌ Zod 3
z.object({ a: z.string() }).strict();

// ✅ Zod 4
z.strictObject({ a: z.string() });
```

See the [migration guide](skills/zod-v4/references/migration-from-v3.md) for complete details.

## Examples

### Basic Validation

```typescript
import { z } from 'zod/v4';

const userSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  age: z.number().int().positive(),
});

const result = userSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // Typed and validated
} else {
  console.error(result.error.issues);
}
```

### Type Inference

```typescript
type User = z.infer<typeof userSchema>;
// { name: string; email: string; age: number }
```

### Custom Validation

```typescript
const passwordSchema = z
  .string()
  .min(8, { error: 'At least 8 characters required' })
  .regex(/[A-Z]/, { error: 'Must contain uppercase' })
  .regex(/[0-9]/, { error: 'Must contain number' });
```

## Customization

You can customize the skill's behavior by editing [skills/zod-v4/SKILL.md](skills/zod-v4/SKILL.md). The file includes a section for adding:

- Project-specific validation patterns
- Team conventions for error messages
- Custom schema factories or utilities
- Integration patterns with your stack
- Common gotchas specific to your codebase

## Structure

```text
plugins/zod/
├── .claude-plugin/
│   ├── plugin.json          # Plugin manifest
│   └── marketplace.json     # Development marketplace (for local testing)
├── skills/
│   └── zod-v4/
│       ├── SKILL.md         # Main skill definition
│       └── references/
│           ├── migration-from-v3.md   # v3 to v4 migration guide
│           ├── core-api.md            # Complete API reference
│           └── common-patterns.md     # Real-world patterns
└── README.md                # This file
```

## Requirements

- Claude Code (any recent version)
- TypeScript projects using Zod v4

## Resources

- **Official Zod v4 Docs**: https://zod.dev/v4
- **Zod v4 Changelog**: https://zod.dev/v4/changelog
- **Zod GitHub**: https://github.com/colinhacks/zod
- **Community Codemod**: https://github.com/nicoespeon/zod-v3-to-v4

## Contributing

To contribute improvements to this plugin:

1. Make your changes
2. Test locally using the development marketplace
3. Update the version in [.claude-plugin/plugin.json](.claude-plugin/plugin.json)
4. Commit and tag your release

## License

[Add your license here]

## Author

boneskull

---

**Note**: This plugin is for Claude Code and provides AI-assisted guidance. Always refer to the official Zod documentation for the most up-to-date information.
