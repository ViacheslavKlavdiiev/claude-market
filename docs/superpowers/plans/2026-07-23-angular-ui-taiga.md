# angular-ui-taiga Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `angular-ui-taiga`, a second swappable Angular UI-library plugin (Taiga UI v5), sibling to `angular-ui-primeng`, and wire it into the marketplace.

**Architecture:** Documentation-only plugin. One authored skill (`angular-ui-taiga`) with a summary `SKILL.md` and a full `references/rules.md`, mirroring `angular-ui-primeng` exactly. No upstream agent-skill exists for Taiga, so content is authored from taiga-ui.dev / the official `llms.txt`/`llms-full.txt` feed / the official `@taiga-ui/mcp` server. The MCP server is featured prominently as the recommended live-lookup path (mention-only — the plugin runs nothing). All Taiga specifics stay confined to this plugin so the UI-swap spine invariant holds.

**Tech Stack:** Claude Code plugin (Markdown skill + `plugin.json`); marketplace manifest (`.claude-plugin/marketplace.json`); Node quality gate (`scripts/build-site.mjs`); `claude plugin validate`.

## Global Constraints

- **English-only** for all repository content (specs, plugins, docs).
- **Quality gate must pass**: `claude plugin validate .` AND `node scripts/build-site.mjs` (fails on missing descriptions/versions, duplicate component ids).
- **Plugin layout**: components (`skills/`) live at the plugin ROOT; `.claude-plugin/` holds ONLY `plugin.json`. Each plugin ships `README.md` + `CHANGELOG.md`.
- **`version` lives only in `plugin.json`**; **`category` lives only in the marketplace entry**.
- **Paths**: use `${CLAUDE_PLUGIN_ROOT}` for shipped file refs; never `../` (validator rejects it). Reference the sibling skill file by relative name (`references/rules.md`), matching PrimeNG.
- **Progressive disclosure**: `SKILL.md` is the summary; detail lives in `references/rules.md`.
- **Taiga version reality (verified 2026-07):** current major is **Taiga UI v5** (v5.16.0). `@angular/cdk` is a **required peer**. Flag every version-specific rule `[v5]` and gate it on the project's pinned `@taiga-ui/*` major. Where an exact identifier could drift across majors (e.g. `provideTaiga()` vs `NG_EVENT_PLUGINS` + `provideAnimations()`, `TuiAlertService` vs `TuiNotificationService`, exact `@taiga-ui/styles/*.less` file names), author with the defensive "verify before asserting — confirm via `@taiga-ui/mcp`" framing rather than asserting a single form as settled fact. This mirrors the PrimeNG skill's style.
- **Swap invariant:** no Taiga specifics leak into `angular-paved-path`. Only `angular-ui-primeng` cross-references and the new plugin are touched; `angular-paved-path` content is not modified.
- **Author, don't vendor:** no upstream skill to copy; no `LICENSE` file inside the plugin (unlike the vendored Angular/Dart/Flutter plugins). `plugin.json` carries `"license": "MIT"` like `angular-ui-primeng`.
- **Marketplace version bump:** `metadata.version` `0.5.0` → `0.6.0`.

---

### Task 1: Scaffold plugin + register in marketplace (skeleton, gate-green)

Create the plugin directory with a minimal-but-valid skill, register it, and bump the marketplace version. This task ends with the quality gate passing on a scaffold, before any long-form content is authored.

**Files:**
- Create: `plugins/angular-ui-taiga/.claude-plugin/plugin.json`
- Create: `plugins/angular-ui-taiga/skills/angular-ui-taiga/SKILL.md` (skeleton; fleshed out in Task 3)
- Create: `plugins/angular-ui-taiga/skills/angular-ui-taiga/references/rules.md` (skeleton; fleshed out in Task 2)
- Create: `plugins/angular-ui-taiga/README.md` (skeleton; fleshed out in Task 4)
- Create: `plugins/angular-ui-taiga/CHANGELOG.md` (fleshed out in Task 4)
- Modify: `.claude-plugin/marketplace.json` (add entry; bump version)

