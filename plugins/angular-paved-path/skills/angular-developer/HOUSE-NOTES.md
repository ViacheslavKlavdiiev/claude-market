# House Notes (marketplace addendum — not part of the vendored skill)

This file is a sibling note maintained by the `claude-market` marketplace. It
is **not** part of the upstream skill content and is never injected into
`SKILL.md` or any `references/*.md` file.

## Provenance

`SKILL.md` and every file under `references/` in this skill directory are
vendored **verbatim** from the official Angular team skill at
[`github.com/angular/skills`](https://github.com/angular/skills)
(`angular-developer/`), MIT licensed, Copyright 2026 Google LLC. See the
sibling `LICENSE` file for the full license text.

To update this skill, re-vendor from the upstream repository (re-run the
fetch loop against `angular-developer/SKILL.md` and
`angular-developer/references/*.md`) rather than hand-editing the vendored
prose. Do not modify Google's content directly — if a correction is needed
upstream, contribute it to `angular/skills` instead.

## Marketplace conventions

- **Version-gating**: this skill is consumed as part of `angular-paved-path`,
  which follows the marketplace's SemVer + dependency-gating conventions (see
  `dependencies` in `.claude-plugin/plugin.json`). Bumping the vendored
  content is a `angular-paved-path` release, tracked in the plugin's
  `CHANGELOG.md`.
- **Red-flags**: this skill's guidance is subject to the marketplace's
  standard red-flags review (security, destructive commands, secrets
  handling) like every other paved-path skill, even though the prose itself
  is not house-authored.

## UI layer stays separate

This paved path (`angular-developer`, `angular-new-app`, and the house
`angular-testing` skill) is intentionally **UI-library-agnostic** — it does
not assume Material, PrimeNG, or any particular component kit. Swappable UI
conventions live in the separate `angular-ui-primeng` plugin, which layers on
top of this one.
