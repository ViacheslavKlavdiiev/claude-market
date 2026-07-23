# Changelog

## 0.1.0 - 2026-07-23

- Initial release: vendored the official Angular team skill from
  `github.com/angular/skills` (MIT, Copyright 2026 Google LLC) verbatim —
  `angular-developer` (SKILL.md + 38 reference files) and `angular-new-app`.
- Added `skills/angular-developer/LICENSE` (MIT text, Copyright 2026 Google
  LLC) and `skills/angular-developer/HOUSE-NOTES.md` (provenance and
  re-vendoring notes; not injected into the vendored content).
- Added the house `angular-testing` skill (authored, not vendored):
  Angular-specific testing conventions layered on top of the vendored
  `testing-fundamentals.md`/`e2e-testing.md` references. All three skills
  (`angular-developer`, `angular-new-app`, `angular-testing`) ship in this
  `0.1.0` release.
- Declared dependencies on `engineering-foundations@^0.1.0` and
  `typescript-paved-path@^0.1.0`.
