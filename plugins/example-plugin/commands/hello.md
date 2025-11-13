---
description: Greet someone with a friendly message
argument-hint: name
---

# Hello Command

Greet the user with a personalized message.

## Usage

```text
/example-plugin:hello World
/example-plugin:hello Claude
/example-plugin:hello
```

## Instructions

If $ARGUMENTS is provided:

- Respond with: "Hello, $ARGUMENTS! This is the example-plugin greeting you."

If $ARGUMENTS is empty:

- Respond with: "Hello! This is the example-plugin. Try: /example-plugin:hello YourName"

Keep the response friendly and demonstrate that the command received the argument correctly.
