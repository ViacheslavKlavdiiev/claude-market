# SDD Engineering Core (Stage A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four production plugins to `claude-market` that port the SDD workflow from `SyukPublic/dev-digest-ai-marketplace`, adapted to be stack-agnostic and driven by a project Stack Manifest.

**Architecture:** Four plugins — `engineering-foundations` (stack-neutral knowledge skills), `research-tools` (researcher agent), `architecture-review` (architecture-reviewer agent), `sdd-engineering` (5 agents + 4 skills, the flow). Each ported from a known upstream source file with a precise, listed set of edits that (a) replace hardcoded React/Next/Fastify surface tables with Stack-Manifest resolution and (b) rehome preloaded skills onto `engineering-foundations`.

**Tech Stack:** Claude Code plugins (markdown agents + `SKILL.md` skills), JSON manifests, one stdlib Python script (`retro_metrics.py`). Validation via `claude plugin validate .` and `node scripts/build-site.mjs`.

## Global Constraints

- All repository content is **English-only** (specs, plugins, docs, code, commit messages).
- Every plugin: `.claude-plugin/plugin.json` (name = dir name, SemVer `version`, `description`, `author.name`, `license: MIT`, `keywords`), plus `README.md` and `CHANGELOG.md`. `version` lives ONLY in `plugin.json`; `category` lives ONLY in the marketplace entry.
- Components (`skills/`, `agents/`) live at the plugin ROOT; `.claude-plugin/` holds only `plugin.json`.
- Paths: use `${CLAUDE_PLUGIN_ROOT}` for any shipped file reference; never use `../`.
- Dependency edges: `architecture-review` → `engineering-foundations`; `sdd-engineering` → `engineering-foundations`, `research-tools`, `architecture-review`. Declare via the `dependencies` array in `plugin.json` (form `"<name>@^X.Y.Z"`, matching the reference `sdd-engineering` manifest).
- No component may hardcode React, Next.js, Fastify, RTL, `NextRequest`/`NextResponse`, or a specific ORM query-builder call as the ONLY example — surface skills and test/typecheck commands resolve through the Stack Manifest.
- Every new plugin must pass `claude plugin validate .`; the whole marketplace must pass `node scripts/build-site.mjs`.
- Upstream source base URL (fetch each file with `curl -s <url>`):
  `https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/`
  (Session fallback: verbatim copies exist in the scratchpad `dd/` dir with `/` → `__`.)
- Reuse the existing template: `cp -r plugins/example-plugin plugins/<new>` then strip the example skill/agent/command you don't need, to inherit correct structure.

## Stack Manifest (shared artifact — referenced by several tasks)

The canonical template both shipped as a file (Task 4) and echoed in the repo README (Task 7):

```markdown
## SDD Stack Manifest

| Surface | Paved-path skills | Library skill | Test command | Typecheck command |
|---------|-------------------|---------------|--------------|-------------------|
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
```

**Resolution rules** (embed this text verbatim wherever a task says "insert the manifest-resolution block"):

> **Stack Manifest resolution.** Read the `## SDD Stack Manifest` section of the project's `CLAUDE.md`.
> 1. For files under a surface's Layer-map paths, load that surface's Paved-path + Library skills before writing/reviewing that surface.
> 2. Use the surface's Test/Typecheck commands for verification.
> 3. Derive the architecture forbidden-import matrix from the Layer map.
> 4. If the manifest is absent, fall back to any stack guidance stated in prose in `CLAUDE.md`, else operate stack-neutrally (foundations skills only). Referencing a skill from an uninstalled plugin is NOT an error — note it and proceed with foundations only. Never invent requirements or violations from a missing manifest.

## File Structure

