# SDD Stage B — Increment 2: Angular + PrimeNG Stack Design

- **Status:** draft
- **Date:** 2026-07-23
- **Author:** Viacheslav Klavdiiev
- **Scope:** Stage B, increment 2 — the Angular web stack + PrimeNG UI library.
  Reuses the existing `typescript-paved-path`. Flutter is a later increment.

## Problem & context

Stage A shipped the manifest-driven SDD flow core; Stage B increment 1 filled the
NestJS surface. This increment fills the **Angular web surface** and, for the first
time, exercises the **swappable UI-library mechanism**: the paved-path stays
UI-agnostic and a separate library plugin (`angular-ui-primeng`) carries all PrimeNG
specifics, so a different project can swap in `angular-ui-taiga` by changing only the
library plugin.

Research facts (sources cited in the skills):

- Angular ships an **official, MIT-licensed** skill: `github.com/angular/skills`
  — a thin `angular-developer/SKILL.md` routing over ~40 `references/*` files, plus
  `angular-new-app/SKILL.md`. Copyright 2026 Google LLC. We **vendor** it (faithful
  reuse) rather than rewrite, preserving license + attribution.
- Modern Angular conventions the skill encodes (version-gated): standalone default
  `[v19+]`, new control flow `@if/@for(track)/@switch` `[v17+]`, signals
  (`signal/computed/linkedSignal/resource`) `[v17+, matured v18/v19]`, `input()/output()/model()`,
  `inject()` in field initializers, Signal Forms `[v21+]`, zoneless `[preview v18 → stable v20/v21]`,
  Tailwind v4 `@import` syntax; testing = TestBed + component harnesses + RouterTestingHarness,
  runner Vitest `[v20/v21]`, Act-Wait-Assert (`await fixture.whenStable()`, not
  `detectChanges()`); official skill is silent on `@testing-library/angular`.
- **PrimeNG**: current stable **v22** (docs moved primeng.org → primeng.dev). Token
  theming (`@primeng/themes` + `providePrimeNG` + `provideAnimationsAsync`) since **v18**;
  pre-v18 CSS/SASS theme files + `PrimeNGConfig` are removed. v18 component renames
  (`p-dropdown`→`p-select`, `p-calendar`→`p-datepicker`, etc.). Modern PrimeNG `[v17+]`
  is **self-contained — does NOT depend on `@angular/cdk`**. Neither PrimeNG nor Taiga
  ships an agent-skill (both ship `llms.txt` + MCP `@primeng/mcp`), so `angular-ui-primeng`
  is authored (grounded in primeng.dev `llms-full.txt`/MCP), not vendored.

## Goals

- Ship two plugins:
  - **`angular-paved-path`** — vendored `angular-developer` + `angular-new-app` skills
    (MIT-attributed, verbatim) + a thin house **`angular-testing`** skill.
  - **`angular-ui-primeng`** — authored `angular-ui-primeng` library skill (PrimeNG v18+
    theming, current v22), the swappable UI layer.
- Preserve upstream **MIT license + Copyright 2026 Google LLC attribution** for all
  vendored content (license file/notice + retained headers + README credit).
- Keep the **UI-swap spine invariant**: the paved-path contains zero PrimeNG (or any UI
  library) specifics; all PrimeNG names/imports live only in `angular-ui-primeng`.
- `angular-testing` states an explicit house testing policy consistent with `nestjs-testing`
  (harnesses primary, Act-Wait-Assert, real providers, behavioral assertions), reconciling
  the official Vitest + harnesses stance and a documented position on `@testing-library/angular`.
- Wire the Angular surface into the shipped Stack Manifest template + repo README.
- Full packaging + dependency edges; passes `claude plugin validate .` and `node scripts/build-site.mjs`.
- English-only. Version-gated rules explicitly marked. Hedge/version-gate the research
  "verify-before-ship" items (zoneless/`NgOptimizedImage` exact wording, PrimeNG v22
  licensing, whether `primeng` pulls `@angular/cdk`) rather than asserting them flatly.

## Non-goals (this increment)

- No Flutter stack (later increment). No `angular-ui-taiga` (documented only as the swap
  example; authored when a project needs it).
- No rewrite of the official Angular content into house prose — it is vendored.
- No new `typescript-paved-path` work (reused as-is via the manifest).
- No change to Stage A flow agents or the NestJS plugins.
- Not running the flow against a live Angular project as part of this increment.

## Architecture

| Plugin | Skills | Depends on | Kind |
|---|---|---|---|
| `angular-paved-path` | `angular-developer` (vendored), `angular-new-app` (vendored), `angular-testing` (house) | `engineering-foundations`, `typescript-paved-path` | paved-path |
| `angular-ui-primeng` | `angular-ui-primeng` | `angular-paved-path` | swappable library |

