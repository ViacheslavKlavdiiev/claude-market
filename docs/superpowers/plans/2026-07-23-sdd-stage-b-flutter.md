# SDD Stage B Increment 3 (Flutter + Dart) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add `dart-paved-path` (vendored BSD-3 dart-lang skills) and `flutter-paved-path` (authored best-practices/architecture/material3/routing/testing + vendored official Flutter task skills) to `claude-market`, filling the Flutter mobile surface. No swappable UI layer (Material 3 is in-SDK).

**Architecture:** Vendor permissive BSD-3 official Dart + Flutter task skills verbatim (preserve attribution); author the five conceptual Flutter skills from docs.flutter.dev; `dart-paved-path` is the shared Dart language layer (parallels `typescript-paved-path`).

**Tech Stack:** Claude Code plugins (markdown skills), JSON manifests. Validation via `claude plugin validate .` + `node scripts/build-site.mjs`.

## Global Constraints

- ENGLISH-only.
- Every plugin: `.claude-plugin/plugin.json` (name = dir, SemVer version, description, author.name, `license: MIT`, keywords) + `README.md` + `CHANGELOG.md`. `version` only in `plugin.json`; `category` only in the marketplace entry. Components (`skills/`) at plugin ROOT.
- `${CLAUDE_PLUGIN_ROOT}` for shipped file refs; never `../` (except inside vendored prose/code examples — acceptable-verbatim).
- Dependency edges (`dependencies` array, `^0.1.0`): `flutter-paved-path` → `engineering-foundations`, `dart-paved-path`; `dart-paved-path` → none.
- **Vendored content (BSD-3):** preserve each source repo's license + attribution — copy the repo `LICENSE` into the vendored subtree and credit in the plugin README; keep the vendored SKILL.md bodies verbatim. Dart skills: `dart-lang/skills` (Copyright 2012 the Dart project authors). Flutter skills: `flutter/agent-plugins` (Copyright 2026 The Flutter Authors). Add a `HOUSE-NOTES.md` per plugin documenting: (a) provenance + re-vendor-don't-edit policy, (b) MCP→CLI fallback (steps referencing a Dart/Flutter MCP "validator" degrade to `flutter test`/`flutter analyze`/`dart analyze`/`dart pub get`), (c) Gemini `metadata.model` frontmatter is an upstream authoring artifact. Only permitted body edit: strip a `metadata.model` frontmatter key IF it breaks `claude plugin validate` (report if done).
- Authored Flutter skills: frontmatter (`name`, `description` "Use when…"), "Rules to follow", "Review red flags", "Sources" (≥1 docs.flutter.dev / dart.dev URL), version-gated rules marked (⚠️/`[vNN]`).
- **Spine invariant** — state VERBATIM in `flutter-architecture`: "The UI layer must not reach data sources directly. Data flows strictly View → ViewModel → Repository → Service (an optional Use-Case may sit between ViewModel and Repository). Views contain no business logic; ViewModels never import `http`/DB/platform SDKs; Services hold no state."
- **State management NEUTRAL:** never mandate Riverpod/Bloc; present options and "start least-powerful (setState → ChangeNotifier/ValueNotifier), adopt Riverpod/Bloc when app-wide/testable/complex-flow state justifies it; keep it in the ViewModel layer."
- **No swappable UI-library plugin** — Material 3 is in-SDK; `flutter-material3` lives inside `flutter-paved-path`.
- Version-gate + hedge verify-before-ship items: Material 2 removal / `useMaterial3` obsolescence timing, `go_router` major API (17.x), `checks` pre-stability, `context.mounted` (≥3.7).
- Scaffold each plugin from `plugins/example-plugin`.
- Must pass `claude plugin validate .`; marketplace must pass `node scripts/build-site.mjs`.
- Research digest available to implementers: `scratchpad/flutter-dart-digest.md` (Part B has fuller per-skill content).

## File Structure

