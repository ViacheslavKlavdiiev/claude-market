---
name: hello-skill
description: Template skill demonstrating the correct SKILL.md structure with frontmatter and a body. Use as the starting point when authoring a new skill, and to show how progressive disclosure keeps a skill small.
---

# Hello Skill (template)

This is a template skill that shows the structure of a `SKILL.md`. Replace the
content below with your real skill instructions.

## How a skill is structured

1. **Frontmatter** (the block between `---`):
   - `name` — the skill identifier (kebab-case).
   - `description` — when to apply it; Claude decides relevance from this text, so
     be concrete and start with "Use when…".
2. **Body** — the instruction itself: the step-by-step process, rules, checklists.

## Progressive disclosure

Keep `SKILL.md` small. Move long material into sibling files and reference them by
name, so Claude only loads the detail when it is needed:

- Concrete before/after examples live in [examples.md](examples.md).
- Deeper background and links live in [references/](references/).
- Helper scripts live in [scripts/](scripts/).

## What this skill does

Greet the user and confirm that the plugin from the `claude-market` marketplace is
installed and working. Then note that this skill is a template and its logic should
be replaced with something real.
