#!/usr/bin/env bash
# Example SessionStart hook
# Demonstrates session initialization logging

set -euo pipefail

# Read hook input from stdin
input=$(cat)

# Extract session_id using basic tools
session_id=$(echo "$input" | grep -o '"session_id":"[^"]*"' | cut -d'"' -f4)

# Log session start
echo "Example plugin: Session started ($session_id)" >&2

# Return success response
cat <<EOF
{
  "continue": true,
  "systemMessage": "Example plugin initialized for this session"
}
EOF

exit 0
