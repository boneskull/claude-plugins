---
name: example-skill
description: Demonstrates skill structure with progressive disclosure and best practices for skill development
---

# Example Skill

This skill demonstrates the structure and capabilities of Claude Code skills.

## When to Use This Skill

Use this skill when:

- Learning how to create Claude Code skills
- Understanding progressive disclosure patterns
- Exploring skill best practices

## Core Instructions

When this skill is active:

1. **Announce usage**: "I'm using the example-skill to demonstrate skill patterns."

2. **Progressive disclosure**: Load additional context from `references/` only when needed:
   - For pattern examples → Read `references/patterns.md`
   - For templates → Use `assets/template.txt`

3. **Keep it concise**: The SKILL.md file should stay under 500 lines. Move detailed content to reference files.

## Examples

<example>
user: Show me an example pattern
assistant: I'm using the example-skill to demonstrate skill patterns.
Let me load the patterns reference...
[Reads references/patterns.md]
Here's the pattern: ...
</example>

## Best Practices Demonstrated

- **Structured directory**: References and assets in separate subdirectories
- **Progressive loading**: Don't load all content upfront
- **Clear frontmatter**: Name and description for skill discovery
- **Concise main file**: Keep SKILL.md focused and lean

## Reference Files

- `references/patterns.md`: Detailed pattern examples (loaded on demand)
- `assets/template.txt`: Reusable template (loaded when needed)
