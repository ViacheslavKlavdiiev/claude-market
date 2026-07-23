---
name: angular-testing
description: Use when writing or reviewing Angular tests — TestBed, component harnesses, RouterTestingHarness, Act-Wait-Assert. Complements the vendored angular-developer testing references.
---

# Angular Testing (house conventions)

This is a **thin house wrapper** around the vendored official references
already shipped in this plugin. It does not repeat their content — read the
reference below for the code shapes, then apply the rules on this page. For
the deep-dive on any topic, open:

- `${CLAUDE_PLUGIN_ROOT}/skills/angular-developer/references/testing-fundamentals.md`
  — TestBed/ComponentFixture, Act-Wait-Assert
- `${CLAUDE_PLUGIN_ROOT}/skills/angular-developer/references/component-harnesses.md`
  — `TestbedHarnessEnvironment`, `HarnessLoader`
- `${CLAUDE_PLUGIN_ROOT}/skills/angular-developer/references/router-testing.md`
  — `RouterTestingHarness`, `provideRouter`
- `${CLAUDE_PLUGIN_ROOT}/skills/angular-developer/references/e2e-testing.md`
  — E2E framework setup via `ng add`

## Rules to follow

1. **Runner matches the project.** ⚠️ `[v20/v21]` Vitest is the modern
   Angular default for new/zoneless projects — assume it unless the project
   already uses Karma or Jest, in which case keep the existing runner rather
   than migrating it mid-task. Assume a zoneless-compatible setup on modern
   Angular (no implicit change-detection ticks).

2. **Act-Wait-Assert, always** (see `testing-fundamentals.md`): Act (set an
   input, click a harness control), Wait (`await fixture.whenStable()`),
   Assert. Do **not** call `fixture.detectChanges()` to force an update —
   that papers over a test that isn't actually waiting for the real,
   asynchronous rendering pipeline to settle.

3. **Component harnesses are the primary approach.** Get a loader with
   `TestbedHarnessEnvironment.loader(fixture)`, then
   `await loader.getHarness(SomeHarness.with({...}))` and drive the
   component through the harness API. Harnesses are robust to internal DOM
   refactors and the same harness is reusable across unit and E2E tests
   (see `component-harnesses.md`). Prefer a harness over
   `fixture.debugElement.query(By.css(...))` whenever one exists for the
   component under test.

4. **Routing tests use `RouterTestingHarness` + a real `provideRouter()`.**
   Configure `TestBed` with `provideRouter([...])` using real test routes
   (so real guards and resolvers execute), create the harness with
   `RouterTestingHarness.create()`, navigate with
   `harness.navigateByUrl(...)`, assert on `harness.router.url`, then
   `await harness.fixture.whenStable()` before asserting on the newly
   activated component (see `router-testing.md`). Never mock `Router` —
   a mocked router only proves the mock was called, not that navigation,
   guards, or resolvers actually work.

5. **`@testing-library/angular` — house policy.** Angular harnesses remain
   the house **default** for anything with an existing harness (Material
   components, or a custom harness you author for your own components). It
   is a **prompt-triggering red flag** to introduce `@testing-library/angular`
   as a substitute for an existing/available harness. `@testing-library/angular`
   is allowed only where no harness exists and a team wants accessible-query
   ergonomics — in that case follow the query-priority order `getByRole` >
   `getByLabelText` > `getByText` > `getByTestId`. Whichever approach is
   used, every test asserts **observable behavior** (a rendered value, an
   emitted output, a navigated URL, a thrown error) — never implementation
   details or mock internals. This is the same behavioral-assertion
   philosophy as `nestjs-testing` (mock at the boundary, assert on outcomes,
   not on the mock's own call log).

6. **Verification before completion.** After generating or changing tests,
   run `ng build` and the project's test suite; fix any errors before
   declaring the task done. This is adopted directly from the vendored
   `angular-developer` skill's own build-verification rule and applies
   equally to test code.

7. **E2E is opt-in.** Only set up an E2E framework (Playwright, Cypress,
   etc. via `ng add` + `ng e2e`) if none is already configured, or the user
   explicitly asks — see `e2e-testing.md`. Never suggest Protractor; it is
   deprecated and removed from current Angular tooling.

## Review red flags

- `fixture.detectChanges()` used to force an update instead of
  `await fixture.whenStable()`.
- Brittle `By.css(...)` DOM queries where a component harness already
  exists for the target component.
- A mocked `Router` (or mocked `ActivatedRoute`) in place of
  `RouterTestingHarness` + real `provideRouter()`.
- Tests that assert only on mock internals or call counts (e.g.
  `expect(spy).toHaveBeenCalled()` with no assertion on what actually
  happened) instead of on observable behavior.
- Protractor usage, or any new E2E scaffolding added without the project
  lacking one or the user asking for it.
- Test changes committed/declared done without having run `ng build` (and
  the test suite) to confirm they pass.

## Sources

- Vendored official references (this plugin,
  `skills/angular-developer/references/`): `testing-fundamentals.md`,
  `component-harnesses.md`, `router-testing.md`, `e2e-testing.md`.
- https://angular.dev/guide/testing
- Cross-reference: the `nestjs-testing` house skill in
  `nestjs-paved-path`, for the shared behavioral-assertion philosophy
  (mock at the boundary, assert on observable outcomes, never on a mock's
  own internals).
