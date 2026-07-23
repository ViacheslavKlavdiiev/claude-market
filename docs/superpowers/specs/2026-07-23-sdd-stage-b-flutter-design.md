# SDD Stage B — Increment 3: Flutter + Dart Stack Design

- **Status:** draft
- **Date:** 2026-07-23
- **Author:** Viacheslav Klavdiiev
- **Scope:** Stage B, increment 3 (final Stage B stack) — the Flutter mobile stack
  (Material 3 + GoRouter) + a shared Dart language plugin. No swappable UI-library
  layer (Material 3 is in-SDK).

## Problem & context

Stage A shipped the manifest-driven SDD flow; Stage B increments 1–2 filled the NestJS
and Angular surfaces. This increment fills the **Flutter mobile surface** and adds a
shared **Dart** language plugin (parallel to `typescript-paved-path`).

Research facts (sources cited in the skills):

- **`dart-lang/skills`** — official, **BSD-3-Clause** ("Copyright 2012 the Dart project
  authors"). 12 well-formed `dart-*` SKILL.md skills. → **VENDOR** a curated subset,
  preserving the BSD-3 notice.
- **`flutter/agent-plugins`** — official; the real Flutter-domain skills live at repo-root
  `skills/flutter-*` (**BSD-3-Clause**, "Copyright 2026 The Flutter Authors"). It re-vendors
  the dart-lang skills too. (`github.com/flutter/skills` now 301-redirects here.) → **VENDOR**
  a curated subset; **AUTHOR** the gaps (no upstream `flutter-best-practices` or Material 3 skill).
- **Vendoring caveats:** SKILL.md frontmatter carries Gemini-authoring `metadata.model`
  artifacts (harmless); some skills reference Dart/Flutter **MCP** tools ("Run validator")
  that degrade to the CLI (`flutter test`/`analyze`, `dart analyze`) when no MCP server is
  present; `dart-fix-runtime-errors` is MCP-only (skip).
- **Material 3** is the default since Flutter 3.16; on current SDKs (3.29+/2025) Material 2
  is removed and `useMaterial3` is obsolete — do NOT toggle it (version-gate + verify).
- **GoRouter** (`go_router`) is at 17.x with frequent breaking majors — pin + verify.
- **No swappable UI-library** for Flutter analogous to PrimeNG: Material 3 ships in-SDK. The
  only "alternatives" (Cupertino, fluent_ui) are niche/OS-specific, not a general swap layer.
- **State management** is deliberately unpinned by the user (they chose Material 3 + GoRouter
  only) and by the official docs — present neutrally.

## Goals

- Ship two plugins:
  - **`dart-paved-path`** — vendored curated `dart-*` skills (BSD-3-attributed), the shared
    Dart language layer (parallels `typescript-paved-path`).
  - **`flutter-paved-path`** — authored `flutter-best-practices`, `flutter-architecture`,
    `flutter-material3`, `flutter-routing`, `flutter-testing`; plus vendored official Flutter
    task skills (`flutter-build-responsive-layout`, `flutter-implement-json-serialization`,
    `flutter-setup-localization`, `flutter-use-http-package`).
- Preserve upstream **BSD-3-Clause license + attribution** for all vendored content
  (LICENSE + notice per vendored subtree, retained headers, README credit) — Dart authors
  (2012) for dart skills, The Flutter Authors (2026) for flutter skills.
- Keep vendored skills self-contained: add a `HOUSE-NOTES.md` per vendored subtree noting the
  MCP→CLI fallback and the Gemini-metadata provenance (do not rewrite the vendored bodies;
  the sole permitted minimal edit is stripping a `metadata.model` key if it breaks validation).
- State the **architecture spine invariant** in `flutter-architecture` (UI never reaches data
  sources directly; `View → ViewModel → Repository → Service`), analogous to NestJS/Angular.
- Present **state management neutrally** (options + "start least-powerful, keep it in the
  ViewModel"), never mandating Riverpod/Bloc.
- Wire the `mobile (Flutter)` surface into the shipped Stack Manifest + README, recording
  UI library = "N/A — Material 3 in-SDK" (contrast with Angular's swappable PrimeNG).
- Full packaging + dependency edges; passes `claude plugin validate .` and `node scripts/build-site.mjs`.
- English-only. Version-gated rules explicitly marked; verify-before-ship items hedged.

## Non-goals (this increment)

- No swappable Flutter UI-library plugin (none warranted).
- No rewrite of the vendored Dart/Flutter content into house prose (vendored under BSD-3).
- No MCP server shipped (vendored MCP steps covered by the HOUSE-NOTES CLI fallback).
- No vendoring of the niche/MCP-only skills (`dart-fix-runtime-errors`, FFI/ffigen,
  `dart-build-cli-app`) or of official skills that overlap the authored conceptual skills
  (`flutter-setup-declarative-routing`, `flutter-add-widget-test`, `flutter-apply-architecture-best-practices`)
  — the authored `flutter-routing`/`flutter-testing`/`flutter-architecture` cover those.
- No change to Stage A flow agents or the NestJS/Angular plugins.
- Not running the flow against a live Flutter project as part of this increment.

## Architecture

| Plugin | Skills | Depends on | Kind |
|---|---|---|---|
| `dart-paved-path` | vendored: `dart-add-unit-test`, `dart-run-static-analysis`, `dart-generate-test-mocks`, `dart-use-pattern-matching`, `dart-resolve-package-conflicts`, `dart-collect-coverage`, `dart-use-primary-constructors` | — | paved-path (shared language) |
| `flutter-paved-path` | authored: `flutter-best-practices`, `flutter-architecture`, `flutter-material3`, `flutter-routing`, `flutter-testing`; vendored: `flutter-build-responsive-layout`, `flutter-implement-json-serialization`, `flutter-setup-localization`, `flutter-use-http-package` | `engineering-foundations`, `dart-paved-path` | paved-path |

Install profile for a Flutter project: flow core + `flutter-paved-path` (+ `dart-paved-path`,
`engineering-foundations` transitively). No UI-library plugin.

### Skill responsibilities (authored)

- `flutter-best-practices` — widget composition (Stateless vs Stateful, `const`, keys), `build()`
  purity, rebuild scoping, `BuildContext` rules (`context.mounted` across async gaps),
  Future/StreamBuilder, null-safety, `flutter_lints`, assets/fonts.
- `flutter-architecture` — official MVVM-layered guidance (UI = Views + ViewModels; data =
  Repositories + Services; optional domain Use-Cases). Carries the **spine invariant**.
  State management presented **neutrally**. `lib/` structure per the official guide.
- `flutter-material3` — M3 default (do NOT set `useMaterial3`; version-gate), `ColorScheme.fromSeed`,
  `theme`/`darkTheme`/`themeMode`, `colorScheme` roles (no hard-coded hex), M3 components
  (`NavigationBar`/`FilledButton`/…), `dynamic_color`.
- `flutter-routing` — GoRouter: `MaterialApp.router` + `GoRouter`/`GoRoute`, path/query params,
  `ShellRoute`/`StatefulShellRoute`, `redirect` guards + `refreshListenable`, `context.go` vs
  `.push`, typed routes via `go_router_builder`, deep linking. Pin `go_router` (17.x) + verify.
- `flutter-testing` — unit/widget/golden/integration tests (`testWidgets`, `WidgetTester`,
  `pump`/`pumpAndSettle`, finders incl. `find.bySemanticsLabel`, `matchesGoldenFile`,
  `integration_test`), mocking (`mockito`/`mocktail`, `thenAnswer` for async), the `checks`
  package as emerging, and the shared behavioral-assertion philosophy (test observable behavior,
  don't over-mock — mock only external Service/Repository boundaries) consistent with
  `nestjs-testing`/`angular-testing`.

### No swappable UI layer (explicit)

Unlike the Angular increment (PrimeNG as a swappable `angular-ui-*` plugin), Flutter's Material 3
is part of the SDK. `flutter-material3` lives inside `flutter-paved-path`; there is no separate
UI-library plugin. The manifest records this as "N/A — Material 3 in-SDK".

### Manifest wiring (edit to Stage A shipped files)

Update `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md` and the repo README's
copy so the `mobile (Flutter)` row's Paved-path skills read the Flutter skill ids and Library reads
"— (Material 3, in-SDK)". Add a note that `dart-paved-path` is the Dart language layer for Flutter
(parallel to `typescript-expert` for TS surfaces). Keep resolution rules unchanged.

## Content sourcing & fidelity

- **Vendored (BSD-3, verbatim bodies):** curated `dart-*` from `dart-lang/skills` and curated
  `flutter-*` from `flutter/agent-plugins` `skills/`. Preserve each repo's `LICENSE` + attribution
  (a `LICENSE` file per vendored subtree, retained frontmatter, README credit). Add a `HOUSE-NOTES.md`
  per plugin for the MCP→CLI fallback + Gemini-metadata provenance. Permitted minimal edit: strip a
  `metadata.model` frontmatter key only if it breaks `claude plugin validate`.
- **Authored:** the five conceptual Flutter skills, from `docs.flutter.dev`/`dart.dev` (per the research
  digest), each with rules-to-follow, review-red-flags, sources, and version-gated (`[vNN]`/⚠️) markers.
- Skills stay small (progressive disclosure); vendored skills already are.
- Hedge verify-before-ship items: Material 2 removal / `useMaterial3` obsolescence timing, `go_router`
  major API, `checks` pre-stability — version-gate rather than assert.

## Acceptance criteria (EARS)

- **AC-1** (Ubiquitous) — The marketplace SHALL contain two new plugins, `dart-paved-path` and
  `flutter-paved-path`, each registered in `marketplace.json` (category, keywords, description) with a
  valid `plugin.json` (name, SemVer version, description, author, license, keywords), `README.md`, `CHANGELOG.md`.
- **AC-2** (Ubiquitous) — Dependency edges SHALL be declared: `flutter-paved-path` depends on
  `engineering-foundations` and `dart-paved-path`; `dart-paved-path` has no dependencies.
- **AC-3** (Ubiquitous) — `dart-paved-path` SHALL contain the seven vendored `dart-*` skills listed in
  Architecture; `flutter-paved-path` SHALL contain the five authored skills + the four vendored
  `flutter-*` skills listed in Architecture.
- **AC-4** (Ubiquitous) — Vendored content SHALL preserve its BSD-3-Clause license + attribution: a
  `LICENSE` file per vendored subtree (Dart project authors 2012 for dart; The Flutter Authors 2026 for
  flutter), retained frontmatter, and a README credit; a `HOUSE-NOTES.md` SHALL document the MCP→CLI
  fallback and the Gemini-metadata provenance. Vendored bodies SHALL NOT be rewritten (only a
  `metadata.model` key may be stripped if it breaks validation).
- **AC-5** (Ubiquitous) — Each authored Flutter skill SHALL include a rules-to-follow section, a
  review-red-flags section, a sources section with ≥1 authoritative URL (docs.flutter.dev / dart.dev),
  and explicitly marked version-gated rules.
- **AC-6** (Ubiquitous) — `flutter-architecture` SHALL state the spine invariant (UI never reaches data
  sources directly; `View → ViewModel → Repository → Service`) and SHALL present state management
  neutrally without mandating a specific library.
- **AC-7** (Ubiquitous) — `flutter-material3` SHALL cover `ColorScheme.fromSeed`, `theme`/`darkTheme`/
  `themeMode`, consuming `colorScheme` roles (no hard-coded hex), and M3 components; and SHALL treat
  `useMaterial3` as version-gated/obsolete (do not toggle on current SDKs).
- **AC-8** (Ubiquitous) — `flutter-routing` SHALL cover GoRouter config, params, `ShellRoute`/
  `StatefulShellRoute`, central `redirect` guards, `context.go`/`.push`, typed routes, deep linking, and
  SHALL pin/version-gate `go_router`.
- **AC-9** (Ubiquitous) — `flutter-testing` SHALL cover widget tests (`testWidgets`/`WidgetTester`/
  `pump`/`pumpAndSettle`/finders), golden tests, `integration_test`, mocking (async via `thenAnswer`),
  and the behavioral-assertion philosophy (mock only external boundaries), consistent with
  `nestjs-testing`/`angular-testing`.
- **AC-10** (Unwanted behavior) — IF a skill states a verify-before-ship fact (M2 removal / `useMaterial3`
  status, `go_router` API, `checks` stability), THEN it SHALL present it as version-gated / verify, not
  an unconditional assertion.
- **AC-11** (Ubiquitous) — The shipped Stack Manifest template and the repo README's copy SHALL list the
  Flutter paved-path skills, `dart-paved-path` as the language layer, and record UI library as
  "N/A — Material 3 in-SDK".
- **AC-12** (Ubiquitous) — All shipped paths SHALL use `${CLAUDE_PLUGIN_ROOT}` and contain no `../`
  (outside vendored prose/code examples); `.claude-plugin/` holds only `plugin.json`; components at plugin
  root; `version` only in `plugin.json`; `category` only in the marketplace entry.
- **AC-13** (Event-driven) — WHEN `claude plugin validate .` runs it SHALL pass; WHEN
  `node scripts/build-site.mjs` runs the quality gate SHALL pass.
- **AC-14** (Ubiquitous) — All repository content SHALL be English.

## Edge cases

- A Flutter project without `dart-paved-path` installed: the manifest names it, but the "uninstalled
  plugin is not an error" rule (Stage A) applies; `flutter-paved-path` still stands.
- Vendored skills referencing MCP tools with no MCP server present: the HOUSE-NOTES CLI fallback applies.
- SDK/version drift (Material 2 removal timing, go_router major): version-gated rules + verify hedges.
- Vendored prose/code examples may contain `../` (import paths) — acceptable-verbatim, not a path defect.

## Non-functional

- Keep authored `SKILL.md` files small (progressive disclosure).
- Plugins remain generic.
- Preserve upstream BSD-3 license obligations (attribution) — a compliance requirement.

## Dependencies & impacts

- Touches `.claude-plugin/marketplace.json` (two new entries + version bump 0.4.0 → 0.5.0), the repo
  `README.md`, and the shipped `stack-manifest.md`. Adds two plugin trees. No change to Stage A/NestJS/Angular.

## Traceability table

| AC | Component |
|----|-----------|
| AC-1, AC-2, AC-12 | marketplace.json + both plugin manifests |
| AC-3 | plugin skill inventories |
| AC-4 | vendored dart/flutter skills + LICENSE/attribution + HOUSE-NOTES |
| AC-5, AC-10 | authored Flutter skills |
| AC-6 | flutter-architecture |
| AC-7 | flutter-material3 |
| AC-8 | flutter-routing |
| AC-9 | flutter-testing |
| AC-11 | stack-manifest.md + README |
| AC-13 | packaging + validation + build-site gate |
| AC-14 | all files |

## Source material

- Vendor: `raw.githubusercontent.com/dart-lang/skills/main/{LICENSE,skills/dart-*/SKILL.md}` (BSD-3, Dart authors 2012);
  `raw.githubusercontent.com/flutter/agent-plugins/main/{LICENSE,skills/flutter-*/SKILL.md}` (BSD-3, The Flutter Authors 2026).
- Author: `docs.flutter.dev` (perf/best-practices, app-architecture, ui/navigation, ui/design/material,
  testing/*), `dart.dev/effective-dart`, `pub.dev/packages/{go_router,go_router_builder,mockito,mocktail,checks,dynamic_color}`.
- Research digest (session): `scratchpad/flutter-dart-digest.md` — per-skill rules + red-flags + version gates.

## `[NEEDS CLARIFICATION]`

None outstanding.
