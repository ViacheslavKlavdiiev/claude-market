# example-plugin

Template plugin that ships one of each component type — a skill, a command, and
an agent — so you can copy it as the starting point for a real plugin.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `hello-skill` | skill | Multi-file skill template (SKILL.md + `references/` + `examples.md`). Shows the progressive-disclosure layout. |
| `hello-command` | command | Slash-command template (`/example-plugin:hello-command`). |
| `hello-agent` | agent | Subagent template with `tools`/`model` frontmatter. |

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install example-plugin@claude-market
```

No dependencies — the plugin is self-contained.

## What it executes

Nothing outside a normal Claude session: no hooks, no MCP servers, no external
binaries, no network access. It is documentation-only content (prompts).

## How to use it as a template

1. Copy the directory: `cp -r plugins/example-plugin plugins/<your-plugin>`.
2. Edit `.claude-plugin/plugin.json` (`name`, `description`, `keywords`, `category`).
3. Replace the components under `skills/`, `commands/`, `agents/` with your own.
4. Register the plugin in `.claude-plugin/marketplace.json`.
5. See [docs/PLUGIN-GUIDELINES.md](../../docs/PLUGIN-GUIDELINES.md) for the full rules.

## Versioning

SemVer per [docs/RELEASES.md](../../docs/RELEASES.md); release notes in
[CHANGELOG.md](CHANGELOG.md).