**Interfaces:**
- Produces: plugin name `angular-ui-taiga`; skill name `angular-ui-taiga`; marketplace entry keyed by `"name": "angular-ui-taiga"`, `"source": "./angular-ui-taiga"`.

- [ ] **Step 1: Create `plugin.json`**

`plugins/angular-ui-taiga/.claude-plugin/plugin.json`:

```json
{
  "name": "angular-ui-taiga",
  "version": "0.1.0",
  "description": "Taiga UI library guidance for Angular: CSS-variable theming, standalone imports, tui-root host, alerts/dialogs, forms. Swappable UI layer.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["angular", "taiga", "ui", "components", "library", "sdd"],
  "dependencies": ["angular-paved-path@^0.1.0"]
}
```

- [ ] **Step 2: Create a valid skeleton `SKILL.md`**

`plugins/angular-ui-taiga/skills/angular-ui-taiga/SKILL.md` — valid frontmatter + heading so the gate passes; body is filled in Task 3:

```markdown
---
name: angular-ui-taiga
description: Use when building Angular UI with Taiga UI — install, tui-root host, CSS-variable theming, standalone imports, alerts/dialogs, forms. Swappable UI-library skill.
---

# Angular UI — Taiga UI

(Content authored in Task 3.)
```

- [ ] **Step 3: Create a valid skeleton `references/rules.md`**

`plugins/angular-ui-taiga/skills/angular-ui-taiga/references/rules.md`:

```markdown
# Taiga UI — Full Rule Catalog

(Content authored in Task 2.)
```

- [ ] **Step 4: Create skeleton `README.md` and `CHANGELOG.md`**

`plugins/angular-ui-taiga/README.md`:

```markdown
# angular-ui-taiga

Taiga UI library guidance for Angular. (Overview authored in Task 4.)
```

`plugins/angular-ui-taiga/CHANGELOG.md`:

```markdown
# Changelog

## 0.1.0 (2026-07-23)

- Initial release. (Notes authored in Task 4.)
```

- [ ] **Step 5: Register the plugin in the marketplace manifest**

In `.claude-plugin/marketplace.json`, add this entry to the `plugins` array immediately AFTER the `angular-ui-primeng` entry (keep the stack grouped):

```json
    {
      "name": "angular-ui-taiga",
      "source": "./angular-ui-taiga",
      "description": "Taiga UI library guidance for Angular (swappable UI layer, alternative to angular-ui-primeng).",
      "category": "development",
      "keywords": ["angular", "taiga", "ui", "components"],
      "author": { "name": "Viacheslav Klavdiiev" }
    },
```

- [ ] **Step 6: Bump the marketplace version**

In `.claude-plugin/marketplace.json`, change `metadata.version` from `"0.5.0"` to `"0.6.0"`.

- [ ] **Step 7: Run the quality gate**

Run: `claude plugin validate . && node scripts/build-site.mjs`
Expected: both succeed — validation passes; build-site reports no missing descriptions/versions and no duplicate component ids. The new `angular-ui-taiga` plugin appears in the generated catalog.

- [ ] **Step 8: Commit**

```bash
git add plugins/angular-ui-taiga .claude-plugin/marketplace.json
git commit -m "feat(angular-ui-taiga): scaffold plugin + register in marketplace 0.6.0"
```

---

### Task 2: Author `references/rules.md` (full catalog)

Write the full Taiga UI rule catalog — the counterpart to `plugins/angular-ui-primeng/skills/angular-ui-primeng/references/rules.md`. Ground each section against the current source before writing.

**Files:**
- Modify: `plugins/angular-ui-taiga/skills/angular-ui-taiga/references/rules.md` (replace skeleton with full content)

**Interfaces:**
- Consumes: nothing (leaf content).
- Produces: the section anchors `SKILL.md` summarizes in Task 3 (Install & configure; tui-root; Standalone imports; Theming; Services; Forms & data; Verify-before-asserting; Confine to this skill).

- [ ] **Step 1: Ground against the current source**

