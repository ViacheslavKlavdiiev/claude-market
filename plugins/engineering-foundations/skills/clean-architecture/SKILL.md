---
name: clean-architecture
description: "Use when designing or reviewing layered/onion architecture in any stack — dependency direction, layer boundaries, ports/adapters, composition root. Layer names come from the project's Stack Manifest layer map."
---

# Clean Architecture (Layered / Onion / Ports & Adapters)

Keeps a codebase's dependencies pointing **inward**: a pure domain/application
core knows nothing about the database, external APIs, the filesystem, or any
SDK — those are replaceable outer details reached only through interfaces
("ports"). This skill is about **layers, dependency direction, and where each
kind of code lives** — not the mechanics of any specific web framework, ORM, or
validation library. Framework/ORM/validation-library mechanics, and the
equivalent "where does this live" question for a UI/frontend layer, belong to
the project's own stack-specific skills; this skill governs cross-layer
dependency direction only.

> **Layer names are the project's.** The names used below (core, services,
> ports, adapters, repositories, composition root, routes) are placeholders.
> The real package/directory names come from the project's Stack Manifest
> layer map — map the rules below onto those names.

For a good/bad code example per rule see [examples.md](examples.md); for
sources and the canonical definition see [references.md](references.md).

## Severity Levels

- **CRITICAL** — Breaks the dependency rule or leaks infrastructure into the core. Destroys testability and the ability to swap implementations; the core stops being pure.
- **HIGH** — Erodes a boundary (an external system escapes its layer, logic sits in the wrong place). Compiles and runs, but couples layers and forces tests to use real I/O.
- **MEDIUM** — Hurts navigability or invites future erosion.

## The layers (outer → inner)

Dependencies may point **only inward** (toward the core). Nothing inner may
import anything outer.

| Layer | Typical responsibility | Placeholder path |
|---|---|---|
| Presentation / edge | Routes/controllers: parse request, call one service, return | `<app>/modules/<feature>/routes.*` |
| Application services | Orchestration, use cases | `<app>/modules/<feature>/service.*` |
| Ports (interfaces) | Contracts the core and services depend on, implemented by adapters | `<shared>/ports.*`, `<shared>/contracts/*` |
| Infrastructure adapters | Concrete implementations of ports (DB client, external APIs, SDKs) | `<app>/adapters/**` |
| Data access (repositories) | All ORM/query-layer usage; returns domain rows, not query builders | `<app>/modules/<feature>/repository.*` |
| Composition root (DI) | The one place that constructs adapters/repositories and wires everything | `<app>/platform/container.*` |
| Domain / application core (pure) | Business/domain logic; no I/O, no SDKs | `<core>/src/**` |

> This table is illustrative. Consult the project's Stack Manifest layer map
> for the actual directory/package names, then apply the rules below to them.

## Guiding principle

**The database, third-party APIs, and any SDK are external details, not the
center.** Inner layers define interfaces; outer layers implement them. When
you don't know where something goes, ask: *"what does this depend on?"* — and
place it so its dependencies point inward, never outward.

## Do NOT flag (sanctioned patterns)

A review loses credibility on false positives. These look like violations but
are how a codebase is commonly, deliberately designed to work — do not report
them unless the project's own conventions say otherwise:

