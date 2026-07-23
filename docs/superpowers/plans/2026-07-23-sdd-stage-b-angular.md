# SDD Stage B Increment 2 (Angular + PrimeNG) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add `angular-paved-path` (vendored official `angular-developer` + `angular-new-app` + house `angular-testing`) and `angular-ui-primeng` (authored swappable UI library) to `claude-market`, filling the Angular web surface.

**Architecture:** Vendor the MIT-licensed official Angular skill verbatim (faithful reuse, preserve attribution); add a thin house testing skill; author the PrimeNG library skill from research; keep the paved-path UI-agnostic so the UI library is swappable.

**Tech Stack:** Claude Code plugins (markdown skills), JSON manifests. Validation via `claude plugin validate .` + `node scripts/build-site.mjs`.

## Global Constraints

- ENGLISH-only.
- Every plugin: `.claude-plugin/plugin.json` (name = dir, SemVer version, description, author.name, `license: MIT`, keywords) + `README.md` + `CHANGELOG.md`. `version` only in `plugin.json`; `category` only in the marketplace entry. Components (`skills/`) at plugin ROOT.
- `${CLAUDE_PLUGIN_ROOT}` for shipped file refs; never `../`.
- Dependency edges (`dependencies` array, `^0.1.0`): `angular-paved-path` → `engineering-foundations`, `typescript-paved-path`; `angular-ui-primeng` → `angular-paved-path`.
- **Vendored content is verbatim** (prose unchanged) and keeps its MIT + `Copyright 2026 Google LLC` attribution: retain each file's frontmatter/header, add a `LICENSE` (MIT text) in the vendored skill subtree, and credit Google LLC in the plugin README. Do not rewrite Google's prose.
- **UI-swap spine invariant** — state VERBATIM in `angular-ui-primeng`: "The paved-path (`angular-paved-path`) contains no UI-library specifics. All PrimeNG component names, imports, providers, and theming live only in this skill. A project swaps its UI library by replacing this plugin (e.g. with `angular-ui-taiga`); the paved-path, forms, routing, and testing conventions are unchanged."
- **No PrimeNG anywhere in `angular-paved-path`** (`primeng`, `@primeng`, `p-`, `providePrimeNG`).
- Authored skills (`angular-testing`, `angular-ui-primeng`): frontmatter (`name`, `description` "Use when…"), "Rules to follow", "Review red flags", "Sources" (≥1 angular.dev / primeng.dev URL), version-gated rules marked (⚠️/`[vNN]`).
- Version-gate and hedge the verify-before-ship items (zoneless/`NgOptimizedImage` exact API, PrimeNG v22 licensing, `@angular/cdk` presence) — do not assert them flatly.
- Scaffold each plugin from `plugins/example-plugin`.
- Must pass `claude plugin validate .`; marketplace must pass `node scripts/build-site.mjs`.
- Upstream Angular skill base (curl): `https://raw.githubusercontent.com/angular/skills/main/`

## File Structure

```
plugins/angular-paved-path/
  .claude-plugin/plugin.json  README.md  CHANGELOG.md
  skills/angular-developer/SKILL.md (+ references/*.md, + LICENSE)
  skills/angular-new-app/SKILL.md
  skills/angular-testing/SKILL.md   (house-authored)
plugins/angular-ui-primeng/
  .claude-plugin/plugin.json  README.md  CHANGELOG.md
  skills/angular-ui-primeng/SKILL.md (+ references/rules.md if long)
.claude-plugin/marketplace.json   (2 new entries + bump 0.3.0 → 0.4.0)
README.md                          (optional-plugins list + manifest copy)
plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md  (web row)
```

---

### Task 1: `angular-paved-path` — vendor the official Angular skill

**Files:**
- Create: `plugins/angular-paved-path/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/angular-paved-path/skills/angular-developer/SKILL.md` + `references/*.md` + `LICENSE`
- Create: `plugins/angular-paved-path/skills/angular-new-app/SKILL.md`

**Interfaces:**
- Produces: skill ids `angular-developer`, `angular-new-app`. Plugin `angular-paved-path` v0.1.0 (marketplace entry + `angular-testing` in Task 2).

- [ ] **Step 1: Scaffold + vendor all upstream files**

