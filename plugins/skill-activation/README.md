# Skill Activation Plugin

**Centralized skill activation system that automatically suggests relevant skills from installed plugins based on user prompts and file context.**

## Overview

This plugin solves the #1 problem with Claude Code skills: **they don't activate automatically**. Install this plugin, configure it to your liking, and all your skills will activate when you need them via the magic of _hooks_.

This plugin is based on the [Claude Code Infrastructure Showcase's](https://github.com/diet103/claude-code-infrastructure-showcase) [skill-activation-prompt hook](https://github.com/diet103/claude-code-infrastructure-showcase/tree/main/.claude/hooks#skill-activation-prompt-userpromptsubmit). It improves upon the original by adding:

- Support for third-party Claude Code Plugins
- Support for plugins to supply their own `skill-rules.json` configuration
- Cascading global and project-specific configurations
- Noisy activation so you can be sure it's working 😁

## Installation

### From Marketplace

```bash
# Add the boneskull-plugins marketplace
/plugin marketplace add boneskull-plugins

# Install the skill-activation plugin
/plugin install skill-activation@boneskull-plugins
```

### For Local Development

```bash
# Add your local development directory as a marketplace
/plugin marketplace add /path/to/claude-plugins

# Install the plugin
/plugin install skill-activation@boneskull-plugins
```

## Quick Start

### 1. Install the Plugin

This plugin provides the hook infrastructure. Install it once using the commands above.

### 2. Plugin Auto-Discovery Works Automatically

Any plugin with a `skills/skill-rules.json` file will automatically have its skills activated. No additional configuration needed!

**Example plugins that work out of the box:**

- `tools@boneskull-plugins` - Git commit and directory management
- `bupkis@boneskull-plugins` - [Bupkis](https://bupkis.zip) assertion patterns
- `zod@boneskull-plugins` - [Zod v4](https://zod.dev/) validation guidance
- `xstate@boneskull-plugins` - [XState v5](https://stately.ai/docs/xstate) & [xstate-audition](https://boneskull.github.io/xstate-audition/) patterns

### 3. Configure Global or Project Rules (Optional)

**Global configuration** (`~/.claude/skill-rules.json`) - applies to all projects:

This example configures a skill in the [obra/superpowers](https://github.com/obra/superpowers) plugin to suggest test-driven development skills when you write code.

```bash
# Create your global skill rules
cat > ~/.claude/skill-rules.json << 'EOF'
{
  "version": "1.0",
  "skills": {
    "superpowers@superpowers-marketplace:test-driven-development": {
      "type": "guardrail",
      "enforcement": "suggest",
      "priority": "high",
      "promptTriggers": {
        "keywords": ["write test", "add test", "TDD"],
        "intentPatterns": ["(create|write).*test"]
      }
    }
  }
}
EOF
```

**Project configuration** (`.claude/skill-rules.json` in project) - overrides global:

```bash
# Create project-specific rules
mkdir -p .claude
cat > .claude/skill-rules.json << 'EOF'
{
  "version": "1.0",
  "skills": {
    "tools@boneskull-plugins:git-commit-messages": {
      "priority": "critical",
      "enforcement": "block"
    }
  }
}
EOF
```

See [`skills/skill-rules.example.json`](skills/skill-rules.example.json) for more examples.

## Architecture

### Three-Tier Rule System

The plugin uses a three-tier configuration system with clear precedence:

```text
PROJECT (.claude/skill-rules.json in project)    ← Highest priority
   ↓ overrides
GLOBAL (~/.claude/skill-rules.json)              ← Middle priority
   ↓ overrides
PLUGIN (each plugin's skills/skill-rules.json)   ← Lowest priority (defaults)
```

**Benefits:**

- **Plugin rules**: Ship with sensible defaults, auto-discovered
- **Global rules**: Your personal preferences across all projects
- **Project rules**: Specific overrides per codebase

### Rule Loading Order

1. Load plugin-defined rules from all installed plugins
2. Load global rules from `~/.claude/skill-rules.json` (overrides plugins)
3. Load project rules from `.claude/skill-rules.json` (overrides everything)

### Skill Reference Format

Skills are referenced using the format: `plugin@marketplace:skill-name`

**Examples:**

- `tools@boneskull-plugins:git-commit-messages`
- `bupkis@boneskull-plugins:bupkis-assertion-patterns`
- `superpowers@superpowers-marketplace:test-driven-development`

## Creating Plugin Rules

### For Your Own Plugins

Create `skills/skill-rules.json` in your plugin:

```json
{
  "description": "Skill activation rules for my-plugin",
  "skills": {
    "my-plugin@boneskull-plugins:my-skill": {
      "type": "domain",
      "enforcement": "suggest",
      "priority": "high",
      "description": "Brief description of when to use this skill",
      "promptTriggers": {
        "keywords": ["keyword1", "keyword2"],
        "intentPatterns": ["(create|add).*something"]
      },
      "fileTriggers": {
        "pathPatterns": ["**/*.ts", "**/*.js"],
        "contentPatterns": ["import.*library"]
      }
    }
  },
  "version": "1.0"
}
```

### Rule Configuration Reference

#### Skill Rule Properties

| Property         | Type                                           | Description                                        |
| ---------------- | ---------------------------------------------- | -------------------------------------------------- |
| `type`           | `"domain"` or `"guardrail"`                    | Domain skill (guidance) or guardrail (enforcement) |
| `enforcement`    | `"suggest"`, `"block"`, or `"warn"`            | How aggressively to enforce                        |
| `priority`       | `"critical"`, `"high"`, `"medium"`, or `"low"` | Display priority                                   |
| `description`    | `string`                                       | Brief description                                  |
| `promptTriggers` | `object`                                       | Keyword and pattern matching                       |
| `fileTriggers`   | `object`                                       | File path and content matching (optional)          |
| `blockMessage`   | `string`                                       | Custom message when blocking (optional)            |

#### Prompt Triggers

```json
"promptTriggers": {
  "keywords": [
    "literal",
    "case insensitive",
    "substring match"
  ],
  "intentPatterns": [
    "(regex|pattern).*matching",
    "intent.*detection"
  ]
}
```

#### File Triggers (Optional)

```json
"fileTriggers": {
  "pathPatterns": ["**/*.test.ts", "src/**/*.js"],
  "pathExclusions": ["node_modules/**", "dist/**"],
  "contentPatterns": ["import.*library", "class.*Name"]
}
```

## Enforcement Levels

### `suggest` (Recommended)

- Shows skill suggestion
- Doesn't block execution
- User can choose to ignore

### `block` (Use Sparingly)

- Blocks execution until skill is used
- Shows custom `blockMessage` if provided
- Use for critical guardrails only

### `warn` (Not Yet Implemented)

- Shows warning but allows proceeding
- Future enhancement

## Priority Levels

Skills are grouped and displayed by priority:

- **Critical** (`critical`): ⚠️ CRITICAL SKILLS (REQUIRED)
- **High** (`high`): 📚 RECOMMENDED SKILLS
- **Medium** (`medium`): 💡 SUGGESTED SKILLS
- **Low** (`low`): 📌 OPTIONAL SKILLS

## How Skills Are Resolved

When a skill reference like `tools@boneskull-plugins:git-commit-messages` is matched:

1. Parse the reference: `plugin@marketplace` + `skill-name`
2. Check if plugin is installed in `~/.claude/plugins/installed_plugins.json`
3. If not installed: mark as unavailable (doesn't break, just shows warning)
4. If installed: resolve path to `{installPath}/skills/{skill-name}/SKILL.md`
5. If skill file doesn't exist: mark as unavailable

**Result:** Graceful degradation - missing plugins/skills are noted but don't cause errors.

## Example Output

When you type `"help me create a git commit"`:

```text
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 SKILL ACTIVATION CHECK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 RECOMMENDED SKILLS:
  → tools:git-commit-messages

ACTION: Use Skill tool BEFORE responding
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Benefits

### For Plugin Authors

- ✅ Self-contained: Each plugin manages its own rules
- ✅ Zero coupling: No dependencies on other plugins
- ✅ Auto-discovery: Install plugin → rules activate
- ✅ Maintainable: Update rules with the plugin

### For Users

- ✅ Install once: One plugin enables all skill activation
- ✅ Automatic: Skills suggest themselves
- ✅ Extensible: Add rules for any installed plugin
- ✅ Graceful: Missing plugins don't break anything

### For Ecosystem

- ✅ Discoverable: Easy to see what skills are available
- ✅ Consistent: Standard format across all plugins
- ✅ Flexible: Centralized overrides when needed

## Advanced: Customization

### Global Rules (`~/.claude/skill-rules.json`)

Use global rules for:

- Personal preferences across all projects
- Third-party marketplace plugin configuration
- Common skill priorities

**Example:**

```json
{
  "description": "My personal skill preferences",
  "skills": {
    "superpowers@superpowers-marketplace:test-driven-development": {
      "priority": "critical",
      "enforcement": "suggest"
    },
    "superpowers@superpowers-marketplace:systematic-debugging": {
      "priority": "high"
    }
  },
  "version": "1.0"
}
```

### Project Rules (`.claude/skill-rules.json`)

Use project rules for:

- Project-specific overrides
- Team conventions
- Stricter enforcement on certain projects

**Example:**

```json
{
  "description": "Project-specific overrides",
  "skills": {
    "tools@boneskull-plugins:git-commit-messages": {
      "priority": "critical",
      "enforcement": "block"
    }
  },
  "version": "1.0"
}
```

### Partial Overrides

You only need to specify properties you want to override - they merge with the base rule:

```json
{
  "skills": {
    "tools@boneskull-plugins:git-commit-messages": {
      "priority": "critical" // Only override priority, keep everything else
    }
  }
}
```

## Troubleshooting

### Skills Not Activating

1. **Check plugin is installed**:

   ```bash
   cat ~/.claude/plugins/installed_plugins.json | jq '.plugins | keys'
   ```

2. **Check if any rules are loaded**:

   ```bash
   # Check plugin has rules
   cat ~/.claude/plugins/cache/plugin-name/skills/skill-rules.json

   # Check your global rules (if any)
   cat ~/.claude/skill-rules.json

   # Check project rules (if any)
   cat .claude/skill-rules.json
   ```

3. **Test the hook manually**:

   ```bash
   cd plugins/skill-activation/hooks
   echo '{"prompt":"test commit","cwd":".","session_id":"test","transcript_path":"/tmp/test","permission_mode":"auto"}' | \
     npx tsx scripts/skill-activation-prompt.ts
   ```

### Rule Not Matching

- Check keyword case (case-insensitive matching)
- Test intent patterns with regex tools
- Add more keywords/patterns
- Check priority level

### Plugin Marked as Unavailable

This means either:

- Plugin isn't installed (check `installed_plugins.json`)
- Skill file doesn't exist at expected path
- Plugin reference format is wrong

**Fix:** Ensure plugin is installed and skill name matches exactly.

## Development

### Testing the Hook

```bash
# Test with sample input
echo '{
  "session_id": "test",
  "transcript_path": "/tmp/test",
  "cwd": ".",
  "permission_mode": "auto",
  "prompt": "help me write a test"
}' | npx tsx plugins/skill-activation/hooks/scripts/skill-activation-prompt.ts
```

### Debugging

The script outputs debug info when no rules are found. Check stderr:

```bash
npx tsx plugins/skill-activation/hooks/scripts/skill-activation-prompt.ts 2>&1 | grep -i warning
```

## Contributing

### Adding Rules for Third-Party Plugins

1. Fork this repository
2. Add rules to [`skills/skill-rules.json`](skills/skill-rules.json)
3. Test with the third-party plugin installed
4. Submit a pull request

### Reporting Issues

If skills aren't activating as expected, please include:

- Plugin name and version
- Your prompt that should trigger the skill
- Contents of the plugin's `skill-rules.json`
- Output of testing the hook manually

## Acknowledgments

- [claude-code-infrastructure-showcase](https://github.com/diet103/claude-code-infrastructure-showcase)

## License

Copyright © 2025 Christopher Hiller. Licensed BlueOak-1.0.0
Copyright © 2025 Claude Code Infrastructure Contributors. Licensed MIT

## See Also

- [Claude Code Hooks Documentation](https://docs.claude.com/en/docs/claude-code/hooks)
- [Claude Code Plugin Development](https://docs.claude.com/en/docs/claude-code/plugins)
- [boneskull-plugins marketplace](../../README.md)
