# SDD Engineering — Core Flow (Stage A) Design

- **Status:** draft
- **Date:** 2026-07-23
- **Author:** Viacheslav Klavdiiev
- **Scope:** Stage A only (stack-agnostic flow core). Stacks (Angular / Flutter /
  NestJS) and per-project library plugins are later stages, described here only
  as context.

## Problem & context

`claude-market` currently ships only `example-plugin`. We want to adopt the
Spec-Driven Development (SDD) workflow from the reference marketplace
`SyukPublic/dev-digest-ai-marketplace` and adapt it to our stack (Angular +
Flutter + NestJS), with swappable per-project UI/ORM libraries (PrimeNG here,
Taiga UI elsewhere; Drizzle ORM for NestJS).

The reference implements the flow across four plugins:

- `engineering-paved-path` — stack knowledge (React / Next.js / Fastify / TS /
  onion / security / testing), 8 skills.
- `research-tools` — `researcher` agent.
- `architecture-review` — `architecture-reviewer` agent.
- `sdd-engineering` — 5 agents + 4 skills; the flow. Depends on the other three.

The pipeline is:

```
spec-creator → implementation-planner → run-plan orchestration → workflow-retro
```

where `run-plan` internally runs:

```
implementer waves → test-writer gap pass → green barrier (tests + typecheck)
  → architecture-reviewer ∥ plan-verifier → triage + bounded fix loop → report
```

The flow core is **stack-agnostic**: almost everything stack-specific lives in
(a) per-surface skill tables inside the agents, and (b) the host project's
`CLAUDE.md` (test/typecheck commands, environment constraints). Adapting to our
stack is therefore: rewrite the knowledge skills, and make those surface tables
resolve against a project manifest instead of hardcoding React/Fastify.

Verbatim copies of every reference source file used for porting are in the
session scratchpad under `dd/` (see the end of this document for the file list).

## Goals

- Port the SDD flow core to `claude-market` as production plugins, adapted so it
  is **stack-agnostic and manifest-driven** rather than hardcoded to
  React/Next/Fastify.