Before writing, confirm current v5 identifiers. If `@taiga-ui/mcp` is available, use it:
`npx @taiga-ui/mcp@latest --source-url=https://taiga-ui.dev/llms-full.txt` (tools: `get_overview`, `get_list_components`, `get_component_example`, `get_migration_guide`). Otherwise read `https://taiga-ui.dev/getting-started` and `https://taiga-ui.dev/llms-full.txt`. Confirm: package names, the providers block, `<tui-root>`/`TuiRoot`, the exact `@taiga-ui/styles/*` file names, and the alert/dialog service names. Where a form can't be confirmed as the single current one, keep the defensive framing (do NOT assert one form as settled fact).

- [ ] **Step 2: Write the full catalog**

Replace the entire contents of `references/rules.md` with:

````markdown
# Taiga UI — Full Rule Catalog

Authority: [taiga-ui.dev](https://taiga-ui.dev). Taiga UI publishes an
AI-support page (https://taiga-ui.dev/ai-support), an `llms.txt`/
`llms-full.txt` feed (https://taiga-ui.dev/llms.txt), and an official MCP
server (`@taiga-ui/mcp`, https://github.com/taiga-family/taiga-ui-mcp) —
which Taiga positions as the **recommended** way for AI assistants to get
version-accurate docs. No formal Claude-Code-style agent-skill exists
upstream — this file is authored, not vendored.

**Version reality check (2026-07):** Taiga UI's current major is **v5**
(v5.16.0). Items below are flagged `[vN]` where behavior differs by major.
Always confirm against the project's installed `@taiga-ui/*` version before
asserting a rule as fact — and prefer the official `@taiga-ui/mcp` server
for live lookups (props, examples, migration).

## 1. Install & configure `[v5]`

Install with the schematic (it wires providers, styles, and `<tui-root>`):

```
ng add taiga-ui
```

Nx workspaces: `npm i taiga-ui` then `nx g taiga-ui:ng-add`.

⚠️ **`@angular/cdk` is a required peer.** Install it first to avoid
dependency-resolution conflicts, especially on non-latest Angular. This is
the **opposite of PrimeNG** (which is self-contained and CDK-free) — do not
carry the PrimeNG assumption over. Verify with `npm ls @angular/cdk`.

`@taiga-ui/*` is a scoped package family — install/import only what you use:
`@taiga-ui/core`, `@taiga-ui/kit`, `@taiga-ui/cdk`, `@taiga-ui/layout`,
`@taiga-ui/icons`, `@taiga-ui/styles`, `@taiga-ui/event-plugins`, the
`@taiga-ui/addon-*` set (e.g. `addon-table`, `addon-charts`, `addon-mobile`,
`addon-commerce`), and `@taiga-ui/legacy` for migration shims.

Canonical `app.config.ts` providers:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { NG_EVENT_PLUGINS } from '@taiga-ui/event-plugins';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimations(),
    NG_EVENT_PLUGINS,
  ],
};
```

⚠️ **Verify the exact provider form against the installed major.** Taiga v5
also ships a convenience `provideTaiga()` (from `@taiga-ui/core`) that
bundles the event plugins and animation wiring. Depending on the version and
whether you ran `ng add`, the canonical form may be `provideTaiga()` instead
of the explicit `NG_EVENT_PLUGINS` + `provideAnimations()` pair. Confirm via
`@taiga-ui/mcp`/getting-started before writing it into a project; do not
assert one form as the only correct one.

Sources: https://taiga-ui.dev/getting-started

## 2. `<tui-root>` host — required

Wrap the app's root template in `<tui-root>` (component `TuiRoot` from
`@taiga-ui/core`). It hosts the portal layer that dialogs, alerts, dropdowns,
hints, and mobile sheets render into:

```ts
import { TuiRoot } from '@taiga-ui/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TuiRoot, RouterOutlet],
  template: `
    <tui-root>
      <router-outlet />
    </tui-root>
  `,
})
export class AppComponent {}
```

**Omitting `<tui-root>` makes alerts/dialogs/dropdowns silent no-ops** —
`TuiAlertService`/`TuiDialogService` calls resolve but nothing renders. This
is the Taiga analog of PrimeNG's "render `<p-toast>`/`<p-confirmDialog>` or
the service does nothing."

Source: https://taiga-ui.dev/getting-started

## 3. Standalone imports — no barrel

Import individual `Tui*` components and directives into a standalone
component's `imports:` array from the specific `@taiga-ui/*` entry point —
never a broad barrel — for tree-shaking:

```ts
import { Component } from '@angular/core';
import { TuiButton } from '@taiga-ui/core';
import { TuiInputModule } from '@taiga-ui/legacy'; // legacy controls, if still used

@Component({
  standalone: true,
  imports: [TuiButton],
  template: `<button tuiButton type="button" (click)="save()">Save</button>`,
})
export class SaveComponent {}
```

Many Taiga building blocks are **directives on native elements**
(`tuiButton`, `tuiTextfield`, `tuiChip`) rather than custom element tags — a
notable difference from PrimeNG's `p-*` element components. Confirm the
current selector/import for each component via `@taiga-ui/mcp`.

## 4. Theming — CSS variables `[v5]`

Taiga theming is **CSS-variable based** (`--tui-*` custom properties) — there
is **no design-token preset object** of PrimeNG's `definePreset` shape. Add
Taiga's global stylesheets to `angular.json` `styles` (LESS-based):

```json
"styles": [
  "@taiga-ui/styles/taiga-ui-theme.less",
  "@taiga-ui/styles/taiga-ui-fonts.less"
]
```

⚠️ **Verify the exact style file paths/names against the installed major**
(the `@taiga-ui/styles/*.less` set and whether a mobile addon stylesheet is
needed have changed across versions). Customize by overriding `--tui-*`
variables in your global styles; light/dark is driven by Taiga's documented
theme mechanism (attribute/class on the root). **Never `::ng-deep` into
Taiga's internal DOM** — override via the CSS variables and documented
theming hooks instead.

Sources: https://taiga-ui.dev/getting-started , https://taiga-ui.dev/llms-full.txt

## 5. Services — alerts & dialogs

Both require `<tui-root>` (§2) to be present.

- **`TuiAlertService`** (from `@taiga-ui/core`) — transient notifications, in
  place of PrimeNG's `MessageService`. Returns an Observable; subscribe to
  actually show it:
  ```ts
  private readonly alerts = inject(TuiAlertService);
  this.alerts.open('Changes saved', { appearance: 'success' }).subscribe();
  ```
  ⚠️ Verify the service name and options against the installed major — some
  versions/docs reference `TuiNotificationService`; confirm via
  `@taiga-ui/mcp`.

- **`TuiDialogService`** (from `@taiga-ui/core`) — component/template dialogs,
  in place of PrimeNG's `DialogService`/`ConfirmationService`:
  ```ts
  private readonly dialogs = inject(TuiDialogService);
  this.dialogs.open<boolean>(new PolymorpheusComponent(EditUserComponent), {
    label: 'Edit user',
    size: 'm',
    data: { userId },
  }).subscribe((result) => { /* ... */ });
  ```
  The opened content reads `TuiDialogContext` (`context.data`,
  `context.completeWith(result)`). Confirm the exact open signature and
  content-injection API via `@taiga-ui/mcp`.

Source: https://taiga-ui.dev/getting-started

## 6. Forms & data

Taiga form controls implement Angular's `ControlValueAccessor`, so they bind
directly with `formControlName`/`[(ngModel)]` — no adapter layer:

```html
<tui-textfield>
  <input tuiTextfield formControlName="email" />
