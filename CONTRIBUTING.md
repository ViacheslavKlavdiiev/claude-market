# Contributing

This is a personal, curated marketplace. The workflow below applies whether the
author is adding a plugin or an outside contributor proposes one.

## Ground rules

Every plugin must be **project-agnostic**: useful when installed into an arbitrary
repository. Plugins tied to a specific product, codebase, or internal workflow do
not belong here.

## From idea to release

1. **(For proposals) Open a plugin proposal issue** using the "Plugin proposal"
   template. Describe the purpose, the components (skills, agents, commands,
   hooks/MCP servers), and why the plugin is generic.
2. **Develop the plugin** under `plugins/<plugin-name>/`, following
   [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md).
3. **Register it** in `.claude-plugin/marketplace.json`. With
   `metadata.pluginRoot` set to `./plugins`, `"source": "<plugin-name>"` is enough.
4. **Validate and test locally:**

   ```
   claude plugin validate .
   node scripts/build-site.mjs      # runs the catalog quality gate
   ```

   Then in a Claude Code session: `/plugin marketplace add ./` from the repo root,
   `/plugin install <plugin-name>@claude-market`, and exercise every skill,
   command, and agent the plugin ships.
5. **Open a pull request** and fill in the PR template. CI must be green —
   [validate.yml](.github/workflows/validate.yml) runs the validator and the
   quality gate.
6. **Merge = release.** A merged version bump publishes to users the moment it
   lands on `main`; the release tag is created automatically. See
   [docs/RELEASES.md](docs/RELEASES.md).

## Review criteria

- Complies with [docs/PLUGIN-GUIDELINES.md](docs/PLUGIN-GUIDELINES.md).
- No secrets or credentials anywhere (see [docs/SECURITY.md](docs/SECURITY.md)).
- Hooks and scripts are portable (POSIX shell, forward slashes) and use
  `${CLAUDE_PLUGIN_ROOT}`.
- `version` bumped and `CHANGELOG.md` updated.
- Plugin README documents what the plugin does and what it executes.