- Define a **Stack Manifest** format (a section in a project's `CLAUDE.md`) that
  tells the flow which paved-path skill, library skill, layer map, and test /
  typecheck commands apply to each surface.
- Keep the artifact conventions, gates, and orchestration semantics of the
  reference intact (spec → plan → run-plan → retro; RTM spine; green barrier;
  bounded fix loop; never commit/push/PR/migrate from the flow).
- Ship complete plugin packaging: `plugin.json`, `README.md`, `CHANGELOG.md` for
  each plugin, registered in `marketplace.json`, passing
  `claude plugin validate .` and the `node scripts/build-site.mjs` quality gate.
- Add a **usage guide** to the repository README: what to install, in what order
  to run the commands, and which components are optional.
- All repository content (specs, plugins, docs, code) is written in **English**.

## Non-goals (this stage)

- No Angular / Flutter / NestJS knowledge skills (Stage B+).
- No per-project library plugins (`angular-ui-primeng`, `angular-ui-taiga`,
  `nestjs-orm-drizzle`) (Stage B+).
- No `typescript-paved-path` plugin (Stage B+).
- No change to the existing release/versioning machinery beyond registering new
  plugins and bumping the marketplace version.
- No running of the flow against a real project as part of this stage (that is a
  Stage B acceptance activity — Stage A has no stack knowledge to run against).

## Target architecture (full picture, for context)

Plugins across all stages. **Bold** = built in Stage A.

Flow core (stack-agnostic):

| Plugin | Contents | Depends on |
|---|---|---|
| **`engineering-foundations`** | skills `clean-architecture`, `security` | — |
| **`research-tools`** | agent `researcher` | — |
| **`architecture-review`** | agent `architecture-reviewer` | engineering-foundations |
| **`sdd-engineering`** | agents `spec-creator`, `implementation-planner`, `implementer`, `test-writer`, `plan-verifier`; skills `run-plan`, `workflow-retro`, `engineering-insights`, `mermaid-diagram` | engineering-foundations, research-tools, architecture-review |

Stack knowledge (Stage B+):

| Plugin | Skills |
|---|---|
| `typescript-paved-path` | `typescript-expert` |
| `angular-paved-path` | `angular-best-practices`, `angular-architecture`, `angular-testing` |
| `flutter-paved-path` | `flutter-best-practices`, `flutter-architecture`, `flutter-testing`, `dart-best-practices` |
| `nestjs-paved-path` | `nestjs-best-practices`, `nestjs-architecture`, `nestjs-testing`, `nestjs-rest-swagger` |

Swappable per-project libraries (Stage B+): `angular-ui-primeng`,
`angular-ui-taiga`, `nestjs-orm-drizzle`, … — small single-skill plugins,
installed per project.

Install profiles: a pure-Angular project installs the flow core +
`angular-paved-path` + `typescript-paved-path` + one `angular-ui-*`; a monorepo
installs the flow core + all three paved-paths + the relevant library plugins.

### Why `engineering-foundations` is its own plugin

The reference bundles stack-neutral knowledge (`onion-architecture`, `security`)
together with stack-specific skills inside `engineering-paved-path`. We split the
stack-specific parts into per-stack plugins (Stage B+), which leaves the
stack-neutral skills homeless. `architecture-reviewer` and the SDD agents preload
these regardless of stack, so they belong in a dedicated foundation plugin that
both `architecture-review` and `sdd-engineering` depend on. `clean-architecture`
is the generalized (stack-neutral) form of the reference's `onion-architecture`.

## Stack Manifest format

The single mechanism by which the stack-agnostic flow discovers, per project,
which knowledge/library skills to load and how to test. It lives as a section in
the host project's `CLAUDE.md`. Agents read it; the flow never hardcodes a
framework.

Template (shipped as `sdd-engineering/skills/run-plan/references/stack-manifest.md`
and echoed in the repo README):

```markdown
## SDD Stack Manifest

| Surface | Paved-path skills | Library skill | Test command | Typecheck command |
|---------|-------------------|---------------|--------------|-------------------|
| web (Angular)    | angular-best-practices, angular-architecture, angular-testing | angular-ui-primeng | <cmd> | <cmd> |
| api (NestJS)     | nestjs-best-practices, nestjs-architecture, nestjs-testing    | nestjs-orm-drizzle | <cmd> | <cmd> |
| mobile (Flutter) | flutter-best-practices, flutter-architecture, flutter-testing | —                  | <cmd> | <cmd> |

### Layer map (for architecture-reviewer)
| Layer | Path glob |
|-------|-----------|
| core   | libs/core/** |
| shared | libs/shared-contracts/** |
| api    | apps/api/** |
| web    | apps/web/** |
| mobile | apps/mobile/** |

### Environment constraints
<e.g. "tests must run offline", "no network in CI", DB test strategy>
```

Resolution rules baked into the agents:

1. **Surface detection.** An agent working on files under a surface's paths (from
   the Layer map) loads that surface's Paved-path + Library skills. If no manifest
   exists, agents fall back to whatever the host `CLAUDE.md` states in prose, and
   otherwise operate stack-neutrally (the Stage-A default, since no stack skills
   exist yet).
2. **Test / typecheck.** The green barrier (`run-plan` Stage 3) uses the manifest's
   Test/Typecheck commands for the touched surfaces; absent a manifest it falls
   back to commands stated elsewhere in `CLAUDE.md`.
3. **Layer map.** `architecture-reviewer` reads the Layer map to build its
   forbidden-import matrix (which glob may not import which). Absent a manifest it
   asks for or infers the layout, never inventing violations.
4. **Missing skill tolerance.** Referencing a skill from a plugin that is not
   installed is not an error — the agent notes it and proceeds with foundations
   only. This is what makes Stage A runnable before any stack plugin exists.

## Component adaptations (Stage A)

Each component is ported from the corresponding scratchpad source, with the
edits below. Substance, checklists, gates, and output contracts are preserved
verbatim except where a change is listed.

### `engineering-foundations`

