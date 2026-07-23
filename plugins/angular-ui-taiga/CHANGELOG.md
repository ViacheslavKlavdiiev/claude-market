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