```
plugins/engineering-foundations/
  .claude-plugin/plugin.json
  README.md  CHANGELOG.md
  skills/clean-architecture/SKILL.md (+ examples.md, references.md)
  skills/security/SKILL.md (+ checklists.md, examples.md, references.md)
plugins/research-tools/
  .claude-plugin/plugin.json
  README.md  CHANGELOG.md
  agents/researcher.md
plugins/architecture-review/
  .claude-plugin/plugin.json
  README.md  CHANGELOG.md
  agents/architecture-reviewer.md
plugins/sdd-engineering/
  .claude-plugin/plugin.json
  README.md  CHANGELOG.md
  agents/{spec-creator,implementation-planner,implementer,test-writer,plan-verifier}.md
  skills/run-plan/SKILL.md (+ references/spawn-prompts.md, references/stack-manifest.md)
  skills/workflow-retro/SKILL.md (+ scripts/retro_metrics.py)
  skills/engineering-insights/SKILL.md (+ reference.md)
  skills/mermaid-diagram/SKILL.md (+ examples.md)
.claude-plugin/marketplace.json   (4 new entries + version bump)
README.md                          (usage guide section)
```

---

### Task 1: `engineering-foundations` plugin

**Files:**
- Create: `plugins/engineering-foundations/.claude-plugin/plugin.json`
- Create: `plugins/engineering-foundations/README.md`, `CHANGELOG.md`
- Create: `plugins/engineering-foundations/skills/clean-architecture/{SKILL.md,examples.md,references.md}`
- Create: `plugins/engineering-foundations/skills/security/{SKILL.md,checklists.md,examples.md,references.md}`
- Modify: `.claude-plugin/marketplace.json` (add entry)

**Interfaces:**
- Produces: skill ids `clean-architecture`, `security` (loaded by later plugins). Plugin name `engineering-foundations`, initial version `0.1.0`.

- [ ] **Step 1: Scaffold from template**

```bash
cp -r plugins/example-plugin plugins/engineering-foundations
rm -rf plugins/engineering-foundations/commands plugins/engineering-foundations/agents
rm -rf plugins/engineering-foundations/skills/hello-skill
mkdir -p plugins/engineering-foundations/skills/clean-architecture
mkdir -p plugins/engineering-foundations/skills/security
```

- [ ] **Step 2: Write `plugin.json`**

```json
{
  "name": "engineering-foundations",
  "version": "0.1.0",
  "description": "Stack-neutral engineering knowledge skills (clean architecture, security) shared by the SDD workflow agents.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["architecture", "security", "clean-architecture", "sdd", "foundations"]
}
```

- [ ] **Step 3: Port the `security` skill (verbatim)**

Fetch and save unchanged (already stack-neutral):
```bash
BASE=https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/engineering-paved-path/skills/security
curl -s $BASE/SKILL.md      -o plugins/engineering-foundations/skills/security/SKILL.md
curl -s $BASE/checklists.md -o plugins/engineering-foundations/skills/security/checklists.md
curl -s $BASE/examples.md   -o plugins/engineering-foundations/skills/security/examples.md
curl -s $BASE/references.md -o plugins/engineering-foundations/skills/security/references.md
```
Then read `SKILL.md` and, if the frontmatter `description` or body references a specific stack (React/Next/Fastify), generalize that wording; otherwise leave as-is. Verify sibling links still resolve.

- [ ] **Step 4: Port the `onion-architecture` skill as `clean-architecture` (adapted)**

```bash
BASE=https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/engineering-paved-path/skills/onion-architecture
curl -s $BASE/SKILL.md      -o plugins/engineering-foundations/skills/clean-architecture/SKILL.md
curl -s $BASE/examples.md   -o plugins/engineering-foundations/skills/clean-architecture/examples.md
curl -s $BASE/references.md -o plugins/engineering-foundations/skills/clean-architecture/references.md
```
Apply these edits to all three files:
- Frontmatter `name:` → `clean-architecture`.
- Rewrite the `description:` to: `Use when designing or reviewing layered/onion architecture in any stack — dependency direction, layer boundaries, ports/adapters, composition root. Layer names come from the project's Stack Manifest layer map.`
- Replace hardcoded package-name conventions (`core/**`, `server/**`, `client/**`, `modules/**`, `adapters/**`, `packages/shared`) with a statement that "layer names are the project's, taken from the Stack Manifest Layer map; the examples below use placeholder names." Keep the concept intact (inward-only dependencies; thin controllers/routes; pure services; repositories/adapters at the edge; composition root; never leak an ORM query-builder or SDK client inward).
- Remove any dependency-cruiser / TS-only enforcement instruction that assumes a specific tool; state the rule stack-neutrally and note enforcement tooling is project-specific.
- Fix any sibling file links renamed by this task.