- `clean-architecture` — generalized from the reference `onion-architecture`
  concept (dependency direction points inward; thin controllers/routes, pure
  services, repositories/adapters at the edge; composition root; never leak an
  ORM query builder or SDK client into a service/route/domain). Layer names are
  parameterized by the project's Layer map rather than the reference's fixed
  `core/**`, `server/**`, `client/**`, `modules/**`, `adapters/**`,
  `packages/shared`. (The reference itself states these names are "conventions,
  not requirements".)
- `security` — ported essentially verbatim (OWASP-aligned app-sec review: input
  validation, authn/authz, secrets, injection, uploads); already stack-neutral.

### `research-tools` — `researcher`

- Ported verbatim from `dd/plugins__research-tools__agents__researcher.md`.
  Already stack-agnostic (PROJECT vs WEB modes, interview-first, mandatory
  "Not found" section, High/Medium/Low confidence). Model `sonnet`.

### `architecture-review` — `architecture-reviewer`

- Ported from `dd/plugins__architecture-review__agents__architecture-reviewer.md`
  (model `opus`, effort `xhigh`; tools Read, Grep, Glob, Bash, Skill).
- **Preloaded skills:** `clean-architecture`, `security` (from
  `engineering-foundations`) instead of the reference's `onion-architecture`,
  `typescript-expert`, `security`. `typescript-expert` is dropped from the
  always-on set (it moves to Stage B `typescript-paved-path`, loaded per surface).
- **Forbidden-import matrix** is driven by the manifest **Layer map** rather than
  hardcoded package names; the inward-only dependency rule and severity model
  (CRITICAL / HIGH / MEDIUM / LOW) are unchanged.
- **HIGH examples** are made stack-neutral / manifest-driven: "framework
  request/response types used in domain logic" and "raw ORM query-builder calls
  in a service or route" stated generically; the concrete `NextRequest` /
  `.select()/.where()` examples are removed (concrete per-stack examples arrive
  with the Stage B stack plugins).
- Evidence-first (CAPRA) rule, "do NOT flag" list, package-invariant checks,
  proposed-diff handling, and the required final line
  `### Gate verdict: PASS|FAIL` are preserved verbatim.

### `sdd-engineering`

General edit applied to every agent that has a per-surface skill table
(`implementer`, `test-writer`, `implementation-planner`, `plan-verifier`): the
table is replaced by the manifest-resolution rules above ("load the paved-path +
library skills the Stack Manifest lists for this surface"). Always-on
`typescript-expert` becomes conditional (loaded only for TS surfaces per manifest,
which in Stage A means never). Preloaded stack-neutral skills become
`clean-architecture` + `security` (+ `mermaid-diagram` where the reference
preloads it).

- **`spec-creator`** — ported from `dd/...spec-creator.md`. Structure preserved
  verbatim: write-boundary = spec files only; English-only artifacts + translate-
  for-approval gate; WHAT/WHY not HOW; untrusted-inputs rule; DesignSync fallback;
  living-spec policy; append-only AC-IDs; multi-call interview model; mandatory
  design-analysis gap sweep; delegates research to `researcher` (≤3 parallel);
  EARS patterns; 11-item self-check; fixed spec file structure; artifacts at
  `docs/specs/SPEC-YYYY-MM-DD-<kebab>.md`. Preloaded skills reduced to
  `mermaid-diagram` + `security`; the "NEVER load how-level skills" rule now names
  our stack skills.
- **`implementation-planner`** — ported from `dd/...implementation-planner.md`.
  Preserved: input gate (approved spec required); two-pass stop-and-ask incl. the
  mandatory "multi-agent or single-agent?" question; requirements review;
  execution modes with phase-size balance and dependency-minimality rules; global
  task IDs; bidirectional RTM coverage; context-pack rule; fixed plan file
  structure; artifacts at `docs/plans/<feature>.md`. Preloaded skills →
  `clean-architecture`, `security` (surface skills on demand via manifest).
- **`implementer`** — ported from `dd/...implementer.md`. Preserved: stay-in-slice
  rule; DoD = tests green + own diff reviewed; adopt→adapt→invent; no
  publishing/migrations; working loop. Preloaded → `clean-architecture`,
  `security`; per-surface skills loaded from the manifest before writing a surface.
- **`test-writer`** (model `sonnet`) — ported from `dd/...test-writer.md`.
  Preserved: write-boundary (test files + e2e dir only); mock-policy-by-layer;
  intention-guided generation; blocking self-verification gate. **Changed:** the
  RTL-specific and Fastify-specific rule sections are replaced by a
  manifest-driven "apply the testing skill named for this surface" instruction;
  the concrete RTL/Fastify guidance moves to the Stage B stack testing skills. The
  Next-specific "Async Server Components → E2E" note is removed.
- **`plan-verifier`** — ported from `dd/...plan-verifier.md`. Ported essentially
  verbatim (already stack-agnostic): read-only; hard gate (plan or spec required);
  two-phase extract-then-audit; five verdicts; evidence-mandatory; forward+backward
  sweep; scope-guard; RTM output; spec-status recommendation without editing the
  spec.
- **`run-plan`** (skill) — ported from `dd/...run-plan__SKILL.md` +
  `references/spawn-prompts.md`. Preserved: Gate 0 plan gate; pre-flight (clean-tree
  check, e2e prereq probe, dependency graph/waves, wave-balance gate, design brief,
  ownership map, TodoWrite); Stage 1 implementer waves (eager launch); Stage 2
  test-writer gap pass; Stage 3 green barrier; Stage 4 parallel review
  (architecture-reviewer ∥ plan-verifier); Stage 5 triage table + bounded fix loop
  (max 2 iterations + no-progress guard); Stage 6 wrap-up + `## Run-plan report`;
  never commit/push/PR/migrate. **Changed:** the green barrier reads test/typecheck
  commands from the manifest; spawn-prompt templates reference manifest-driven
  surface skills. Ships the `stack-manifest.md` reference.
- **`workflow-retro`** (skill) — ported from `dd/...workflow-retro__SKILL.md` +
  its `scripts/retro_metrics.py` (stdlib Python, portable). Stack-agnostic; no
  content change. Artifacts at `docs/retros/<date>-<slug>.md` + `ledger.md`.
- **`engineering-insights`** (skill) — ported from `dd/...engineering-insights__SKILL.md`.
  Stack-agnostic; append-only into `docs/engineering-insights.md`; anti-banality
  gate. No content change.
- **`mermaid-diagram`** (skill) — ported from `dd/...mermaid-diagram__SKILL.md`.
  No change.

### Portability requirement

All shipped file references in hooks/MCP/scripts use `${CLAUDE_PLUGIN_ROOT}`; no
`../` in any path (the marketplace validator rejects it and the plugin cache copy
would break it). `retro_metrics.py` must be POSIX-portable and stdlib-only.

## Repository README usage guide

Add a "Using the SDD workflow" section to the repo `README.md` covering:

1. **Install order** (flow core):
   ```
   /plugin marketplace add ViacheslavKlavdiiev/claude-market
   /plugin install engineering-foundations@claude-market
   /plugin install research-tools@claude-market
   /plugin install architecture-review@claude-market
   /plugin install sdd-engineering@claude-market
   ```
   (Stage B stack/library plugins listed as optional, added when they exist.)
2. **Set up the Stack Manifest** in the target project's `CLAUDE.md` (link to the
   template).
3. **Run order:**
   - `@spec-creator` (or ask to "write a spec") → produces `docs/specs/SPEC-*.md`;
     approve it.
   - `@implementation-planner` → produces `docs/plans/<feature>.md`; choose
     multi-agent vs single-agent.
   - `/sdd-engineering:run-plan docs/plans/<feature>.md` → orchestrates
     implementation, testing, review, and fixes.
   - `/sdd-engineering:workflow-retro` → post-run metrics + insights.
4. **Optional components:** `research-tools`'s `researcher` (used standalone or by
   spec-creator), `workflow-retro`, `engineering-insights`, `mermaid-diagram`;
   `architecture-review` can be run standalone against a diff.

