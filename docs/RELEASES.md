# Releases

## Versioning model

- Every plugin carries an explicit **SemVer** `version` in its
  `.claude-plugin/plugin.json`. This is the **only** place a version lives —
  never duplicate it in the marketplace entry (the manifest silently wins, and
  duplication only causes drift).
- **A release does not exist without a version bump.** Claude Code delivers
  updates to users only when the manifest version changes; pushing commits
  without a bump ships nothing to existing users.
- SemVer semantics for plugins:
  - **MAJOR** — breaking changes: removed or renamed skills/commands/agents,
    changed hook behavior users may depend on.
  - **MINOR** — new skills, agents, commands, or capabilities; backward compatible.
  - **PATCH** — fixes and internal changes with no interface impact.
- The marketplace-level `metadata.version` in `marketplace.json` is
  informational; bump it on structural catalog changes (plugins added, removed,
  or renamed).

## Release procedure

1. Run `node scripts/prepare-release.mjs <plugin> <major|minor|patch>` — it bumps
   the version in the plugin's `plugin.json` and scaffolds a `CHANGELOG.md`
   entry. Replace the TODO line with real release notes.
2. Run `claude plugin validate .` and `node scripts/build-site.mjs` (the catalog
   quality gate) to confirm the catalog is well-formed.
3. Commit and push to `main`. **Merging to `main` is the release.**
4. Tagging is automated: when a version bump lands on `main`, the
   `tag-releases.yml` workflow creates the annotated tag `<plugin>-vX.Y.Z`
   (e.g. `example-plugin-v0.2.0`) and a GitHub Release with the matching
   changelog section as notes. Tags exist for humans, auditability, and rollback
   reference — Claude Code itself tracks `main`, not tags. (Manual fallback:
   `node scripts/tag-releases.mjs --dry-run` shows what would be tagged.)

## How users receive updates

```
/plugin marketplace update claude-market
/plugin update <plugin-name>@claude-market
```

Claude Code caches plugins in `~/.claude/plugins/cache`; a stale cache after an
update is a known issue — the workaround is uninstall/reinstall. Document
user-facing breaking changes prominently in the changelog.

## Rollback: roll forward only

Never delete, reuse, or decrease a published version. To undo a bad release
`X.Y.Z`, run:

```
node scripts/rollback.mjs <plugin> [--to <version>]
```

It restores the plugin directory from the last good release tag (or `--to` a
specific one), bumps the **patch** version past the bad release, and prepends a
changelog entry ("reverts X.Y.Z"). Review the diff, then commit and push like any
release — the content rolls back, the version rolls forward. After the push, the
tag is created automatically.

Downgrades are not reliably delivered to users, and a deleted tag or version
leaves installs in an inconsistent state — rolling forward is the only
dependable path. For a security-driven rollback, also follow the incident
response in [SECURITY.md](SECURITY.md).