Install profile for an Angular project: flow core + `angular-paved-path`
(+ `typescript-paved-path`, `engineering-foundations` transitively) + `angular-ui-primeng`.
Swap example: replace `angular-ui-primeng` with a future `angular-ui-taiga`; everything
else is unchanged.

### Skill decomposition rationale (Option a)

The official `angular-developer` skill is authoritative, version-aware, cross-linked, and
MIT-licensed. Rewriting it into our `best-practices/architecture` split (as NestJS did,
where no upstream existed) would forfeit upstream updates and risk drift from angular.dev.
So we vendor it whole and add a **thin house `angular-testing`** wrapper for the one place
we want an explicit house policy. The manifest's Angular paved-path skills therefore
become `angular-developer, angular-new-app, angular-testing` (not the placeholder
`angular-best-practices/architecture/testing`). Architecture/DI/routing/forms live inside
the vendored `angular-developer` references — that is acceptable and faithful.

### `angular-testing` (house skill) scope

A thin skill that references (does not duplicate) the vendored official testing references
and adds a house rules/red-flags/sources block consistent with `nestjs-testing`:
- Runner: match the project (Vitest is the modern Angular default `[v20/v21]`; Karma/Jest if the project uses them).
- Pattern **Act-Wait-Assert**: `await fixture.whenStable()`, do NOT force `fixture.detectChanges()`.
- **Component harnesses** are the primary approach; `RouterTestingHarness` + real `provideRouter()` for routing (real guards/resolvers).
- House policy on `@testing-library/angular`: **allowed** where a team prefers accessible-query ergonomics, but harnesses remain the house default; either way assert observable behavior (≥1 real assertion), not implementation details — mirroring `nestjs-testing`'s "don't mock the unit under test / mock at boundaries."
- Adopt the official "run `ng build` after generating; fix errors before proceeding" as a verification-before-completion rule.

### UI-swap spine invariant (state verbatim in `angular-ui-primeng`)

> The paved-path (`angular-paved-path`) contains no UI-library specifics. All PrimeNG
> component names, imports, providers, and theming live only in this skill. A project
> swaps its UI library by replacing this plugin (e.g. with `angular-ui-taiga`); the
> paved-path, forms, routing, and testing conventions are unchanged.

### Manifest wiring (small edit to Stage A shipped files)

Update `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md` and the repo
README's pasted copy so the `web (Angular)` row's Paved-path skills read
`angular-developer, angular-new-app, angular-testing` and the Library reads
`angular-ui-primeng`. Keep the resolution rules and the `typescript-expert` note. No agent changes.

## Content sourcing & fidelity

