# architecture-review

Read-only architectural auditor. Ships the `architecture-reviewer` agent, which
checks whether a project's dependency graph respects its layer contracts and
emits an explicit `PASS`/`FAIL` gate verdict.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `architecture-reviewer` | agent | Read-only audit of already-written code for Clean Architecture violations: forbidden imports across layers, missing abstractions, and structural drift. Never modifies files; every finding cites verbatim `file:line` evidence. |

## What it checks

- **Layer contracts and dependency direction** — the forbidden-import matrix
  (inward-only dependency arrow, no leaking infrastructure into the core, no
  reaching around published facades, etc.) is derived from the **layer names
  in the project's Stack Manifest** (the `## SDD Stack Manifest` section of
  `CLAUDE.md`), not from any hardcoded package or framework names. If no
  manifest is present, the agent falls back to prose stack guidance in
  `CLAUDE.md`, or operates stack-neutrally using only the foundations skills.
- **Missing abstractions and drift smells** — ORM types leaking out of the
  repository layer, framework request/response types reaching domain/core
  logic, God services, duplicated contracts — calibrated as
  CRITICAL / HIGH / MEDIUM / LOW findings.
- **Documented package invariants** (e.g. a core package's own purity rule
  stated in its AGENTS.md/README), not just imports.

Every finding requires verbatim `file:line` evidence — no extrapolation from
file names, no findings from memory. The report always ends with a required
`### Gate verdict: PASS|FAIL` line: FAIL if any CRITICAL or HIGH finding
exists, otherwise PASS.

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install architecture-review@claude-market
```

Depends on `engineering-foundations@^0.1.0` (preloads its `clean-architecture`
and `security` skills) — the plugin manager installs it automatically.

## How to use

**Standalone:** Invoke the `architecture-reviewer` agent directly against a
set of files, a commit, a PR, or even a proposed (not-yet-applied) diff.

**In the SDD workflow:** Spawned by the `run-plan` agent's Stage 4 to gate a
plan's changes before they are considered complete.

## Hard constraints

The `architecture-reviewer` agent:
- Is **read-only** — no `Write`/`Edit` tool; only non-mutating `Bash` (e.g.
  `git log`, `git diff`, `ls`, `rg`) is used.
- Requires **verbatim evidence** for every finding — a claim without a cited
  `file:line` and exact text is not reportable.
- Never invents requirements or violations when a Stack Manifest is absent;
  referencing a skill from an uninstalled plugin is not treated as an error.
- Always ends its report with `### Gate verdict: PASS` or `### Gate verdict: FAIL`.

## What it executes

Nothing outside a normal Claude session: no hooks, no MCP servers, no external
binaries, no writes. It is documentation and prompts only.

## Versioning

SemVer, tracked in `.claude-plugin/plugin.json`; release notes in
[CHANGELOG.md](CHANGELOG.md).
