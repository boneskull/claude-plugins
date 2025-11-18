# Refactor Plugin Design

**Date:** 2025-01-17
**Status:** Approved
**Author:** boneskull with Claude

## Purpose

Create a focused refactoring plugin that provides code simplification capabilities through an agent-based approach with convenient command access.

## Scope

Copy the code-simplifier agent from nicknisi's developer-experience plugin. Provide a `/simplify` slash command for quick invocation.

## Constraints

- Copy the code-simplifier agent exactly as-is (no modifications)
- Keep the opus model specification for maximum refactoring intelligence
- Single agent focus (extensible later if needed)
- Follow boneskull-plugins marketplace conventions

## Architecture

### Plugin Structure

```
plugins/refactor/
├── .claude-plugin/
│   └── plugin.json
├── agents/
│   └── code-simplifier.md
├── commands/
│   └── simplify.md
└── README.md
```

### Components

#### 1. Code-Simplifier Agent

**Source:** `~/projects/nicknisi/claude-plugins/plugins/developer-experience/agents/code-simplifier.md`

**Configuration:**
- Name: `code-simplifier`
- Model: `opus`
- Color: `green`
- Lines: 67

**Capabilities:**
- Reduces complexity (simplifies conditionals, extracts expressions, uses early returns)
- Eliminates redundancy (removes duplicate code, applies DRY principles)
- Improves naming (descriptive, consistent names that reveal intent)
- Extracts methods (breaks large functions into focused ones)
- Removes dead code
- Clarifies logic flow

**Constraints:**
- Preserves all public APIs unless explicitly authorized
- Maintains backward compatibility
- Keeps performance neutral or better
- Respects existing code style and conventions

#### 2. Simplify Command

**File:** `commands/simplify.md`

**Purpose:** Provides quick access to the code-simplifier agent without remembering agent invocation syntax.

**Implementation:**
```yaml
---
description: Simplify and refactor code to improve readability and maintainability
---

You are being asked to simplify code. Use the code-simplifier agent to refactor the code while preserving its behavior.

Please launch the code-simplifier agent using the Task tool with subagent_type: "refactor:code-simplifier".
```

**Usage:**
```
User: /simplify
User: The calculateTotalPrice function in src/cart.ts is too complex
Assistant: [Launches code-simplifier agent]
```

#### 3. Plugin Metadata

**plugin.json:**
```json
{
  "name": "refactor",
  "version": "1.0.0",
  "description": "General-purpose software development refactoring and reorganization",
  "author": {
    "name": "boneskull"
  },
  "license": "BlueOak-1.0.0",
  "keywords": ["refactoring", "code-simplification", "clean-code", "maintainability"]
}
```

#### 4. Marketplace Registration

**Entry in `.claude-plugin/marketplace.json`:**
```json
{
  "name": "refactor",
  "source": "./plugins/refactor",
  "description": "General-purpose software development refactoring and reorganization",
  "version": "1.0.0",
  "author": {
    "name": "boneskull"
  },
  "category": "development",
  "tags": ["refactoring", "code-quality", "simplification", "clean-code"],
  "strict": true
}
```

**Category rationale:** "development" fits best for a code development tool.

**Tags:** Focus on refactoring and code quality for discoverability.

## Documentation

### README Structure

The README will include:

1. **Installation** - Command to install the plugin
2. **Components** - List of commands and agents
3. **Usage** - Examples showing `/simplify` command and agent capabilities
4. **How it works** - Brief explanation of refactoring methodology
5. **Example** - Before/after code snippet demonstrating value

### Key Content

The README will explain what the code-simplifier does:
- Analyzes code before acting
- Preserves public APIs and behavior
- Applies systematic simplification techniques
- Provides explanations for each change
- Asks permission before changing public APIs

## Implementation Steps

1. Create plugin directory structure
2. Copy code-simplifier.md from source
3. Create simplify.md command
4. Write plugin.json
5. Register in marketplace.json (alphabetically)
6. Write README.md
7. Format all files with Prettier
8. Commit to git

## Success Criteria

- Plugin installs successfully with `/plugin install refactor@boneskull-plugins`
- `/simplify` command launches the code-simplifier agent
- Agent operates with opus model
- All metadata correctly configured
- Files properly formatted
- Documentation clear and helpful

## Future Extensions (Not in Scope)

The plugin structure allows future additions:
- Additional refactoring agents (extract-class, inline-method, etc.)
- More convenience commands
- Skills for refactoring patterns
- Hooks for automatic refactoring suggestions

These remain out of scope for initial release.
