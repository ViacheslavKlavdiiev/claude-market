# Changelog

## 0.1.0 - 2026-07-23

- Initial release.
- `run-plan`: orchestrates an approved Development Plan through the full
  implementation pipeline (implementer waves → test-writer gap pass → green
  barrier → `architecture-reviewer` ∥ `plan-verifier` → bounded fix loop →
  wrap-up report), ported from upstream and made manifest-driven — the green
  barrier's test/typecheck commands and the paved-path/library skills each
  writing agent loads are resolved from the project's Stack Manifest
  (`references/stack-manifest.md`), falling back to `CLAUDE.md` prose or
  stack-neutral operation when no manifest is present. Ships the manifest
  template + resolution rules (`references/stack-manifest.md`) and the
  spawn-prompt templates (`references/spawn-prompts.md`).
- `workflow-retro`: post-run retrospective producing true token/tool/duration/
  parallelism metrics from on-disk journals, insights with concrete actions,
  and a trend row in the retro ledger. Ported verbatim (stack-agnostic);
  bundled `scripts/retro_metrics.py` is stdlib-only.
- `engineering-insights`: captures durable engineering insights into the host
  project's insights log and prunes it on request. Ported verbatim
  (stack-agnostic).
- `mermaid-diagram`: creates Mermaid diagrams for specs, plans, and reports.
  Ported verbatim (stack-agnostic); illustrative examples genericized to a
  generic SPA + API frontend/backend split.
- Declares dependencies on `engineering-foundations@^0.1.0`,
  `research-tools@^0.1.0`, and `architecture-review@^0.1.0`. The five
  pipeline agents (`spec-creator`, `implementation-planner`, `implementer`,
  `test-writer`, `plan-verifier`) ship in a follow-up release.