</tui-textfield>
```

Tabular/data patterns come from `@taiga-ui/addon-table`. For server-side
paging/sorting, drive the data source from the component and feed the table
the current page — confirm the current table API (`tui-table`, directives,
sort/pagination inputs) via `@taiga-ui/mcp`, as it has evolved across majors.

## 7. ⚠️ Verify-before-asserting

- **Installed Taiga major** — v5 now; gate every `[v5]` rule on
  `npm ls @taiga-ui/core` / `package.json`, not this snapshot.
- **`@angular/cdk` peer** — required for Taiga; check it is installed.
- **Provider form** — `provideTaiga()` vs explicit `NG_EVENT_PLUGINS` +
  `provideAnimations()` (see §1).
- **Alert service name** — `TuiAlertService` vs `TuiNotificationService`
  (see §5).
- **Style file paths** and **component selectors/imports** — confirm via the
  official MCP server before writing them into a project.

Prefer `@taiga-ui/mcp` for all of the above:
`npx @taiga-ui/mcp@latest --source-url=https://taiga-ui.dev/llms-full.txt`.

## 8. Keep Taiga confined to this skill

Every `Tui*` name, `@taiga-ui/*` import path, provider, service, and theming
concept documented above belongs only in this skill and the projects that
install it. `angular-paved-path` (components, signals, DI, forms, routing,
testing) must never reference `Tui*` components, `@taiga-ui/*` imports,
`provideTaiga`/`NG_EVENT_PLUGINS`, `<tui-root>`, or `--tui-*` — that would
break the swap invariant and couple the paved-path to one UI library.

