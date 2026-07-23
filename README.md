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

## Using the SDD workflow

The Spec-Driven Development (SDD) workflow turns a request into an approved
spec, an approved plan, an orchestrated multi-agent implementation with
review gates, and a measured retrospective.

### 1. Install

Install the foundation plugins in this order — `sdd-engineering` depends on
the other three, so the plugin manager pulls them in automatically, but
installing explicitly makes the dependency chain visible:

```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install engineering-foundations@claude-market
/plugin install research-tools@claude-market
/plugin install architecture-review@claude-market
/plugin install sdd-engineering@claude-market
```

Stage B stack/library plugins (Angular / Flutter / NestJS, PrimeNG, Drizzle)
are optional and installed per project once published.

### 2. Set up the Stack Manifest

Add a `## SDD Stack Manifest` section to the **target project's** `CLAUDE.md`
(not this repo's) so `run-plan` and the agents it spawns know which paved-path
skills, test/typecheck commands, and layer map to use. Start from the shipped
template:

```markdown
## SDD Stack Manifest

| Surface | Paved-path skills | Library skill | Test command | Typecheck command |
|---------|-------------------|---------------|--------------|--------------------|
| web (Angular)    | angular-best-practices, angular-architecture, angular-testing | angular-ui-primeng | <cmd> | <cmd> |
| api (NestJS)     | nestjs-best-practices, nestjs-architecture, nestjs-testing    | nestjs-orm-drizzle | <cmd> | <cmd> |
| mobile (Flutter) | flutter-best-practices, flutter-architecture, flutter-testing | —                  | <cmd> | <cmd> |

### Layer map (for architecture-reviewer)
| Layer | Path glob |
|-------|-----------|
| core   | libs/core/** |
| shared | libs/shared-contracts/** |
| api    | apps/api/** |
| web    | apps/web/** |
| mobile | apps/mobile/** |

### Environment constraints
<free text: offline test requirement, DB test strategy, CI network policy, ...>

## Resolution rules

> **Stack Manifest resolution.** Read the `## SDD Stack Manifest` section of the project's `CLAUDE.md`.
> 1. For files under a surface's Layer-map paths, load that surface's Paved-path + Library skills before writing/reviewing that surface.
> 2. Use the surface's Test/Typecheck commands for verification.
> 3. Derive the architecture forbidden-import matrix from the Layer map.
> 4. If the manifest is absent, fall back to any stack guidance stated in prose in `CLAUDE.md`, else operate stack-neutrally (foundations skills only). Referencing a skill from an uninstalled plugin is NOT an error — note it and proceed with foundations only. Never invent requirements or violations from a missing manifest.
```

Trim the rows to whichever surfaces the project actually has, and fill in the
real test/typecheck commands. If a project has no manifest, the pipeline
falls back to prose stack guidance in `CLAUDE.md`, or operates stack-neutrally
using only the `engineering-foundations` skills — a missing manifest is never
treated as a violation.

### 3. Run order

1. `@spec-creator` (or "write a spec for …") → `docs/specs/SPEC-*.md`.
   Review and approve the spec before moving on.
2. `@implementation-planner` → `docs/plans/<feature>.md`. The plan records an
   execution mode — choose multi-agent (parallel implementer waves) or
   single-agent, depending on the feature's size and parallelizability.
3. `/sdd-engineering:run-plan docs/plans/<feature>.md` — orchestrates
   implementer wave(s), a test-writer gap pass, the green barrier (tests +
   typecheck), `architecture-reviewer` ∥ `plan-verifier`, and a bounded fix
   loop, ending in a wrap-up report. Never commits, pushes, opens a PR, or
   runs migrations — review the diff yourself before doing any of that.
4. `/sdd-engineering:workflow-retro` — measures the run's true token/tool/
   duration/parallelism metrics from on-disk journals, produces insights with
   concrete actions, and appends a trend row to the retro ledger.

### 4. Optional components

- `researcher` (from `research-tools`) — usable standalone, or invoked by
  `spec-creator` to fill spec gaps.
- `workflow-retro` — post-run retrospective (see run order step 4 above).
- `engineering-insights` — captures durable, non-obvious engineering
  knowledge (gotchas, root causes, antipatterns, decisions) into the project's
  `docs/engineering-insights.md`.
- `mermaid-diagram` — creates Mermaid diagrams for specs, plans, and reports.
- `architecture-reviewer` (from `architecture-review`) can also be run
  standalone against a diff, outside the `run-plan` pipeline.

`engineering-foundations` is required — it's a direct dependency of both
`architecture-review` and `sdd-engineering`. `research-tools` and
`architecture-review`, in turn, are pulled in as dependencies of
`sdd-engineering` (see the install order above).

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
