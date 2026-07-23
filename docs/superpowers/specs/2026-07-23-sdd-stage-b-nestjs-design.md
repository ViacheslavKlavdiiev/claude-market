# SDD Stage B — Increment 1: NestJS + Drizzle Stack Design

- **Status:** draft
- **Date:** 2026-07-23
- **Author:** Viacheslav Klavdiiev
- **Scope:** Stage B, increment 1 only — the NestJS backend stack + Drizzle ORM
  library + shared TypeScript foundation. Angular and Flutter stacks are later
  increments.

## Problem & context

Stage A shipped the stack-agnostic SDD flow core (four plugins) with a
manifest-driven mechanism: agents load per-surface paved-path and library skills
named in the project's `## SDD Stack Manifest` (in `CLAUDE.md`), and fall back to
foundations-only when a named skill's plugin is not installed. Stage A
deliberately shipped **no** stack knowledge — the surface tables are currently
manifest-driven stubs that resolve to nothing for a real stack.

This increment fills the NestJS surface: it authors the real knowledge skills so
that, in a NestJS project, the SDD agents (`implementer`, `test-writer`,
`implementation-planner`, `plan-verifier`) and `architecture-reviewer` load
substantive, current guidance instead of operating stack-neutrally.

Target stack facts (from research; sources cited in the skills):

- NestJS has **no** official agent-skills / LLM rule files (unlike Angular and
  Flutter). Drizzle publishes an official `llms.txt` / `llms-full.txt` doc index
  (reference feed, not a packaged skill). The skills must say this plainly and
  must not claim an official NestJS skill exists. Community NestJS skills are
  corroborating reference only; every rule is verified against `docs.nestjs.com`.
- **Shared spine invariant** linking the architecture, ORM, and testing skills:
  *only the infrastructure/repository layer touches Drizzle; application services
  depend on repository **port interfaces** via DI tokens, never on `drizzle-orm`
  or the DB handle.*
- Version-sensitive items must be flagged as version-gated (agent checks the
  installed version before applying): NestJS **v11** / Node **20+**, Express **v5**
  route syntax (named wildcards, `query parser`), `ConfigModule` v4 precedence,
  `CacheModule`→Keyv, v11 reverse-order shutdown hooks + built-in JSON logging;
  Drizzle pre-1.0 with a **new Relations API** (pin the installed version).

## Goals

- Ship three plugins:
  - **`typescript-paved-path`** — `typescript-expert` skill (shared by NestJS and,
    later, Angular). Ported from the upstream `engineering-paved-path`
    `typescript-expert` skill (already stack-neutral TS content).
  - **`nestjs-paved-path`** — skills `nestjs-best-practices`, `nestjs-architecture`,
    `nestjs-testing`, `nestjs-rest-swagger`.
  - **`nestjs-orm-drizzle`** — skill `nestjs-orm-drizzle` (swappable per-project
    library plugin; Postgres-focused).
- Each skill carries an implementer "rules to follow" section and a reviewer
  "red flags" section (the `architecture-reviewer` and `plan-verifier` consume the
  red-flags), cites authoritative sources (`docs.nestjs.com`, `orm.drizzle.team`),
  and flags version-gated rules.
- Wire the new skills into the shipped Stack Manifest template and the repo README
  so a NestJS project's manifest names them.
- Full packaging: manifests, READMEs, CHANGELOGs, marketplace entries, dependency
  edges; passes `claude plugin validate .` and `node scripts/build-site.mjs`.
- English-only.

## Non-goals (this increment)

- No Angular or Flutter stack skills or library plugins (later increments).
- No changes to the Stage A flow agents/skills themselves beyond what the manifest
  already supports — they consume these skills by name; no agent edits are needed.
- No running the SDD flow against a live NestJS project as part of this increment
  (that is a validation activity the user performs afterward; there is no NestJS
  repo in this marketplace to run against).
- Not authoring an MCP server or the Drizzle `llms.txt` mirror — the skill
  references Drizzle's hosted `llms.txt` rather than vendoring it.

