# research-tools

Read-only investigation agent for finding information in your project or on the
web. Ships the `researcher` agent, designed to be used standalone or invoked by
the `spec-creator` agent in the SDD workflow.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `researcher` | agent | Read-only research agent that investigates code, config, docs (PROJECT mode) or finds external facts (WEB mode). Never modifies files; reports only what it finds. |

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install research-tools@claude-market
```

No dependencies — the plugin is self-contained.

## How to use

**Standalone:** Invoke the `researcher` agent directly to ask questions about
your project or look up external information.

- `PROJECT mode`: investigates codebase (code, config, docs, git history).
- `WEB mode`: searches the internet for facts, standards, best practices.

**In the SDD workflow:** The `spec-creator` agent automatically invokes
`researcher` when it needs to gather information for writing specifications.

## Hard constraints

The `researcher` agent:
- Is **read-only** — never creates, modifies, or deletes files.
- **Interviews first** — asks clarifying questions when a request is ambiguous.
- **Reports honestly** — includes a mandatory "Not found" section and never
  invents facts.
- **Never runs deep-research harness** — does focused searching with built-in
  tools only.

## What it executes

Nothing outside a normal Claude session: no hooks, no MCP servers, no external
binaries, no writes. It is documentation and prompts only.

## Versioning

SemVer, tracked in `.claude-plugin/plugin.json`; release notes in
[CHANGELOG.md](CHANGELOG.md).
