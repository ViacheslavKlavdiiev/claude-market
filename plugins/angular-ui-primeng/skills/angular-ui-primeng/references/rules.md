# PrimeNG — Full Rule Catalog

Authority: [primeng.dev](https://primeng.dev) (docs moved from
`primeng.org`, which now 301-redirects to `primeng.dev`; versioned docs
live at `vNN.primeng.org`, e.g. https://v18.primeng.org). PrimeNG's own
`llms.txt`/`llms-full.txt` (https://primeng.dev/llms) and the official
`@primeng/mcp` server were used to ground this content. No formal
Claude-Code-style agent-skill exists upstream for PrimeNG — this file is
authored, not vendored.

**Version reality check (2026-07):** PrimeNG's current stable is **v22**.
The design-token/CSS-variable theming system described throughout this
file was introduced in **v18** (Nov 2024, alongside Angular 18) and is
unchanged in principle through v19–v22. Items below are flagged `[vNN]`
where behavior differs by version — always confirm against the project's
actual installed `primeng` version before asserting a rule as fact.

## 1. Install & configure `[v18+]`

```
npm install primeng
npm install @primeng/themes
```

Canonical `app.config.ts` setup:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAnimationsAsync(),
    providePrimeNG({ theme: { preset: Aura } }),
  ],
};
```

`provideAnimationsAsync()` (from
`@angular/platform-browser/animations/async`) replaces eagerly-imported
`BrowserAnimationsModule` and is required for overlay/toast/dialog
animations to work — omitting it doesn't error, it just silently
disables animation.

Source: https://primeng.dev/installation

## 2. ⚠️ `[v18 breaking]` No pre-v18 CSS/SASS theming, no `PrimeNGConfig`

`[v17 and earlier]` theming worked by importing a prebuilt CSS/SASS theme
file (e.g. `saga-blue`, `lara-light-blue`) plus `primeng/resources/*` into
`angular.json`/global styles, and configuring behavior through the
injectable `PrimeNGConfig` service.

**Both are removed in v18.** Styled mode was reimplemented from scratch,
moved into core, SASS dropped entirely — theming is now
design-token + CSS-variable (`--p-*`) based, configured through
`providePrimeNG({ theme: { preset } })`.

Migration from a v17-or-earlier app:
- Delete CSS theme + `primeng/resources` imports from `angular.json` /
  global styles.
- Add `providePrimeNG({ theme: { preset } })` + `provideAnimationsAsync()`
  to `app.config.ts` (see §1).
- Replace any `PrimeNGConfig` injection/config calls with the `providePrimeNG()`
  config object and, where needed, the runtime `PrimeNG` service.

Presets ship from `@primeng/themes`: **Aura** (PrimeTek's own design
language), **Material** (Google Material Design 2), **Lara**
(Bootstrap-style), **Nora** (enterprise-oriented). Each preset ships two
base font-size variants — 16px standard and a legacy 14px `*-compat`
variant (compat variants are maintained until June 2027 — ⚠️ verify against current primeng.dev).

Sources: https://v18.primeng.org/guides/migration , https://primeng.dev/theming

## 3. Standalone imports — no global barrel

Import components individually into a standalone component's `imports:`
array:

```ts
import { Component } from '@angular/core';
import { Button } from 'primeng/button';
import { TableModule } from 'primeng/table';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [Button, TableModule],
  template: `
    <p-table [value]="users">...</p-table>
    <p-button label="Refresh" (onClick)="refresh()" />
  `,
})
export class UsersComponent {}
```

"Imported and registered individually so that you only include what you
use, for bundle optimization." Avoid a broad barrel import or leftover
NgModule wiring carried over from an older app — it defeats
tree-shaking.

Sources: https://primeng.dev/installation , https://primeng.dev/table

## 4. Styling — Tailwind interop, layers, tokens

**Tailwind is the recommended interop path.** Install the official
plugin:

```
npm install tailwindcss-primeui
```

It exposes PrimeNG's semantic design tokens as Tailwind utilities —
`bg-primary`, `text-surface-500`, `text-muted-color`, the
`primary-[50..950]`/`surface-[0..950]` scales, radius utilities, and
animation utilities (`animate-fadein`, `animate-slidedown`,
`animate-zoomin`). ⚠️ `[Tailwind v4]` it's a CSS-based plugin; ⚠️
`[Tailwind v3]` it's a JS-based plugin (`tailwind.config.js`
`plugins: []` entry) — install/wire it per the Tailwind major the project
uses.

**CSS layer ordering is critical** to avoid PrimeNG/Tailwind specificity
wars. Enable `cssLayer` in the theme config:

```ts
providePrimeNG({
  theme: {
    preset: Aura,
    options: { cssLayer: { name: 'primeng', order: 'tailwind-base, primeng, tailwind-utilities' } },
  },
});
```

- ⚠️ Tailwind v4: the `primeng` layer must come **after `theme` and
  `base`, but before `utilities`** — so Tailwind's own utility classes can
  always override PrimeNG's default component styles.
- ⚠️ Tailwind v3: the `primeng` layer goes **between Tailwind's `base` and
  `utilities` layers**.

Get the order wrong (or skip `cssLayer` entirely) and Tailwind utility
classes stop overriding PrimeNG defaults, which shows up as `!important`
creep or specificity workarounds in app code.

**PrimeFlex** (PrimeTek's own utility-CSS library) still works but is
effectively legacy next to Tailwind. **Do not mix PrimeFlex and Tailwind
in the same project** — pick Tailwind + `tailwindcss-primeui`.

**Per-instance overrides**: every component exposes `styleClass` (and
`[style]`) to attach Tailwind/utility classes without piercing view
encapsulation. This is the sanctioned override point —
**never `::ng-deep` into PrimeNG's internal DOM/classes.**

**Design tokens** — three tiers: primitive (`blue.500`), semantic
(`primary.color`), component (`button.color`). Default CSS-variable
prefix is `p`, so a component token resolves to e.g.
`var(--p-primary-color)`. Customize by extending a preset:

```ts
import { definePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';

const MyPreset = definePreset(Aura, {
  semantic: { primary: { 500: '#7c3aed' } },
});

providePrimeNG({ theme: { preset: MyPreset } });
```

Runtime helpers: `usePreset()` / `updatePreset()` to swap/patch a preset
at runtime; `$dt()` to read a token's resolved value in code (a `$t()`
alias is sometimes referenced for the same purpose — ⚠️ verify against
current primeng.dev/theming before relying on it).

**Dark mode** via `darkModeSelector` in the theme config — default
`'system'` follows `prefers-color-scheme`; set it to a class selector
(e.g. `'.app-dark'`) to drive dark mode from an app-level toggle instead.

Sources: https://primeng.dev/tailwind , https://primeng.dev/theming

## 5. Services + host components

Provide each service where the app uses it, and **render its host
component** — a service injected without its host component rendered is
a silent no-op (message/dialog calls do nothing visible).

- **`MessageService`** → provide it, place `<p-toast>` in the template,
  then:
  ```ts
  messageService.add({ severity: 'success', summary: 'Saved', detail: 'Changes saved.', life: 3000 });
  ```
  `severity`: `success` | `info` | `warn` | `error`. `position` (on
  `<p-toast position="...">`), `sticky` to suppress auto-dismiss.

- **`ConfirmationService`** → provide it, place `<p-confirmDialog>` (or
  use `confirmPopup`), then:
  ```ts
  confirmationService.confirm({
    message: 'Delete this record?',
    accept: () => this.delete(),
    reject: () => {},
  });
  ```

- **`DialogService`** (DynamicDialog) → inject `DialogService`, open a
  component dynamically:
  ```ts
  const ref = this.dialogService.open(EditUserComponent, {
    header: 'Edit user',
    width: '40rem',
    data: { userId },
    inputValues: { readonly: false },
  });
  ref.onClose.subscribe((result) => { /* ... */ });
  ```
  The opened component injects `DynamicDialogConfig` (read `config.data`
  for the generic payload) and `DynamicDialogRef` (`ref.close(result)`
  surfaces at the caller's `ref.onClose`). `inputValues` sets the opened
  component's `input()`s directly.

Sources: https://primeng.dev/toast , https://primeng.dev/dynamicdialog

## 6. `p-table` — server-side data, virtual scroll, forms

Server-side pagination/sort/filter:

```html
<p-table
  [value]="rows()"
  [lazy]="true"
  (onLazyLoad)="loadPage($event)"
  [paginator]="true"
  [rows]="20"
  [totalRecords]="totalRecords()"
