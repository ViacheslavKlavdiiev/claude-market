---
name: flutter-best-practices
description: Use when writing or reviewing Flutter widget code — StatelessWidget/StatefulWidget, const, keys, build() purity, BuildContext across async gaps, Future/StreamBuilder, null safety, lints, assets.
---

# Flutter Best Practices

There is no official "Flutter best practices" agent-skill covering this
combined ground — this skill is authored from docs.flutter.dev and
dart.dev; see Sources. It complements (does not replace) the vendored
task skills in this plugin (`flutter-build-responsive-layout`,
`flutter-implement-json-serialization`, `flutter-setup-localization`,
`flutter-use-http-package`), which cover narrower how-tos.

## Rules to follow

1. **Prefer `StatelessWidget`.** Reach for `StatefulWidget` only when the
   widget itself owns mutable, ephemeral state (an animation, a text
   field's controller, a toggle). If the state actually belongs to a
   parent or a service, lift it out instead of defaulting to `State`.

2. **`const` everywhere the subtree is immutable.** A `const` widget is
   skipped entirely on rebuild — this is the single cheapest, highest-leverage
   perf win in Flutter. Enable `prefer_const_constructors` (and
   `prefer_const_literals_to_create_immutables`) so the analyzer catches
   missed opportunities instead of relying on manual review.

3. **`build()` must be PURE.** No side effects, no `async`/`await`, no
   network or file I/O, no allocation of controllers/streams/subscriptions.
   `build()` can run many times per second (every animation tick, every
   ancestor rebuild) — anything expensive or stateful inside it re-runs on
   every call.

4. **Own the lifecycle of long-lived objects.** Create controllers
   (`AnimationController`, `TextEditingController`, `ScrollController`),
   streams, and subscriptions in `initState`, and tear them down in
   `dispose`. Never allocate them inside `build()` — that leaks the old
   instance on every rebuild and disconnects listeners from the new one.

5. **Narrow the rebuild scope.** Split large widgets into smaller ones,
   push state as far down the tree as it's actually used, keep `const`
   children above the part that changes, and use `ValueListenableBuilder`
   / `Selector` / a scoped `Consumer` so only the subtree that depends on
   changed data rebuilds — not the whole screen.

6. **Use `Key`/`ValueKey` for reordering.** When a list reorders, inserts,
   or removes stateful siblings of the same widget type, give each one a
   stable `ValueKey` (e.g. keyed by an id) so Flutter matches elements to
   the correct state across the rebuild instead of shuffling state onto
   the wrong item. Don't sprinkle keys where element identity never
   changes — they add no value there.

7. **⚠️ `[Flutter ≥3.7]` Never use a `BuildContext` across an `async` gap
   without a mounted guard.** After any `await`, check
   `if (!context.mounted) return;` before touching `context` again (e.g.
   before calling `Navigator`, `ScaffoldMessenger`, or `Theme.of`). The
   widget — or the whole route — may have been disposed while the
   `await` was pending. This is enforced by the `use_build_context_synchronously`
   lint; verify it's enabled and treat it as a build-breaking failure,
   not a warning to ignore. On Flutter <3.7, use the equivalent
   `mounted` check on the `State` object instead of `context.mounted`.

   ```dart
   Future<void> _submit() async {
     final result = await repository.save(form);
     if (!context.mounted) return;
     ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(result)));
   }
   ```

8. **Hoist futures/streams out of `build()`.** Store the `Future`/`Stream`
   in `initState` (or a field assigned once), and pass that stored
   reference to `FutureBuilder`/`StreamBuilder` — never call the async
   function inline in the `future:`/`stream:` parameter, or it restarts
   on every rebuild. Always branch on `snapshot.connectionState` and
   check `snapshot.hasError` before reading `snapshot.data`; a bare
   `snapshot.data!` crashes on the loading/error frames.

9. **Sound null-safety, avoid `!`.** Prefer `?.`, `??`, and narrowing
   (`if (x != null)`) over the bang operator. Reach for `!` only when
   non-nullability is provably guaranteed at that point and a null there
   would itself indicate a bug worth crashing on. Use `late` only with a
   clear, documented initialization contract (e.g. set in `initState`
   before any read).

10. **Format and lint baseline.** Run `dart format` (default 80-column
    width) before committing. Every app project should have
    `analysis_options.yaml` with `include: package:flutter_lints/flutter.yaml`
    (or `package:lints` for pure-Dart packages) — pin the package version
    and never strip this baseline to silence warnings.

11. **Assets and fonts declared properly.** List every asset and font
    under the `flutter:` key in `pubspec.yaml`. Provide resolution-aware
    image variants (`2.0x/`, `3.0x/` subdirectories) rather than shipping
    one oversized image and scaling it down at runtime. Keep heavy
    decode/parse work (large images, big JSON) off the UI isolate — use
    `compute()` or a dedicated isolate so it doesn't jank the frame
    budget.

## Review red flags

- `async` work, `Future`/`Stream` creation, or non-trivial `MediaQuery.of`
  layout math performed inside `build()`.
- `setState` called after an `await` with no `mounted`/`context.mounted`
  guard; any `BuildContext` used after an async gap without that check.
- Missing `const` on widget trees that are obviously immutable.
- A single `setState` at the top of a large widget causing a whole-page
  rebuild for a one-field change.
- Controllers, `AnimationController`s, or stream subscriptions created
  but never disposed (`dispose()` missing or incomplete).
- `!` used to silence a nullability error instead of actually handling
  the null case.
- `FutureBuilder`/`StreamBuilder` with the future/stream built inline
  (`future: fetchData()`) instead of a hoisted, stable reference.
- Fixed pixel sizes or hard-coded `Color(0xFF...)` values in place of
  theme roles and layout constraints (see `flutter-material3` and
  `flutter-build-responsive-layout`).
- A disabled, removed, or never-configured lint baseline
  (`analysis_options.yaml` missing or empty).

## Sources

- https://docs.flutter.dev/perf/best-practices
- https://dart.dev/effective-dart
- https://docs.flutter.dev/reference/of-context
- https://pub.dev/packages/flutter_lints
- Version gate: `context.mounted` requires Flutter ≥3.7; on older SDKs use
  the `State.mounted` check instead.