## Sources

- https://taiga-ui.dev/getting-started
- https://taiga-ui.dev/ai-support
- Reference feed: https://taiga-ui.dev/llms.txt , https://taiga-ui.dev/llms-full.txt
- Official MCP server: `@taiga-ui/mcp` — https://github.com/taiga-family/taiga-ui-mcp
- Swap alternative — PrimeNG: https://primeng.dev
````

- [ ] **Step 3: Run the quality gate**

Run: `claude plugin validate . && node scripts/build-site.mjs`
Expected: both pass; the `angular-ui-taiga` skill page renders the full rule catalog.

- [ ] **Step 4: Commit**

```bash
git add plugins/angular-ui-taiga/skills/angular-ui-taiga/references/rules.md
git commit -m "feat(angular-ui-taiga): author full Taiga UI rule catalog"
```

---

### Task 3: Author `SKILL.md` (summary)

Fill in the summary skill file — the counterpart to `angular-ui-primeng`'s `SKILL.md`: the verbatim swap invariant block, the numbered rule summary, review red flags, the swap-to-another-library note, and sources.

**Files:**
- Modify: `plugins/angular-ui-taiga/skills/angular-ui-taiga/SKILL.md` (replace skeleton body)

**Interfaces:**
- Consumes: section topics from `references/rules.md` (Task 2).
- Produces: nothing downstream.

- [ ] **Step 1: Replace the skill body**

Replace the entire contents of `SKILL.md` with:

````markdown
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
````

- [ ] **Step 2: Run the quality gate**

Run: `claude plugin validate . && node scripts/build-site.mjs`
Expected: both pass; the skill's description and content render.

- [ ] **Step 3: Commit**

```bash
git add plugins/angular-ui-taiga/skills/angular-ui-taiga/SKILL.md
git commit -m "feat(angular-ui-taiga): author SKILL.md summary + swap invariant"
```

---

### Task 4: Author `README.md` + `CHANGELOG.md`

Flesh out the plugin's docs — the counterpart to `angular-ui-primeng`'s README/CHANGELOG.

**Files:**
- Modify: `plugins/angular-ui-taiga/README.md`
- Modify: `plugins/angular-ui-taiga/CHANGELOG.md`

- [ ] **Step 1: Write `README.md`**

Replace the entire contents with:

````markdown
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
````

- [ ] **Step 2: Write `CHANGELOG.md`**

Replace the entire contents with:

```markdown
# Changelog

## 0.1.0 (2026-07-23)

- Initial release: `angular-ui-taiga` skill — Taiga UI (v5) install &
  `app.config.ts` setup (`@angular/cdk` peer, `NG_EVENT_PLUGINS` /
  `provideTaiga` + `provideAnimations`), `<tui-root>` portal host,
  CSS-variable (`--tui-*`) theming via `@taiga-ui/styles`, standalone
  tree-shaken `Tui*` imports, `TuiAlertService`/`TuiDialogService` +
  `<tui-root>` requirement, `ControlValueAccessor` forms,
  `@taiga-ui/addon-table` data, verify-before-asserting items, and
  Taiga-specific review red flags. Authored from taiga-ui.dev / `llms.txt` /
  `@taiga-ui/mcp` (no upstream agent-skill exists to vendor). Second swappable
  Angular UI-library plugin; documents PrimeNG (`angular-ui-primeng`) as the
  swap alternative.
```

