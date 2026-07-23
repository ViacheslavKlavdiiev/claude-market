---
name: nestjs-architecture
description: Use when structuring or reviewing NestJS layering — domain/application/infrastructure/presentation, repository ports, DI tokens, where DTOs vs entities vs persistence rows live. Builds on clean-architecture.
---

# NestJS Architecture (Layering & Ports)

There is **no official NestJS agent-skill**. This skill is authored from
docs.nestjs.com and specializes `engineering-foundations:clean-architecture`
(the stack-neutral layering skill) for NestJS's module/provider/DI
mechanics. A community skill (`Kadajett/agent-nestjs-skills`) was consulted
as corroborating reference only — see Sources.

Read `engineering-foundations:clean-architecture` first for the general
dependency-direction rules (ports, composition root, "parse don't
validate"). This skill maps those onto NestJS's concrete building blocks:
modules, providers, DI tokens, decorators.

Full rule catalog with rationale and code shape lives in
[references/rules.md](references/rules.md).

## Layer mapping

| Layer | Contents | Framework touch allowed |
|---|---|---|
| **domain / core** | entities, value objects, port interfaces (e.g. `UserRepository`) | none — pure TS, zero framework imports |
| **application** | use-cases / `@Injectable()` services depending only on domain ports | `@Injectable()` decorator only |
| **infrastructure** | adapters implementing ports (repositories, HTTP clients, DB provider) | the only layer allowed to import an ORM |
| **presentation** | controllers, DTOs, guards, filters, Swagger decorators, `main.ts` | full NestJS/HTTP surface |

## Shared spine invariant (verbatim — do not paraphrase)

> Only the infrastructure/repository layer imports the ORM (query builder /
> DB client) or holds the DB handle. Application services depend on
> repository port interfaces via DI tokens (`Symbol` + `@Inject()`), never
> on the ORM package or the DB instance.

For the Drizzle-specific instantiation of this rule, see the
`nestjs-orm-drizzle` skill.

Bind the implementation in the module:
`{ provide: USER_REPOSITORY, useClass: DrizzleUserRepository }` (concrete
class name is illustrative — swap for whatever ORM the project uses).

## Rules to follow (see references/rules.md for detail)

1. **Layer mapping** — as above; dependencies point inward (presentation →
   application → domain; infrastructure → domain); domain depends on
   nothing.
2. **Shared spine invariant** — the ORM boundary, verbatim above.
3. **Three object types, three locations** — DTO (presentation) ≠ domain
   entity (domain) ≠ persistence row (infrastructure); map explicitly at
   boundaries, never let one leak into another layer.
4. **Module boundaries** — a feature module wires controller + use-cases +
   repository binding, exports use-cases/ports, not concrete repositories.
5. **Module sharing pitfall** — providing the same service from two
   modules creates two singleton instances; export + import the module
   instead of re-registering the provider.
6. **Repository pattern** — encapsulate queries behind a repository
   interface so services hold only business logic and tests mock the
   port, not a live DB.
7. **Interface segregation & Liskov substitution for ports** — keep port
   interfaces small and role-specific; any implementation (including test
   mocks) must honor the same contract (return shape, thrown error types).
8. **Events for decoupling** — prefer `@nestjs/event-emitter` over
   `forwardRef()` to break would-be circular dependencies between feature
   modules.
9. **Pragmatism tier** — default to "lite" layering (controller → service
   → repository-interface → Drizzle repo) for CRUD; reserve the full
   4-layer split for genuinely complex domains.
10. **architecture-reviewer glob guidance** — typical globs
    `apps/api/**/domain`, `apps/api/**/application`,
    `apps/api/**/infrastructure`, `apps/api/**/presentation` (actual
    paths come from the Stack Manifest layer map).

## Review red flags

- Importing the ORM package (e.g. `drizzle-orm`, `typeorm`,
  `@prisma/client`) outside the infrastructure/repository layer.
- A service constructor typed to a concrete class (`DrizzleUserRepository`)
  instead of a port interface/DI token.
- Domain entities decorated with `@ApiProperty()` or `class-validator`
  decorators (those belong on presentation-layer DTOs only).
- Controllers returning raw persistence rows instead of a mapped
  response DTO.
- `HttpException` thrown from a domain-layer service — always a red flag,
  the domain layer must stay framework-free. From an application-layer
  service it is a red flag only in the full/layered tier (rule 9); in the
  lite tier, where domain and application collapse into one service
  layer, `HttpException` thrown from that service is acceptable per
  `nestjs-best-practices` §7.
- Business rules implemented inside a repository (repositories do data
  access, not domain logic).
- The same provider registered in two feature modules instead of
  exported/imported once (duplicate-singleton bug).
- A fat port interface (e.g. one `NotificationService` interface with
  8 unrelated methods) forcing every mock to stub methods it doesn't use.
- `forwardRef()` used to paper over a circular dependency that an event
  or a shared module would resolve more cleanly.

## Sources

- https://docs.nestjs.com/fundamentals/custom-providers
- https://docs.nestjs.com/modules
- `engineering-foundations:clean-architecture` (this skill's stack-neutral
  basis)
- Corroborating community reference (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills — folded in for the
  repository-pattern, interface-segregation/Liskov, module-sharing
  pitfall, and events-for-decoupling items; all consistent with
  docs.nestjs.com, no conflicts found. Microservices-only patterns from
  that reference (message/event patterns, queues, health checks) are out
  of scope for this REST-focused increment — see `nestjs-best-practices`
  for the one REST-relevant carve-out (health checks).
