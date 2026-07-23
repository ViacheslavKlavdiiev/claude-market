---
name: flutter-routing
description: Use when setting up navigation in Flutter with GoRouter — routes, params, shells, redirect guards, typed routes, deep linking.
---

# Flutter Routing (GoRouter)

This skill is authored from `pub.dev/packages/go_router` and
`docs.flutter.dev/ui/navigation`. It covers the same ground as the
official `flutter-setup-declarative-routing` skill in
`flutter/agent-plugins` (not vendored into this plugin — the
house-authored version here supersedes it) plus the redirect/shell/typed
-routes depth needed for real apps, not just a single-screen example.

## ⚠️ Version gate — read before pinning

`go_router` is at major version **17.x** as of authoring. It has a
history of breaking changes across major versions (redirect signature
changes, `ShellRoute`/`StatefulShellRoute` API churn, etc.). **Pin an
exact or tightly-bounded version in `pubspec.yaml` and re-check the
package changelog** before applying the examples below verbatim to a
project pinned to an older major.

## Rules to follow

1. **One top-level `GoRouter`, bound via `MaterialApp.router`.** Define
   a single `GoRouter` instance (usually a top-level or DI-provided
   singleton) and wire it in with:

   ```dart
   MaterialApp.router(routerConfig: router)
   ```

   Do not mix this with a second, independent `MaterialApp` +
   `Navigator` — there should be exactly one router owning the app's
   navigation state.

2. **Each screen is a `GoRoute`.**

   ```dart
   GoRoute(
     path: '/users/:id',
     builder: (context, state) => UserScreen(
       id: state.pathParameters['id']!,
     ),
   )
   ```

   Path parameters are declared with a leading `:` (`:id`) and read via
   `state.pathParameters['id']`. Query parameters are read via
   `state.uri.queryParameters['q']` — do not hand-parse the URL string.

3. **Persistent shells (bottom nav / side rail) via `ShellRoute` or
   `StatefulShellRoute.indexedStack`.** Use `ShellRoute` when the shared
   chrome (nav bar, app bar) wraps child routes that don't need
   independently preserved state. Use `StatefulShellRoute.indexedStack`
   when each tab/branch must keep its own navigation stack and scroll/
   form state alive when switching tabs — `ShellRoute` alone rebuilds
   the child fresh on every switch and loses that per-branch state.

4. **Guard auth centrally with `redirect`, not scattered widget
   checks.** Put the auth decision in the top-level `GoRouter(redirect:
   ...)` (plus a per-route `redirect` for narrower rules), returning
   either a path to redirect to or `null` to allow navigation as
   requested:

   ```dart
   GoRouter(
     redirect: (context, state) {
       final loggedIn = authRepository.isLoggedIn;
       final loggingIn = state.matchedLocation == '/login';
       if (!loggedIn && !loggingIn) return '/login';
       if (loggedIn && loggingIn) return '/';
       return null;
     },
     refreshListenable: authRepository, // re-run redirect on auth changes
     routes: [...],
   )
   ```

   `refreshListenable` (a `Listenable`/`ChangeNotifier`, commonly the
   auth Repository itself) makes GoRouter re-evaluate `redirect` when
   auth state changes out from under the current route — without it, a
   login/logout that happens while already on a screen won't reroute
   until the next explicit navigation.

5. **`context.go` vs `context.push` — pick deliberately.**
   - `context.go('/path')` replaces the current location — URL-first,
     use it for tab/section switches and anywhere the back button
     should not return to the page you're leaving.
   - `context.push('/path')` pushes onto the stack — use it for drill-in
     navigation (list → detail) that the user should be able to pop
     back out of with the system back button/gesture.

6. **Typed routes for larger apps: `go_router_builder`.** Once a route
   set outgrows hand-written path strings, define routes as classes
   annotated `@TypedGoRoute<...>()` and generate the navigation API with
   `build_runner` (`dart run build_runner build`). This trades a small
   amount of codegen setup for compile-time-checked route
   construction/args instead of stringly-typed `context.go('/users/$id')`
   calls scattered through the app.

7. **Deep linking needs platform configuration, not just routes.**
   Declaring `GoRoute`s alone does not make a URL open the app —
   Android needs an `intent-filter` with `autoVerify="true"` in the
   manifest (App Links), iOS needs Associated Domains, and Flutter Web
   should call `usePathUrlStrategy()` before `runApp` to use real paths
   instead of `/#/path` hash routing.

8. **⚠️[Flutter SDK ≥3.7] Guard `context` after an
   `await` with `context.mounted`.** Any navigation call
   (`context.go`/`context.push`/reading `GoRouterState`) that happens
   after an `await` must be preceded by a `context.mounted` check — the
   widget (and its router context) may have been disposed while the
   await was pending.

   ```dart
   final result = await someAsyncCall();
   if (!context.mounted) return;
   context.go('/next');
   ```

## Review red flags

- Mixing imperative `Navigator.push`/`Navigator.of(context).push` with
  GoRouter-defined routes for real screens — this breaks URL sync and
  deep links. Imperative `Navigator` calls for genuinely ephemeral
  overlays (a `showDialog`/`showModalBottomSheet`) are fine; using it to
  navigate between actual app screens instead of `context.go`/
  `context.push` is not.
- Auth/permission checks implemented inside individual widgets (e.g. an
  `if (!loggedIn) return LoginScreen();` inside a build method) instead
  of a central `redirect`.
- Stringly-typed navigation (`context.go('/users/$id')` built by hand
  everywhere) throughout a large app instead of typed routes via
  `go_router_builder`.
- A `ShellRoute` used where tabs need independently preserved
  state/navigation stacks — should be
  `StatefulShellRoute.indexedStack`.
- Navigation or `GoRouterState` access after an `await` with no
  `context.mounted` guard.
- No `refreshListenable` wired to the auth source when `redirect` reads
  auth state — redirects go stale until the next unrelated navigation.

## Sources

- https://pub.dev/packages/go_router
- https://docs.flutter.dev/ui/navigation
- https://docs.flutter.dev/ui/navigation/deep-linking
- https://pub.dev/packages/go_router_builder
- Cross-reference: the official `flutter-setup-declarative-routing`
  skill in `github.com/flutter/agent-plugins` (BSD-3) covers the same
  base GoRouter setup; it is intentionally not vendored into this
  plugin (see this plugin's `HOUSE-NOTES.md`).
- ⚠️ Version gate: `go_router` 17.x as of authoring, with breaking
  changes across majors — verify the pinned version's changelog before
  applying redirect/shell APIs verbatim. `context.mounted` requires
  Flutter ≥3.7.
