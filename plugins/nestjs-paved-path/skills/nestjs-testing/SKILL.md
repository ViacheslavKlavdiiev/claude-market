---
name: nestjs-testing
description: Use when writing/reviewing NestJS tests — unit tests stubbing repository ports, supertest e2e, ValidationPipe tests, real-DB repository tests. Jest default.
---

# NestJS Testing

There is **no official NestJS agent-skill**. This skill is authored from
docs.nestjs.com; a community skill (`Kadajett/agent-nestjs-skills`) was
consulted as corroborating reference only — see Sources.

Full rule catalog with rationale and code shape lives in
[references/rules.md](references/rules.md). This file is the summary; use
it to navigate, open the reference for the details of a specific rule.

## Shared spine invariant (verbatim — do not paraphrase)

> Only the infrastructure/repository layer imports Drizzle or holds the DB
> handle. Application services depend on repository port interfaces via DI
> tokens (`Symbol` + `@Inject()`), never on `drizzle-orm` or the DB
> instance.

Testing consequence: because a service depends only on a port interface,
a unit test supplies a **fake/stub implementing that interface** — fast,
no DB, and it proves the service honors the contract. Never mock the
Drizzle query-builder chain in a unit test; that only proves the mock was
called, not that the service or the real repository behaves correctly.
Query-builder-level behavior belongs in a repository test against a real
Postgres instance (§4 below).

## Rules to follow (see references/rules.md for each)

1. **Unit tests** — `Test.createTestingModule({ providers: [Service,
   { provide: TOKEN, useValue: mock }] }).compile()`. Stub the injected
   repository port; **never mock the unit under test itself**. Use
   `.overrideProvider().useValue()/.useClass()`, `.overrideGuard()`,
   `.overrideInterceptor()` for cross-cutting overrides. Every test
   asserts observable behavior (return value, thrown error, a call made
   to a collaborator with the right arguments) — not just that a mock was
   called some number of times with no assertion on what it did.
2. **Mock at the port boundary** — per the shared spine invariant above:
   mock/stub the repository *interface* the service depends on, never the
   Drizzle query builder. A type-safe stub that satisfies the port
   interface (e.g. implements every method the interface declares) is
   required — a stub with a narrower shape than the real port passes
   today and breaks silently when the port grows.
3. **e2e/integration tests** — build the real DI container
   (`Test.createTestingModule({ imports: [AppModule] })` →
   `createNestApplication()`), **apply the exact same global pipes and
   filters as `main.ts`** (the same `ValidationPipe` config, the same
   exception filter) before calling `app.init()`, then drive it with
   `request(app.getHttpServer())` (supertest). Assert both status code
   and response envelope shape.
4. **Mandatory ValidationPipe test** — every e2e suite covering a
   validated endpoint must include: (a) an invalid DTO → assert
   `400` + the expected message; (b) an extra/unexpected field → assert
   the configured `forbidNonWhitelisted` behavior. This verifies the
   input-validation security contract actually runs in the full pipeline,
   not just in isolated DTO unit tests.
5. **Repository tests** — run the real Drizzle repository implementation
   against a real Postgres instance; never mock the query builder here —
   that would defeat the point of a repository test. Isolate each test
   (wrap in a transaction rolled back in teardown, or truncate between
   tests) so tests don't leak state into each other.
6. **Test database** — prefer Testcontainers
   (`@testcontainers/postgresql`) to spin up a hermetic Postgres per test
   *suite* (not per test) in CI and locally; run migrations once before
   the suite starts.
7. **Runner** — Jest is the NestJS default; use it unless the project has
   already migrated. ⚠️ version note: many projects are migrating to
   Vitest (`vi` is a near-drop-in replacement for `jest`'s mocking API,
   but NestJS's decorator metadata requires an SWC or `ts-jest`-equivalent
   transform configured for Vitest). Default to Jest; only use Vitest
   conventions in this skill's examples if the project has already made
   that switch.
8. **File/suite separation** — keep unit specs (`*.spec.ts`, colocated
   with source) and e2e specs (`test/*.e2e-spec.ts`) in separate suites
   with separate Jest configs; run e2e serially or against isolated
   per-worker databases — never share one mutable DB across parallel e2e
   workers.

## Review red flags

- A test mocks the class/function under test itself (or asserts only on
  its own mock's internal call log) instead of exercising real behavior.
- A unit test mocks the Drizzle query-builder chain (`.select().from().where()`)
  instead of stubbing the repository port interface.
- An e2e test builds the app without applying the same global
  `ValidationPipe`/exception filter `main.ts` uses — the test then proves
  nothing about the real request pipeline.
- No test asserting an invalid DTO → `400` on a validated endpoint.
- Repository/integration tests sharing one mutable database with no
  rollback/truncate between tests (order-dependent, flaky suite).
- A test database spun up per individual test (slow) instead of per
  suite, or a suite running against a schema with migrations not applied.
- A stub/fake that doesn't actually satisfy the port interface's full
  shape (missing methods, wrong return type) — compiles today, breaks
  when the port changes and the stub wasn't updated.

## Sources

- https://docs.nestjs.com/fundamentals/testing
- https://node.testcontainers.org/
- Corroborating community reference (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills — folded in for the
  `Test.createTestingModule` + mock-`ExecutionContext` guard-testing
  pattern, the e2e-supertest-with-real-global-pipes shape, and the
  mock-external-services/fake-timers guidance (see
  [references/rules.md](references/rules.md) §9); its DB-cleanup examples
  are TypeORM-specific (`dataSource.synchronize`) — reframed here for
  Drizzle/Postgres via migrations + transaction rollback or truncate,
  with no conflict on the underlying pattern.
