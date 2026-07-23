# angular-ui-taiga

Taiga UI library guidance for Angular: install & config, `<tui-root>` host,
CSS-variable (`--tui-*`) theming, standalone tree-shaken imports,
`TuiAlertService`/`TuiDialogService`, forms, and data/tables.

## Overview

This is a **swappable per-project UI library** plugin. An Angular project
installs exactly one UI-library plugin alongside `angular-paved-path` — this
one, if it uses Taiga UI. Guidance targets Taiga UI's current major, **v5**.

> The paved-path (`angular-paved-path`) contains no UI-library specifics.
> All Taiga UI component names, imports, providers, and theming live only
> in this skill. A project swaps its UI library by replacing this plugin
> (e.g. with `angular-ui-primeng`); the paved-path, forms, routing, and
> testing conventions are unchanged.

**No official Taiga UI agent-skill exists** to vendor (unlike
`angular-paved-path`, which vendors Google's official `angular-developer`
skill). This skill is authored from Taiga's own AI-oriented references —
`llms.txt`/`llms-full.txt` (https://taiga-ui.dev/llms.txt), the AI-support
page (https://taiga-ui.dev/ai-support), and the official `@taiga-ui/mcp`
server — which Taiga positions as the **recommended** live-lookup path for AI
assistants. Point users at `@taiga-ui/mcp` for version-accurate docs beyond
this skill's snapshot.

### Swap to another UI library

Because the paved-path spine holds zero UI-library imports, swapping libraries
means installing a different sibling plugin instead of this one — nothing else
changes. **PrimeNG** is the documented swap alternative
(https://primeng.dev): the sibling `angular-ui-primeng` plugin carries
PrimeNG's install/provider/theming/component-catalog sections in place of this
skill's Taiga content, while `angular-paved-path` and the forms/routing/
testing conventions stay identical.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `angular-ui-taiga` | skill | Install & `app.config.ts` setup (`@angular/cdk` peer, `NG_EVENT_PLUGINS`/`provideTaiga`), `<tui-root>` host, CSS-variable (`--tui-*`) theming with `@taiga-ui/styles`, standalone tree-shaken imports, `TuiAlertService`/`TuiDialogService`, `ControlValueAccessor` forms, `@taiga-ui/addon-table`, verify-before-asserting items, and review red flags. Full rule catalog in `references/rules.md`. |

## Dependencies

- `angular-paved-path@^0.1.0` — supplies the Angular conventions (signals,
  standalone components, forms, routing, testing) this skill's Taiga guidance
  builds on top of. Install `angular-paved-path` alongside this plugin.

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install angular-ui-taiga@claude-market
```

## What it executes

Documentation-only content (prompts). No hooks, no MCP servers, no external
binaries, no network access. (The skill *mentions* the external
`@taiga-ui/mcp` server as a live-lookup resource but does not configure or
run it.)

## Versioning

SemVer per marketplace conventions; release notes in
[CHANGELOG.md](CHANGELOG.md).
