---
description: Template slash command. Replace it with a real command.
argument-hint: "[optional argument]"
---

# /hello-command (template)

A template slash command that shows the structure of a command file. A command is
a flat `.md` file in the `commands/` directory; the file name becomes the command
name (here, `/example-plugin:hello-command`).

## How a command is structured

- **Frontmatter** (optional):
  - `description` — a short summary shown in the command list.
  - `argument-hint` — an argument hint for autocomplete.
  - you can also set `allowed-tools`, `model`, and others.
- **Body** — the prompt that runs when the command is invoked. Arguments are
  available as `$ARGUMENTS` (or `$1`, `$2`, … for positional ones).

## What this command does

Greet the user and confirm that the command from the `claude-market` marketplace
plugin works. If an argument was passed, echo it back: `$ARGUMENTS`.
Then remind that this is a template and its logic should be replaced.
