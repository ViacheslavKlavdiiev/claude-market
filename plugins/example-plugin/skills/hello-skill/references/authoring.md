# Authoring reference

Background material and links that would bloat `SKILL.md`. This is the
progressive-disclosure tier: Claude loads it only when the skill references it.

## Writing a good `description`

The `description` is the only thing Claude sees when deciding whether a skill is
relevant. Make it specific:

- Start with **"Use when…"** and name the concrete triggers.
- List the situations, file types, or keywords that should activate the skill.
- Avoid vague phrasing like "helps with code" — it never matches precisely.

## Keeping skills small

- One skill = one job. Split unrelated concerns into separate skills.
- Push examples, deep references, and scripts into sibling files.
- A large `SKILL.md` costs context on every activation; sibling files do not.

## Further reading

- Claude Code plugins: https://code.claude.com/docs/en/plugins
- Marketplaces: https://code.claude.com/docs/en/plugin-marketplaces