- [ ] **Step 3: Run the quality gate**

Run: `claude plugin validate . && node scripts/build-site.mjs`
Expected: both pass; the plugin page renders README + the component table.

- [ ] **Step 4: Commit**

```bash
git add plugins/angular-ui-taiga/README.md plugins/angular-ui-taiga/CHANGELOG.md
git commit -m "docs(angular-ui-taiga): author README + CHANGELOG"
```

---

### Task 5: Update cross-references (PrimeNG + main README)

Now that `angular-ui-taiga` is a real shipped sibling, update the places that described it as hypothetical, and add it to the main README's install list and stack table.

**Files:**
- Modify: `plugins/angular-ui-primeng/skills/angular-ui-primeng/SKILL.md` (the "Swapping to another UI library" section + Sources note)
- Modify: `plugins/angular-ui-primeng/README.md` (the "Swap to another UI library" section)
- Modify: `README.md` (Angular install block + narrative + stack table)

**Interfaces:**
- Consumes: plugin name `angular-ui-taiga` (Task 1).

- [ ] **Step 1: Update PrimeNG `SKILL.md` swap note**

In `plugins/angular-ui-primeng/skills/angular-ui-primeng/SKILL.md`, the "Swapping to another UI library" section currently says Taiga's services "would live in a sibling `angular-ui-taiga` plugin, installed instead of this one." Change the conditional framing to present tense — Taiga UI now **is** a shipped sibling. Replace the sentence:

