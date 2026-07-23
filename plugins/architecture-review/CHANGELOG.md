# Changelog

## 0.1.0 - 2026-07-23

- Initial release.
- `architecture-reviewer`: read-only architectural auditor, ported from
  upstream and adapted to be manifest-driven — layer names and the
  forbidden-import matrix are derived from the project's Stack Manifest
  Layer map instead of hardcoded package/framework names. Preloads the
  `clean-architecture` and `security` skills from `engineering-foundations`;
  stack-specific surface skills load per-surface via the manifest. Emits a
  required `### Gate verdict: PASS|FAIL` line; used standalone or spawned by
  the `run-plan` agent's Stage 4.
