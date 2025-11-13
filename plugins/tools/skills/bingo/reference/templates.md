# Bingo Templates

Guide to available Bingo templates and their features.

## Available Templates

### typescript-app

**Full-featured TypeScript application template**

**Includes:**
- TypeScript (latest version)
- ESLint with recommended rules
- Prettier for formatting
- Vitest for testing
- Package scripts
- Git repository
- Comprehensive tsconfig.json

**Best for:**
- New TypeScript projects
- Applications (not libraries)
- Projects needing complete tooling

**Creation:**
```bash
npx bingo typescript-app
```

**Generated structure:**
```
my-app/
├── src/
│   └── index.ts
├── tests/
│   └── index.test.ts
├── package.json
├── tsconfig.json
├── .eslintrc.js
├── .prettierrc
├── .gitignore
└── README.md
```

## Template Comparison

| Feature | typescript-app |
|---------|----------------|
| TypeScript | ✓ |
| ESLint | ✓ |
| Prettier | ✓ |
| Testing | Vitest |
| Documentation | ✓ |
| CI/CD | Optional |

## Customization Options

During creation, templates prompt for:

### typescript-app Customizations

**Project metadata:**
- Name
- Description
- Author
- License

**Tooling choices:**
- Strict TypeScript mode
- ESLint rules (recommended/strict)
- Test coverage thresholds
- Git hooks (Husky)

**Build options:**
- Bundle (esbuild, tsup, etc.)
- Target environment
- Source maps

## Template Selection Guide

### Choose typescript-app when:

- Starting new TypeScript project
- Need complete tooling setup
- Want automated updates
- Building application (not library)

### Consider alternatives when:

- Building library (may need different template)
- Using different language
- Minimal tooling needed
- Very specific requirements

## Template Updates

Templates receive updates for:
- Dependency version bumps
- New tooling improvements
- Security patches
- Configuration optimizations

**Update process:**
```bash
npx bingo update
```

Updates preserve:
- Project-specific code
- Custom configurations
- Additional dependencies
- Manual modifications

## Template Customization Philosophy

Bingo templates balance:
- **Completeness**: Include necessary tooling
- **Flexibility**: Allow customization
- **Maintainability**: Easy to update
- **Best practices**: Follow conventions

**What templates DON'T include:**
- Application-specific logic
- Custom business rules
- Proprietary configurations
- Heavy frameworks (by default)

## Future Templates

Templates under consideration:
- JavaScript app
- TypeScript library
- Monorepo structure
- Framework-specific templates

Check [Bingo repository](https://github.com/JoshuaKGoldberg/create) for latest templates.