>
```

- `[lazy]="true"` + `(onLazyLoad)` fires on paginate/sort/filter — fetch
  exactly the requested page server-side rather than loading the whole
  dataset client-side.
- `[totalRecords]` is required alongside a lazy paginator (without it the
  paginator can't compute page count).
- `sortMode="multiple"` for multi-column sort; filtering via `filters:
  DataTableFilterMeta` + per-column `filter` + `globalFilterFields`.
- `selectionMode`: `single` | `multiple` | `checkbox` | `radio`, with
  `metaKeySelection` for ctrl/cmd-click semantics.
- `virtualScrollerOptions` (with a fixed `itemSize`) for large in-memory
  sets where lazy server paging isn't the right fit.

**Form controls** (`p-inputText`/`pInputText`, `p-select`,
`p-datepicker`, `p-checkbox`, `p-multiSelect`, etc.) implement Angular's
`ControlValueAccessor`, so they bind directly with `formControlName` (or
`[(ngModel)]`) — no adapter layer needed:

```html
<input pInputText formControlName="email" />
<p-select [options]="roles" formControlName="role" />
```

As Angular Signal Forms `[v21+]` land in the paved-path, prefer PrimeNG
controls whose value bindings are compatible with the signal field API
(the `ControlValueAccessor` contract itself doesn't change).

Source: https://primeng.dev/table

## 7. ⚠️ `[v18 renames]` — current component names

| Current (v18+) | Deprecated / legacy name |
| --- | --- |
| `p-select` | `p-dropdown` |
| `p-datepicker` | `p-calendar` |
| `p-toggleSwitch` | `p-inputSwitch` |
| `p-drawer` | `p-sidebar` |
| `p-popover` | `p-overlayPanel` |

Flag any legacy name found in code (or in older docs/tutorials/AI
suggestions) as deprecated and point to the current name.

## 8. Accessibility & relation to Angular CDK

PrimeNG components target WCAG 2.x with built-in ARIA attributes,
keyboard navigation, and focus management; each component's doc page has
its own Accessibility section. Screen-reader-only text uses the
`.p-hidden-accessible` utility class.

**⚠️ Verify before asserting: `@angular/cdk`.** Unlike Angular Material
(which is *built on* `@angular/cdk`), modern PrimeNG `[v17+]` is
self-contained — it ships its own overlay/positioning, focus-trap, and
virtual-scroll primitives and does not require `@angular/cdk` as a
dependency. Older discussions referencing a CDK peer dependency predate
this and are legacy. **Do not assume `@angular/cdk` is present just
because `primeng` is installed** — check the installed `primeng`
package's own `package.json` dependencies (or `npm ls @angular/cdk`)
before writing guidance or code that relies on CDK being available.

Sources (context/history, verify against current `primeng` package.json):
https://github.com/primefaces/primeng/issues/6993 ,
https://viralpatelstudio.in/blogs/angular-material-vs-primeng-vs-cdk-which-ui-library-2025

## 9. ⚠️ Verify before asserting: licensing

PrimeNG's current stable release is **v22**. There have been reports of a
license-key requirement entering PrimeNG's configuration in recent
majors. **Do not assert a specific licensing requirement as settled
fact** — licensing terms and mechanics can change release to release.
Before shipping any licensing guidance to a project:

1. Check https://primeng.dev/installation (and the release notes for the
   project's specific installed major) for the current licensing
   requirement.
2. Gate any license-key-in-config instruction on the installed `primeng`
   major (`npm ls primeng` / `package.json`), not on this document's
   snapshot.

## 10. Keep PrimeNG confined to this skill

Every PrimeNG component name, import path, provider, service, and
theming concept documented above belongs only in this skill and in the
projects that install it. `angular-paved-path` (components, signals, DI,
forms, routing, testing) must never reference `p-*` components,
`primeng/*` imports, or `providePrimeNG` — that would break the
swap invariant and couple the paved-path to one UI library.

## Sources

- https://primeng.dev/installation
- https://primeng.dev/theming
- https://primeng.dev/tailwind
- https://primeng.dev/table
- https://primeng.dev/dynamicdialog
- https://primeng.dev/toast
- Migration reference: https://v18.primeng.org/guides/migration
- Reference feed: https://primeng.dev/llms (primeng.org 301-redirects here)
- Official MCP server: `@primeng/mcp` (https://primeng.dev/mcp)
- CDK-relationship context (verify against current `primeng` package.json):
  https://github.com/primefaces/primeng/issues/6993
- Swap alternative — Taiga UI: https://taiga-ui.dev/ai-support
