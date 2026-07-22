# claude-market

Personal [Claude Code](https://code.claude.com/docs) plugin marketplace: skills,
commands, and agents for use across projects.

Catalog site: https://viacheslavklavdiiev.github.io/claude-market/ ·
machine-readable API: [`/api/index.json`](https://viacheslavklavdiiev.github.io/claude-market/api/index.json)

## Install

In Claude Code (from any project):

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install example-plugin@claude-market
```

Refresh the catalog after new plugins are published:

```
/plugin marketplace update claude-market
```

> The marketplace is distributed as a git repository: Claude Code clones it in
> full, so plugins with relative paths work out of the box. Adding the
> marketplace via a direct URL to `marketplace.json` is **not** supported
> (relative paths would not resolve).

## Repository layout

```
.claude-plugin/marketplace.json   # catalog: the list of plugins
plugins/<plugin>/                 # each plugin is its own directory
  .claude-plugin/plugin.json      #   manifest (SemVer version lives here)
  README.md · CHANGELOG.md        #   docs and per-release notes
  skills/<skill>/SKILL.md         #   skills (+ examples.md, references/, scripts/)
  commands/<command>.md           #   flat .md commands
  agents/<agent>.md               #   subagent definitions
scripts/build-site.mjs            # catalog site generator + quality gate
scripts/prepare-release.mjs       # bump version + scaffold changelog
scripts/tag-releases.mjs          # create release tags (runs in CI)
scripts/rollback.mjs              # roll-forward rollback
.github/workflows/                # validate, deploy-pages, tag-releases
docs/                             # PLUGIN-GUIDELINES, RELEASES, SECURITY, DEPENDENCIES
```

## Add a new plugin

1. Copy the template: `cp -r plugins/example-plugin plugins/<new-plugin>`.
2. Edit `plugins/<new-plugin>/.claude-plugin/plugin.json` (`name`, `version`,
   `description`, `keywords`, `category`).
3. Fill in the components under `skills/`, `commands/`, `agents/`, and update the
   plugin `README.md` / `CHANGELOG.md`.
4. Register the plugin in `.claude-plugin/marketplace.json` (`source` is relative
   to `plugins/`, so `"./<new-plugin>"`).
5. Validate and build:
   ```
   claude plugin validate .
   node scripts/build-site.mjs      # runs the quality gate
   ```
6. Commit and push to `main` — the site redeploys and the release tag is created
   automatically.

See [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md) for the full rules and
[docs/RELEASES.md](docs/RELEASES.md) for the versioning model.

## Catalog site

A human-readable catalog is generated from `marketplace.json` and the plugin
contents, and published to GitHub Pages on every push to `main`:

- search by name / description / tags / plugin;
- filter by component type (skills / commands / agents) and by category;
- a page per component with the full rendered content, plus a page per plugin;
- a machine-readable `/api/index.json` catalog;
- light / dark theme.

Build locally:

```
node scripts/build-site.mjs        # → _site/
```

The build **fails** on catalog quality violations (missing descriptions or
versions, duplicate ids), so a degraded catalog is never deployed.

## Versioning

Each plugin carries an explicit SemVer `version` in its `plugin.json` (the single
source of truth). Merging a version bump to `main` is the release; a
`<plugin>-vX.Y.Z` tag and GitHub Release are created automatically. Full model in
[docs/RELEASES.md](docs/RELEASES.md).

## License

[MIT](LICENSE).