```
plugins/dart-paved-path/
  .claude-plugin/plugin.json  README.md  CHANGELOG.md  HOUSE-NOTES.md
  skills/<dart-skill>/SKILL.md (× 7, vendored)  +  LICENSE (BSD-3, Dart authors)
plugins/flutter-paved-path/
  .claude-plugin/plugin.json  README.md  CHANGELOG.md  HOUSE-NOTES.md
  skills/flutter-best-practices/SKILL.md   (authored)
  skills/flutter-architecture/SKILL.md     (authored)
  skills/flutter-material3/SKILL.md        (authored)
  skills/flutter-routing/SKILL.md          (authored)
  skills/flutter-testing/SKILL.md          (authored)
  skills/<flutter-task-skill>/SKILL.md (× 4, vendored)  +  LICENSE (BSD-3, Flutter Authors)
.claude-plugin/marketplace.json   (2 new entries + bump 0.4.0 → 0.5.0)
README.md                          (optional-plugins list + manifest copy)
plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md  (mobile row)
```

---

### Task 1: `dart-paved-path` — vendor curated dart-lang skills

**Files:**
- Create: `plugins/dart-paved-path/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`, `HOUSE-NOTES.md`
- Create: `plugins/dart-paved-path/skills/<name>/SKILL.md` (× 7) + `plugins/dart-paved-path/LICENSE`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Produces: skill ids `dart-add-unit-test`, `dart-run-static-analysis`, `dart-generate-test-mocks`, `dart-use-pattern-matching`, `dart-resolve-package-conflicts`, `dart-collect-coverage`, `dart-use-primary-constructors`. Plugin `dart-paved-path` v0.1.0, no dependencies.

- [ ] **Step 1: Scaffold + vendor the 7 dart skills + LICENSE**

```bash
cp -r plugins/example-plugin plugins/dart-paved-path
rm -rf plugins/dart-paved-path/commands plugins/dart-paved-path/agents plugins/dart-paved-path/skills/hello-skill
BASE=https://raw.githubusercontent.com/dart-lang/skills/main
curl -s $BASE/LICENSE -o plugins/dart-paved-path/LICENSE
for s in dart-add-unit-test dart-run-static-analysis dart-generate-test-mocks dart-use-pattern-matching dart-resolve-package-conflicts dart-collect-coverage dart-use-primary-constructors; do
  mkdir -p plugins/dart-paved-path/skills/$s
  curl -s "$BASE/skills/$s/SKILL.md" -o "plugins/dart-paved-path/skills/$s/SKILL.md"
  # fetch any references/* the skill ships
  for r in $(curl -s "https://api.github.com/repos/dart-lang/skills/git/trees/main?recursive=1" | grep -oE "\"path\": \"skills/$s/[^\"]*\"" | sed 's/"path": "//;s/"//' | grep -v '/SKILL.md$'); do
    mkdir -p "plugins/dart-paved-path/$(dirname "${r#skills/}" | sed 's|^|skills/|')" 2>/dev/null
    curl -s "$BASE/$r" -o "plugins/dart-paved-path/skills/${r#skills/}"
  done
done
ls plugins/dart-paved-path/skills   # expect 7 dirs
head -1 plugins/dart-paved-path/LICENSE   # expect: Copyright 2012, the Dart project authors.
```

- [ ] **Step 2: Verify verbatim + validation-safe frontmatter**

- Confirm each vendored SKILL.md has valid YAML frontmatter (`name`, `description`). Do NOT edit bodies. If `claude plugin validate` later rejects a `metadata.model:` key, strip only that key and note it in the report.
- Confirm the LICENSE contains the BSD-3 three conditions + disclaimer + the 2012 Dart authors copyright.

- [ ] **Step 3: HOUSE-NOTES.md**