- [ ] **Step 5: Write `README.md` and `CHANGELOG.md`**

README: one paragraph on purpose (stack-neutral foundation skills the SDD agents preload), a list of the two skills with one line each, and a note that it is a dependency of `architecture-review` and `sdd-engineering`. CHANGELOG: a `## 0.1.0` entry dated 2026-07-23 — "Initial release: clean-architecture and security skills."

- [ ] **Step 6: Register in `marketplace.json`**

Add to the `plugins` array (after `example-plugin`):
```json
{
  "name": "engineering-foundations",
  "source": "./engineering-foundations",
  "description": "Stack-neutral engineering knowledge skills (clean architecture, security).",
  "category": "development",
  "keywords": ["architecture", "security", "foundations"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 7: Validate**

Run: `claude plugin validate .`
Expected: PASS (no errors for `engineering-foundations`).

- [ ] **Step 8: Grep gate — no hardcoded stack, no `../`**

Run:
```bash
grep -rniE 'react|next\.js|fastify|nextrequest|nextresponse' plugins/engineering-foundations || echo "CLEAN"
grep -rn '\.\./' plugins/engineering-foundations || echo "NO-PARENT-PATHS"
```
Expected: `CLEAN` and `NO-PARENT-PATHS` (or only incidental prose matches you have justified in the generalization edits).

- [ ] **Step 9: Commit**

```bash
git add plugins/engineering-foundations .claude-plugin/marketplace.json
git commit -m "feat: add engineering-foundations plugin (clean-architecture, security)"
```

---

### Task 2: `research-tools` plugin

**Files:**
- Create: `plugins/research-tools/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/research-tools/agents/researcher.md`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Produces: agent id `researcher` (invoked by `spec-creator` via the Agent tool). Plugin name `research-tools`, version `0.1.0`.

- [ ] **Step 1: Scaffold**

```bash
cp -r plugins/example-plugin plugins/research-tools
rm -rf plugins/research-tools/commands plugins/research-tools/skills
rm -f plugins/research-tools/agents/hello-agent.md
```

- [ ] **Step 2: Port the `researcher` agent (verbatim)**

```bash
curl -s https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/research-tools/agents/researcher.md \
  -o plugins/research-tools/agents/researcher.md
