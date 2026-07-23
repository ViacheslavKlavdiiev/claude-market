---
name: flutter-testing
description: Use when writing or reviewing Flutter tests — unit/widget/golden/integration tests, WidgetTester, finders, mocking. Behavioral assertions over mocks.
---

# Flutter Testing

This skill is authored from `docs.flutter.dev/testing` and the
`mockito`/`mocktail`/`checks` package docs on pub.dev. It covers the same
ground as the official `flutter-add-widget-test` and
`flutter-add-integration-test` skills in `github.com/flutter/agent-plugins`
(neither vendored into this plugin — see this plugin's `HOUSE-NOTES.md`;
this house-authored skill supersedes them), plus the golden-test and
behavioral-assertion depth those don't cover. For plain-Dart unit tests and
mock generation this skill defers to the vendored `dart-add-unit-test` and
`dart-generate-test-mocks` skills in the `dart-paved-path` dependency —
read those for the `package:test` basics; this skill adds the
Flutter-specific widget/golden/integration layers on top.

## The test pyramid

Write **many** unit tests, **fewer** widget tests, and the **fewest**
integration tests:

- **Unit** — `package:test` (pure Dart logic) or `package:flutter_test`
  (Flutter-dependent logic, no widget tree). Fast, no device/simulator.
  See `dart-add-unit-test` for the full pattern (`group`/`test`/`setUp`,
  `expect`+matchers).
- **Widget** — mounts a widget in a headless test binding via
  `WidgetTester` and verifies its rendered output/interactions, without a
  real device. Most UI logic belongs here, not in integration tests.
- **Integration** — drives the full app on a real or simulated
  device/browser. Reserve these for end-to-end flows that genuinely need
  a real environment (platform plugins, multi-screen navigation,
  performance); they are the slowest and most brittle layer.

## Rules to follow

1. **Layout mirrors `lib/`.** Put unit and widget tests under `test/`,
   mirroring the `lib/` structure, and end every file `_test.dart` (e.g.
   `lib/src/utils.dart` → `test/src/utils_test.dart`). Put integration
   tests in a separate top-level `integration_test/` directory, using the
   `integration_test` package, and run them with
   `flutter test integration_test` (the default `flutter test` runner does
   **not** pick this directory up).

2. **Widget tests: `testWidgets` + `pumpWidget`.**

   ```dart
   testWidgets('shows the greeting text', (tester) async {
     await tester.pumpWidget(
       const MaterialApp(home: GreetingView(name: 'Ada')),
     );

     expect(find.text('Hello, Ada'), findsOneWidget);
   });
   ```

   Wrap the widget under test in `MaterialApp`/`Directionality` (or
   whatever ancestor it actually depends on) whenever it reads inherited
   theme, localization, or text-direction data — a bare widget with no
   such ancestor throws or renders wrong, not because the widget is
   broken but because the test omitted its real-app context.

3. **`pump()` vs `pumpAndSettle()` — pick based on what you're waiting
   for.** `tester.pump()` advances exactly one frame — use it after a
   state change you expect to resolve in a single frame (e.g. a
   synchronous `setState`). `tester.pumpAndSettle()` repeatedly pumps
   until no more frames are scheduled — use it after triggering
   animations or async work (a `Future`, a route transition) that needs
   multiple frames to finish. Never call `pumpAndSettle()` against a
   widget with a continuously-repeating animation (e.g. an indefinite
   spinner) — it will pump forever and the test hangs.

4. **Finders: prefer accessibility-anchored selectors.** Use
   `find.byType`, `find.text`, and `find.byKey` for straightforward
   cases, but prefer **`find.bySemanticsLabel`** when a widget has (or
   should have) a semantic label — it selects the same way assistive
   technology does, doubling as an accessibility check, and survives
   internal widget-tree refactors that would break a `find.byType` on a
   generic container. Assert counts with
   `expect(finder, findsOneWidget)` / `findsNothing` / `findsNWidgets(n)`.

5. **Interactions via `WidgetTester`.** Drive the UI the way a user
   would: `tester.tap(finder)`, `tester.enterText(finder, 'text')`,
   `tester.drag(finder, offset)`, and
   `tester.scrollUntilVisible(finder, delta, scrollable: ...)` to bring an
   off-screen widget into view before interacting with it. Follow each
   interaction with the appropriate `pump()`/`pumpAndSettle()` (rule 3)
   before asserting on the result.

6. **Golden tests pin exact rendered pixels.**

   ```dart
   await expectLater(
     find.byType(ProfileCard),
     matchesGoldenFile('goldens/profile_card.png'),
   );
   ```

   Generate/update the reference images with
   `flutter test --update-goldens`, and **review the diff before
   committing** — an unreviewed regenerate can bake in a visual
   regression. Keep goldens deterministic: pin fonts (load test fonts
   explicitly or use `Ahem`), fixed surface sizes, and avoid
   platform-dependent rendering paths. ⚠️ Golden output is
   platform/font-rendering-sensitive — a golden generated on macOS/CI
   image A can mismatch on Linux/CI image B; run/update goldens on the
   same platform your CI asserts against, or accept per-platform golden
   sets.

