---
description: Analyze a file and provide insights
argument-hint: file-path
allowed-tools: Read, Bash
---

# Analyze Command

Read and analyze a file, providing insights about its contents.

## Usage

```
/example-plugin:analyze src/index.ts
/example-plugin:analyze README.md
```

## Instructions

1. Validate that $ARGUMENTS contains a file path
2. Use the Read tool to read the file
3. Analyze the file contents:
   - File type and format
   - Size and line count
   - Key patterns or structures
   - Any notable characteristics

4. Present findings in a structured format:

```
# Analysis: [filename]

**Type**: [file type]
**Size**: [lines/bytes]

## Key Findings

- Finding 1
- Finding 2
- Finding 3

## Recommendations

- Recommendation 1
- Recommendation 2
```

If no arguments provided, respond with:
"Please specify a file path: /example-plugin:analyze path/to/file"
