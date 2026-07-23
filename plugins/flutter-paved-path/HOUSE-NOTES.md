# House notes

- **Provenance.** The 4 skills under `skills/flutter-*`
  (`flutter-build-responsive-layout`, `flutter-implement-json-serialization`,
  `flutter-setup-localization`, `flutter-use-http-package`) are vendored
  **verbatim** from the official BSD-3 licensed
  [`github.com/flutter/agent-plugins`](https://github.com/flutter/agent-plugins)
  (Copyright 2026 The Flutter Authors). No prose or code in any `SKILL.md`
  body has been edited. The remaining five conceptual skills
  (`flutter-best-practices`, `flutter-architecture`, `flutter-material3`,
  `flutter-routing`, `flutter-testing`) are house-authored from
  [docs.flutter.dev](https://docs.flutter.dev) — they are added in
  subsequent tasks, not vendored. Update the vendored skills by
  re-vendoring from upstream `main` and bumping this plugin's version.
  Three overlapping upstream skills — `flutter-setup-declarative-routing`,
  `flutter-add-widget-test`, `flutter-apply-architecture-best-practices` —
  were deliberately **not** vendored: the house-authored `flutter-routing`,
  `flutter-testing`, and `flutter-architecture` skills cover that ground
  instead.
- **MCP → CLI fallback.** Some vendored steps reference Flutter/Dart MCP
  tooling. If it is not installed/available, fall back to the equivalent
  Flutter CLI commands: `flutter test`, `flutter analyze`,
  `flutter pub get`.
- **`metadata.model` frontmatter.** Each vendored `SKILL.md` carries an
  upstream `metadata.model` (and `metadata.last_modified`) key — an
  artifact of Gemini-based authoring tooling at the source repo. It is
  harmless and was left in place; `claude plugin validate .` passed with
  it present, so no body edits were made (see task report for the
  validation outcome).