> For example, **Taiga UI** is a documented swap alternative
> (https://taiga-ui.dev/ai-support): its providers (`tui*`), theming
> (CSS-based, no design-token layer of this shape), and services
> (`TuiAlertService`/`TuiDialogService` in place of `MessageService`/
> `DialogService`) would live in a sibling `angular-ui-taiga` plugin,
> installed instead of this one, alongside the same `angular-paved-path`.

with:

> For example, **Taiga UI** is a documented swap alternative
> (https://taiga-ui.dev/ai-support): its providers (`NG_EVENT_PLUGINS`/
> `provideTaiga`), theming (CSS-variable `--tui-*`, no design-token layer of
> this shape), and services (`TuiAlertService`/`TuiDialogService` in place of
> `MessageService`/`DialogService`) live in the sibling **`angular-ui-taiga`**
> plugin, installed instead of this one, alongside the same
> `angular-paved-path`.

- [ ] **Step 2: Update PrimeNG `README.md` swap note**

In `plugins/angular-ui-primeng/README.md`, the "Swap to another UI library" section calls it "a hypothetical `angular-ui-taiga` plugin". Replace:

> **Taiga UI** is a documented swap alternative
> (https://taiga-ui.dev/ai-support): a hypothetical `angular-ui-taiga`
> plugin would carry Taiga's install/provider/theming/component-catalog
> sections in place of this skill's PrimeNG content, while
> `angular-paved-path` and the forms/routing/testing conventions stay
> identical.

with:

> **Taiga UI** is a documented swap alternative
> (https://taiga-ui.dev/ai-support): the sibling `angular-ui-taiga` plugin
> carries Taiga's install/provider/theming/component-catalog sections in
> place of this skill's PrimeNG content, while `angular-paved-path` and the
> forms/routing/testing conventions stay identical.

- [ ] **Step 3: Add Taiga to the main README install block**

In `README.md`, in the "The Angular stack is available now" fenced block (currently ending with `/plugin install angular-ui-primeng@claude-market`), append a comment line clarifying the UI plugin is a choice of one:

```
/plugin install typescript-paved-path@claude-market
/plugin install angular-paved-path@claude-market
/plugin install angular-ui-primeng@claude-market   # OR angular-ui-taiga (choose one UI library)
```

- [ ] **Step 4: Update the main README narrative sentence**

In `README.md`, replace:

> `angular-ui-primeng` is the
> default UI-library skill for the Angular surface; it's swappable for
> another library skill (e.g. a Taiga variant) if a project doesn't use
> PrimeNG.

with:

> `angular-ui-primeng` is the default UI-library skill for the Angular
> surface; it's swappable for `angular-ui-taiga` (Taiga UI) — install exactly
> one UI-library plugin per project.

- [ ] **Step 5: Update the stack table**

In `README.md`, in the stack table row for `web (Angular)`, change the "Library skill" cell from `angular-ui-primeng` to `angular-ui-primeng or angular-ui-taiga`.

- [ ] **Step 6: Run the quality gate**

Run: `claude plugin validate . && node scripts/build-site.mjs`
Expected: both pass; PrimeNG and main README pages reflect Taiga as a shipped sibling.

- [ ] **Step 7: Commit**

```bash
git add plugins/angular-ui-primeng README.md
git commit -m "docs: reflect angular-ui-taiga as a shipped swap sibling"
```

---

### Task 6: Update project memory + final gate

Record the increment in memory and confirm the full quality gate one last time.

**Files:**
- Modify: `/Users/viacheslavklavdiiev/.claude/projects/-Users-viacheslavklavdiiev-work-claude-market/memory/claude-market-sdd-port.md`

- [ ] **Step 1: Run the full quality gate from a clean tree**

Run: `claude plugin validate . && node scripts/build-site.mjs && git status --porcelain`
Expected: both commands pass; `git status` shows a clean working tree (all plugin/doc changes already committed in Tasks 1–5).

- [ ] **Step 2: Update the `claude-market-sdd-port` memory**

In the memory file, under the "Possible future work" note that currently lists `angular-ui-taiga`, record it as **done**: add a short line that `angular-ui-taiga` (Taiga UI v5, second swappable Angular UI library) shipped, marketplace at **0.6.0**, validating the UI-swap invariant on a second library; and remove `angular-ui-taiga` from the "future work" list. Keep the existing `[[claude-market-conventions]]` link.

- [ ] **Step 3: (No commit needed)**

Memory files live outside the git repo; nothing to commit. Report completion.

---

## Self-Review

**Spec coverage:**
- Plugin structure (plugin.json, SKILL.md, references/rules.md, README, CHANGELOG) → Tasks 1–4. ✓
- Skill content outline items 1–10 → Task 2 (rules.md §1–§8) + Task 3 (SKILL.md summary). Install/CDK/providers ✓; `<tui-root>` ✓; standalone imports ✓; CSS-variable theming ✓; services ✓; forms & data ✓; verify-before-asserting ✓; swap invariant verbatim ✓; review red flags ✓; sources ✓.
- MCP prominent, mention-only → SKILL.md intro + rules.md header + README (Tasks 2–4). ✓
- Repo wiring: marketplace entry + bump 0.6.0 → Task 1; PrimeNG cross-ref hypothetical→shipped → Task 5; main README → Task 5; memory update → Task 6. ✓
- Quality gate green → every task ends with `claude plugin validate . && node scripts/build-site.mjs`. ✓
- Out of scope respected: no vendored skill/LICENSE, no MCP execution, no agents/commands, no paved-path content changes. ✓

**Placeholder scan:** No "TBD/TODO" in deliverable content. The skeleton files in Task 1 contain "authored in Task N" markers but are fully replaced in Tasks 2–4, and the gate passing after Task 1 confirms the skeleton is itself valid. No un-shown code steps.

**Type/name consistency:** plugin name `angular-ui-taiga`, skill name `angular-ui-taiga`, source `./angular-ui-taiga`, dependency `angular-paved-path@^0.1.0`, version `0.1.0`, marketplace `0.6.0` — consistent across Tasks 1, 4, 5, 6. Identifiers that vary by Taiga major (`NG_EVENT_PLUGINS`/`provideTaiga`, `TuiAlertService`/`TuiNotificationService`, `@taiga-ui/styles/*.less`) are deliberately presented with verify-before-asserting framing per the Global Constraints, not asserted inconsistently.
