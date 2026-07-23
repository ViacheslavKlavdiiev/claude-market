---
name: angular-ui-primeng
description: Use when building Angular UI with PrimeNG — install, token theming, standalone imports, Tailwind interop, tables/dialogs/forms, services. Swappable UI-library skill.
---

# Angular UI — PrimeNG

## UI-swap spine invariant (verbatim — do not paraphrase)

> The paved-path (`angular-paved-path`) contains no UI-library specifics.
> All PrimeNG component names, imports, providers, and theming live only
> in this skill. A project swaps its UI library by replacing this plugin
> (e.g. with `angular-ui-taiga`); the paved-path, forms, routing, and
> testing conventions are unchanged.

PrimeNG ships **no official Claude Code agent-skill** — unlike
`angular-paved-path`, which vendors Google's official `angular-developer`
skill, this skill is authored from primeng.dev's `llms-full.txt` reference
feed and the official `@primeng/mcp` server. Point users at `@primeng/mcp`
for live, version-accurate doc lookups (props/events/templates/theming)
rather than relying solely on this skill's snapshot.

Full rule catalog with rationale and code shape lives in
[references/rules.md](references/rules.md). This file is the summary;
open the reference for the detail behind any rule below.

## Rules to follow

(Full detail, code shape, and rationale for every item: see
[references/rules.md](references/rules.md).)

1. **Install & configure** ⚠️`[v18+]` — `npm install primeng @primeng/themes`;
   configure in `app.config.ts` with `provideAnimationsAsync()` +
   `providePrimeNG({ theme: { preset: Aura } })`.
2. ⚠️`[v18 breaking]` **No pre-v18 CSS/SASS themes.** Never import
   `primeng/resources/...` theme CSS or use `PrimeNGConfig` — both removed.
   Theming is design-token + CSS-variable (`--p-*`) based. Presets:
   Aura / Material / Lara / Nora via `@primeng/themes`.
3. **Standalone imports** — import components individually into a
   standalone component's `imports:` (`import { Button } from
   'primeng/button'`, or a specific `*Module` like `TableModule`) — never
   a global barrel (tree-shaking).
4. **Tailwind interop** — use `tailwindcss-primeui`; enable `cssLayer` and
   order layers so Tailwind utilities win. ⚠️ Tailwind v4: `primeng` layer
   after `theme`+`base`, before `utilities`. Tailwind v3: `primeng` layer
   between base and utilities. Don't mix PrimeFlex with Tailwind.
5. **Style overrides** via `styleClass` + design tokens (`definePreset`,
   `--p-*`, `$dt()`) — never `::ng-deep`. Dark mode via `darkModeSelector`.
6. **Services** — provide `MessageService` (+ render `<p-toast>`),
   `ConfirmationService` (+ `<p-confirmDialog>`), `DialogService` /
   DynamicDialog (`DynamicDialogConfig`/`DynamicDialogRef`) wherever
   injected, and render their host components.
7. **`p-table` server data** — `[lazy]="true"` + `(onLazyLoad)` +
   `[totalRecords]` + `[paginator]`/`[rows]`; `virtualScrollerOptions` for
   large sets. Controls implement `ControlValueAccessor` — bind
   `formControlName` directly.
8. ⚠️`[v18 renames]` Use current component names — `p-select` (was
   `p-dropdown`), `p-datepicker` (was `p-calendar`), `p-toggleSwitch` (was
   `p-inputSwitch`), `p-drawer` (was `p-sidebar`), `p-popover` (was
   `p-overlayPanel`). Flag legacy names as deprecated.
9. ⚠️ **Verify before asserting: `@angular/cdk`.** Don't assume
   `@angular/cdk` ships as a PrimeNG dependency — modern PrimeNG `[v17+]`
   is self-contained. Check the installed `primeng` package's own
   dependencies before relying on CDK primitives being present.
10. ⚠️ **Verify before asserting: licensing.** PrimeNG's current stable is
    **v22**, which may require a license key in config. This has changed
    across majors — check https://primeng.dev/installation and gate any
    licensing rule on the project's installed `primeng` major before
    stating it as fact.
11. Keep ALL PrimeNG specifics in this skill; the paved-path imports none.

## Review red flags

- Pre-v18 CSS theme imports (`primeng/resources/themes/...`) or
  `PrimeNGConfig` usage in a v18+ app.
- Missing `provideAnimationsAsync()` (overlays/toasts silently broken or
  unanimated).
- No `cssLayer`, or wrong layer order — Tailwind utilities losing to
  PrimeNG (specificity fights, `!important` creep).
- `::ng-deep` into PrimeNG internals instead of `styleClass`/design
  tokens; PrimeFlex mixed with Tailwind in the same project.
- Deprecated component names (`p-dropdown`, `p-calendar`, `p-sidebar`,
  `p-overlayPanel`, `p-inputSwitch`) used in new code.
- `p-table` loading all rows client-side when `[lazy]` +
  `(onLazyLoad)` fits the data size; missing `[totalRecords]` alongside a
  lazy paginator.
- `MessageService`/`ConfirmationService`/`DialogService` injected without
  being provided, or without the corresponding host component
  (`<p-toast>`, `<p-confirmDialog>`) rendered.
- Global PrimeNG barrel imports that defeat tree-shaking.
- PrimeNG names, imports, or providers leaking into the paved-path spine —
  breaks the swap invariant.
- Hardcoding a PrimeNG major in guidance or install commands that differs
  from the project's actual pinned version.

## Swapping to another UI library

Because the paved-path spine holds zero UI-library imports, swapping UI
libraries means replacing only this plugin — nothing in
`angular-paved-path` (or forms/routing/testing conventions) changes. For
example, **Taiga UI** is a documented swap alternative
(https://taiga-ui.dev/ai-support): its providers (`NG_EVENT_PLUGINS`/
`provideTaiga`), theming (CSS-variable `--tui-*`, no design-token layer of
this shape), and services (`TuiAlertService`/`TuiDialogService` in place of
`MessageService`/`DialogService`) live in the sibling **`angular-ui-taiga`**
plugin, installed instead of this one, alongside the same
`angular-paved-path`.

## Sources

- https://primeng.dev/installation
- https://primeng.dev/theming
- https://primeng.dev/tailwind
- https://primeng.dev/table
- https://primeng.dev/dynamicdialog
- https://primeng.dev/toast
- Reference feed: https://primeng.dev/llms (primeng.org 301-redirects here)
- Official MCP server: `@primeng/mcp` (https://primeng.dev/mcp)
- Swap alternative: Taiga UI — https://taiga-ui.dev/ai-support