## Architecture

Mirrors the Stage A target architecture. New plugins and their place in the graph:

| Plugin | Skills | Depends on | Kind |
|---|---|---|---|
| `typescript-paved-path` | `typescript-expert` | — | paved-path (shared TS) |
| `nestjs-paved-path` | `nestjs-best-practices`, `nestjs-architecture`, `nestjs-testing`, `nestjs-rest-swagger` | `engineering-foundations`, `typescript-paved-path` | paved-path |
| `nestjs-orm-drizzle` | `nestjs-orm-drizzle` | `nestjs-paved-path` | swappable library |

Rationale for the dependency edges: `nestjs-paved-path` builds on the stack-neutral
`clean-architecture` + `security` foundations and on `typescript-expert`;
`nestjs-orm-drizzle` only makes sense alongside the NestJS paved-path, so it depends
on it. These edges let a project install `nestjs-orm-drizzle` and pull the rest
transitively. (Alternative libraries — a future `nestjs-orm-typeorm`,
`nestjs-orm-prisma` — would sit at the same layer; only one is installed per project.)

Install profile for a NestJS project: flow core (Stage A) + `nestjs-paved-path`
(+ `typescript-paved-path`, `engineering-foundations` transitively) +
`nestjs-orm-drizzle`.

### Skill boundaries (one responsibility each)

- `nestjs-best-practices` — framework mechanics: modules/providers/DI, thin
  controllers, DTOs + global `ValidationPipe`, `@nestjs/config`, exception
  filters + HTTP error envelope, interceptors (incl. `ClassSerializerInterceptor`),
  guards/pipes/filters separation, execution order, lifecycle/shutdown, logging.
  Version-gated v11/Express-v5 notes.
- `nestjs-architecture` — layering: domain/core (ports, entities, pure TS) →
  application (`@Injectable()` use-cases depending on ports) → infrastructure
  (Drizzle repos + adapters, the only Drizzle-touching layer) → presentation
  (controllers/DTOs/filters/Swagger). Three object types in three locations (DTO ≠
  domain entity ≠ persistence row) with explicit boundary mapping. Composition
  root = `AppModule`. A documented "lite" tier (controller → service →
  repository-interface → Drizzle repo) as the default, full 4-layer for complex
  domains, so it does not over-engineer. This skill owns the layer-map guidance the
  `architecture-reviewer` uses for a NestJS surface.
- `nestjs-rest-swagger` — `@nestjs/swagger` setup + CLI plugin, DTO-driven schema,
  `@Api*` decorators, `PartialType`/`PickType` derivations, REST resource naming +
  URI versioning, status codes, pagination envelope, documented error responses,
  `/docs` gated in prod.
