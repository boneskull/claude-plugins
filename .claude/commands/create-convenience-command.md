---
description: Create a convenience command for a specific skill to make it easier to invoke
argument-hint: <plugin-name>/<skill-name>
---

# Create Convenience Command

Create a slash command that provides convenient access to a specific skill in the marketplace.

## Usage

```
/create-convenience-command <plugin-name>/<skill-name>
```

**Arguments:**

- `plugin-name`: The name of the plugin containing the skill (e.g., `bupkis`)
- `skill-name`: The name of the skill directory (e.g., `bupkis-assertion-patterns`)

## What is a Convenience Command?

A convenience command is a slash command that makes it easier to invoke and work with a specific skill. Instead of relying on the agent to automatically discover when to use a skill, convenience commands let users explicitly invoke skill knowledge when needed.

## Example

For the `bupkis/bupkis-assertion-patterns` skill, a convenience command `/bupkis` would:

- Let users quickly ask about bupkis assertion patterns
- Accept optional context about what they're trying to assert
- Load the skill knowledge on-demand
- Provide targeted guidance based on the user's needs

## Instructions

Follow these steps to create a convenience command:

### 1. Validate Inputs

- Ensure the plugin exists in `plugins/<plugin-name>/`
- Verify the skill exists at `plugins/<plugin-name>/skills/<skill-name>/SKILL.md`
- Check that a command with the same name doesn't already exist in `plugins/<plugin-name>/commands/`

### 2. Read the Skill File

Read the target skill file to understand:

- What the skill does (from description)
- When to use it
- What patterns or capabilities it provides
- Any key concepts or terminology

For our example:

```bash
plugins/bupkis/skills/bupkis-assertion-patterns/SKILL.md
```

### 3. Determine Command Name

The command name should be:

- The plugin name (if the plugin has one primary skill)
- A shortened, memorable name that relates to the skill
- In kebab-case format

For `bupkis/bupkis-assertion-patterns`, the command name would be: **`bupkis`**

### 4. Create Command File

Create `plugins/<plugin-name>/commands/<command-name>.md` with:

**YAML Frontmatter:**

```yaml
---
description: Brief description of what the command helps with
argument-hint: [optional-context] # Optional: if command takes arguments
---
```

**Command Content:**

Structure the command file with these sections:

1. **Title and Overview**: Clear statement of what the command does
2. **Usage**: How to invoke the command (with or without arguments)
3. **Instructions**: What the agent should do when the command is invoked
4. **Example Interactions**: Show how the command might be used

### 5. Write the Command Content

For our `bupkis` example, create `plugins/bupkis/commands/bupkis.md`:

```markdown
---
description: Get guidance on writing idiomatic bupkis assertions
argument-hint: [what-to-assert]
---

# Bupkis Assertion Guidance

Provide guidance on writing idiomatic assertions using the bupkis testing library.

## Usage
```

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
   - Show before/after comparisons if helpful

3. **If no context was provided**, offer to help by:
   - Asking what they're trying to test or assert
   - Listing common scenarios (checking properties, verifying structure, testing promises, etc.)
   - Offering to show examples of specific patterns

4. **Always emphasize**:
   - Using semantic assertions over indirect checks
   - Combining related checks with `to satisfy`
   - Choosing positive assertions when possible
   - Letting assertions imply related checks (e.g., `to be an object` implies non-null)

## Example Interactions

**With context:**

```

User: /bupkis checking if an object has multiple numeric properties

Agent: For checking multiple properties with specific types, use `to satisfy`
with nested `expect.it()` assertions:

[Shows pattern #2 from the skill with relevant example]

```

**Without context:**

```

User: /bupkis

Agent: I can help you write idiomatic bupkis assertions! What are you trying to test?

Common scenarios:

- Checking if properties exist on objects
- Verifying object structure and types
- Testing arrays or collections
- Validating promise behavior
- Type checking values

Let me know what you're working on, or ask about a specific pattern!

```

## Related Skill

- [Bupkis Assertion Patterns](../skills/bupkis-assertion-patterns/SKILL.md)
```

### 6. Test the Command

After creating the command:

1. Format the file:

   ```bash
   npm run format
   ```

2. If testing locally, reload the plugin or restart Claude Code

3. Try invoking the command:
   ```
   /bupkis
   /bupkis checking if a result object has the right exit code and output
   ```

### 7. Update Plugin README

Add the new command to the plugin's README.md under the Commands section:

```markdown
## Commands

### `/bupkis [what-to-assert]`

Get guidance on writing idiomatic bupkis assertions. Optionally provide context
about what you're trying to test for targeted advice.

**Examples:**

- `/bupkis` - Get general help with assertions
- `/bupkis checking multiple properties` - Get specific guidance
```

### 8. Format and Commit

```bash
# Format all files
npm run format

# Add the new files
git add plugins/<plugin-name>/commands/<command-name>.md
git add plugins/<plugin-name>/README.md

# Commit with conventional commit format
git commit -m "feat(<plugin-name>): add /<command-name> convenience command

Add slash command for convenient access to <skill-name> skill.
Provides on-demand guidance for [brief description of what the skill does].

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

## Command Design Guidelines

### DO

- ✅ Make the command name memorable and related to the skill
- ✅ Support optional arguments for context (makes the command more flexible)
- ✅ Explicitly reference the skill file in the instructions
- ✅ Provide example interactions showing both with and without arguments
- ✅ Include helpful prompts when no context is provided
- ✅ Link to the related skill file

### DON'T

- ❌ Duplicate the entire skill content in the command
- ❌ Make the command name too long or complicated
- ❌ Create commands for skills that are already well auto-discovered
- ❌ Forget to update the README with the new command

## When to Create Convenience Commands

Create convenience commands when:

- The skill provides reference material users might want on-demand
- The skill might not be auto-discovered when needed
- Users benefit from explicitly invoking the skill with context
- The skill provides patterns or guidelines for a specific tool/library

**Don't create convenience commands when:**

- The skill is already reliably auto-invoked when needed
- The skill is too narrow or specialized for general use
- The skill content would be better as an agent

## Best Practices

1. **Keep it focused**: The command should have one clear purpose
2. **Support flexibility**: Optional arguments let users provide as much or as little context as they want
3. **Be helpful when context is missing**: Offer suggestions or ask clarifying questions
4. **Reference the skill**: Don't duplicate - point to the skill as the source of truth
5. **Show examples**: Example interactions help users understand how to use the command
6. **Update documentation**: Always update the plugin README

## Resources

- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [Command Best Practices](https://code.claude.com/docs/en/plugins/commands)
- [Skills Documentation](https://code.claude.com/docs/en/plugins/skills)

## Troubleshooting

**Issue:** Command isn't being recognized

- **Solution:** Check that the file is in `plugins/<plugin-name>/commands/` with `.md` extension
- **Solution:** Verify YAML frontmatter is properly formatted
- **Solution:** Try reloading the plugin or restarting Claude Code

**Issue:** Command works but doesn't use the skill

- **Solution:** Ensure the instructions explicitly mention loading/referencing the skill file
- **Solution:** Check that the skill file path is correct

**Issue:** Command is too rigid

- **Solution:** Add optional arguments so users can provide context or use it standalone
- **Solution:** Provide helpful prompts when the user doesn't provide context
