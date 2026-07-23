# House notes

- **Provenance.** All 7 skills under `skills/` are vendored **verbatim**
  from the official BSD-3 licensed
  [`github.com/dart-lang/skills`](https://github.com/dart-lang/skills)
  (Copyright 2012, the Dart project authors). No prose or code in any
  `SKILL.md` body has been edited. Update by re-vendoring from upstream
  `main` and bumping this plugin's version.
- **MCP → CLI fallback.** Some vendored steps reference the Dart MCP
  server. If it is not installed/available, fall back to the equivalent
  Dart CLI commands: `dart analyze`, `dart test`, `dart pub get`,
  `dart fix --apply`, `dart run build_runner build`.
- **`metadata.model` frontmatter.** Each vendored `SKILL.md` carries an
  upstream `metadata.model` (and `metadata.last_modified`) key — an
  artifact of Gemini-based authoring tooling at the source repo. It is
  harmless and was left in place (see report for validation outcome).
