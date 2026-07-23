# sdd-engineering

The Spec-Driven Development (SDD) workflow: turn a request into an approved
spec, an approved plan, an orchestrated multi-agent implementation with
review gates, and a measured retrospective — stack-agnostic and driven by the
project's own Stack Manifest rather than any hardcoded framework.

## Pipeline

```
spec-creator → implementation-planner → run-plan → workflow-retro
```

- **`spec-creator`** (agent, Task 5) — turns a request into an approved
  Development Spec, using `researcher` (from `research-tools`) to fill gaps.
- **`implementation-planner`** (agent, Task 5) — turns an approved spec into
  an approved Development Plan: phases, dependency graph, disjoint scopes,
  and a requirement Traceability Matrix (RTM).
- **`run-plan`** (skill, this plugin) — orchestrates the approved plan through
  the full implementation pipeline. See below for its internal stages.
- **`workflow-retro`** (skill, this plugin) — measures a past pipeline run
  (true token/tool/duration/parallelism metrics from on-disk journals),
  produces insights with concrete actions, and appends a trend row to the
  retro ledger.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `run-plan` | skill | Executes an APPROVED Development Plan end-to-end: implementer wave(s) → test-writer gap pass → green barrier (tests + typecheck) → `architecture-reviewer` ∥ `plan-verifier` → bounded fix loop (≤2 iterations) → final report. Never commits, pushes, opens a PR, or runs migrations. |
| `workflow-retro` | skill | Post-run retrospective of the multi-agent pipeline: parses session + subagent journals on disk (a parent's usage excludes subagent tokens) into true metrics, derives insights with concrete optimization actions, and appends a trend row to the retro ledger. Ships `scripts/retro_metrics.py` (stdlib-only). |
| `engineering-insights` | skill | Captures durable, non-obvious engineering knowledge (gotchas, root causes, antipatterns, decisions) into the host project's `docs/engineering-insights.md`, and prunes that log on request. |
| `mermaid-diagram` | skill | Creates Mermaid diagrams (flowcharts, sequence, class, ER, state, Gantt, etc.) for specs, plans, and reports. Stack-agnostic; example diagrams illustrate a generic full-stack web app. |

## `run-plan` internal stages

```
Gate 0 (plan gate) → Pre-flight (clean-tree check, Stack Manifest resolution,
  e2e prereq probe, dependency graph/waves, wave-balance gate, design brief,
  ownership map)
→ Stage 1: implementer wave(s) (eager launch)
→ Stage 2: test-writer gap pass
→ Stage 3: green barrier (tests + typecheck, per Stack Manifest)
→ Stage 4: architecture-reviewer ∥ plan-verifier (parallel, read-only)
→ Stage 5: triage table → bounded fix loop (≤2 iterations, no-progress guard)
→ Stage 6: wrap-up (tick plan checkboxes, `## Run-plan report`)
```

`run-plan` never commits, pushes, opens a PR, or runs database migrations —
those are always left to the user, after the diff has been reviewed with the
project's own tooling.

## The Stack Manifest

`run-plan`, and the agents it spawns, resolve stack context from the
`## SDD Stack Manifest` section of the host project's `CLAUDE.md` — which
paved-path and library skills to load per surface, which test/typecheck
commands to run, and the layer map the architecture forbidden-import matrix
is derived from. See
[skills/run-plan/references/stack-manifest.md](skills/run-plan/references/stack-manifest.md)
for the template and the resolution rules. If no manifest is present, the
pipeline falls back to prose stack guidance in `CLAUDE.md`, or operates
stack-neutrally using only the `engineering-foundations` skills — a missing
manifest is never treated as a violation or an invented requirement.

## Artifact paths (defaults, all overridable)

| Artifact | Default path |
| -------- | ------------ |
| Development Spec | `docs/specs/<feature>.md` |
| Development Plan | `docs/plans/<feature>.md` |
| Retro report | `docs/retros/<YYYY-MM-DD>-<slug>.md` |
| Retro ledger | `docs/retros/ledger.md` |
| Engineering insights | `docs/engineering-insights.md` |

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install sdd-engineering@claude-market
```

Depends on `engineering-foundations@^0.1.0`, `research-tools@^0.1.0`, and
`architecture-review@^0.1.0` — the plugin manager installs them automatically.

## Agents

The five pipeline agents (`spec-creator`, `implementation-planner`,
`implementer`, `test-writer`, `plan-verifier`) ship with this release;
`run-plan`'s spawn-prompt templates
(`skills/run-plan/references/spawn-prompts.md`) target them by name.
`run-plan` requires an already-approved plan file as input (Gate 0) and
spawns `architecture-reviewer` (from `architecture-review`) and
`plan-verifier`/`implementer`/`test-writer` per its templates.

## Hard constraints

- `run-plan` never commits, pushes, opens a PR, or runs database migrations.
- Every subagent spawn embeds context VERBATIM (context pack, findings,
  design brief) — no "see the attached image" or unresolved pointers.
- The fix loop is capped at 2 iterations, with a no-progress guard that
  escalates to the user rather than looping a third time.
- `engineering-insights` never writes inside this plugin's own directory —
  insights are project artifacts, committed with the project's code.

## What it executes

Nothing outside a normal Claude session, except `workflow-retro`'s bundled
`scripts/retro_metrics.py` — a stdlib-only Python script that parses on-disk
session journals; it makes no network calls and writes only to a scratchpad
path the caller chooses. No hooks, no MCP servers, no other external binaries.

## Versioning

SemVer, tracked in `.claude-plugin/plugin.json`; release notes in
[CHANGELOG.md](CHANGELOG.md).
