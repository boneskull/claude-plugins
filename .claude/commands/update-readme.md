---
description: Update README.md with current marketplace plugins and their components
---

# Update README Command

Update the README.md file to reflect the current state of published plugins in the marketplace.

## Instructions

1. Read `.claude-plugin/marketplace.json` to get the list of published plugins
2. For each plugin, inspect its directory to find:
   - Skills in `plugins/<name>/skills/`
   - Commands in `plugins/<name>/commands/`
   - Agents in `plugins/<name>/agents/`
   - Hooks in `plugins/<name>/hooks/`
   - MCP servers in `plugins/<name>/.mcp.json`
3. Update the "Available Plugins" section in README.md with:
   - Plugin name (h3 heading)
   - Category from marketplace.json
   - Brief description from marketplace.json
   - "Contains:" section listing all components found
   - Installation command
4. Ensure the note about example-plugin not being published is included
5. Keep other sections (Installation, Development, License) unchanged
6. Format with Prettier after updating

## Expected Output Format

For each plugin:

```markdown
### plugin-name

**Category:** Category Name

Brief description.

**Contains:**

- **Skills:**
  - `skill-name` - Description
- **Commands:**
  - `/plugin:command-name` - Description
- **Agents:**
  - `agent-name` - Description
- **Hooks:**
  - Event type hooks configured
- **MCP Servers:**
  - `server-name` - Description

**Installation:**

\`\`\`bash
/plugin install plugin-name@boneskull-plugins
\`\`\`
```

## Components to Check

**Skills:**

- Look for `SKILL.md` files in `plugins/<name>/skills/*/`
- Extract description from YAML frontmatter
- Note progressive disclosure stats if available

**Commands:**

- Look for `.md` files in `plugins/<name>/commands/`
- Extract description from YAML frontmatter
- Format as `/plugin:command-name`

**Agents:**

- Look for `.md` files in `plugins/<name>/agents/`
- Extract description from YAML frontmatter

**Hooks:**

- Check for `plugins/<name>/hooks/hooks.json`
- List event types configured (SessionStart, PostToolUse, etc.)

**MCP Servers:**

- Check for `plugins/<name>/.mcp.json`
- List server names and their purpose

## Notes

- Only include plugins listed in marketplace.json
- Example-plugin should be mentioned in a note but not in the main plugin list
- Progressive disclosure stats (line counts) are nice to include for skills
- Keep descriptions concise and action-oriented
