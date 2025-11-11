# Tools Plugin Design

**Date:** 2025-11-11
**Author:** boneskull
**Status:** Approved

## Purpose

The tools plugin collects skills and documentation for CLI, development, and language-specific tools. Each tool receives its own skill containing usage patterns, best practices, and reference documentation.

## Scope

The plugin covers three tool categories:

- **CLI/terminal tools**: Command-line utilities (jq, ripgrep, sed, awk)
- **Development tools**: Build systems, package managers, testing frameworks
- **Language-specific tools**: Tools tied to particular programming languages

## Structure

### Directory Layout

```
plugins/tools/
├── .claude-plugin/
│   └── plugin.json           # Plugin metadata
├── skills/                   # Empty initially
├── README.md                 # Self-documenting guide
└── LICENSE -> ../../LICENSE  # Symlink to repository license
```

### Plugin Metadata

File: `plugins/tools/.claude-plugin/plugin.json`

```json
{
  "name": "tools",
  "version": "1.0.0",
  "description": "Skills and documentation for various CLI, development, and language-specific tools",
  "author": {
    "name": "boneskull"
  },
  "license": "BlueOak-1.0.0",
  "keywords": ["tools", "cli", "documentation", "reference", "best-practices"]
}
```

## Skill Organization

### Naming Convention

Skills follow tool names directly: `jq`, `ripgrep`, `prettier`, `typescript`. This makes them predictable and easy to find.

### Skill Structure Pattern

Each tool skill follows this structure:

```
skills/<tool-name>/
├── SKILL.md                    # Main skill with YAML frontmatter
└── reference/                  # Optional: progressive disclosure
    ├── README.md
    ├── common_patterns.md
    └── api_reference.md
```

### Progressive Disclosure

Skills use reference files for detailed documentation. The main SKILL.md file contains essential patterns and guidance. Reference files load on-demand, keeping the main skill focused while providing comprehensive documentation when needed.

The bupkis plugin demonstrates this pattern.

## README Content

The README serves as a self-documenting guide:

1. **Header**: Plugin title, description, installation command
2. **Purpose**: Explains the plugin's scope and organization
3. **Skill Naming**: Documents the naming convention
4. **Skill Structure**: Shows the expected pattern with examples
5. **Progressive Disclosure**: Explains reference file usage, points to bupkis as example
6. **Future Skills**: Placeholder noting incremental addition

## Extensibility

The minimal structure supports easy extension:

- Empty `skills/` directory awaits new skills
- Naming convention ensures consistency
- Structure template guides implementation
- Progressive disclosure pattern scales to any tool complexity

## Repository Integration

### Marketplace Catalog

Add entry to `.claude-plugin/marketplace.json`:

```json
{
  "name": "tools",
  "description": "Skills and documentation for various CLI, development, and language-specific tools",
  "version": "1.0.0",
  "path": "plugins/tools"
}
```

### Repository README

Add to plugins section:

````markdown
### tools

Skills and documentation for various CLI, development, and language-specific tools.

- **Skills**: One skill per tool (to be added incrementally)
- **Category**: Development/Tools

Learn best practices and common patterns for the tools you use every day.

#### Installing the Tools Plugin

\```bash
/plugin install tools@boneskull-plugins
\```
````

## Implementation

Create these files:

1. `plugins/tools/.claude-plugin/plugin.json` - Plugin metadata
2. `plugins/tools/skills/` - Empty directory
3. `plugins/tools/README.md` - Self-documenting guide
4. `plugins/tools/LICENSE` - Symlink to `../../LICENSE`
5. `.claude-plugin/marketplace.json` - Add plugin entry
6. `README.md` - Add tools plugin section

## Design Principles

- **YAGNI**: No skills yet, no template files, just the structure
- **Consistency**: Follows bupkis pattern exactly
- **Clarity**: README documents all conventions
- **Scalability**: Structure supports any number of tools

## Next Steps

After implementation, add individual tool skills incrementally, following the documented pattern.