- **A service constructing its OWN repository** from a shared DB handle (e.g.
  a module's service builds its own repository object in its constructor) —
  the repository is module-private and the test seam stays the injected
  DB handle/container (rule 3's sanctioned exception). Constructing
  **another** module's repository this way is still a violation (rule 7).
- **The core importing the shared ports/contracts package** — that IS the
  allowed inward direction (rule 8); only imports from outer/app-internal code
  into the core are the forbidden back-edge.
- **Pure helpers living in the core** — purity is the bar, not emptiness; pure
  logic belongs in the core, and moving it out "just because it's small" is
  not a fix (rule 1).
- **A vendor SDK used inside the core's own sanctioned port implementation**
  (e.g. the one blessed default provider adapter shipped alongside the port
  it implements) — the core is allowed to *ship* that one sanctioned
  implementation; everything else in the core depends on the interface,
  never the SDK (rule 1).
- **A composition-root cycle** — a hand-rolled DI container that
  intentionally passes itself back into services it constructs is commonly
  excluded from circular-dependency checks by design; if the project does
  this, it should be an explicit, documented exclusion, not silently ignored.

---

## 1. Dependencies point inward — the core stays pure (CRITICAL)

The domain/application core is the innermost layer. Its only side effect is
through an **injected** port (e.g., an injected provider interface). No direct
database client, filesystem, network call, `process.env` read, or third-party
SDK call. Whatever the core needs (a diff, a document, a payload) is an
**input**, never something it fetches itself. If you reach for I/O here, the
logic belongs in a service or adapter, not the core.

Why: purity is what lets the core run identically in every host (locally, in
tooling, in CI), and be tested with a fake port implementation and no real
infrastructure. One real import of a filesystem/DB/network module ends that.

## 2. External systems only behind interfaces (ports) (CRITICAL)

Every outside system (database, LLM/AI provider, version-control host, issue
tracker, search index, secrets store, auth provider, etc.) is reached through
a **port** — an interface declared in the shared ports/contracts layer.
Services and the core depend on the **port**, never on a concrete adapter
class.

Never import a concrete vendor SDK client into a service or the core. That
inverts the dependency arrow and forces real network access/credentials into
tests.

## 3. Instantiate only in the composition root (HIGH)

Concrete **adapters** and **other modules' repositories** are constructed
**only** in the composition root (the DI container / wiring module), lazily,
resolving secrets/config there. Everything else receives them through
injection. Tests inject fakes through the container's override mechanism —
that is the whole point of the indirection.

One sanctioned exception (common in practice): a module's service MAY
construct its **own** repository from a shared DB handle. The repository is
module-private and the test seam remains the injected DB handle/container.
Constructing **another** module's repository this way is still a violation —
reach shared entities through the composition root's facade instead (rule 7).

A `new SomeAdapter(...)` outside the composition root is a smell: it can't be
overridden in tests and it hard-wires a choice the composition root should
own.

## 4. All data access lives in repositories (CRITICAL)

The ORM/query-layer API (tables, query DSL, raw queries) appears **only** in
the repository layer. Services and routes call repository methods; they never
build queries directly. Repositories return **domain types / rows**, not a
live query builder or a half-built query — that would leak the ORM upward and
let callers depend on its shape.

Why: the repository is the seam that keeps "what we store" swappable and lets
the service be tested without a real database. A leaked query builder
re-couples every caller to that specific ORM.

## 5. Schema contracts are the single source of truth at boundaries (HIGH)

Validate **once, at the edge**: parse untrusted input at the route/controller
and parse/serialize output using the project's shared validation/schema
library, with schemas defined in one shared contracts location. Inward of
that boundary, code works with the already-parsed types — **parse, don't
validate** — don't re-validate the same data deeper in. Don't redefine a
contract per layer; extend the shared contracts module with a **new**
definition (never edit a generated/barrel file by hand).

The tell-tale antipattern is an untyped cast of the raw request body
**followed by** scattered manual type/presence checks deeper in the handler
and service. These are two symptoms of the **same** missing edge-parse, so fix
them as one change: replace the cast with a single schema-parse call at the
route, and then **delete the downstream manual re-checks** — once the payload
is parsed at the boundary, every inward type/presence guard on those fields is
dead code, because the type is already guaranteed. Flag the cast and its
now-redundant re-checks together as one finding, not as two unrelated ones.

Why: one gate means one place to trust. Re-validation inward is dead weight
and drifts out of sync; redefining shapes per layer breaks the single source
of truth.

## 6. Routes are a thin edge (HIGH)

A route/controller does four things: read context/auth, parse the request
with a contract, call **one** service method, return its result. No business
logic, no direct data-access calls, no adapter calls, no constructing
services-with-logic in the handler body.

Why: keeping orchestration in the service (not the handler) is what lets the
same logic be reused elsewhere (a background job, a CLI, a scheduled task) and
tested without going through the transport layer.

## 7. Respect facade boundaries (MEDIUM)

Cross-cutting subsystems are reached only through their published facade —
never by importing files from another module's internal pipeline. Shared
entities are reached via the composition root's facades, not by deep-importing
another module's repository.

Why: the facade is the contract; reaching past it couples you to internals
that are free to change behind it.

## 8. Cross-package import direction (core→outer back-edge is CRITICAL; else HIGH)

The core must never import from the outer app/server layer. The shared
ports/contracts package must import nothing runtime beyond the schema/
validation library and its own definitions — it sits at the center so every
package can depend on it. The arrows: `outer app → core → shared` and
`outer app → shared`; never the reverse.

A `core → outer app` import is **CRITICAL**, not merely HIGH: it both breaks
the inward-only dependency rule *and* leaks the outer package into the core,
so the core stops being pure and shareable — that is a rule 1 purity break,
not a mild coupling. Rank a core→outer back-edge at the top tier, alongside
the rule 1/2 findings — even when the imported symbol is only a type or an
error class. Other direction issues (e.g. the shared package importing
something runtime, which couples the center outward) stay HIGH.

Why: a back-edge (core importing outer code) makes the "pure, shareable" core
un-shareable and creates import cycles.

## 9. Enforce the boundaries mechanically where possible — keep the check green (HIGH)

Conventions erode; a check in CI doesn't. **Enforcement tooling is
project-specific** — this skill does not prescribe one. Many stacks use an
import/dependency-boundary linter (for example: dependency-cruiser,
eslint-plugin-boundaries, ArchUnit, import-linter, deptrac, or a build-tool's
own module-boundary feature — whichever the project's Stack Manifest names,
if any) wired into a script and gated in CI. What such a check should forbid,
regardless of which tool enforces it:

- the core importing outer app internals, except the shared contracts (rule 8)
- I/O primitives (filesystem, process, raw network sockets) or infra SDKs used
  directly inside the core, and any vendor SDK used outside its one sanctioned
  port implementation (rule 1)
- the shared contracts package importing anything beyond its schema library
  and its own definitions (rule 8)
- routes or services importing the ORM/query layer or raw schema/table
  definitions directly, instead of going through a repository (rule 4)
- services or the core importing concrete adapter implementations instead of
  ports (rule 2)
- deep imports into another module's internal pipeline/service/repository
  instead of its published facade (rule 7)
- circular dependencies, with any intentional exception (e.g. a
  composition-root cycle) explicitly and narrowly excluded, not silently
  allowed everywhere

When you add a boundary the project's tooling doesn't yet cover, extend its
existing configuration — never invent a parallel one. Not everything is
mechanizable (e.g. "business logic in a route", a stray global network call
in the core) — those stay a review-time judgment. See
[examples.md](examples.md) for an illustrative (tool-agnostic) shape of such a
rule set. A second, in-editor import-boundary linter is an optional faster
feedback loop alongside a CI check, not a replacement for one.

---

## Quick placement checklist

When adding code, ask in order:
1. Does it touch an external system (DB, third-party API/SDK, filesystem,
   network)? → behind a **port/adapter interface** (or a **repository** for
   the DB), constructed in the **composition root**.
2. Is it orchestration / a use case? → a **service** method.
3. Is it pure domain/business logic? → the **core** (and keep it pure).
4. Is it request/response shape (params/body/response)? → a **route** + a
   **shared contract**.
5. Does my import point **outward**? → stop; invert it with an interface.