## Acceptance criteria (EARS)

- **AC-1** (Ubiquitous) — The marketplace SHALL contain four new plugins:
  `engineering-foundations`, `research-tools`, `architecture-review`,
  `sdd-engineering`, each registered in `.claude-plugin/marketplace.json` with a
  category, keywords, and description.
- **AC-2** (Ubiquitous) — Each new plugin SHALL have a valid
  `.claude-plugin/plugin.json` (name, SemVer version, description, author,
  license, keywords), a `README.md`, and a `CHANGELOG.md`.
- **AC-3** (Ubiquitous) — Plugin dependencies SHALL be declared:
  `architecture-review` depends on `engineering-foundations`; `sdd-engineering`
  depends on `engineering-foundations`, `research-tools`, `architecture-review`.
- **AC-4** (Ubiquitous) — `sdd-engineering` SHALL contain exactly these agents:
  `spec-creator`, `implementation-planner`, `implementer`, `test-writer`,
  `plan-verifier`; and these skills: `run-plan`, `workflow-retro`,
  `engineering-insights`, `mermaid-diagram`.
- **AC-5** (Ubiquitous) — `architecture-review` SHALL contain the
  `architecture-reviewer` agent; `research-tools` SHALL contain the `researcher`
  agent; `engineering-foundations` SHALL contain the `clean-architecture` and
  `security` skills.
- **AC-6** (Ubiquitous) — No ported component SHALL hardcode React, Next.js,
  Fastify, RTL, or `NextRequest`/`NextResponse`; per-surface skill selection and
  test/typecheck commands SHALL resolve through the Stack Manifest.
