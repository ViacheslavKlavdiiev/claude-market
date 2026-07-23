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

@Component({
  standalone: true,
  imports: [TuiButton],
  template: `<button tuiButton type="button" (click)="save()">Save</button>`,
})
export class SaveComponent {}
```

Legacy pre-v5 controls live in `@taiga-ui/legacy` (e.g. `TuiInputModule`) as
migration shims — import them only from that entry point, and prefer the
current `@taiga-ui/core`/`@taiga-ui/kit` equivalents in new code.

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
