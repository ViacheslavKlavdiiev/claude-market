# flutter-paved-path

Flutter mobile surface of the stack-agnostic SDD (spec-driven development)
workflow: five house-authored conceptual skills plus four official Flutter
task skills vendored verbatim.

## Overview

This plugin fills in the Flutter mobile layer, depending on the
stack-neutral `dart-paved-path` (Dart language skills) the same way
`nestjs-paved-path` depends on `typescript-paved-path`. There is no
swappable UI-library skill here — Material 3 ships in the Flutter SDK
itself, so it is covered directly rather than pulled in as a dependency.

## What's inside

### Authored conceptual skills (house-authored from docs.flutter.dev)

| Component | Type | Description |
| --------- | ---- | ----------- |
| `flutter-best-practices` | skill | Authored. Flutter engineering conventions and idioms. |
| `flutter-architecture` | skill | Authored. Recommended app architecture and layering. |
| `flutter-material3` | skill | Authored. Building UI with Material 3, in-SDK (no external UI library). |
| `flutter-routing` | skill | Authored. Declarative routing with GoRouter. |
| `flutter-testing` | skill | Authored. Widget, unit, and integration testing strategy. |

All five ship in this release, alongside the four vendored task skills
below.

### Vendored task skills (verbatim, BSD-3)

| Component | Type | Description |
| --------- | ---- | ----------- |
| `flutter-build-responsive-layout` | skill | Vendored (verbatim, BSD-3). Use `LayoutBuilder`, `MediaQuery`, or `Expanded`/`Flexible` to create a layout that adapts to different screen sizes. |
| `flutter-implement-json-serialization` | skill | Vendored (verbatim, BSD-3). Create model classes with `fromJson`/`toJson` methods using `dart:convert`. |
| `flutter-setup-localization` | skill | Vendored (verbatim, BSD-3). Add `flutter_localizations`/`intl`, enable code generation, and create `l10n.yaml`. |
| `flutter-use-http-package` | skill | Vendored (verbatim, BSD-3). Use the `http` package for GET/POST/PUT/DELETE requests against a REST API. |

Four overlapping upstream skills were intentionally **not** vendored —
`flutter-setup-declarative-routing`, `flutter-add-widget-test`,
`flutter-add-integration-test`, and
`flutter-apply-architecture-best-practices` — because the house-authored
`flutter-routing`, `flutter-testing`, and `flutter-architecture` skills
cover that same ground. See [`HOUSE-NOTES.md`](HOUSE-NOTES.md).

## Attribution

The 4 skills listed above under "Vendored task skills" are **vendored
verbatim** from the official, BSD-3 licensed Flutter agent-plugins
repository, [`github.com/flutter/agent-plugins`](https://github.com/flutter/agent-plugins)
(**Copyright 2026 The Flutter Authors**). The `SKILL.md` prose in each
`skills/flutter-*/` directory is the Flutter project's original content,
unmodified. The full BSD-3 license text and copyright notice are included
at [`LICENSE`](LICENSE); see also [`HOUSE-NOTES.md`](HOUSE-NOTES.md) for
provenance and re-vendoring notes.

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install flutter-paved-path@claude-market
```

## Dependencies

This plugin declares a dependency on `engineering-foundations@^0.1.0` and
`dart-paved-path@^0.1.0`. Install both first (or let your marketplace
tooling resolve dependencies) — `dart-paved-path` supplies the underlying
Dart language skills (unit tests, static analysis, mocks, pattern
matching, package conflicts) that the Flutter surface builds on.

## MCP → CLI fallback

Some vendored skills reference Flutter/Dart MCP tooling. If it isn't
available, use the equivalent CLI commands (`flutter test`,
`flutter analyze`, `flutter pub get`) — see
[`HOUSE-NOTES.md`](HOUSE-NOTES.md).

## What it executes

Documentation-only content (prompts). No hooks, no MCP servers, and no
bundled scripts are shipped by this plugin itself (the vendored skills'
own guidance may direct an agent to run `flutter`/`dart` commands
locally, per their documented CLI workflow).

## Versioning

SemVer per marketplace conventions; release notes in
[CHANGELOG.md](CHANGELOG.md). The vendored skill content is updated by
re-vendoring from `github.com/flutter/agent-plugins`, tracked as a
version bump in this plugin's changelog.
