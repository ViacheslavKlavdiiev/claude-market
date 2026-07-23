# nestjs-orm-drizzle

Drizzle ORM (Postgres) integration guidance for NestJS: schema, the
`DRIZZLE` provider, queries, transactions, pooling, `drizzle-kit`
migrations, and repository isolation.

## Overview

This is a **swappable per-project ORM library** plugin. A NestJS project
picks exactly one ORM library plugin for its persistence layer — this one,
if it uses Drizzle against Postgres — and installs it alongside
`nestjs-paved-path`.

Repositories authored under this skill implement the domain **port
interfaces** that `nestjs-paved-path`'s `nestjs-architecture` skill
defines (e.g. `UserRepository`), keeping Drizzle itself confined to the
infrastructure layer:

> Only the infrastructure/repository layer imports Drizzle or holds the DB
> handle. Application services depend on repository port interfaces via DI
> tokens (`Symbol` + `@Inject()`), never on `drizzle-orm` or the DB
> instance.

Drizzle has no official NestJS integration; the `DRIZZLE`-token custom
provider this skill documents is the community-standard pattern for
wiring the two together.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `nestjs-orm-drizzle` | skill | Schema (`pgTable`), the version-gated Relations API/RQB v2, the `DatabaseModule`/`DRIZZLE` provider pattern, query-builder vs. relational queries, transactions, connection pooling, `drizzle-kit` migrations, and repository-isolation review red flags. |

## Dependencies

- `nestjs-paved-path@^0.1.0` — supplies `nestjs-architecture`, which
  defines the domain port interfaces this skill's repositories implement,
  and the layering/DI-token conventions this skill assumes.

Install `nestjs-paved-path` alongside this plugin.

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install nestjs-orm-drizzle@claude-market
```

## What it executes

Documentation-only content (prompts). No hooks, no MCP servers, no
external binaries, no network access.

## Versioning

SemVer per marketplace conventions; release notes in
[CHANGELOG.md](CHANGELOG.md).
