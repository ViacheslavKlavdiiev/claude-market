# NestJS Architecture — Full Rule Catalog

Authority: docs.nestjs.com, specializing
`engineering-foundations:clean-architecture` for NestJS. A community skill
(`Kadajett/agent-nestjs-skills`, MIT) was consulted as corroborating
reference for items marked **[community]**; no conflicts with docs were
found among the items folded in here (unlike some best-practices items,
where one opinionated stance was flagged).

## 1. Layer mapping

- **domain / core** — entities, value objects, and **port interfaces**
  (e.g. `UserRepository`, `PaymentGateway`). Pure TypeScript. Zero
  framework imports — no `@Injectable()`, no `nestjs` package, no ORM.
- **application** — use-cases, typically one `@Injectable()` service per
  use-case or per cohesive group of use-cases. Depends only on domain
  ports (injected via DI tokens), never on a concrete infrastructure
  class. The `@Injectable()` decorator itself is the only framework touch
  tolerated at this layer.
- **infrastructure** — adapters that implement domain ports: Drizzle
  repositories, HTTP clients to third-party APIs, the DB connection
  provider itself. This is the **only** layer permitted to import an ORM
  or hold a live DB handle.
- **presentation** — controllers, request/response DTOs, guards, pipes,
  filters, Swagger (`@ApiProperty` etc.) decorators, and `main.ts`
  bootstrap code.

## 2. Shared spine invariant (verbatim)

> Only the infrastructure/repository layer imports Drizzle or holds the DB
> handle. Application services depend on repository port interfaces via DI
> tokens (`Symbol` + `@Inject()`), never on `drizzle-orm` or the DB
> instance.

Concretely:
```ts
// domain/ports/user-repository.ts — pure interface, no imports from nestjs/drizzle
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// infrastructure/drizzle-user.repository.ts — the only file allowed to import drizzle-orm
@Injectable()
export class DrizzleUserRepository implements UserRepository { /* ... */ }

// application/user.service.ts — depends on the port, not the impl
@Injectable()
export class UserService {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}
}

// users.module.ts — binds the concrete impl to the token
@Module({
  providers: [
    UserService,
    { provide: USER_REPOSITORY, useClass: DrizzleUserRepository },
  ],
  exports: [UserService],
})
export class UsersModule {}
```

## 3. Three object types, three locations

Do not conflate these — each has a distinct home and purpose:

| Type | Layer | Purpose |
|---|---|---|
| DTO | presentation | request/response shape, `class-validator` decorators, `@ApiProperty` for Swagger |
| Domain entity | domain | behavior + invariants; framework-free |
| Persistence row | infrastructure | Drizzle `InferSelectModel`/schema-shaped row |

Map explicitly at each boundary: the repository maps row ↔ entity;
a mapper (or the entity's own factory/`toDTO()`) maps entity ↔ DTO. Never
return a persistence row to a controller, and never feed a request DTO
directly into domain logic without mapping it to/through the entity.

## 4. Module boundaries

A feature module is the unit of composition: it wires a controller, its
use-case service(s), and the repository binding (`provide`/`useClass`).
It exports the use-case services and/or port tokens other modules
legitimately need — never the concrete repository class itself. The
composition root is `AppModule` plus the set of feature modules it
imports; no business logic lives in `AppModule`.

## 5. Module sharing pitfall

**[community]** Nest modules are effectively singletons per application
context, but if the **same provider class** is listed in the `providers`
array of two different modules (rather than exported from one and
imported via the other module), Nest instantiates it **twice** —
independent instances with independently diverging in-memory state, plus
wasted memory. Always export the provider from the module that owns it
and `imports: [OwningModule]` from the consumer; only reach for
`@Global()` for genuinely cross-cutting infra (DB/config/logging module),
and prefer an explicit re-export pattern over broad globals for
convenience sharing.

## 6. Repository pattern

**[community, pattern is ORM-agnostic]** Encapsulate query logic —
including anything more complex than a single `findById` — inside a
repository class/adapter implementing a domain port, so:
- application services contain only business/orchestration logic, never
  query-building code;
- unit tests for services mock the repository **port**, not a database.

This is even more valuable with Drizzle than with an ORM offering an
active-record API, since Drizzle has no built-in repository abstraction
of its own — the project supplies it, and this rule is exactly where that
abstraction lives (infrastructure layer, one class per aggregate/entity).

## 7. Interface segregation & Liskov substitution for ports

**[community]**
- **Interface segregation** — keep port interfaces small and
  role-specific. A fat interface (e.g. `NotificationService` with 8
  unrelated methods covering email, SMS, push...) forces every consumer
  and every test mock to implement/stub methods it never calls. Split
  into role interfaces (`EmailSender`, `SmsSender`, ...) and compose via
  intersection only where a consumer genuinely needs more than one role.
- **Liskov substitution** — every implementation of a port (real adapter
  or test mock/fake) must honor the same contract: same return shape on
  success, same thrown exception types on failure. A mock that returns
  `null` where the real adapter throws, or omits fields the real one
  always populates, causes bugs that only surface when swapping
  implementations. Where multiple implementations of one port exist
  (e.g. a real + fake payment gateway), consider a shared contract-test
  function run against each implementation to keep them honest.

## 8. Events for decoupling

**[community]** When two feature modules would otherwise need a direct
(and easily circular) dependency on each other — e.g. `OrdersModule`
needing to notify `NotificationsModule` and `InventoryModule` when an
order is created — prefer `@nestjs/event-emitter`: emit a domain event
(`OrderCreatedEvent`) from the originating use-case, and have listeners
(`@OnEvent('order.created')`) in the other modules react. This avoids the
originating service knowing about all its consumers and is generally
preferable to reaching for `forwardRef()` to resolve a circular module
dependency — `forwardRef()` should be a last resort, not the default fix.

## 9. Pragmatism tier

Do not over-engineer simple CRUD into a full 4-layer split by default.
For a straightforward CRUD feature, the **lite** layering is the default:
controller → service → repository-interface → Drizzle repository
(collapsing "domain" and "application" into one service layer, since
there is no meaningful domain logic beyond straightforward
validation/orchestration). Reserve the full domain/application/
infrastructure/presentation split for features with genuine business
rules, invariants, or multiple use-cases sharing domain logic. State
this explicitly when reviewing so the agent does not flag lite layering
in a simple CRUD module as an architecture violation.

## 10. architecture-reviewer glob guidance

When an `architecture-reviewer`-style check runs over a NestJS surface,
typical globs (once the project's Stack Manifest layer map confirms real
paths) look like:
```
apps/api/**/domain/**
apps/api/**/application/**
apps/api/**/infrastructure/**
apps/api/**/presentation/**
```
Always defer to the project's actual Stack Manifest layer map over this
placeholder shape — directory names vary per project.

## Out of scope

Microservices-only patterns (message/event patterns via `@MessagePattern`/
`@EventPattern`, queue processors, dedicated microservice health-check
wiring) are out of scope for this REST-focused increment. See also:
`nestjs-best-practices` for the one REST-relevant carve-out from that
space (liveness/readiness health checks apply to any deployed REST
service too).

## Sources

- https://docs.nestjs.com/fundamentals/custom-providers
- https://docs.nestjs.com/modules
- `engineering-foundations:clean-architecture`
- Corroborating reference only (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills
