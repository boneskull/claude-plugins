# Tools Plugin

Skills and documentation for various CLI, development, and language-specific tools.

## Purpose

This plugin collects skills for the tools you use every day. Each tool gets its own dedicated skill containing:

- Common usage patterns and idioms
- Best practices for effective usage
- Quick reference documentation
- Progressive disclosure for detailed docs

## Installation

From marketplace:

```bash
/plugin install tools@boneskull-plugins
```

## Skill Organization

### Naming Convention

Tool skills follow tool names directly:

- `jq` for jq command-line JSON processor
- `ripgrep` for ripgrep search tool
- `prettier` for Prettier code formatter
- `typescript` for TypeScript compiler

This predictable naming makes skills easy to find.

### Skill Structure

Each tool skill follows this pattern:

```text
skills/<tool-name>/
├── SKILL.md                    # Main skill with YAML frontmatter
└── reference/                  # Optional: progressive disclosure
    ├── README.md               # Quick reference
    ├── common_patterns.md      # Common usage patterns
    └── api_reference.md        # Detailed API docs
```

### Progressive Disclosure Pattern

Skills use reference files for detailed documentation. The main SKILL.md contains essential patterns and guidance. Reference files load on-demand when needed, keeping the main skill focused.

**Example:** See the [bupkis plugin](../bupkis/) for a working example of this pattern.

## Adding New Tool Skills

1. Create directory: `skills/<tool-name>/`
2. Write `SKILL.md` with YAML frontmatter:

   ```yaml
   ---
   name: tool-name
   description: Brief description of what this skill teaches
   ---
   ```

3. Add essential patterns in SKILL.md
4. (Optional) Create `reference/` subdirectory for detailed docs
5. Update this README to list the new skill

## Available Skills

### git-commit-messages

Teaches proper git commit message formatting, avoiding HEREDOC syntax issues.

**Key patterns:**

- Use `-m` with multiline strings (not HEREDOC)
- Include Claude Code attribution
- Conventional commit format

**When activated:** When creating git commits with body text, footers, or co-author attribution.

## Future Skills

Additional skills will be added incrementally as needed. Each tool will follow the structure and conventions documented above.

## License

[Blue Oak Model License 1.0.0](../../LICENSE)
