---
name: flutter-architecture
description: Use when structuring a Flutter app — the official MVVM layered architecture (Views + ViewModels / Repositories + Services), DI, state management choice.
---

# Flutter Architecture

This skill is authored from `docs.flutter.dev/app-architecture` — the
official Flutter application-architecture guidance. It is *guidance*, not
a framework: nothing in the SDK enforces these layers, and the guidance
itself is relatively recent (2024–2025) — confirm it still matches
current docs before treating it as settled convention. It complements
(does not replace) `flutter-best-practices` and `flutter-material3` in
this plugin.

## The spine invariant

> The UI layer must not reach data sources directly. Data flows strictly
> View → ViewModel → Repository → Service (an optional Use-Case may sit
> between ViewModel and Repository). Views contain no business logic;
> ViewModels never import `http`/DB/platform SDKs; Services hold no
> state.

Every rule below exists to keep this invariant true. When reviewing or
writing Flutter app code, check first whether a Widget, ViewModel, or
Repository is reaching further down (or sideways) than its layer allows.

## Rules to follow

### UI layer — Views + ViewModels

1. **Views are widgets with no business logic.** A View's job is to
   render a ViewModel's state and forward user intent to the
   ViewModel's commands (exposed as plain Dart callbacks/methods). No
   parsing, no validation rules, no direct data access — if a Widget
   needs to decide something more complex than "how do I lay this out,"
   that decision belongs in the ViewModel.

2. **One ViewModel per View.** ViewModels hold UI state (loading, error,
   the data to display, form values) and expose commands the View calls
   in response to user input. ViewModels commonly extend
   `ChangeNotifier` so a View can listen and rebuild on change, and they
   are constructed so they can survive widget rebuilds/config changes
   (e.g. owned above the View, not recreated inside `build()`).

3. **Inject Repositories into ViewModels via constructor DI.** A
   ViewModel depends on one or more Repository interfaces passed into
   its constructor — never a global singleton reached for internally,
   and never a Service or platform SDK (`http`, `Dio`, `sqflite`,
   `firebase_*`, `shared_preferences`, ...) imported directly into a
   ViewModel. If a ViewModel needs data, it asks a Repository for it.

### Data layer — Repositories + Services

4. **Repositories are the single source of truth for a kind of data.**
   A Repository turns raw data (from one or more Services) into domain
   models, owns caching/refresh/retry policy, and decides when to hit
   the network vs. serve from cache. Repositories are unaware of each
   other — one Repository must never import or call another; if two
   Repositories need to be combined, that composition belongs in a
   ViewModel or a Use-Case, not inside a Repository.

5. **Services are stateless wrappers around exactly one external
   source.** A Service wraps a single REST API, a single platform
   channel, a single local database/file API, etc., and exposes
   `Future`/`Stream`-returning methods with no business logic and no
   mutable state of its own. A Service that accumulates state (a cache,
   a "last result" field used for logic) has drifted into Repository
   territory.

6. **Domain models are immutable.** Model classes returned by
   Repositories should be immutable value types — hand-written `final`
   fields with `copyWith`, or generated via `freezed`/Dart 3 `sealed`
   classes for unions (e.g. `Loading`/`Success`/`Error` result types).

### Optional domain layer — Use-Cases

7. **Add a Use-Case only when logic spans repositories, is genuinely
   complex, or is reused across multiple ViewModels.** A Use-Case (aka
   Interactor) sits between ViewModel and Repository, orchestrating
   calls across two or more Repositories or encapsulating a business
   rule that would otherwise be duplicated in several ViewModels. Do
   not introduce a Use-Case for a single ViewModel calling a single
   Repository method — that's needless indirection.

### Project layout

8. **Structure `lib/` by layer, then by feature.** The official guide's
   recommended shape:

   ```
   lib/
   ├── data/
   │   ├── models/
   │   ├── repositories/
   │   └── services/
   ├── domain/                # optional
   │   ├── models/
   │   └── use_cases/
   └── ui/
       ├── core/               # shared widgets/theme/utilities
       └── features/
           └── <feature>/
               ├── view_models/
               └── views/
   ```

   App-wide session/cache state lives in a Repository (constructed once,
   above the features that need it), never held in a widget or a static/
   global variable.

## State management — pick per app, do not treat this as pinned

The official docs are deliberately non-prescriptive here: *"the best
choice depends on the app's complexity, your team's preferences, and the
specific problems you need to solve."* This skill does **not** mandate a
state-management library. Options, roughly low → high ceremony:

- **`setState`** — ephemeral, widget-local state. Start here for
  anything that doesn't need to be seen outside one widget.
- **`ValueNotifier` + `ValueListenableBuilder`** — Flutter-only, single
  value, no external package.
- **`InheritedWidget`/`InheritedModel`** — low-level ancestor→descendant
  sharing; the primitive `provider` and others build on.
- **`ChangeNotifier` (+ `provider`)** — the pattern the official
  architecture guide itself uses for ViewModels; a solid default once
  state needs to be shared/observed beyond one widget.
- **Riverpod** (community) — compile-safe, testable, provider-based;
  popular for medium/large apps that want DI + state management unified.
- **Bloc/Cubit** (community) — explicit event→state modeling; strong for
  complex flows and traceability/testability at scale.
- Redux, MobX, signals, and others exist too — search the `state-management`
  topic on pub.dev.

**Guidance:** start with the least powerful tool that solves the
problem — `setState` or `ValueNotifier` before reaching for a package.
Adopt Riverpod or Bloc when state is genuinely app-wide, needs to be
independently testable, or the flow is complex enough that ad hoc
`ChangeNotifier` wiring becomes hard to follow. Whichever you pick, the
state lives in the ViewModel layer — never inside a View/widget.

## Review red flags

- A Widget/View calling `http`/Dio/Firebase/`SharedPreferences` (or any
  platform SDK) directly, instead of going through a ViewModel →
  Repository.
- Business logic (parsing, validation, branching on domain rules) living
  in a `State`/widget instead of a ViewModel or Use-Case.
- A ViewModel importing a Service class directly, or importing a
  platform SDK/HTTP client itself — it should only see Repository
  interfaces.
- Two Repositories referencing/calling each other.
- A Service holding mutable state (a cache field, a "current user"
  field used for branching) — that logic belongs in a Repository.
- A single "god" ViewModel that spans multiple unrelated features/Views
  instead of one ViewModel per View.
- `GetIt` or another global service locator reached for *inside a View*
  to fetch a Repository/Service directly — DI should flow through
  constructors down to the ViewModel; a locator used to wire up
  constructors at the composition root is fine, using it inside a View
  to bypass the ViewModel is not.

## Sources

- https://docs.flutter.dev/app-architecture
- https://docs.flutter.dev/app-architecture/guide
- https://docs.flutter.dev/app-architecture/case-study
- https://docs.flutter.dev/app-architecture/recommendations
- https://docs.flutter.dev/data-and-backend/state-mgmt/options
- ⚠️ This guidance is relatively recent (2024–2025) and is not enforced
  by the SDK or tooling — treat it as recommended convention, verify
  against current docs before applying rigidly to an existing codebase
  that predates it.
