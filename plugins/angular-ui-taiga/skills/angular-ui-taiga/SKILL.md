---
name: angular-ui-taiga
description: Use when building Angular UI with Taiga UI — install, tui-root host, CSS-variable theming, standalone imports, alerts/dialogs, forms. Swappable UI-library skill.
---

# Angular UI — Taiga UI

## UI-swap spine invariant (verbatim — do not paraphrase)

> The paved-path (`angular-paved-path`) contains no UI-library specifics.
> All Taiga UI component names, imports, providers, and theming live only
> in this skill. A project swaps its UI library by replacing this plugin
> (e.g. with `angular-ui-primeng`); the paved-path, forms, routing, and
> testing conventions are unchanged.

Taiga UI ships **no official Claude Code agent-skill** — unlike
`angular-paved-path`, which vendors Google's official `angular-developer`
skill, this skill is authored from taiga-ui.dev, the official `llms.txt`/
`llms-full.txt` feed, and the official `@taiga-ui/mcp` server. Taiga
positions the MCP server as the **recommended** way for AI assistants to get
version-accurate docs — point users at `@taiga-ui/mcp`
(`npx @taiga-ui/mcp@latest --source-url=https://taiga-ui.dev/llms-full.txt`)
for live lookups (components, examples, migration) rather than relying solely
on this skill's snapshot.

Full rule catalog with rationale and code shape lives in
[references/rules.md](references/rules.md). This file is the summary; open
the reference for the detail behind any rule below.

## Rules to follow

(Full detail, code shape, and rationale for every item: see
[references/rules.md](references/rules.md).)

1. **Install & configure** `[v5]` — `ng add taiga-ui`; ⚠️ `@angular/cdk` is a
   **required peer** (opposite of PrimeNG — install it first). Providers:
   `provideAnimations()` + `NG_EVENT_PLUGINS` (from `@taiga-ui/event-plugins`)
   — ⚠️ or the v5 convenience `provideTaiga()`; verify the form against the
   installed major.
2. **`<tui-root>` host** — wrap the root template in `<tui-root>` (`TuiRoot`
   from `@taiga-ui/core`); it hosts the portal layer for dialogs/alerts/
   dropdowns/hints. Omit it → those features are silent no-ops.
3. **Standalone imports** — import individual `Tui*` components/directives
   from the specific `@taiga-ui/*` entry point; never a barrel (tree-shaking).
   Many are directives on native elements (`tuiButton`, `tuiTextfield`), not
   custom tags.
4. **Theming — CSS variables** `[v5]` — `--tui-*` custom properties; add
   `@taiga-ui/styles/*.less` to `angular.json`. **No `definePreset`-style
   token object** (that is PrimeNG). Never `::ng-deep`; override via `--tui-*`.
5. **Services** — `TuiAlertService` (notifications; ⚠️ vs
   `TuiNotificationService` — verify) and `TuiDialogService` (component/
   template dialogs, `TuiDialogContext`). Both need `<tui-root>`.
6. **Forms & data** — controls implement `ControlValueAccessor` (bind
   `formControlName` directly); tables via `@taiga-ui/addon-table`.
7. ⚠️ **Verify before asserting** — installed Taiga major (v5 now), the
   `@angular/cdk` peer, the provider form, the alert-service name, and exact
   style/selector identifiers. Prefer `@taiga-ui/mcp` for live confirmation.
8. Keep ALL Taiga specifics in this skill; the paved-path imports none.

## Review red flags

- Missing `<tui-root>` — alerts/dialogs/dropdowns silently do nothing.
- `@angular/cdk` not installed while Taiga is (peer-dependency breakage).
- `::ng-deep` into Taiga internals instead of overriding `--tui-*` variables
  and documented theming hooks.
- Barrel imports of `@taiga-ui/*` that defeat tree-shaking.
- `TuiAlertService`/`TuiDialogService` injected but `<tui-root>` absent.
- A design-token/`definePreset`-style theming layer assumed (that is PrimeNG,
  not Taiga).
- Taiga names, imports, providers, `<tui-root>`, or `--tui-*` leaking into the
  paved-path spine — breaks the swap invariant.
- Hardcoding a Taiga major (or a provider/service/style identifier from one
  major) that differs from the project's actual pinned version.

## Swapping to another UI library

Because the paved-path spine holds zero UI-library imports, swapping UI
libraries means replacing only this plugin — nothing in `angular-paved-path`
(or forms/routing/testing conventions) changes. **PrimeNG** is the documented
swap alternative (https://primeng.dev): its providers (`providePrimeNG`),
theming (design-token/`--p-*` presets), and services (`MessageService`/
`DialogService` in place of `TuiAlertService`/`TuiDialogService`) live in the
sibling `angular-ui-primeng` plugin, installed instead of this one, alongside
the same `angular-paved-path`.

## Sources

- https://taiga-ui.dev/getting-started
- https://taiga-ui.dev/ai-support
- Reference feed: https://taiga-ui.dev/llms.txt , https://taiga-ui.dev/llms-full.txt
- Official MCP server: `@taiga-ui/mcp` — https://github.com/taiga-family/taiga-ui-mcp
- Swap alternative: PrimeNG — https://primeng.dev
