---
description: Create a new plugin with the specified name and description
---

# Create Plugin Command

Create a new plugin in the boneskull-plugins marketplace with the specified name and description.

## Usage

```
/create-plugin <plugin-name> <description>
```

**Arguments:**

- `plugin-name`: The name of the plugin (must be kebab-case)
- `description`: A brief description of what the plugin does

## Instructions

Follow these steps to create a new plugin:

### 1. Validate Plugin Name

- Ensure the name is in kebab-case format (e.g., `my-plugin`)
- Check that `plugins/<plugin-name>` doesn't already exist
- Verify the name isn't already registered in `.claude-plugin/marketplace.json`

### 2. Create Directory Structure

Create the following directory structure:

```
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── commands/           # Optional: slash commands
├── agents/             # Optional: custom agents
├── skills/             # Optional: agent skills
├── hooks/              # Optional: event hooks
├── src/                # Optional: MCP server source
├── .mcp.json           # Optional: MCP configuration
├── package.json        # Optional: if MCP server needed
├── tsconfig.json       # Optional: if MCP server needed
└── README.md
```

### 3. Create plugin.json

Create `.claude-plugin/plugin.json` with:

```json
{
  "name": "<plugin-name>",
  "version": "1.0.0",
  "description": "<description>",
  "author": {
    "name": "boneskull"
  },
  "license": "BlueOak-1.0.0",
  "keywords": []
}
```

### 4. Create README.md

Generate a README.md with:

```markdown
# <Plugin Name>

<description>

## Installation

\`\`\`bash
/plugin install <plugin-name>@boneskull-plugins
\`\`\`

## Components

### Commands

(None yet)

### Skills

(None yet)

### Agents

(None yet)

### Hooks

(None yet)

### MCP Servers

(None yet)

## Usage

(Add usage examples here)

## Development

See [DEVELOPMENT.md](../../docs/DEVELOPMENT.md) for development guidelines.

## License

[Blue Oak Model License 1.0.0](../../LICENSE)
```

### 5. Register in Marketplace

Add an entry to `.claude-plugin/marketplace.json`:

```json
{
  "name": "<plugin-name>",
  "source": "./plugins/<plugin-name>",
  "description": "<description>",
  "version": "1.0.0",
  "author": {
    "name": "boneskull"
  },
  "category": "utility",
  "tags": [],
  "strict": true
}
```

**Important:**

- Add the entry alphabetically by name
- Choose appropriate category: `utility`, `development`, `testing`, `documentation`, etc.
- Add relevant tags based on functionality

### 6. Format Files

Run Prettier to format all created files:

```bash
npm run format
```

### 7. Provide Next Steps

After creation, inform the user:

1. **Plugin created successfully at:** `plugins/<plugin-name>/`
2. **Next steps:**
   - Add components as needed (commands, skills, agents, hooks, or MCP server)
   - Update keywords in `plugin.json` and tags in `marketplace.json`
   - Choose appropriate category in `marketplace.json`
   - Fill in README.md with usage examples
   - Test locally: `/plugin marketplace add /path/to/claude-plugins`
   - Install and test: `/plugin install <plugin-name>@boneskull-plugins`

## Component Guidelines

### Commands (commands/)

- Create `.md` files for slash commands
- Include YAML frontmatter with description
- Name files in kebab-case

### Skills (skills/)

- Create directories with `SKILL.md` files
- Keep skills under 500 lines (use `references/` for longer content)
- Include YAML frontmatter with description and trigger patterns

### Agents (agents/)

- Create `.md` files for specialized subagents
- Include YAML frontmatter with description
- Define clear responsibilities and capabilities

### Hooks (hooks/)

- Create `hooks.json` for event handlers
- Support events: `SessionStart`, `PostToolUse`, `UserPromptSubmit`, etc.
- Use absolute paths or ensure proper path resolution

### MCP Servers

- Create TypeScript source in `src/`
- Add `.mcp.json` configuration
- Include `package.json` with dependencies
- Add build scripts and `tsconfig.json`

## Best Practices

1. **Keep it simple** - Start with minimal functionality
2. **Document thoroughly** - Clear README with examples
3. **Test locally first** - Install from local marketplace before publishing
4. **Follow conventions** - Use kebab-case for all naming
5. **Format consistently** - Run `npm run format` before committing
6. **Version semantically** - Follow semver (1.0.0, 1.1.0, 2.0.0, etc.)

## Resources

- [Development Guide](../../docs/DEVELOPMENT.md)
- [Example Plugin](../../plugins/example-plugin/README.md)
- [Claude Code Plugin Documentation](https://code.claude.com/docs/en/plugins)
- [MCP Documentation](https://modelcontextprotocol.io/)

## Troubleshooting

**Issue:** Plugin name validation fails

- **Solution:** Ensure name is kebab-case with only lowercase letters, numbers, and hyphens

**Issue:** Plugin already exists

- **Solution:** Choose a different name or remove existing plugin first

**Issue:** Marketplace registration fails

- **Solution:** Check JSON syntax in marketplace.json and ensure proper formatting