7. **Mocking: `mockito` or `mocktail`.** Use `mockito`
   (`@GenerateNiceMocks([MockSpec<T>()])` + `build_runner`, importing the
   generated `.mocks.dart`) when codegen is acceptable, or `mocktail`
   (no codegen, works with `sealed`/`final` classes mockito's codegen can
   struggle with) when it isn't. **CRITICAL:** stub any method returning
   a `Future`/`Stream` with `thenAnswer((_) async => value)` — **never**
   `thenReturn(value)`, which hands back an unwrapped value instead of a
   `Future` and fails or misbehaves at the await site.

   ```dart
   when(mockRepository.fetchUser(any))
       .thenAnswer((_) async => const User(id: '1', name: 'Ada'));
   ```

8. **⚠️ `package:checks` is the emerging successor to `matcher`/`expect`,
   not yet the default.** `checks` (`check(x).equals(...)`,
   `check(x).isA<T>()`) is a newer, more type-safe assertion API; treat it
   as forward-looking and confirm the project has actually adopted it
   before writing new tests against it. `expect` + `matcher` remains the
   standard, stable choice for new tests today unless the project has
   already migrated.

## Behavioral-assertion philosophy

Consistent with this marketplace's `nestjs-testing` and `angular-testing`
skills:

- **Test observable behavior, not implementation.** Assert what the
  user sees or what happens as a result of an action — rendered text, a
  widget appearing/disappearing, a tap leading to a navigation or a
  callback firing — never private fields or that some specific private
  method ran.
- **Don't over-mock.** Mock only true external boundaries (network,
  platform channels, local DB) at the Service/Repository seam (see
  `flutter-architecture`). Construct real ViewModels and real widgets in
  the test and drive them through their public API; a widget test that
  mocks the very widget under test proves nothing.
- **Prefer fakes over deep mock-verify chains.** A small in-memory fake
  implementing a Repository interface is usually easier to read and more
  robust than a long chain of `verify(mock.x()).called(n)` assertions
  that test call plumbing instead of outcomes.

## Review red flags

- Mocking the widget/class under test itself, instead of mocking only
  its true external dependencies.
- Asserting on internal/private state instead of rendered output or a
  public, observable outcome.
- `tester.pump()` used where the change needs multiple frames to settle
  (animation, async work) — flaky, order-dependent failures.
- `tester.pumpAndSettle()` used against a widget with a continuously
  repeating/infinite animation — the test hangs instead of failing
  cleanly.
- `find.byType(Container)` / `find.byType(Padding)` or another generic,
  structural widget type used as a selector — brittle against unrelated
  layout refactors; prefer `find.byKey`, `find.text`, or
  `find.bySemanticsLabel`.
- Golden tests that are non-deterministic (unpinned fonts, animated
  content, platform-dependent text rendering) or golden diffs
  regenerated and committed without visual review.
- `thenReturn(value)` used to stub a method that returns a
  `Future`/`Stream` — must be `thenAnswer((_) async => value)`.
- Integration tests used for coverage that a widget test could provide
  just as well (pyramid inverted: few unit tests, many slow integration
  tests).

## Sources

- https://docs.flutter.dev/testing/overview
- https://docs.flutter.dev/testing/unit-tests
- https://docs.flutter.dev/testing/widget-tests
- https://docs.flutter.dev/testing/integration-tests
- https://docs.flutter.dev/cookbook/testing/widget/introduction
- https://pub.dev/packages/mockito
- https://pub.dev/packages/mocktail
- https://pub.dev/packages/checks — ⚠️ pre-stable emerging successor to
  `matcher`/`expect`; verify current adoption status before defaulting to
  it.
- Cross-reference: the official `flutter-add-widget-test` and
  `flutter-add-integration-test` skills in
  `github.com/flutter/agent-plugins` (BSD-3) cover the same base
  widget/integration-test setup; intentionally not vendored into this
  plugin (see this plugin's `HOUSE-NOTES.md`) — this skill supersedes
  them with added golden-test and behavioral-assertion depth.
- Cross-reference: the vendored `dart-add-unit-test` and
  `dart-generate-test-mocks` skills in the `dart-paved-path` dependency,
  for the plain-Dart `package:test` and mock-generation fundamentals this
  skill builds on.
- Cross-reference: `nestjs-testing` (`nestjs-paved-path`) and
  `angular-testing` (`angular-paved-path`) for the shared
  behavioral-assertion philosophy — mock at the boundary, assert on
  observable outcomes, never on a mock's own internals.
