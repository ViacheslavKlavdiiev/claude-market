# dart-paved-path

Shared Dart language layer: 7 official Dart skills vendored verbatim,
parallel to `typescript-paved-path` for the TypeScript stacks.

## Overview

This plugin fills in the Dart language surface of the stack-agnostic SDD
(spec-driven development) workflow. It is stack-neutral Dart expertise
that `flutter-paved-path` (the Flutter mobile surface) depends on, the
same way `nestjs-paved-path` depends on `typescript-paved-path`.

## Attribution

All 7 skills below are **vendored verbatim** from the official, BSD-3
licensed Dart team skill repository,
[`github.com/dart-lang/skills`](https://github.com/dart-lang/skills)
(**Copyright 2012, the Dart project authors**). The `SKILL.md` prose in
each `skills/dart-*/` directory is the Dart project's original content,
unmodified. The full BSD-3 license text and copyright notice are included
at [`LICENSE`](LICENSE); see also [`HOUSE-NOTES.md`](HOUSE-NOTES.md) for
provenance and re-vendoring notes.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `dart-add-unit-test` | skill | Vendored (verbatim, BSD-3). Write and organize unit tests for functions, methods, and classes using `package:test`. |
| `dart-run-static-analysis` | skill | Vendored (verbatim, BSD-3). Run `dart analyze` to find warnings/errors and `dart fix --apply` to auto-resolve mechanical lint issues. |
| `dart-generate-test-mocks` | skill | Vendored (verbatim, BSD-3). Define and generate mock objects for external dependencies using `package:mockito` and `build_runner`. |
| `dart-use-pattern-matching` | skill | Vendored (verbatim, BSD-3). Use switch expressions and pattern matching where appropriate. |
| `dart-resolve-package-conflicts` | skill | Vendored (verbatim, BSD-3). Workflow for fixing package version conflicts when `pub get` fails. |
| `dart-collect-coverage` | skill | Vendored (verbatim, BSD-3). Collect coverage using `package:coverage` and produce an LCOV report. |
| `dart-use-primary-constructors` | skill | Vendored (verbatim, BSD-3). Write and migrate to Dart's primary constructor syntax (empty-body semicolon, in-body initializer list, abbreviated concise forms). |

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install dart-paved-path@claude-market
```

No dependencies — the plugin is self-contained.

## MCP → CLI fallback

Some vendored skills reference the Dart MCP server. If it isn't
available, use the equivalent Dart CLI commands (`dart analyze`,
`dart test`, `dart pub get`, `dart fix --apply`,
`dart run build_runner build`) — see [`HOUSE-NOTES.md`](HOUSE-NOTES.md).

## What it executes

Documentation-only content (prompts). No hooks, no MCP servers, and no
bundled scripts are shipped by this plugin itself (the vendored skills'
own guidance may direct an agent to run `dart`/`pub` commands locally,
per their documented CLI workflow).

## Versioning

SemVer per marketplace conventions; release notes in
[CHANGELOG.md](CHANGELOG.md). The vendored skill content is updated by
re-vendoring from `github.com/dart-lang/skills`, tracked as a version
bump in this plugin's changelog.