- **Vendored (verbatim, MIT):** `angular-developer/SKILL.md` + all `angular-developer/references/*`
  and `angular-new-app/SKILL.md` from `github.com/angular/skills`. Retain each file's license/
  attribution header; add a `LICENSE`/`NOTICE` for the vendored subtree and credit Google LLC
  (Apache/MIT — use the upstream's MIT) in the plugin README. Fix only `${CLAUDE_PLUGIN_ROOT}`
  path portability if any file references a sibling by a bare/`../` path; do not edit the prose.
  Add a short house preamble file (not edits to Google's files) noting version-gating conventions
  and pointing to `angular-ui-primeng`.
- **Authored:** `angular-testing` (house) and `angular-ui-primeng` (from the research digest,
  grounded in angular.dev / primeng.dev `llms-full.txt` + `@primeng/mcp`), each with rules-to-follow,
  review-red-flags, sources, and version-gated (`[vNN]`/⚠️) markers.
- Skills stay small via progressive disclosure (the vendored skill already uses `references/`).
- Hedge the flagged "verify-before-ship" items with version-gated wording rather than flat claims.

## Acceptance criteria (EARS)

- **AC-1** (Ubiquitous) — The marketplace SHALL contain two new plugins, `angular-paved-path`
  and `angular-ui-primeng`, each registered in `marketplace.json` (category, keywords, description)
  with a valid `plugin.json` (name, SemVer version, description, author, license, keywords),
  `README.md`, and `CHANGELOG.md`.
- **AC-2** (Ubiquitous) — Dependency edges SHALL be declared: `angular-paved-path` depends on
  `engineering-foundations` and `typescript-paved-path`; `angular-ui-primeng` depends on
  `angular-paved-path`.
- **AC-3** (Ubiquitous) — `angular-paved-path` SHALL contain the skills `angular-developer`,
  `angular-new-app`, and `angular-testing`; `angular-ui-primeng` SHALL contain the
  `angular-ui-primeng` skill.
- **AC-4** (Ubiquitous) — The vendored `angular-developer` and `angular-new-app` content SHALL be
  reproduced verbatim (prose unchanged), with its MIT license + `Copyright 2026 Google LLC`
  attribution preserved (retained headers + a license/notice file in the vendored subtree + a
  README credit).
- **AC-5** (Ubiquitous) — The `angular-testing` and `angular-ui-primeng` skills SHALL each include
  a rules-to-follow section, a review-red-flags section, a sources section with ≥1 authoritative URL
  (angular.dev / primeng.dev), and explicitly marked version-gated rules.
- **AC-6** (Ubiquitous) — The UI-swap spine invariant SHALL be stated in `angular-ui-primeng`, and
  NO PrimeNG-specific name/import/provider (`primeng`, `@primeng/*`, `p-*`, `providePrimeNG`) SHALL
  appear anywhere in `angular-paved-path`.
- **AC-7** (Ubiquitous) — `angular-ui-primeng` SHALL cover: v18+ token theming
  (`@primeng/themes` + `providePrimeNG` + `provideAnimationsAsync`), the removal of pre-v18 CSS/SASS
  themes + `PrimeNGConfig`, per-component standalone imports (tree-shaking), Tailwind interop with
  correct `cssLayer` ordering, `styleClass`/design-token overrides (not `::ng-deep`), the
  MessageService/ConfirmationService/DialogService patterns, `p-table` lazy/pagination, the v18
  component renames (current + deprecated names), and PrimeNG's CDK-independence.
- **AC-8** (Unwanted behavior) — IF the skill states a fact flagged as verify-before-ship (zoneless
  or `NgOptimizedImage` exact API, PrimeNG v22 licensing, `@angular/cdk` presence), THEN it SHALL
  present it as version-gated / "verify against current docs", not as an unconditional assertion.
- **AC-9** (Ubiquitous) — `angular-testing` SHALL mandate harnesses + `RouterTestingHarness`,
  Act-Wait-Assert (`await fixture.whenStable()`, not forced `detectChanges()`), a documented
  `@testing-library/angular` policy, behavioral assertions, and `ng build` verification.
- **AC-10** (Ubiquitous) — The shipped Stack Manifest template and the repo README's copy SHALL list
  the Angular paved-path skills (`angular-developer, angular-new-app, angular-testing`) and the
  `angular-ui-primeng` library.
- **AC-11** (Ubiquitous) — All shipped paths SHALL use `${CLAUDE_PLUGIN_ROOT}` and contain no `../`;
  `.claude-plugin/` holds only `plugin.json`; components at plugin root; `version` only in
  `plugin.json`; `category` only in the marketplace entry.
- **AC-12** (Event-driven) — WHEN `claude plugin validate .` runs it SHALL pass; WHEN
  `node scripts/build-site.mjs` runs the quality gate SHALL pass.
- **AC-13** (Ubiquitous) — All repository content SHALL be English (the vendored Google content is
  already English).

## Edge cases

- An Angular project not using PrimeNG installs `angular-paved-path` without `angular-ui-primeng`;
  the paved-path stands alone (UI-agnostic). A Taiga project swaps in `angular-ui-taiga` (documented
  as the swap example; not built here).
- Angular version differences: the vendored skill already gates dynamically ("analyze the version");
  the house skills add static `[vNN]` markers.
- PrimeNG major other than v22 / pre-v18: version-gated rules + the migration note cover it.

## Non-functional

- Keep authored `SKILL.md` files small (progressive disclosure); the vendored skill already is.
- Plugins remain generic (no product-specific bindings).
- Preserve upstream license obligations (MIT attribution) — a compliance requirement, not optional.

## Dependencies & impacts

- Touches `.claude-plugin/marketplace.json` (two new entries + version bump 0.3.0 → 0.4.0), the repo
  `README.md`, and the shipped `stack-manifest.md`. Adds two plugin trees. No change to Stage A/NestJS.

## Traceability table

| AC | Component |
|----|-----------|
| AC-1, AC-2, AC-11 | marketplace.json + both plugin manifests |
| AC-3 | plugin skill inventories |
| AC-4 | vendored angular-developer + angular-new-app + license/attribution |
| AC-5, AC-8 | angular-testing + angular-ui-primeng skills |
| AC-6 | UI-swap invariant + paved-path PrimeNG-free check |
| AC-7 | angular-ui-primeng |
| AC-9 | angular-testing |
| AC-10 | stack-manifest.md + README |
| AC-12 | packaging + validation + build-site gate |
| AC-13 | all files |

## Source material

- Official Angular skill (vendor): `raw.githubusercontent.com/angular/skills/main/angular-developer/{SKILL.md,references/*}` and `.../angular-new-app/SKILL.md` (MIT, Copyright 2026 Google LLC).
- Angular docs: `angular.dev`. PrimeNG: `primeng.dev` (+ `primeng.org/llms`, `@primeng/mcp`).
- Research digest (session): `scratchpad/angular-primeng-digest.md` — per-skill rules + red-flags + version gates.

## `[NEEDS CLARIFICATION]`

None outstanding.
