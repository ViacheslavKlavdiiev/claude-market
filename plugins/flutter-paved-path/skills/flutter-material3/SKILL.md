---
name: flutter-material3
description: Use when theming a Flutter app with Material 3 — ColorScheme.fromSeed, theme/darkTheme/themeMode, colorScheme roles, M3 components, dynamic color.
---

# Flutter Material 3 Theming

There is no separate swappable UI-library layer for Flutter the way there
is for Angular (PrimeNG) — Material 3 ships inside the `material` library
in the SDK and is the default, mainstream design system. No official
"Material 3 theming" agent-skill exists either; this skill is authored
from docs.flutter.dev, api.flutter.dev, and m3.material.io — see Sources.

## ⚠️ Version gate — read this before touching `useMaterial3`

Material 3 became the **default** in Flutter 3.16 (`useMaterial3: true`
was the implicit value from then on). On **current SDKs (3.29+)**,
Material 2 has been **removed entirely** and the `ThemeData.useMaterial3`
flag is obsolete. Concretely:

- **Do not set `useMaterial3` at all** in `ThemeData` on a current SDK —
  there is nothing to toggle it against, and setting it (`true` or
  `false`) is a stale-tutorial smell that flags outdated guidance.
- **Verify the target SDK before applying this rule.** If a project pins
  an old Flutter version (pre-3.16) you may find `useMaterial3: false`
  still in play deliberately — confirm the `flutter` SDK constraint in
  `pubspec.yaml` / the installed `flutter --version` before assuming M3 is
  active or that the flag is dead weight to remove.

## Rules to follow

1. **Build the theme from a seed color.**
   `ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: mySeed))`
   generates a full, harmonized tonal palette from one color — this is
   the M3-idiomatic replacement for hand-picking `primarySwatch`/individual
   colors.

2. **Always supply both `theme:` and `darkTheme:`, plus `themeMode:`.**
   Build the dark theme the same way, with `brightness: Brightness.dark`:

   ```dart
   MaterialApp(
     theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: seed)),
     darkTheme: ThemeData(
       colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark),
     ),
     themeMode: ThemeMode.system, // default; let the OS decide unless overridden
   )
   ```

   Omitting `darkTheme`/`themeMode` means dark-mode users get an
   unintended (usually light) theme or a jarring one built ad hoc from
   individual widget overrides.

3. **Consume colors via `Theme.of(context).colorScheme` roles**, never
   hard-coded hex or named `Colors.*` constants. Read `primary`,
   `secondary`, `surface`, `onSurface`, `surfaceContainerHighest`, `error`,
   etc. by role so the same widget looks correct in both light and dark
   theme and after a seed-color change, with no widget-level edits.

4. **Dynamic color (Android 12+) via `dynamic_color`, with a fallback
   seed.** Wrap the app in `DynamicColorBuilder` and use the
   device-derived `ColorScheme` when available; always provide a static
   `ColorScheme.fromSeed(...)` fallback for iOS, older Android, web, and
   desktop where no dynamic palette exists.

   ```dart
   DynamicColorBuilder(
     builder: (lightDynamic, darkDynamic) {
       return MaterialApp(
         theme: ThemeData(
           colorScheme: lightDynamic ?? ColorScheme.fromSeed(seedColor: seed),
         ),
         darkTheme: ThemeData(
           colorScheme: darkDynamic ??
               ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark),
         ),
       );
     },
   )
   ```

5. **Use M3 components, not their M2 predecessors:**
   - `NavigationBar` (bottom bar) instead of `BottomNavigationBar`.
   - `NavigationRail` for side navigation on wider layouts.
   - `FilledButton` (and `FilledButton.tonal`) alongside `ElevatedButton`/
     `OutlinedButton`/`TextButton` — pick `FilledButton` for the primary
     action per M3 button hierarchy.
   - `SegmentedButton` for exclusive/multi-select choice groups.
   - `SearchBar`/`SearchAnchor` for search entry points.
   - `Card`, updated `AlertDialog`/`Dialog`, and badges follow M3 shapes
     automatically once the theme is seed-based — no per-widget styling
     needed for the default look.

6. **Centralize typography and shape in `ThemeData`**, not on individual
   widgets: set `textTheme` (and read it back via
   `Theme.of(context).textTheme.titleLarge` etc.), and configure
   component-level theme extensions (`cardTheme`, `filledButtonTheme`,
   `navigationBarTheme`, ...) once at the app root so every instance of a
   component stays visually consistent without repeated inline styling.

## Review red flags

- Explicitly setting `useMaterial3: true` or `useMaterial3: false` on a
  current SDK — the flag is obsolete; either it's a no-op or (once M2 is
  fully removed) it doesn't do what the author thinks.
- Hard-coded `Color(0xFF...)` literals or bare `Colors.blue`-style
  constants in widget code instead of `Theme.of(context).colorScheme`
  roles.
- No `darkTheme` and/or no `themeMode` set on `MaterialApp` — dark mode is
  unhandled or falls back to an unintended default.
- Colors or text that read fine in light mode but fail contrast/legibility
  in dark mode (a symptom of hard-coded colors instead of role-based
  theming).
- Legacy M2 widgets: `RaisedButton`/`FlatButton` (removed from current
  SDKs — any reference to them is stale-tutorial code that won't compile),
  or `BottomNavigationBar` used where `NavigationBar` is clearly intended
  for a new M3 screen.
- Per-screen or per-widget one-off styling (colors, shapes, text styles)
  that duplicates what `ThemeData` should centralize.

## Sources

- https://docs.flutter.dev/ui/design/material
- https://api.flutter.dev/flutter/material/ThemeData/useMaterial3.html
- https://m3.material.io
- https://pub.dev/packages/dynamic_color
- ⚠️ Version gate: Material 3 default since Flutter 3.16; Material 2
  removed and `useMaterial3` obsolete on current SDKs (3.29+) — confirm
  against the target SDK before applying the "never set useMaterial3"
  rule to an older pinned project.