```bash
cp -r plugins/example-plugin plugins/angular-paved-path
rm -rf plugins/angular-paved-path/commands plugins/angular-paved-path/agents plugins/angular-paved-path/skills/hello-skill
DEV=plugins/angular-paved-path/skills/angular-developer
NEW=plugins/angular-paved-path/skills/angular-new-app
mkdir -p $DEV/references $NEW
BASE=https://raw.githubusercontent.com/angular/skills/main
curl -s $BASE/angular-developer/SKILL.md -o $DEV/SKILL.md
curl -s $BASE/angular-new-app/SKILL.md   -o $NEW/SKILL.md
# fetch every reference file listed in the tree
for f in $(curl -s "https://api.github.com/repos/angular/skills/git/trees/main?recursive=1" \
  | grep -oE '"path": "angular-developer/references/[^"]*"' | sed 's/.*references\///;s/"//'); do
  curl -s "$BASE/angular-developer/references/$f" -o "$DEV/references/$f"
done
ls $DEV/references | wc -l   # expect ~38
```

- [ ] **Step 2: Preserve license + verify verbatim + portability**

- Confirm `SKILL.md` frontmatter retains `license: MIT` and the `Copyright 2026 Google LLC` attribution; do NOT edit the prose.
- Create `plugins/angular-paved-path/skills/angular-developer/LICENSE` with the MIT license text, copyright line "Copyright 2026 Google LLC", sourced from `github.com/angular/skills` (fetch `https://raw.githubusercontent.com/angular/skills/main/LICENSE` if present; else write the standard MIT text with that copyright).
- Portability: grep the vendored files for `../` or bare sibling paths that would break in the plugin cache. The upstream uses relative `references/foo.md` links inside the skill dir — those are fine (no `../`). Only if a file uses `../` outside its skill dir, note it (do not rewrite prose unless it actually breaks; prefer leaving verbatim and flagging).
```bash
grep -rn '\.\./' plugins/angular-paved-path/skills/angular-developer plugins/angular-paved-path/skills/angular-new-app || echo "NO-PARENT-PATHS"
grep -c 'MIT' plugins/angular-paved-path/skills/angular-developer/SKILL.md
```