- `nestjs-testing` — unit tests via `Test.createTestingModule` stubbing repository
  ports (never the unit under test), e2e via `supertest` on `getHttpServer()` with
  the same global pipes/filters as `main.ts`, the mandatory invalid-DTO→400
  ValidationPipe test, repository tests against real Postgres (Testcontainers) with
  per-test transaction rollback, Jest default with a Vitest note. Reinforces the
  Drizzle-isolation spine (mock at the port boundary; don't mock the query builder).
- `nestjs-orm-drizzle` — Postgres schema (`pgTable`, `InferSelect/InsertModel`),
  the `@Global() DatabaseModule` + `DRIZZLE` injection-token provider factory,
  query builder + relational `db.query` (schema passed to `drizzle()`), transactions
  (`db.transaction`, `tx` propagation), pooling (one app-scoped pool, closed on
  shutdown), `drizzle-kit` generate→migrate (versioned SQL; `push` prototyping-only;
  migrations as a deploy step not app boot), repositories implement the domain ports
  from `nestjs-architecture`. Relations-API version pin flagged.
- `typescript-expert` — ported verbatim from upstream (strict `tsconfig`,
  utility-types, type-level guidance, `ts_diagnostic.py`); already stack-neutral.

### Manifest wiring (small edit to Stage A shipped files)

Update the shipped template `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md`
and the repo README's pasted copy so the `api (NestJS)` row reads:
`nestjs-best-practices, nestjs-architecture, nestjs-testing, nestjs-rest-swagger`
(adds `nestjs-rest-swagger`), library `nestjs-orm-drizzle`, and a note that
`typescript-expert` applies to every TypeScript surface. This keeps the template
consistent with the now-real skill ids. No change to the resolution rules or to any
agent.

## Content sourcing & fidelity

- `typescript-expert`: fetched and ported verbatim from
  `engineering-paved-path/skills/typescript-expert/` (SKILL.md + `references/`
  {tsconfig-strict.json, typescript-cheatsheet.md, utility-types.ts} + `scripts/ts_diagnostic.py`).
- The four NestJS skills are **authored** (no faithful upstream to port) from the
  research synthesis, grounded in `docs.nestjs.com` and `orm.drizzle.team`. Each
  skill lists its authoritative sources. Progressive disclosure: keep each `SKILL.md`
  focused; move long rule catalogs / examples into sibling `references/` or
  `examples.md` where a skill grows large.
- `ts_diagnostic.py` must remain stdlib-only and POSIX-portable; any script path a
  skill references uses `${CLAUDE_PLUGIN_ROOT}`.

## Acceptance criteria (EARS)

- **AC-1** (Ubiquitous) — The marketplace SHALL contain three new plugins:
  `typescript-paved-path`, `nestjs-paved-path`, `nestjs-orm-drizzle`, each registered
  in `marketplace.json` with category, keywords, description, and each with a valid
  `plugin.json` (name, SemVer version, description, author, license, keywords),
  `README.md`, and `CHANGELOG.md`.
- **AC-2** (Ubiquitous) — Dependency edges SHALL be declared: `nestjs-paved-path`
  depends on `engineering-foundations` and `typescript-paved-path`;
  `nestjs-orm-drizzle` depends on `nestjs-paved-path`. `typescript-paved-path` has no
  dependencies.
- **AC-3** (Ubiquitous) — `nestjs-paved-path` SHALL contain exactly the skills
  `nestjs-best-practices`, `nestjs-architecture`, `nestjs-testing`,
  `nestjs-rest-swagger`; `nestjs-orm-drizzle` SHALL contain the `nestjs-orm-drizzle`
  skill; `typescript-paved-path` SHALL contain the `typescript-expert` skill.
- **AC-4** (Ubiquitous) — Each authored NestJS skill SHALL include an implementer
  "rules to follow" section AND a reviewer "red flags" section, and SHALL cite at
  least one authoritative source URL (`docs.nestjs.com` or `orm.drizzle.team`).
- **AC-5** (Ubiquitous) — The `nestjs-architecture`, `nestjs-orm-drizzle`, and
  `nestjs-testing` skills SHALL all state the shared spine invariant: only the
  infrastructure/repository layer imports Drizzle / holds the DB handle; application
  services depend on repository port interfaces via DI tokens.
- **AC-6** (Unwanted behavior) — IF a skill mentions NestJS AI tooling, THEN it SHALL
  state that NestJS ships no official agent-skill and SHALL NOT claim otherwise;
  Drizzle's `llms.txt` MAY be cited as a reference feed.
- **AC-7** (Ubiquitous) — Every version-sensitive rule (NestJS v11 / Node 20+ /
  Express v5 route + query-parser / ConfigModule v4 / CacheModule-Keyv / v11
  shutdown-order + JSON logging / Drizzle Relations API) SHALL be marked as
  version-gated with an instruction to check the installed version first.
- **AC-8** (Ubiquitous) — `nestjs-rest-swagger` SHALL cover Swagger setup + CLI
  plugin, DTO-driven schema with `@Api*` decorators, `PartialType`/`PickType`
  derivation, REST naming + URI versioning, status codes, a pagination envelope,
  documented error responses, and gating `/docs` outside production.
- **AC-9** (Ubiquitous) — `nestjs-testing` SHALL mandate: stub repository ports
  (never mock the unit under test), e2e via `supertest` with the same global
  pipes/filters as `main.ts`, an invalid-DTO→400 ValidationPipe test, and repository
  tests against a real Postgres with per-test isolation; Jest default + Vitest note.
- **AC-10** (Ubiquitous) — `typescript-expert` SHALL be ported from upstream with its
  `references/` and `scripts/ts_diagnostic.py`; the script SHALL be stdlib-only and
  POSIX-portable.
- **AC-11** (Ubiquitous) — The shipped Stack Manifest template and the repo README's
  copy SHALL list the four NestJS paved-path skills (incl. `nestjs-rest-swagger`),
  the `nestjs-orm-drizzle` library, and note `typescript-expert` for TS surfaces.
- **AC-12** (Ubiquitous) — All shipped paths SHALL use `${CLAUDE_PLUGIN_ROOT}` and
  contain no `../`; `.claude-plugin/` holds only `plugin.json`; components at plugin
  root; `version` only in `plugin.json`; `category` only in the marketplace entry.
- **AC-13** (Event-driven) — WHEN `claude plugin validate .` runs, it SHALL pass; WHEN
  `node scripts/build-site.mjs` runs, the quality gate SHALL pass.
- **AC-14** (Ubiquitous) — All repository content SHALL be English.

## Edge cases

- A NestJS project not using Drizzle: it installs `nestjs-paved-path` without
  `nestjs-orm-drizzle`; the architecture/testing skills still stand (they reference
  "the ORM repository layer" generically, with Drizzle specifics living in the
  library skill). The spine invariant is phrased "the ORM/persistence layer" in the
  paved-path skills and made Drizzle-concrete only in `nestjs-orm-drizzle`.
- Installed NestJS < v11 or a different Drizzle relations version: version-gated
  rules tell the agent to check and apply the matching guidance (AC-7).

## Non-functional

- Keep each `SKILL.md` small; use progressive disclosure for long rule catalogs.
- Plugins remain generic (no product-specific bindings).

## Dependencies & impacts

- Touches `.claude-plugin/marketplace.json` (three new entries + marketplace version
  bump to 0.3.0), the repo `README.md` (optional-plugins list + manifest copy), and
  the shipped `stack-manifest.md` template. Adds three plugin trees under `plugins/`.
  No change to Stage A agents or flow skills.

## Traceability table

| AC | Component |
|----|-----------|
| AC-1, AC-2, AC-12 | marketplace.json + three plugin manifests |
| AC-3 | plugin skill inventories |
| AC-4, AC-6, AC-7 | each authored NestJS skill |
| AC-5 | nestjs-architecture + nestjs-orm-drizzle + nestjs-testing |
| AC-8 | nestjs-rest-swagger |
| AC-9 | nestjs-testing |
| AC-10 | typescript-paved-path |
| AC-11 | stack-manifest.md + README |
| AC-13 | packaging + validation + build-site gate |
| AC-14 | all files |

## Source material

- Upstream `typescript-expert`: `raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/engineering-paved-path/skills/typescript-expert/{SKILL.md,references/tsconfig-strict.json,references/typescript-cheatsheet.md,references/utility-types.ts,scripts/ts_diagnostic.py}`
- NestJS: `docs.nestjs.com` (validation, configuration, exception-filters, interceptors,
  serialization, guards, lifecycle, openapi/*, versioning, fundamentals/testing,
  custom-providers, migration guide v11).
- Drizzle: `orm.drizzle.team` (get-started/postgresql, rqb, transactions, migrations,
  drizzle-kit-generate/migrate, kit-overview) and `orm.drizzle.team/llms.txt`.
- The research synthesis (session) provides the per-skill rule and red-flag lists.

## `[NEEDS CLARIFICATION]`

None outstanding.
