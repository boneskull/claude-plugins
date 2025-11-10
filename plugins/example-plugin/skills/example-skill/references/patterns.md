# Skill Patterns Reference

This file demonstrates progressive disclosure - it's only loaded when needed.

## Pattern 1: Conditional Loading

Load reference files based on user intent:

- User asks about patterns → Load patterns.md
- User needs template → Load template.txt
- User wants examples → Show inline examples from SKILL.md

## Pattern 2: Directory Organization

```
skill-name/
├── SKILL.md           # Entry point (always loaded)
├── references/        # Documentation (on-demand)
│   ├── patterns.md
│   └── advanced.md
├── assets/            # Templates/binaries (on-demand)
│   └── template.txt
└── scripts/           # Executables (on-demand)
    └── helper.sh
```

## Pattern 3: Frontmatter Requirements

```yaml
---
name: skill-name # Max 64 chars, lowercase/hyphens
description: Clear third-person description of when to use this skill (max 1024 chars)
---
```

## Pattern 4: Size Management

- Keep SKILL.md under 500 lines
- Move detailed content to references/
- Use progressive disclosure
- Split large topics across multiple reference files