- **AC-7** (Ubiquitous) — A Stack Manifest template SHALL ship as a `run-plan`
  reference file and be documented in the repo README.
- **AC-8** (State-driven) — WHILE no Stack Manifest is present, the agents SHALL
  operate stack-neutrally (foundations only) without erroring.
- **AC-9** (Ubiquitous) — `architecture-reviewer` SHALL end every report with
  `### Gate verdict: PASS|FAIL`, and SHALL derive its forbidden-import matrix from
  the manifest Layer map.
- **AC-10** (Ubiquitous) — `run-plan` SHALL preserve the reference gates: plan
  gate, clean-tree check, green barrier, parallel review, ≤2-iteration fix loop
  with a no-progress guard; and SHALL NOT commit, push, open PRs, or run
  migrations.
- **AC-11** (Ubiquitous) — `test-writer` SHALL restrict writes to test files /
  e2e directory and SHALL enforce mock-policy-by-layer and a blocking
  self-verification gate.
- **AC-12** (Ubiquitous) — `spec-creator` SHALL write only spec files, produce
  English artifacts, use EARS acceptance criteria with append-only AC-IDs, and
  gate approval on zero `[NEEDS CLARIFICATION]` + full requirement coverage.
- **AC-13** (Event-driven) — WHEN `claude plugin validate .` runs, it SHALL pass
  for all new plugins.
- **AC-14** (Event-driven) — WHEN `node scripts/build-site.mjs` runs, the quality
  gate SHALL pass (no missing descriptions/versions, no duplicate component ids).
- **AC-15** (Ubiquitous) — All shipped paths SHALL use `${CLAUDE_PLUGIN_ROOT}`
  and contain no `../`; `retro_metrics.py` SHALL be stdlib-only and POSIX-portable.
- **AC-16** (Ubiquitous) — The repo `README.md` SHALL contain a usage guide:
  install order, run order (spec-creator → planner → run-plan → workflow-retro),
  and which components are optional.
- **AC-17** (Ubiquitous) — All repository content SHALL be in English.

## Edge cases

- Manifest present but references an uninstalled stack plugin → note and proceed
  with foundations (AC-8 tolerance), never fail.
- No manifest and no stack prose in `CLAUDE.md` → stack-neutral operation.
- `run-plan` invoked on a dirty tree → STOP and ask (reference gate preserved).
- Ported agent references a skill id that will only exist in Stage B → the
  reference is written as manifest-driven text, so it degrades gracefully.

## Non-functional

- Each plugin is a single trust unit and always-on context overhead — keep skills
  small; use progressive disclosure (`references/`, `examples.md`, `scripts/`).
- Plugins must be generic (no product-specific bindings).

## Dependencies & impacts

- Touches `.claude-plugin/marketplace.json` (four new entries + marketplace
  version bump), the repo `README.md`, and adds four plugin trees under
  `plugins/`. No change to `scripts/` or workflows beyond what the quality gate
  already enforces.

## Traceability table

| AC | Component |
|----|-----------|
| AC-1, AC-2, AC-3 | marketplace.json + all four plugin manifests |
| AC-4, AC-10, AC-11, AC-12 | sdd-engineering agents + skills |
| AC-5 | research-tools, architecture-review, engineering-foundations |
| AC-6, AC-7, AC-8 | manifest mechanism across all agents + run-plan reference |
| AC-9 | architecture-reviewer |
| AC-13, AC-14, AC-15 | packaging + validation + build-site gate |
| AC-16 | repo README |
| AC-17 | all files |

## Source files for porting (session scratchpad `dd/`)

- `plugins__research-tools__agents__researcher.md`
- `plugins__architecture-review__agents__architecture-reviewer.md`
- `plugins__sdd-engineering__agents__{spec-creator,implementation-planner,implementer,test-writer,plan-verifier}.md`
- `plugins__sdd-engineering__skills__{run-plan,workflow-retro,engineering-insights,mermaid-diagram}__SKILL.md`
- `plugins__sdd-engineering__skills__run-plan__references__spawn-prompts.md`
- `plugins__engineering-paved-path__README.md` (for `clean-architecture` +
  `security` substance; stack-specific skills are Stage B)
- `plugins__*__.claude-plugin__plugin.json` (dependency contract reference)

## `[NEEDS CLARIFICATION]`

None outstanding.