```
Read it and confirm it is stack-neutral (PROJECT/WEB modes, interview-first, mandatory "Not found" section, High/Medium/Low confidence, model `sonnet`). No content edits expected. If the frontmatter references `${CLAUDE_PLUGIN_ROOT}`-relative files, confirm they exist; the reference ships none.

- [ ] **Step 3: Write `plugin.json`**

```json
{
  "name": "research-tools",
  "version": "0.1.0",
  "description": "Read-only investigation agent for codebase and web research, used by the SDD workflow.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["research", "investigation", "agent", "sdd"]
}
```

- [ ] **Step 4: Write `README.md` and `CHANGELOG.md`**

README: purpose (the `researcher` agent; PROJECT vs WEB modes; used standalone or by `spec-creator`). CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 5: Register in `marketplace.json`**

```json
{
  "name": "research-tools",
  "source": "./research-tools",
  "description": "Read-only investigation agent for codebase and web research.",
  "category": "development",
  "keywords": ["research", "investigation", "agent"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 6: Validate + grep gate**

Run:
```bash
claude plugin validate .
grep -rn '\.\./' plugins/research-tools || echo "NO-PARENT-PATHS"
```
Expected: validate PASS; `NO-PARENT-PATHS`.

- [ ] **Step 7: Commit**

```bash
git add plugins/research-tools .claude-plugin/marketplace.json
git commit -m "feat: add research-tools plugin (researcher agent)"
```

---

### Task 3: `architecture-review` plugin

**Files:**
- Create: `plugins/architecture-review/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/architecture-review/agents/architecture-reviewer.md`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: `clean-architecture`, `security` skills from `engineering-foundations` (Task 1).
- Produces: agent id `architecture-reviewer` (spawned by `run-plan` Stage 4). Plugin name `architecture-review`, version `0.1.0`, depends on `engineering-foundations@^0.1.0`.

- [ ] **Step 1: Scaffold**

```bash
cp -r plugins/example-plugin plugins/architecture-review
rm -rf plugins/architecture-review/commands plugins/architecture-review/skills
rm -f plugins/architecture-review/agents/hello-agent.md
curl -s https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/architecture-review/agents/architecture-reviewer.md \
  -o plugins/architecture-review/agents/architecture-reviewer.md
```

- [ ] **Step 2: Apply adaptation edits to `architecture-reviewer.md`**

Edit the fetched file:
1. **Preloaded skills:** wherever it loads `onion-architecture`, `typescript-expert`, `security`, change to load `clean-architecture` and `security` (drop `typescript-expert` from the always-on set — add a note it is loaded per-surface via the manifest in stacked projects). Rename every in-prose `onion-architecture` skill reference to `clean-architecture`.
2. **Forbidden-import matrix:** replace the hardcoded package names (`core/**`, `server/**`, `client/**`, `modules/**`, `adapters/**`, `packages/shared`) with: "derive the layers and their path globs from the project's Stack Manifest Layer map; the matrix below is expressed over those layer names." Preserve the eight inward-only rules and the CRITICAL/HIGH/MEDIUM/LOW severity model verbatim.
3. **HIGH examples:** make stack-neutral. Replace "`NextRequest`/`NextResponse` used in domain logic" with "framework request/response types used in domain/core logic"; replace "raw query-builder calls (`.select()/.where()/db.query()`) in a service or route" with "raw ORM/query-builder calls in a service or route (concrete signatures per the project's ORM)". Remove any other Next/Fastify-specific token as the sole example.
4. Insert the **manifest-resolution block** (from the plan header) where the agent decides which layer map to use.
5. Preserve verbatim: the CAPRA evidence-first rule, the "do NOT flag" list, package-invariant checks, proposed-diff handling, and the required final line `### Gate verdict: PASS|FAIL`.
6. Confirm frontmatter `model: opus`, `effort: xhigh`, tools `Read, Grep, Glob, Bash, Skill` are intact.

- [ ] **Step 3: Write `plugin.json` (with dependency)**

```json
{
  "name": "architecture-review",
  "version": "0.1.0",
  "description": "Read-only architecture auditor: checks layer contracts and dependency direction, emits a PASS/FAIL gate verdict.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["architecture", "review", "audit", "clean-architecture", "sdd"],
  "dependencies": ["engineering-foundations@^0.1.0"]
}
```

- [ ] **Step 4: Write `README.md` and `CHANGELOG.md`**

README: what the reviewer checks (layer contracts, forbidden imports — driven by the manifest Layer map), the PASS/FAIL verdict, that it is read-only, and that it can run standalone against a diff or be spawned by `run-plan`. Note the `engineering-foundations` dependency. CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 5: Register in `marketplace.json`**

```json
{
  "name": "architecture-review",
  "source": "./architecture-review",
  "description": "Read-only architecture auditor with a PASS/FAIL gate verdict.",
  "category": "development",
  "keywords": ["architecture", "review", "audit"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 6: Validate + gates**

Run:
```bash
claude plugin validate .
grep -c 'Gate verdict: PASS|FAIL' plugins/architecture-review/agents/architecture-reviewer.md
grep -rniE 'nextrequest|nextresponse|fastify' plugins/architecture-review || echo "CLEAN"
grep -rn '\.\./' plugins/architecture-review || echo "NO-PARENT-PATHS"
```
Expected: validate PASS; gate-verdict count ≥ 1; `CLEAN`; `NO-PARENT-PATHS`.

- [ ] **Step 7: Commit**

```bash
git add plugins/architecture-review .claude-plugin/marketplace.json
git commit -m "feat: add architecture-review plugin (manifest-driven architecture-reviewer)"
```

---

### Task 4: `sdd-engineering` plugin — skills

**Files:**
- Create: `plugins/sdd-engineering/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/sdd-engineering/skills/run-plan/SKILL.md`, `references/spawn-prompts.md`, `references/stack-manifest.md`
- Create: `plugins/sdd-engineering/skills/workflow-retro/SKILL.md`, `scripts/retro_metrics.py`
- Create: `plugins/sdd-engineering/skills/engineering-insights/SKILL.md`, `reference.md`
- Create: `plugins/sdd-engineering/skills/mermaid-diagram/SKILL.md`, `examples.md`

**Interfaces:**
- Consumes: `architecture-reviewer` (Task 3), `researcher` (Task 2) — spawned by `run-plan`. Consumes agents from Task 5 (spawned by `run-plan`).
- Produces: skill ids `run-plan`, `workflow-retro`, `engineering-insights`, `mermaid-diagram`, and the shipped `stack-manifest.md` reference. Plugin name `sdd-engineering`, version `0.1.0`.

- [ ] **Step 1: Scaffold + fetch all skill sources**

```bash
cp -r plugins/example-plugin plugins/sdd-engineering
rm -rf plugins/sdd-engineering/commands plugins/sdd-engineering/skills/hello-skill
rm -f plugins/sdd-engineering/agents/hello-agent.md
S=plugins/sdd-engineering/skills
BASE=https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/sdd-engineering/skills
mkdir -p $S/run-plan/references $S/workflow-retro/scripts $S/engineering-insights $S/mermaid-diagram
curl -s $BASE/run-plan/SKILL.md                     -o $S/run-plan/SKILL.md
curl -s $BASE/run-plan/references/spawn-prompts.md   -o $S/run-plan/references/spawn-prompts.md
curl -s $BASE/workflow-retro/SKILL.md                -o $S/workflow-retro/SKILL.md
curl -s $BASE/workflow-retro/scripts/retro_metrics.py -o $S/workflow-retro/scripts/retro_metrics.py
curl -s $BASE/engineering-insights/SKILL.md          -o $S/engineering-insights/SKILL.md
curl -s $BASE/engineering-insights/reference.md      -o $S/engineering-insights/reference.md
curl -s $BASE/mermaid-diagram/SKILL.md               -o $S/mermaid-diagram/SKILL.md
curl -s $BASE/mermaid-diagram/examples.md            -o $S/mermaid-diagram/examples.md
```

- [ ] **Step 2: Port `workflow-retro`, `engineering-insights`, `mermaid-diagram` (verbatim)**

These three are stack-agnostic. Read each `SKILL.md` and confirm no React/Next/Fastify references and no `../` paths; leave content unchanged. Confirm `retro_metrics.py` is stdlib-only:
```bash
python3 -c "import ast,sys; t=ast.parse(open('plugins/sdd-engineering/skills/workflow-retro/scripts/retro_metrics.py').read()); mods={n.names[0].name.split('.')[0] for n in ast.walk(t) if isinstance(n,(ast.Import,))}|{n.module.split('.')[0] for n in ast.walk(t) if isinstance(n,ast.ImportFrom) and n.module}; std=set(sys.stdlib_module_names); print('NON-STDLIB:', mods-std or 'NONE')"
```
Expected: `NON-STDLIB: NONE`. Confirm any path the SKILL.md tells the user to run uses `${CLAUDE_PLUGIN_ROOT}/skills/workflow-retro/scripts/retro_metrics.py`; if it uses a bare/relative path, edit it to the `${CLAUDE_PLUGIN_ROOT}` form.

- [ ] **Step 3: Adapt `run-plan/SKILL.md`**

Apply edits:
1. **Green barrier (Stage 3):** where it reads test/typecheck commands "from `CLAUDE.md`", change to "from the Stack Manifest for the touched surfaces (see `references/stack-manifest.md`), falling back to `CLAUDE.md` prose."
2. Insert the **manifest-resolution block** (plan header) near the pre-flight where the orchestrator establishes stack context.
3. Preserve verbatim every gate and stage: Gate 0 plan gate; clean-tree check; e2e prereq probe; dependency graph/waves; wave-balance gate; design brief; ownership map; Stage 1 eager implementer waves; Stage 2 test-writer gap pass; Stage 3 green barrier; Stage 4 parallel `architecture-reviewer` ∥ `plan-verifier`; Stage 5 triage table + ≤2-iteration fix loop + no-progress guard; Stage 6 wrap-up + `## Run-plan report`; never commit/push/PR/migrate.
4. Confirm it references the shipped `references/spawn-prompts.md` via a `${CLAUDE_PLUGIN_ROOT}`-relative path; fix if bare.

- [ ] **Step 4: Adapt `run-plan/references/spawn-prompts.md`**

In each spawn template that names surface skills (React/Next/Fastify), replace with the manifest-driven phrasing: "load the paved-path and library skills the Stack Manifest lists for this surface." Keep the `{{placeholder}}` fill structure and all other template text intact.

- [ ] **Step 5: Create `run-plan/references/stack-manifest.md`**

Write the Stack Manifest template and resolution rules exactly as given in the plan header ("Stack Manifest" section + "Resolution rules" blockquote). This is the single source shipped with the plugin.

- [ ] **Step 6: Write `plugin.json` (with dependencies)**

```json
{
  "name": "sdd-engineering",
  "version": "0.1.0",
  "description": "Spec-Driven Development workflow: spec, plan, orchestrated implementation with review gates, and retrospective — stack-agnostic and manifest-driven.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["sdd", "spec-driven", "workflow", "planning", "orchestration"],
  "dependencies": [
    "engineering-foundations@^0.1.0",
    "research-tools@^0.1.0",
    "architecture-review@^0.1.0"
  ]
}
```

- [ ] **Step 7: Write `README.md` and `CHANGELOG.md`**

README: the pipeline diagram (`spec-creator → implementation-planner → run-plan → workflow-retro`), the run-plan internal stages, artifact paths (`docs/specs/`, `docs/plans/`, `docs/retros/`, `docs/engineering-insights.md`), a pointer to `references/stack-manifest.md`, and the dependency list. CHANGELOG `## 0.1.0` dated 2026-07-23. (The agents themselves are added in Task 5 — note them in the README now; the plugin validates without them but the marketplace entry is added in Task 5.)

- [ ] **Step 8: Grep gate (skills only)**

Run:
```bash
grep -rniE 'react|next\.js|fastify|\brtl\b|testing-library/react' plugins/sdd-engineering/skills || echo "CLEAN"
grep -rn '\.\./' plugins/sdd-engineering/skills || echo "NO-PARENT-PATHS"
grep -c 'Run-plan report' plugins/sdd-engineering/skills/run-plan/SKILL.md
```
Expected: `CLEAN`; `NO-PARENT-PATHS`; report-count ≥ 1.

- [ ] **Step 9: Commit**

```bash
git add plugins/sdd-engineering
git commit -m "feat: add sdd-engineering skills (run-plan, workflow-retro, engineering-insights, mermaid-diagram) + stack manifest"
```

---

### Task 5: `sdd-engineering` plugin — agents

**Files:**
- Create: `plugins/sdd-engineering/agents/{spec-creator,implementation-planner,implementer,test-writer,plan-verifier}.md`
- Modify: `.claude-plugin/marketplace.json` (add `sdd-engineering` entry)

**Interfaces:**
- Consumes: `clean-architecture`, `security` (Task 1); `mermaid-diagram` (Task 4); `researcher` (Task 2); the Stack Manifest.
- Produces: agent ids `spec-creator`, `implementation-planner`, `implementer`, `test-writer`, `plan-verifier` (spawned by `run-plan`).

- [ ] **Step 1: Fetch all five agent sources**

```bash
A=plugins/sdd-engineering/agents
BASE=https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/sdd-engineering/agents
for f in spec-creator implementation-planner implementer test-writer plan-verifier; do
  curl -s $BASE/$f.md -o $A/$f.md
done
```

- [ ] **Step 2: Global surface-table edit (apply to planner, implementer, test-writer, plan-verifier)**

In each agent that has a per-surface skill table listing React/Next/Fastify, replace the table with the **manifest-resolution block** (plan header). Change any always-on `typescript-expert` preload to "loaded per-surface via the manifest (never in stack-neutral projects)." Rename `onion-architecture` skill references to `clean-architecture`. Do NOT alter each agent's role-specific rules, gates, or output contracts beyond this.

- [ ] **Step 3: Adapt `spec-creator.md`**

Edits: preloaded skills reduced to `mermaid-diagram` + `security`; in the "NEVER load how-level skills" rule, replace the React/Next/Fastify/typescript-expert names with our stack skill names (`angular-*`, `flutter-*`, `nestjs-*`, `typescript-expert`). Preserve verbatim: write-boundary (spec files only), English-only + translate-for-approval gate, WHAT/WHY-not-HOW, untrusted-inputs rule, DesignSync fallback, living-spec policy, append-only AC-IDs, multi-call interview model, mandatory design-analysis gap sweep, `researcher` delegation (≤3 parallel), EARS patterns, 11-item self-check, fixed spec structure, `docs/specs/SPEC-*.md` path.

- [ ] **Step 4: Adapt `test-writer.md`**

Edits: replace the RTL-specific rules section AND the Fastify-specific backend rules section with a manifest-driven instruction: "apply the testing skill the Stack Manifest names for this surface; if none is available, write framework-idiomatic tests and record the gap." Remove the Next-specific "Async Server Components cannot be tested → route to E2E" note. Preserve verbatim: write-boundary (test files + e2e dir only; no Bash write-bypass), mock-policy-by-layer principle (never mock the unit under test; ≥1 behavioral assertion), intention-guided generation, blocking self-verification gate, model `sonnet`.

- [ ] **Step 5: Confirm `implementation-planner`, `implementer`, `plan-verifier` role rules intact**

Read each and confirm the Step-2 edit did not remove role logic. Specifically confirm present: planner input gate + two-pass stop-and-ask incl. "multi-agent or single-agent?" + execution modes + phase-size balance + dependency-minimality + global task IDs + bidirectional RTM + context-pack rule; implementer stay-in-slice + DoD + adopt→adapt→invent + no-publishing; plan-verifier read-only + hard gate + two-phase extract-then-audit + five verdicts + evidence-mandatory + RTM output + spec-status recommendation.

- [ ] **Step 6: Register `sdd-engineering` in `marketplace.json`**

```json
{
  "name": "sdd-engineering",
  "source": "./sdd-engineering",
  "description": "Spec-Driven Development workflow: spec, plan, orchestrated implementation with review gates, and retrospective.",
  "category": "development",
  "keywords": ["sdd", "spec-driven", "workflow", "orchestration"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 7: Validate + gates**

Run:
```bash
claude plugin validate .
grep -rniE 'testing-library/react|nextrequest|fastify|async server component' plugins/sdd-engineering/agents || echo "CLEAN"
grep -rn '\.\./' plugins/sdd-engineering/agents || echo "NO-PARENT-PATHS"
ls plugins/sdd-engineering/agents | wc -l
```
Expected: validate PASS; `CLEAN`; `NO-PARENT-PATHS`; agent count = 5.

- [ ] **Step 8: Commit**

```bash
git add plugins/sdd-engineering .claude-plugin/marketplace.json
git commit -m "feat: add sdd-engineering agents (spec-creator, planner, implementer, test-writer, plan-verifier)"
```

---

### Task 6: Marketplace version bump + full quality gate

**Files:**
- Modify: `.claude-plugin/marketplace.json` (bump `metadata.version`)

**Interfaces:**
- Consumes: all four plugins registered (Tasks 1–5).

- [ ] **Step 1: Bump marketplace version**

In `.claude-plugin/marketplace.json`, change `metadata.version` from `0.1.0` to `0.2.0` (new plugins added).

- [ ] **Step 2: Run the full build-site quality gate**

Run: `node scripts/build-site.mjs`
Expected: exits 0; no errors about missing descriptions/versions or duplicate component ids; `_site/` regenerated with pages for all four new plugins and their components.

- [ ] **Step 3: Run full validation**

Run: `claude plugin validate .`
Expected: PASS for the whole marketplace.

- [ ] **Step 4: Verify dependency edges resolve**

Run:
```bash
grep -o '"dependencies": \[[^]]*\]' plugins/architecture-review/.claude-plugin/plugin.json
grep -o '"dependencies": \[[^]]*\]' plugins/sdd-engineering/.claude-plugin/plugin.json
```
Expected: architecture-review → engineering-foundations; sdd-engineering → all three.

- [ ] **Step 5: Commit**

```bash
git add .claude-plugin/marketplace.json _site
git commit -m "chore: bump marketplace to 0.2.0 and rebuild catalog site"
```

---

### Task 7: Repository README usage guide

**Files:**
- Modify: `README.md` (add "Using the SDD workflow" section)

**Interfaces:**
- Consumes: the four plugin names + the Stack Manifest template (Task 4).

- [ ] **Step 1: Add the usage section**

Insert a new `## Using the SDD workflow` section into `README.md` (after "Add a new plugin" or before "Catalog site"). It MUST contain:

1. **Install order** (fenced block):
```
/plugin marketplace add ViacheslavKlavdiiev/claude-market
/plugin install engineering-foundations@claude-market
/plugin install research-tools@claude-market
/plugin install architecture-review@claude-market
/plugin install sdd-engineering@claude-market
```
plus a line: "Stage B stack/library plugins (Angular / Flutter / NestJS, PrimeNG, Drizzle) are optional and installed per project once published."

2. **Set up the Stack Manifest**: paste the template from `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md` and say it goes in the target project's `CLAUDE.md`.

3. **Run order**:
   - `@spec-creator` (or "write a spec for …") → `docs/specs/SPEC-*.md`; review + approve.
   - `@implementation-planner` → `docs/plans/<feature>.md`; choose multi-agent vs single-agent.
   - `/sdd-engineering:run-plan docs/plans/<feature>.md` → orchestrates implementation, testing, review, fixes.
   - `/sdd-engineering:workflow-retro` → metrics + insights.

4. **Optional components** list: `researcher` (standalone or used by spec-creator), `workflow-retro`, `engineering-insights`, `mermaid-diagram`, and running `architecture-review` standalone against a diff. State that `engineering-foundations` is required (dependency of the other two); `research-tools`, `architecture-review` are pulled in as dependencies of `sdd-engineering`.

- [ ] **Step 2: Verify README renders + gate still green**

Run: `node scripts/build-site.mjs`
Expected: exits 0.

- [ ] **Step 3: Commit**

```bash
git add README.md _site
git commit -m "docs: add SDD workflow usage guide (install order, run order, optional components)"
```

---

## Self-Review

**Spec coverage:** AC-1/2/3 → Tasks 1–6 (manifests, packaging, dependency edges). AC-4/5 → Tasks 1,2,3,5 (component inventory). AC-6/7/8 → Tasks 3,4,5 (manifest resolution + shipped template + graceful fallback). AC-9 → Task 3 (gate verdict + Layer-map matrix). AC-10 → Tasks 4 (run-plan gates). AC-11 → Task 5 (test-writer boundaries). AC-12 → Task 5 (spec-creator). AC-13/14 → Tasks 1–3,5,6 (validate + build-site gates). AC-15 → grep gates in every task + stdlib check in Task 4. AC-16 → Task 7 (README). AC-17 → Global Constraints (English-only, enforced by review). All ACs mapped.

**Placeholder scan:** No "TBD"/"implement later". Porting steps give exact fetch URLs + explicit edit lists (the "code" for a markdown port). Verification steps give exact commands + expected output.

**Type/name consistency:** Plugin names, skill ids, and agent ids are consistent across tasks (`engineering-foundations`, `clean-architecture`, `security`, `researcher`, `architecture-reviewer`, `run-plan`, `workflow-retro`, `engineering-insights`, `mermaid-diagram`, `spec-creator`, `implementation-planner`, `implementer`, `test-writer`, `plan-verifier`). Dependency versions `^0.1.0` match the `0.1.0` plugin versions. Marketplace bumped to `0.2.0` once.

**Note for executor:** Tasks must run in order 1 → 5 (dependency edges); Tasks 6 and 7 are terminal. If the upstream raw URLs are unreachable, fall back to the session scratchpad `dd/` copies (filenames use `__` for `/`).