Create `plugins/dart-paved-path/HOUSE-NOTES.md`: (a) these skills are vendored verbatim from the official BSD-3 `github.com/dart-lang/skills` (Copyright 2012 the Dart project authors), updated by re-vendoring; (b) some steps reference the Dart MCP server — without it, use the CLI (`dart analyze`, `dart test`, `dart pub get`, `dart fix --apply`, `dart run build_runner build`); (c) `metadata.model` frontmatter is an upstream Gemini authoring artifact, harmless. Keep short.

- [ ] **Step 4: plugin.json**

```json
{
  "name": "dart-paved-path",
  "version": "0.1.0",
  "description": "Dart language skills (unit tests, static analysis, mocks, pattern matching, package conflicts) vendored from the official dart-lang/skills.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["dart", "language", "testing", "analysis", "paved-path", "sdd"]
}
```
(Note: the plugin wrapper is MIT; the vendored skill content is BSD-3 as carried in the skills' `LICENSE` + frontmatter + README credit.)

- [ ] **Step 5: README + CHANGELOG (with attribution)**

README: purpose (shared Dart language layer for Flutter, parallel to `typescript-paved-path`); state clearly the skills are **vendored verbatim from the official BSD-3 `github.com/dart-lang/skills` (Copyright 2012 the Dart project authors)** and credit accordingly (point to `skills/.../` and the `LICENSE`); list the 7 skills one line each; note the MCP→CLI fallback (see HOUSE-NOTES). CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 6: Register in marketplace.json**

```json
{
  "name": "dart-paved-path",
  "source": "./dart-paved-path",
  "description": "Dart language skills vendored from the official dart-lang/skills (BSD-3).",
  "category": "development",
  "keywords": ["dart", "language", "testing", "analysis"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 7: Validate + commit**

```bash
claude plugin validate .
grep -rn '\.\./' plugins/dart-paved-path/.claude-plugin plugins/dart-paved-path/*.md || echo "NO-PARENT-PATHS (non-vendored)"
git add plugins/dart-paved-path .claude-plugin/marketplace.json
git commit -m "feat: add dart-paved-path with vendored official Dart skills (BSD-3)"
```
Expected: PASS. (If validate unavailable, validate JSON via python3 + confirm; say so.)

---

### Task 2: `flutter-paved-path` — scaffold + vendor official Flutter task skills

**Files:**
- Create: `plugins/flutter-paved-path/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`, `HOUSE-NOTES.md`
- Create: vendored `skills/{flutter-build-responsive-layout,flutter-implement-json-serialization,flutter-setup-localization,flutter-use-http-package}/SKILL.md` (+ any references) + `plugins/flutter-paved-path/LICENSE`

**Interfaces:**
- Produces: 4 vendored skill ids. Plugin `flutter-paved-path` v0.1.0 (authored skills in Tasks 3–5; marketplace entry in Task 5).

- [ ] **Step 1: Scaffold + vendor the 4 flutter task skills + LICENSE**

```bash
cp -r plugins/example-plugin plugins/flutter-paved-path
rm -rf plugins/flutter-paved-path/commands plugins/flutter-paved-path/agents plugins/flutter-paved-path/skills/hello-skill
BASE=https://raw.githubusercontent.com/flutter/agent-plugins/main
curl -s $BASE/LICENSE -o plugins/flutter-paved-path/LICENSE
for s in flutter-build-responsive-layout flutter-implement-json-serialization flutter-setup-localization flutter-use-http-package; do
  mkdir -p plugins/flutter-paved-path/skills/$s
  curl -s "$BASE/skills/$s/SKILL.md" -o "plugins/flutter-paved-path/skills/$s/SKILL.md"
  for r in $(curl -s "https://api.github.com/repos/flutter/agent-plugins/git/trees/main?recursive=1" | grep -oE "\"path\": \"skills/$s/[^\"]*\"" | sed 's/"path": "//;s/"//' | grep -v '/SKILL.md$'); do
    mkdir -p "plugins/flutter-paved-path/$(dirname "${r#}" )" 2>/dev/null
    curl -s "$BASE/$r" -o "plugins/flutter-paved-path/${r}"
  done
done
head -1 plugins/flutter-paved-path/LICENSE   # expect: Copyright 2026 The Flutter Authors. All rights reserved.
ls plugins/flutter-paved-path/skills   # expect the 4 vendored dirs (authored ones added later)
```

- [ ] **Step 2: HOUSE-NOTES + verify verbatim**

Create `plugins/flutter-paved-path/HOUSE-NOTES.md`: (a) the `flutter-*` task skills are vendored verbatim from the official BSD-3 `github.com/flutter/agent-plugins` (Copyright 2026 The Flutter Authors); the conceptual skills (`flutter-best-practices`, `-architecture`, `-material3`, `-routing`, `-testing`) are house-authored from docs.flutter.dev; (b) MCP→CLI fallback (`flutter test`, `flutter analyze`, `flutter pub get`); (c) `metadata.model` is an upstream artifact. Do NOT edit vendored bodies (strip only a `metadata.model` key if it breaks validation; report). Confirm LICENSE has the 2026 Flutter Authors BSD-3 notice.

- [ ] **Step 3: plugin.json (with dependencies)**

```json
{
  "name": "flutter-paved-path",
  "version": "0.1.0",
  "description": "Flutter engineering skills: best practices, architecture, Material 3, GoRouter, testing, plus vendored official Flutter task skills.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["flutter", "dart", "material3", "gorouter", "mobile", "paved-path", "sdd"],
  "dependencies": ["engineering-foundations@^0.1.0", "dart-paved-path@^0.1.0"]
}
```

- [ ] **Step 4: README + CHANGELOG (with attribution)**

README: purpose (Flutter mobile surface); state the five authored conceptual skills (best-practices, architecture, material3, routing, testing) AND the four vendored task skills, crediting the vendored ones to the official BSD-3 `github.com/flutter/agent-plugins` (Copyright 2026 The Flutter Authors); note no swappable UI-library (Material 3 in-SDK); dependency note (engineering-foundations + dart-paved-path); MCP→CLI (see HOUSE-NOTES). (The authored skills land in Tasks 3–5 — the README may list all nine now.) CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 5: Validate + commit**

```bash
claude plugin validate .
git add plugins/flutter-paved-path
git commit -m "feat: scaffold flutter-paved-path with vendored official Flutter task skills (BSD-3)"
```
Expected: PASS. (No marketplace entry yet — Task 5.)

---

### Task 3: author `flutter-best-practices` + `flutter-material3`

**Files:**
- Create: `plugins/flutter-paved-path/skills/flutter-best-practices/SKILL.md`
- Create: `plugins/flutter-paved-path/skills/flutter-material3/SKILL.md`

- [ ] **Step 1: Author `flutter-best-practices/SKILL.md`**

Frontmatter `name: flutter-best-practices`; `description:` "Use when writing or reviewing Flutter widget code — StatelessWidget/StatefulWidget, const, keys, build() purity, BuildContext across async gaps, Future/StreamBuilder, null safety, lints, assets."

**Rules to follow:** prefer `StatelessWidget` (StatefulWidget only for owned ephemeral state); add `const` wherever the subtree is immutable (enable `prefer_const_constructors`); keep `build()` PURE (no side effects/async/IO/controller allocation); create/dispose controllers/subscriptions in `initState`/`dispose`, never `build()`; narrow rebuild scope (split widgets, push state down, `ValueListenableBuilder`/`Selector`); use `Key`/`ValueKey` when reordering/inserting siblings of the same type in lists; ⚠️`[v3.7+]` never use a `BuildContext` across an `async` gap without `if (!context.mounted) return;` (`use_build_context_synchronously` lint); hoist the future/stream out of `build()` for `FutureBuilder`/`StreamBuilder` and always handle `connectionState`/`hasError`; sound null-safety, avoid `!` (bang) unless provably non-null; run `dart format`; enable a lint baseline (`flutter_lints` `include: package:flutter_lints/flutter.yaml`); declare assets/fonts under `flutter:` in `pubspec.yaml` with resolution variants, heavy decode off the UI isolate (`compute`).

**Review red flags:** async/Future-Stream creation/`MediaQuery.of` math in `build()`; `setState` after `await` with no `mounted` check; missing `const`; whole-page `setState` for one field; controllers never disposed; `!` to silence nullability; `FutureBuilder` with an inline `future: fetch()`; fixed pixel sizes / hard-coded colors instead of theme + constraints; disabled lint baseline.

**Sources:** https://docs.flutter.dev/perf/best-practices, https://dart.dev/effective-dart, https://docs.flutter.dev/reference/of-context, pub.dev/packages/flutter_lints. Mark version gates (⚠️ `context.mounted` ≥3.7).

- [ ] **Step 2: Author `flutter-material3/SKILL.md`**

Frontmatter `name: flutter-material3`; `description:` "Use when theming a Flutter app with Material 3 — ColorScheme.fromSeed, theme/darkTheme/themeMode, colorScheme roles, M3 components, dynamic color."

**Rules to follow:** ⚠️`[version-gated]` Material 3 is the default since Flutter 3.16 and on current SDKs (3.29+) Material 2 is removed and `useMaterial3` is obsolete — do NOT set `useMaterial3` at all (verify against the target SDK); build the theme from a seed `ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: ...))`; supply both `theme:` and `darkTheme:` (each `ColorScheme.fromSeed(..., brightness: Brightness.dark)`) + `themeMode:` (default `ThemeMode.system`); consume colors from `Theme.of(context).colorScheme` roles (`primary`/`surface`/`onSurface`/`surfaceContainerHighest`) — never hard-code hex; dynamic color (Android 12+) via `dynamic_color` with a fallback seed; use M3 components (`NavigationBar` not `BottomNavigationBar`, `NavigationRail`, `FilledButton`, `SegmentedButton`, `SearchBar`); centralize typography/shape in `ThemeData.textTheme`/component themes.

**Review red flags:** explicitly setting `useMaterial3: true/false` on a current SDK (obsolete); hard-coded `Color(0xFF…)`/`Colors.blue` instead of `colorScheme` roles; no `darkTheme`/`themeMode`; contrast failing in dark mode; legacy M2 components (`RaisedButton`/`FlatButton` removed; `BottomNavigationBar` where `NavigationBar` is intended).

**Sources:** https://docs.flutter.dev/ui/design/material, https://api.flutter.dev/flutter/material/ThemeData/useMaterial3.html, m3.material.io, pub.dev/packages/dynamic_color. Mark the ⚠️ M3-default/useMaterial3-obsolete gate.

- [ ] **Step 3: Validate + commit**

```bash
claude plugin validate .
grep -rn '\.\./' plugins/flutter-paved-path/skills/flutter-best-practices plugins/flutter-paved-path/skills/flutter-material3 || echo "NO-PARENT-PATHS"
git add plugins/flutter-paved-path/skills/flutter-best-practices plugins/flutter-paved-path/skills/flutter-material3
git commit -m "feat: author flutter-best-practices + flutter-material3 skills"
```

---

### Task 4: author `flutter-architecture` + `flutter-routing`

**Files:**
- Create: `plugins/flutter-paved-path/skills/flutter-architecture/SKILL.md`
- Create: `plugins/flutter-paved-path/skills/flutter-routing/SKILL.md`

- [ ] **Step 1: Author `flutter-architecture/SKILL.md`**

Frontmatter `name: flutter-architecture`; `description:` "Use when structuring a Flutter app — the official MVVM layered architecture (Views + ViewModels / Repositories + Services), DI, state management choice."

Open with the **spine invariant** (verbatim, from Global Constraints).

**Rules to follow:** official MVVM layering — **UI layer** = Views (widgets, no business logic) + ViewModels (hold UI state, expose commands = callbacks, survive config changes; commonly extend `ChangeNotifier`; one ViewModel per View); **data layer** = Repositories (single source of truth; domain models; caching/retry/refresh; unaware of each other) + Services (stateless; wrap one external source; expose `Future`/`Stream`); **optional domain layer** = Use-Cases (only when logic spans repositories / is complex / reused). Inject Repositories into ViewModels via constructor DI; domain models immutable (`freezed`/`sealed`); app-wide session/cache lives in a Repository, not a widget. `lib/` structure: `data/{models,repositories,services}/`, optional `domain/{models,use_cases}/`, `ui/{core, features/<feature>/{view_models,views}}/`.

**State management (NEUTRAL — do not mandate):** options low→high ceremony: `setState` (ephemeral), `ValueNotifier`+`ValueListenableBuilder`, `InheritedWidget`, `ChangeNotifier`(+`provider`, used by the official guide), **Riverpod** (community, compile-safe/testable), **Bloc/Cubit** (community, event→state). Guidance: "start with the least powerful tool that solves the problem; adopt Riverpod/Bloc when app-wide/testable/complex-flow state justifies it; keep state in the ViewModel layer, never in Views."

**Review red flags:** widget calling `http`/Dio/Firebase/SharedPreferences directly; business logic in a `State`/widget; a ViewModel importing a Service or platform SDK; repositories referencing each other; a Service holding mutable state; god-ViewModel spanning features; `GetIt`/global singletons used as a hidden service locator inside Views.

**Sources:** https://docs.flutter.dev/app-architecture (+ /guide, /case-study, /recommendations), https://docs.flutter.dev/data-and-backend/state-mgmt/options. Note it is guidance (not tooling-enforced); ⚠️ relatively recent (2024–2025).

- [ ] **Step 2: Author `flutter-routing/SKILL.md`**

Frontmatter `name: flutter-routing`; `description:` "Use when setting up navigation in Flutter with GoRouter — routes, params, shells, redirect guards, typed routes, deep linking."

**Rules to follow:** ⚠️`[go_router 17.x — pin + verify, breaking majors]` bind via `MaterialApp.router(routerConfig: router)` with a single top-level `GoRouter`; each screen = `GoRoute(path, builder)`; path params `:id` (`state.pathParameters`), query via `state.uri.queryParameters`; persistent shells via `ShellRoute` / `StatefulShellRoute.indexedStack` (independent per-branch state); central `redirect` (+ per-route) returning a path or null, driven off auth state with `refreshListenable`; `context.go` (replace, URL-first — tab/section switches) vs `context.push` (drill-in you pop back from); typed routes via `go_router_builder` (`@TypedGoRoute`, build_runner) for larger apps; deep linking (platform config; web `usePathUrlStrategy()`); ⚠️`[v3.7+]` `context.mounted` guard when navigating after an await.

**Review red flags:** mixing imperative `Navigator.push` with GoRouter routes (breaks URL sync/deep links) except ephemeral dialogs/sheets; auth checks scattered in widgets instead of a central `redirect`; stringly-typed navigation everywhere in a large app; `ShellRoute` where per-tab state needs `StatefulShellRoute`; no `context.mounted` guard after await.

**Sources:** pub.dev/packages/go_router, https://docs.flutter.dev/ui/navigation (+ /deep-linking), pub.dev/packages/go_router_builder; cross-ref the vendored `flutter-setup-declarative-routing` skill (official). Mark the ⚠️ go_router version gate.

- [ ] **Step 3: Validate + commit**

```bash
claude plugin validate .
grep -rl 'must not reach data sources directly' plugins/flutter-paved-path/skills/flutter-architecture   # spine invariant present
grep -rn '\.\./' plugins/flutter-paved-path/skills/flutter-architecture plugins/flutter-paved-path/skills/flutter-routing || echo "NO-PARENT-PATHS"
git add plugins/flutter-paved-path/skills/flutter-architecture plugins/flutter-paved-path/skills/flutter-routing
git commit -m "feat: author flutter-architecture (spine + neutral state mgmt) + flutter-routing (GoRouter)"
```

---

### Task 5: author `flutter-testing` + register `flutter-paved-path`

**Files:**
- Create: `plugins/flutter-paved-path/skills/flutter-testing/SKILL.md`
- Modify: `.claude-plugin/marketplace.json` (add `flutter-paved-path` entry)

- [ ] **Step 1: Author `flutter-testing/SKILL.md`**

Frontmatter `name: flutter-testing`; `description:` "Use when writing or reviewing Flutter tests — unit/widget/golden/integration tests, WidgetTester, finders, mocking. Behavioral assertions over mocks."

**Rules to follow:** test pyramid (many unit via `package:test`/`flutter_test`, fewer widget, fewest integration); `test/` mirrors `lib/`, files end `_test.dart`; integration in `integration_test/` (`flutter test integration_test`); widget tests `testWidgets('...', (tester) async {...})`, `await tester.pumpWidget(...)` (wrap SUT in `MaterialApp`/`Directionality` for inherited theme/direction), `tester.pump()` (one frame) vs `tester.pumpAndSettle()` (animations/async settle); finders `find.byType`/`find.text`/`find.byKey` and prefer **`find.bySemanticsLabel`** for accessibility-anchored selectors; assert `expect(finder, findsOneWidget/findsNothing/findsNWidgets(n))`; interactions `tester.tap`/`enterText`/`drag`/`scrollUntilVisible`; golden tests `expect(find.byType(X), matchesGoldenFile('goldens/x.png'))` (`--update-goldens`; keep deterministic — fixed fonts/sizes; platform-font-sensitive); mocking `mockito` (`@GenerateNiceMocks` + build_runner) or `mocktail` (no codegen) — CRITICAL stub Futures/Streams with `thenAnswer((_) async => v)` never `thenReturn`; ⚠️ the `checks` package (`check(x).equals(...)`) is the emerging successor to `matcher`/`expect` (forward-looking; `expect` standard today).

**Behavioral-assertion philosophy (consistent with `nestjs-testing`/`angular-testing`):** test observable behavior (rendered text, tap→outcome), not private fields; don't over-mock — mock only true external boundaries (network/platform/DB) via the Service/Repository seam; use real ViewModels/widgets; prefer fakes over deep mock-verify chains.

**Review red flags:** mocking the widget under test; asserting on internal state instead of rendered output; `pump()` where `pumpAndSettle()` is needed (flaky) or vice-versa (hangs on infinite animations); brittle `find.byType` on generic widgets (`Container`/`Padding`); non-deterministic goldens; `thenReturn` on an async method.

**Sources:** https://docs.flutter.dev/testing/overview (+ /unit-tests, /widget-tests, /integration-tests), pub.dev/packages/{mockito,mocktail,checks}; cross-ref the vendored `flutter-add-widget-test`/`flutter-add-integration-test` and `dart-add-unit-test`/`dart-generate-test-mocks` skills, and `nestjs-testing`/`angular-testing` for the shared philosophy. Mark ⚠️ `checks` pre-stability.

- [ ] **Step 2: Register `flutter-paved-path` in marketplace.json**

```json
{
  "name": "flutter-paved-path",
  "source": "./flutter-paved-path",
  "description": "Flutter engineering skills (best practices, architecture, Material 3, GoRouter, testing) + vendored official Flutter task skills.",
  "category": "development",
  "keywords": ["flutter", "dart", "material3", "gorouter", "mobile"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 3: Validate + gates + commit**

```bash
claude plugin validate .
ls plugins/flutter-paved-path/skills | sort   # expect 9: 5 authored + 4 vendored
grep -rn '\.\./' plugins/flutter-paved-path/skills/flutter-testing || echo "NO-PARENT-PATHS"
git add plugins/flutter-paved-path/skills/flutter-testing .claude-plugin/marketplace.json
git commit -m "feat: author flutter-testing skill and register flutter-paved-path"
```
Expected: PASS; 9 skills; NO-PARENT-PATHS.

---

### Task 6: Manifest/README wiring + version bump + full quality gate

**Files:**
- Modify: `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md`
- Modify: `README.md`
- Modify: `.claude-plugin/marketplace.json` (bump `metadata.version` 0.4.0 → 0.5.0)

- [ ] **Step 1: Update the shipped Stack Manifest template**

In `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md`, set the `mobile (Flutter)` row's Paved-path skills to `flutter-best-practices, flutter-architecture, flutter-material3, flutter-routing, flutter-testing` and Library to `— (Material 3, in-SDK)`. Add a note below the table: "`dart-paved-path` is the Dart language layer for Flutter surfaces (parallel to `typescript-expert` for TypeScript surfaces)." Keep resolution rules unchanged.

- [ ] **Step 2: Update the repo README**

In `README.md`: (a) update the pasted Stack Manifest copy to match Step 1; (b) in the optional/Stage-B plugins note, replace the Flutter "forthcoming" placeholder with install lines:
```
/plugin install dart-paved-path@claude-market
/plugin install flutter-paved-path@claude-market
```
note Flutter has no swappable UI-library plugin (Material 3 in-SDK), unlike Angular's PrimeNG; and that this completes Stage B (all three stacks shipped).

- [ ] **Step 3: Bump marketplace version**

Set `.claude-plugin/marketplace.json` `metadata.version` to `0.5.0`.

- [ ] **Step 4: Full quality gate**

```bash
node scripts/build-site.mjs
claude plugin validate .
```
Expected: build-site exit 0 (now 12 plugins), validate PASS. If build-site FAILS, read the error, fix the cause, re-run. Do NOT `git add _site` (gitignored).

- [ ] **Step 5: Verify dependency edges**

```bash
for p in dart-paved-path flutter-paved-path; do echo "== $p =="; grep -A4 '"dependencies"' plugins/$p/.claude-plugin/plugin.json 2>/dev/null || echo "(none)"; done
```
Expected: dart-paved-path none; flutter-paved-path → engineering-foundations + dart-paved-path.

- [ ] **Step 6: Commit**

```bash
git add plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md README.md .claude-plugin/marketplace.json
git commit -m "chore: wire Flutter stack into manifest + README, bump marketplace to 0.5.0"
```

---

## Self-Review

**Spec coverage:** AC-1/2/12 → Tasks 1–6 (manifests, packaging, deps, bump). AC-3 → Tasks 1,2,3,4,5 (skill inventories). AC-4 → Tasks 1,2 (vendor + LICENSE + attribution + HOUSE-NOTES). AC-5/10 → Tasks 3,4,5 (authored skills' sections + version-gating/hedging). AC-6 → Task 4 (spine + neutral state mgmt). AC-7 → Task 3 (material3). AC-8 → Task 4 (routing). AC-9 → Task 5 (testing). AC-11 → Task 6 (manifest + README). AC-13 → validate + build-site (Tasks 1–6). AC-14 → English-only. All ACs mapped.

**Placeholder scan:** Vendoring uses tree-driven fetch loops (all skill files, not stale lists). Authored-skill steps carry the full rule/red-flag/source content (from the research digest). Verify steps give exact commands + expected output.

**Type/name consistency:** plugin names (`dart-paved-path`, `flutter-paved-path`), the 7 dart + 4 vendored flutter + 5 authored flutter skill ids, dependency versions `^0.1.0`, single marketplace bump to `0.5.0`, and the verbatim spine-invariant sentence are consistent across tasks and match the spec.

**Note for executor:** Run tasks 1 → 5 in order (flutter-paved-path depends on dart-paved-path; Task 2 scaffolds before Tasks 3–5 author into it); Task 6 terminal. Tasks 1–2 need network (curl from dart-lang/skills + flutter/agent-plugins); if unreachable, STOP. Authored skills (3–5) are written from this plan's embedded content + `scratchpad/flutter-dart-digest.md`, not fetched.