- [ ] **Step 3: House preamble (separate file, do not edit Google's files)**

Create `plugins/angular-paved-path/skills/angular-developer/HOUSE-NOTES.md` (a sibling, referenced from the README, not injected into Google's SKILL.md): note (a) this skill is vendored verbatim from the official MIT Angular skills repo (link) and updated by re-vendoring; (b) the marketplace's version-gating + red-flags conventions; (c) that the swappable UI layer lives in `angular-ui-primeng` and the paved-path stays UI-agnostic. Keep it short.

- [ ] **Step 4: plugin.json (with dependencies)**

```json
{
  "name": "angular-paved-path",
  "version": "0.1.0",
  "description": "Angular web engineering skills: the official Angular developer skill (vendored) plus house testing conventions.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["angular", "frontend", "signals", "standalone", "paved-path", "sdd"],
  "dependencies": ["engineering-foundations@^0.1.0", "typescript-paved-path@^0.1.0"]
}
```

- [ ] **Step 5: README + CHANGELOG (with attribution)**

README: purpose (Angular surface knowledge); state clearly that `angular-developer` + `angular-new-app` are **vendored verbatim from the official MIT-licensed `github.com/angular/skills` (Copyright 2026 Google LLC)** and credit accordingly; list the three skills (note `angular-testing` ships with this plugin, added in the same release); note the paved-path is UI-agnostic and pairs with a UI library plugin (`angular-ui-primeng`); dependency note. CHANGELOG `## 0.1.0` dated 2026-07-23. (Attribution in README satisfies MIT notice; the skill `LICENSE` file carries the full text.)

- [ ] **Step 6: Validate + commit**

```bash
claude plugin validate .
git add plugins/angular-paved-path
git commit -m "feat: add angular-paved-path with vendored official Angular skill (MIT, Google LLC)"
```
Expected: validate PASS. (If unavailable, validate JSON via python3 + confirm structure; say so.)

---

### Task 2: `angular-paved-path` — house `angular-testing` skill + register

**Files:**
- Create: `plugins/angular-paved-path/skills/angular-testing/SKILL.md`
- Modify: `.claude-plugin/marketplace.json` (add `angular-paved-path` entry)

**Interfaces:**
- Produces: skill id `angular-testing`.

- [ ] **Step 1: Author `angular-testing/SKILL.md`**

Frontmatter `name: angular-testing`; `description:` "Use when writing or reviewing Angular tests — TestBed, component harnesses, RouterTestingHarness, Act-Wait-Assert. Complements the vendored angular-developer testing references."

**Rules to follow:**
- Reference (do not duplicate) the vendored official testing references: `angular-developer/references/{testing-fundamentals,component-harnesses,router-testing,e2e-testing}.md`.
- Runner: match the project — Vitest is the modern Angular default ⚠️`[v20/v21]`; use Karma/Jest if the project already does. Assume a zoneless-compatible setup on modern Angular.
- Pattern **Act-Wait-Assert**: Act (set input / click), Wait (`await fixture.whenStable()`), Assert. Do NOT force `fixture.detectChanges()` to push updates.
- **Component harnesses are the primary approach**: `TestbedHarnessEnvironment.loader(fixture)` → `loader.getHarness(X.with({...}))`; robust to DOM refactors, reusable unit+e2e.
- **Routing**: `RouterTestingHarness` + real `provideRouter()` with test routes (exercises real guards/resolvers); assert `harness.router.url` then `await harness.fixture.whenStable()`.
- **`@testing-library/angular` house policy**: allowed where a team prefers accessible-query ergonomics (`getByRole` > `getByLabelText` > `getByText` > `getByTestId`), but Angular harnesses remain the house default. Whichever is used, assert observable behavior (≥1 real assertion), never implementation details — consistent with `nestjs-testing` (mock at boundaries, don't assert on mock internals).
- **Verification-before-completion**: run `ng build` (and the test suite) after generating; fix errors before declaring done (adopted from the official skill).
- E2e: Playwright/Cypress/etc. via `ng add` + `ng e2e`; only set up if none configured or the user asks.

**Review red flags:** `fixture.detectChanges()` used to force updates instead of `await fixture.whenStable()`; brittle `By.css` DOM queries where a harness exists; a mocked `Router` instead of `RouterTestingHarness`; tests asserting on mock internals / call-count only; Protractor; skipping `ng build` verification.

**Sources:** the vendored `angular-developer/references/testing-*` files; https://angular.dev/guide/testing; cross-ref `nestjs-testing` for the shared behavioral-assertion philosophy. Mark version-gated items (⚠️ Vitest default `[v20/v21]`).

Keep it focused (this is a thin wrapper; no `references/` needed unless it grows past ~150 lines).

- [ ] **Step 2: Register `angular-paved-path` in marketplace.json**

```json
{
  "name": "angular-paved-path",
  "source": "./angular-paved-path",
  "description": "Angular web engineering skills (vendored official Angular skill + house testing).",
  "category": "development",
  "keywords": ["angular", "frontend", "signals", "testing"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 3: Validate + gates + commit**

```bash
claude plugin validate .
ls plugins/angular-paved-path/skills | sort   # expect: angular-developer angular-new-app angular-testing
grep -rniE 'primeng|providePrimeNG|@primeng|\bp-[a-z]' plugins/angular-paved-path && echo "CHECK: PrimeNG leak" || echo "PAVED-PATH-UI-AGNOSTIC"
grep -rn '\.\./' plugins/angular-paved-path/skills/angular-testing || echo "NO-PARENT-PATHS"
git add plugins/angular-paved-path .claude-plugin/marketplace.json
git commit -m "feat: add angular-testing house skill and register angular-paved-path"
```
Expected: PASS; 3 skills; `PAVED-PATH-UI-AGNOSTIC`; NO-PARENT-PATHS. (Note: the grep may match the word "primeng" in README/HOUSE-NOTES prose that merely *names* the UI plugin — that is allowed; confirm any hit is a plain mention of the `angular-ui-primeng` plugin name, not actual PrimeNG API/`p-*` component usage. If a real `p-*`/`providePrimeNG` usage appears, that's a leak to fix.)

---

### Task 3: `angular-ui-primeng` plugin (authored library skill)

**Files:**
- Create: `plugins/angular-ui-primeng/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/angular-ui-primeng/skills/angular-ui-primeng/SKILL.md` (+ `references/rules.md` if long)
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: `angular-paved-path`. Produces: skill id `angular-ui-primeng`. Plugin v0.1.0, depends on `angular-paved-path@^0.1.0`.

- [ ] **Step 1: Scaffold**

```bash
cp -r plugins/example-plugin plugins/angular-ui-primeng
rm -rf plugins/angular-ui-primeng/commands plugins/angular-ui-primeng/agents plugins/angular-ui-primeng/skills/hello-skill
mkdir -p plugins/angular-ui-primeng/skills/angular-ui-primeng
```

- [ ] **Step 2: Author `angular-ui-primeng/SKILL.md`**

Frontmatter `name: angular-ui-primeng`; `description:` "Use when building Angular UI with PrimeNG — install, token theming, standalone imports, Tailwind interop, tables/dialogs/forms, services. Swappable UI-library skill."

Open with the **UI-swap spine invariant** (verbatim, from Global Constraints), then a note: PrimeNG ships no official agent-skill; this skill is authored, grounded in primeng.dev `llms-full.txt` + the `@primeng/mcp` server (point users there for live doc lookups).

**Rules to follow** (mark version gates ⚠️`[vNN]`):
- Install `primeng` + `@primeng/themes`; configure in `app.config.ts` with `provideAnimationsAsync()` + `providePrimeNG({ theme: { preset: Aura } })` ⚠️`[v18+]`. Include the canonical snippet.
- ⚠️`[v18 breaking]` Do NOT import pre-v18 CSS/SASS theme files (`primeng/resources/...`) or use `PrimeNGConfig` — removed; theming is design-token + CSS-variable based (`--p-*`). Presets: Aura / Material / Lara / Nora via `@primeng/themes`.
- Import components individually into a standalone component's `imports:` (`import { Button } from 'primeng/button'` or `TableModule`) — never a global barrel (tree-shaking).
- Tailwind interop: use `tailwindcss-primeui`; enable `cssLayer` and order layers so Tailwind utilities win — ⚠️ Tailwind v4: `primeng` layer after `theme`+`base`, before `utilities`; Tailwind v3: `primeng` between base and utilities. Don't mix PrimeFlex with Tailwind.
- Override styling via `styleClass` + design tokens (`definePreset`, `--p-*`, `$dt()`), never `::ng-deep`. Dark mode via `darkModeSelector`.
- Services: provide `MessageService` (+ `<p-toast>`), `ConfirmationService` (+ `<p-confirmDialog>`), `DialogService`/DynamicDialog (`DynamicDialogConfig`/`DynamicDialogRef`) where used; render the host components.
- `p-table` server data: `[lazy]="true"` + `(onLazyLoad)` + `[totalRecords]` + `[paginator]`/`[rows]`; `virtualScrollerOptions` for large sets; controls implement `ControlValueAccessor` (bind `formControlName`).
- ⚠️`[v18 renames]` Use current names: `p-select` (was `p-dropdown`), `p-datepicker` (was `p-calendar`), `p-toggleSwitch` (was `p-inputSwitch`), `p-drawer` (was `p-sidebar`), `p-popover` (was `p-overlayPanel`) — flag legacy names as deprecated.
- ⚠️ Do NOT assume `@angular/cdk` is present via PrimeNG — modern PrimeNG `[v17+]` is self-contained (verify against the installed `primeng` package before relying on CDK).
- ⚠️ PrimeNG current stable is **v22** and may require a license key in config — verify current licensing at primeng.dev before asserting; gate the rule on the installed major.
- Keep ALL PrimeNG specifics in this skill; the paved-path imports none.

**Review red flags:** pre-v18 CSS theme imports / `PrimeNGConfig` in a v18+ app; missing `provideAnimationsAsync()`; no/wrong `cssLayer` order (Tailwind not overriding); `::ng-deep` into PrimeNG internals; PrimeFlex+Tailwind mixed; deprecated component names; `p-table` loading all rows client-side when `[lazy]` fits / missing `[totalRecords]`; service injected but not provided / host component not rendered; global barrel imports; PrimeNG names leaking into the paved-path; hardcoding a PrimeNG major that differs from the project's pin.

**Sources:** https://primeng.dev/installation, /theming, /tailwind, /table, /dynamicdialog, /toast; https://primeng.org/llms; `@primeng/mcp`. Note Taiga UI as the swap alternative (https://taiga-ui.dev/ai-support).

If the skill exceeds ~200 lines, move the rule catalog + code snippets into `references/rules.md` and summarize in `SKILL.md` (match the NestJS-plugin pattern).

- [ ] **Step 3: plugin.json**

```json
{
  "name": "angular-ui-primeng",
  "version": "0.1.0",
  "description": "PrimeNG UI library guidance for Angular: token theming, standalone imports, Tailwind interop, tables/dialogs/forms. Swappable UI layer.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["angular", "primeng", "ui", "components", "library", "sdd"],
  "dependencies": ["angular-paved-path@^0.1.0"]
}
```

- [ ] **Step 4: README + CHANGELOG**

README: purpose (swappable per-project Angular UI library skill; PrimeNG v18+ token theming, current v22); the UI-swap invariant; a "swap to another library (e.g. Taiga UI)" note; that no upstream PrimeNG agent-skill is vendored (authored from primeng.dev llms/MCP); dependency note. CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 5: Register + validate + commit**

```json
{
  "name": "angular-ui-primeng",
  "source": "./angular-ui-primeng",
  "description": "PrimeNG UI library guidance for Angular (swappable UI layer).",
  "category": "development",
  "keywords": ["angular", "primeng", "ui", "components"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```
```bash
claude plugin validate .
grep -rn '\.\./' plugins/angular-ui-primeng || echo "NO-PARENT-PATHS"
grep -rl 'contains no UI-library specifics' plugins/angular-ui-primeng   # spine invariant present
git add plugins/angular-ui-primeng .claude-plugin/marketplace.json
git commit -m "feat: add angular-ui-primeng library plugin"
```
Expected: PASS; NO-PARENT-PATHS; spine grep matches.

---

### Task 4: Manifest/README wiring + version bump + full quality gate

**Files:**
- Modify: `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md`
- Modify: `README.md`
- Modify: `.claude-plugin/marketplace.json` (bump `metadata.version` 0.3.0 → 0.4.0)

- [ ] **Step 1: Update the shipped Stack Manifest template**

In `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md`, set the `web (Angular)` row's Paved-path skills to `angular-developer, angular-new-app, angular-testing` and Library to `angular-ui-primeng`. Keep the resolution rules and the `typescript-expert` note.

- [ ] **Step 2: Update the repo README**

In `README.md`: (a) update the pasted Stack Manifest copy to match Step 1; (b) in the optional/Stage-B plugins note, replace the Angular "forthcoming" placeholder with the install lines:
```
/plugin install angular-paved-path@claude-market
/plugin install angular-ui-primeng@claude-market
```
and note Flutter is still forthcoming; mention `angular-ui-primeng` is swappable (e.g. a Taiga variant) and `typescript-paved-path` applies to Angular too.

- [ ] **Step 3: Bump marketplace version**

Set `.claude-plugin/marketplace.json` `metadata.version` to `0.4.0`.

- [ ] **Step 4: Full quality gate**

```bash
node scripts/build-site.mjs
claude plugin validate .
```
Expected: build-site exit 0 (now 10 plugins; components include the vendored Angular refs as one skill each + the new skills), validate PASS. If build-site FAILS, read the error, fix the cause, re-run. Do NOT `git add _site` (gitignored).

- [ ] **Step 5: Verify dependency edges + paved-path is PrimeNG-free**

```bash
for p in angular-paved-path angular-ui-primeng; do echo "== $p =="; grep -A4 '"dependencies"' plugins/$p/.claude-plugin/plugin.json; done
grep -rniE 'providePrimeNG|@primeng|import .*primeng|\bp-table\b|\bp-button\b' plugins/angular-paved-path/skills/angular-developer plugins/angular-paved-path/skills/angular-testing || echo "PAVED-PATH-PRIMENG-FREE"
```
Expected: angular-paved-path → engineering-foundations + typescript-paved-path; angular-ui-primeng → angular-paved-path; PAVED-PATH-PRIMENG-FREE.

- [ ] **Step 6: Commit**

```bash
git add plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md README.md .claude-plugin/marketplace.json
git commit -m "chore: wire Angular stack into manifest + README, bump marketplace to 0.4.0"
```

---

## Self-Review

**Spec coverage:** AC-1/2/11 → Tasks 1–4 (manifests, packaging, dependency edges, bump). AC-3 → Tasks 1,2,3 (skill inventories). AC-4 → Task 1 (verbatim vendor + LICENSE + attribution). AC-5/8 → Tasks 2,3 (authored skills' sections + version-gating/hedging). AC-6 → Task 3 (invariant) + Tasks 2,4 (paved-path PrimeNG-free grep). AC-7 → Task 3 (PrimeNG coverage). AC-9 → Task 2 (angular-testing mandates). AC-10 → Task 4 (manifest + README). AC-12 → validate + build-site (Tasks 1–4). AC-13 → English-only. All ACs mapped.

**Placeholder scan:** Vendoring uses a tree-driven fetch loop (all reference files, not a stale hand list). Authored-skill steps carry the full rule/red-flag/source content from the research digest. Verify steps give exact commands + expected output.

**Type/name consistency:** plugin names (`angular-paved-path`, `angular-ui-primeng`), skill ids (`angular-developer`, `angular-new-app`, `angular-testing`, `angular-ui-primeng`), dependency versions `^0.1.0`, single marketplace bump to `0.4.0`, and the verbatim spine-invariant sentence are consistent across tasks and match the spec.

**Note for executor:** Run tasks 1 → 3 in order; Task 4 terminal. Task 1 needs network (curl from github.com/angular/skills); if unreachable, STOP (no scratchpad copy of the official skill). The authored skills (Tasks 2, 3) are written from this plan's embedded content + `scratchpad/angular-primeng-digest.md`, not fetched.
