#!/usr/bin/env bash
# Example PostToolUse hook
# Demonstrates post-tool processing (Write/Edit operations)

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Extract tool information
tool_name=$(echo "$input" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
file_path=$(echo "$input" | grep -o '"file_path":"[^"]*"' | cut -d'"' -f4)

# Log the operation
echo "Example plugin: $tool_name completed on $file_path" >&2

# Return success response
cat <<EOF
{
  "continue": true,
  "systemMessage": "Example plugin processed $tool_name operation"
}
EOF

exit 0
