# engineering-foundations

Stack-neutral engineering knowledge skills that the Spec-Driven Development
(SDD) workflow agents preload before doing architecture or code review work.
These skills teach concepts and review rules — not the mechanics of any
specific framework, ORM, or language — so they apply unchanged across
projects with different tech stacks.

## What's inside

| Skill | Description |
| ----- | ----------- |
| `clean-architecture` | Layered/onion architecture review and design guidance: dependency direction, layer boundaries, ports/adapters, composition root. Layer names come from the project's Stack Manifest layer map. |
| `security` | Web application security best practices based on OWASP Top 10:2025 — confidence-based vulnerability review, auth/authorization, input handling, file uploads, secrets, and API endpoint hardening. |

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install engineering-foundations@claude-market
```

No dependencies — the plugin is self-contained.

## Dependents

This plugin is a dependency of the `architecture-review` and `sdd-engineering`
plugins, which preload its skills rather than duplicating this content.

## What it executes

Nothing outside a normal Claude session: no hooks, no MCP servers, no external
binaries, no network access. It is documentation-only content (skills).

## Versioning

SemVer, tracked in `.claude-plugin/plugin.json`; release notes in
[CHANGELOG.md](CHANGELOG.md).
