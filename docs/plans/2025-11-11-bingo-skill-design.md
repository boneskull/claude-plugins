# Bingo Skill Design

**Date:** 2025-11-11
**Author:** boneskull
**Status:** Approved

## Purpose

The Bingo skill provides quick reference and patterns for using Bingo, a CLI tool for creating and maintaining web repositories from templates.

## Scope

The skill covers:
- Creating new projects from templates
- Managing template updates and migrations
- Common workflows for personal use
- Task-oriented patterns for quick lookup

## Structure

### Directory Layout

```
plugins/tools/skills/bingo/
├── SKILL.md                   # Main skill with task patterns
└── reference/                 # Progressive disclosure
    ├── README.md             # Command reference
    ├── common_patterns.md    # Detailed examples
    └── templates.md          # Template guidance
```

### Progressive Disclosure Pattern

**SKILL.md** (100-150 lines):
- YAML frontmatter
- Brief Bingo overview
- Quick start command
- Common task patterns
- Cross-references to detailed docs

**reference/** (loaded on-demand):
- Full command reference
- Extended examples
- Template-specific guidance

## Content Organization

### Task-Oriented Patterns

SKILL.md organizes content by tasks:

1. **Creating New Projects**
   - Quick start: `npx bingo <template>`
   - Template selection
   - Customization during creation
   - Package manager choice

2. **Managing Templates and Updates**
   - Keeping projects current
   - Preserving customizations
   - Handling migrations

3. **Common Workflows**
   - TypeScript app setup
   - Applying template updates
   - Troubleshooting

Each pattern includes:
- Scenario/goal
- Complete command with explanation
- Expected results
- Common variations

### Reference Files

**README.md:**
- Complete command syntax
- All options and flags
- Return codes and output

**common_patterns.md:**
- Expanded task examples
- Multiple scenario variations
- Edge cases and gotchas

**templates.md:**
- Available templates
- Template-specific options
- Recommendations per use case

## YAML Frontmatter

```yaml
---
name: bingo
description: Template management for web repositories - creating projects, applying updates, and managing configurations
---
```

## Skill Activation

The skill activates automatically when:
- User mentions "Bingo"
- Questions about repository templates
- Asks about project setup/scaffolding

No explicit invocation required.

## Writing Style

- Active voice
- Concise, action-oriented
- Commands with context, not bare syntax
- Realistic examples
- Scannable format

## Implementation Priorities

**Must Have:**
1. SKILL.md with common task patterns
2. Quick start section
3. Template selection guidance
4. Update workflow

**Should Have:**
1. reference/README.md with command reference
2. reference/common_patterns.md with examples
3. reference/templates.md with template details

**Could Have:**
1. Troubleshooting section
2. Migration guides
3. Advanced customization patterns

## Design Principles

- **Quick lookup**: User finds common tasks in seconds
- **Progressive disclosure**: Detailed docs available without clutter
- **Task-focused**: Organized by what user wants to accomplish
- **Scannable**: Headers and structure enable fast navigation
- **Practical**: Real scenarios, not theoretical examples

## Next Steps

1. Create skill directory structure
2. Write SKILL.md with core patterns
3. Create reference files with detailed content
4. Add skill to tools plugin
5. Test with actual Bingo usage scenarios
