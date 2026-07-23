# angular-ui-primeng

PrimeNG UI library guidance for Angular: install & config, design-token
theming, standalone imports, Tailwind interop, tables/dialogs/forms, and
the core services (`MessageService`, `ConfirmationService`,
`DialogService`).

## Overview

This is a **swappable per-project UI library** plugin. An Angular project
installs exactly one UI-library plugin alongside `angular-paved-path` —
this one, if it uses PrimeNG. PrimeNG guidance targets its current
token-based theming system, introduced in **v18** and unchanged in
principle through the current stable **v22**.

> The paved-path (`angular-paved-path`) contains no UI-library specifics.
> All PrimeNG component names, imports, providers, and theming live only
> in this skill. A project swaps its UI library by replacing this plugin
> (e.g. with `angular-ui-taiga`); the paved-path, forms, routing, and
> testing conventions are unchanged.

**No official PrimeNG agent-skill exists** to vendor (unlike
`angular-paved-path`, which vendors Google's official `angular-developer`
skill). This skill is authored from PrimeNG's own AI-oriented references —
`llms.txt`/`llms-full.txt` at https://primeng.org/llms and the official
`@primeng/mcp` server — and points users at `@primeng/mcp` for live,
version-accurate doc lookups beyond this skill's snapshot.

### Swap to another UI library

Because the paved-path spine holds zero UI-library imports, swapping
libraries means installing a different sibling plugin instead of this
one — nothing else changes. **Taiga UI** is a documented swap alternative
(https://taiga-ui.dev/ai-support): a hypothetical `angular-ui-taiga`
plugin would carry Taiga's install/provider/theming/component-catalog
sections in place of this skill's PrimeNG content, while
`angular-paved-path` and the forms/routing/testing conventions stay
identical.

## What's inside

| Component | Type | Description |
| --------- | ---- | ----------- |
| `angular-ui-primeng` | skill | Install & `app.config.ts` setup, v18 theming migration, standalone tree-shaken imports, Tailwind interop (`tailwindcss-primeui` + `cssLayer` ordering), design-token overrides, `MessageService`/`ConfirmationService`/`DialogService`, `p-table` server-side data + virtual scroll, v18 component renames, and review red flags. Full rule catalog in `references/rules.md`. |

## Dependencies

- `angular-paved-path@^0.1.0` — supplies the Angular conventions (signals,
  standalone components, forms, routing, testing) this skill's PrimeNG
  guidance builds on top of. Install `angular-paved-path` alongside this
  plugin.

## Installation

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install angular-ui-primeng@claude-market
```

## What it executes

Documentation-only content (prompts). No hooks, no MCP servers, no
external binaries, no network access. (The skill *mentions* the external
`@primeng/mcp` server as a live-lookup resource but does not configure or
run it.)

## Versioning

SemVer per marketplace conventions; release notes in
[CHANGELOG.md](CHANGELOG.md).
