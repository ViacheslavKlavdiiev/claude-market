# angular-paved-path

Angular web engineering skills: the official Angular developer skill
(vendored) plus house testing conventions.

## Overview

This plugin fills in the Angular web surface of the stack-agnostic SDD
(spec-driven development) workflow, the same way `nestjs-paved-path` fills
in the NestJS backend surface. It builds on top of the stack-neutral
`engineering-foundations` (clean architecture, security) and
`typescript-paved-path` (TypeScript expertise) plugins.

The paved path is **UI-library-agnostic** — it makes no assumption about
Material, PrimeNG, or any other component kit. A swappable UI layer is meant
to live in a separate `angular-ui-primeng` plugin that pairs with this one.

## Attribution

`angular-developer` and `angular-new-app` are **vendored verbatim** from the
official, MIT-licensed Angular team skill repository,
[`github.com/angular/skills`](https://github.com/angular/skills)
(**Copyright 2026 Google LLC**). The prose in `SKILL.md` and every file
under `skills/angular-developer/references/` is Google's original content,
unmodified. The full MIT license text and copyright notice are included at
`skills/angular-developer/LICENSE`; see also
[`skills/angular-developer/HOUSE-NOTES.md`](skills/angular-developer/HOUSE-NOTES.md)
for provenance and re-vendoring notes.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `angular-developer` | skill | Vendored (verbatim, MIT, Copyright 2026 Google LLC). Architectural guidance and code-generation rules for Angular: signals-based reactivity (`signal`, `computed`, `linkedSignal`, `resource`, `effect`), inputs/outputs, dependency injection, routing, forms (signal forms, template-driven, reactive), styling and animations, Angular Aria accessible components, testing, and CLI tooling. Backed by 38 reference files. |
| `angular-new-app` | skill | Vendored (verbatim, MIT, Copyright 2026 Google LLC). Guidance for scaffolding a new Angular application with the Angular CLI, including `--ai-config`, common flags, and Tailwind setup. |

A house `angular-testing` skill (Angular-specific testing conventions
layered on top of the vendored `testing-fundamentals.md`/`e2e-testing.md`
references) is planned to ship in this same plugin's `0.1.0` release, added
alongside the plugin's marketplace registration.

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install angular-paved-path@claude-market
```

## Dependencies

- `engineering-foundations@^0.1.0` — supplies `clean-architecture` and
  `security`, the stack-neutral foundations this plugin's Angular-specific
  guidance builds on top of.
- `typescript-paved-path@^0.1.0` — supplies `typescript-expert`, the
  stack-neutral TypeScript skill Angular development relies on.

Install both dependency plugins alongside this one.

## What it executes

Documentation-only content (prompts). No hooks, no MCP servers, no bundled
scripts, and no network access are shipped by this plugin itself (the
vendored skill's own guidance may direct an agent to run `ng`/`npx`/`npm`
commands locally, per its documented CLI workflow).

## Versioning

SemVer per marketplace conventions; release notes in
[CHANGELOG.md](CHANGELOG.md). The vendored skill content is updated by
re-vendoring from `github.com/angular/skills`, tracked as a version bump in
this plugin's changelog.
