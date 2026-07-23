# angular-ui-taiga — design

**Status:** approved (brainstorming) — pending implementation plan
**Date:** 2026-07-23
**Related:** `docs/superpowers/specs/2026-07-23-sdd-stage-b-angular-design.md`
(Stage B increment 2, which shipped `angular-paved-path` + `angular-ui-primeng`)

## Purpose

Ship `angular-ui-taiga`: a second **swappable per-project Angular UI-library
plugin**, sibling to `angular-ui-primeng`. An Angular project installs exactly
one UI-library plugin alongside `angular-paved-path`; this one covers projects
that use [Taiga UI](https://taiga-ui.dev).

Shipping a second UI library is the point: it **validates the UI-swap spine
invariant against a genuinely different library**. Taiga differs from PrimeNG in
ways that exercise the invariant — CSS-variable theming (no design-token preset
layer), a required `@angular/cdk` peer (PrimeNG is CDK-free), a `<tui-root>`
host wrapper, and a distinct provider/service model (`NG_EVENT_PLUGINS` +
`provideAnimations()`; `TuiAlertService`/`TuiDialogService`). If the paved-path
spine truly holds zero UI specifics, swapping PrimeNG ↔ Taiga touches only the
UI plugin.

## Version reality (verified 2026-07)

- **Taiga UI v5** is current (v5.16.0). All version-specific guidance is flagged
  `[v5]` and gated on the project's installed `@taiga-ui/*` major.
- Install: `ng add taiga-ui` (Nx: `npm i taiga-ui` then `nx g taiga-ui:ng-add`).
  **`@angular/cdk` is a required peer** and should be installed first to avoid
  dependency conflicts — the explicit opposite of PrimeNG, and a `⚠️ verify`
  item.
- **No official Claude-Code agent-skill exists to vendor** (same as PrimeNG).
  This skill is **authored from docs**: taiga-ui.dev, the official
  `llms.txt` / `llms-full.txt` feed, and the official MCP server.
- Taiga positions its **MCP server (`@taiga-ui/mcp`) as the recommended path**
  for AI assistants to get version-accurate docs
  (`npx @taiga-ui/mcp@latest --source-url=https://taiga-ui.dev/llms-full.txt`).
  This skill features it prominently as the live-lookup path — **mention only**,
  no config/execution (the plugin stays documentation-only).

## Plugin structure

Mirrors `angular-ui-primeng` exactly (repo conventions: components at plugin
ROOT, only `plugin.json` inside `.claude-plugin/`; README + CHANGELOG; version
only in `plugin.json`; category only in the marketplace entry; no `../` paths).

```
plugins/angular-ui-taiga/
  .claude-plugin/plugin.json      # version 0.1.0; dependencies: angular-paved-path@^0.1.0
  README.md
  CHANGELOG.md
  skills/angular-ui-taiga/
    SKILL.md                      # summary: rules + review red flags + swap note + sources
    references/rules.md           # full catalog: code shape + rationale, progressive disclosure
```

## Skill content outline

SKILL.md is the summary (rules as one-liners pointing into the reference);
`references/rules.md` carries the detail, code shape, and rationale.

1. **Install & configure `[v5]`** — `ng add taiga-ui`; `@angular/cdk` required
   peer (⚠️ verify — contrast PrimeNG's self-contained model); `app.config.ts`
   with `NG_EVENT_PLUGINS` (via `provideEventPlugins()`) + `provideAnimations()`.
2. **`<tui-root>` host** — wraps the app; required for dialogs, alerts, portals,
   hints, and dropdowns. Omitting it makes those features silent no-ops
   (analogous to PrimeNG's rule of rendering `<p-toast>`/`<p-confirmDialog>`).
3. **Standalone imports** — import individual `Tui*` components/directives into a
   standalone component's `imports:`; `@taiga-ui/*` scoped packages
   (`core`, `kit`, `cdk`, `layout`, `icons`, `addon-*`, `legacy`) — no barrel,
   for tree-shaking.
4. **Theming — CSS variables `[v5]`** — import `@taiga-ui/core/styles`;
   customize via `--tui-*` CSS custom properties; light/dark via the documented
   theme mechanism. Explicitly a **different shape** from PrimeNG's
   `definePreset`/design-token theming — the paved-path must know neither.
5. **Services** — `TuiAlertService` (notifications, in place of `MessageService`)
   and `TuiDialogService` (component/template dialogs with `TuiDialogContext`,
   in place of `DialogService`/`ConfirmationService`). Both depend on `<tui-root>`
   being present.
6. **Forms & data** — Taiga form controls implement `ControlValueAccessor`, so
   `formControlName`/`[(ngModel)]` bind directly (no adapter). Tabular/data
   patterns via `@taiga-ui/addon-table`.
7. **⚠️ Verify-before-asserting** — installed Taiga major (v5 now), the
   `@angular/cdk` peer requirement, and package split/renames across majors.
   Point users at `@taiga-ui/mcp` for live, version-accurate lookups.
8. **Swap invariant (verbatim block)** — same wording pattern as the PrimeNG
   skill, reversed: every `Tui*` name, `@taiga-ui/*` import, provider, service,
   and theming concept lives only in this skill; swapping back to PrimeNG (or any
   other library) replaces only this plugin — `angular-paved-path` and the
   forms/routing/testing conventions are unchanged.
9. **Review red flags** — missing `<tui-root>`; missing/uninstalled
   `@angular/cdk`; `::ng-deep` into Taiga internals instead of CSS-variable
   overrides; barrel imports defeating tree-shaking; `TuiAlertService`/
   `TuiDialogService` used without `<tui-root>`; Taiga specifics leaking into the
   paved-path spine; hardcoding a Taiga major that differs from the project's
   pinned version.
10. **Sources** — taiga-ui.dev getting-started/setup/theming/dialogs/alerts,
    the `llms.txt`/`llms-full.txt` feed, the `@taiga-ui/mcp` server, and the
    AI-support page (`https://taiga-ui.dev/ai-support`).

## Repo wiring (this increment)

- Add the marketplace entry to `.claude-plugin/marketplace.json`
  (category `development`; keywords `angular`, `taiga`, `ui`, `components`).
- Bump marketplace `metadata.version` **0.5.0 → 0.6.0**.
- Update `angular-ui-primeng` (SKILL.md + README.md) so its swap notes describe
  `angular-ui-taiga` as a **real shipped sibling** rather than "hypothetical."
- Update the `claude-market-sdd-port` memory to record this increment.

## Quality gate

`claude plugin validate .` and `node scripts/build-site.mjs` must both pass:
English-only content, every component has a description, versions present, no
duplicate component ids.

## Out of scope (YAGNI)

- No vendored upstream skill (none exists for Taiga).
- No MCP server configuration or execution — the plugin is documentation-only
  and only *mentions* `@taiga-ui/mcp`.
- No new agents or commands.
- No changes to `angular-paved-path` content (only the PrimeNG cross-reference
  and the new plugin are touched); if any paved-path text turns out to name a UI
  library, that is a bug to note, not to fix in this increment.
