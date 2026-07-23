# NestJS Best Practices — Full Rule Catalog

Authority: docs.nestjs.com. A community skill
(`Kadajett/agent-nestjs-skills`, MIT) was consulted as corroborating
reference for a handful of items marked **[community]** below — where it
disagrees with docs.nestjs.com or uses a different-generation API, that is
called out explicitly and docs win.

## 1. Modules

- One module per bounded feature (`UsersModule`, `OrdersModule`, ...). A
  module wires its own controller(s), providers, and imports/exports —
  it does not reach into another module's internals.
- Export only what other modules actually need (a use-case/service or a
  port token), not everything a module happens to define.
- `@Global()` is reserved for genuinely cross-cutting infrastructure (DB
  connection/config module, logging) that nearly every feature module
  needs — not a shortcut to avoid wiring imports/exports properly.
- `AppModule` is the **composition root**: it imports feature modules and
  global infra modules. It must not contain business logic, controllers,
  or ad-hoc providers of its own.

## 2. Providers & DI

- Constructor-inject abstractions (interfaces via tokens, other services),
  never reach for `new SomeService()` inside application code — that
  bypasses the container and breaks test substitution.
- TypeScript interfaces are erased at runtime, so you cannot
  `@Inject(SomeInterface)`. Define an injection token (`Symbol('...')` or a
  string constant, or an abstract class) and bind the interface's
  implementation to that token in the module:
  ```ts
  export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
  // module:
  { provide: USER_REPOSITORY, useClass: DrizzleUserRepository }
  // consumer:
  constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}
  ```
- Prefer `useClass` / `useFactory` / `useValue` custom-provider forms over
  manual instantiation, especially when the binding needs to vary by
  environment (test vs. prod) or depends on other injected config.
- **[community] DI scope awareness** — Nest providers default to
  singleton scope. Never store per-request mutable state on a singleton
  (it leaks across concurrent requests). If request-scoped data (request
  id, current user) is genuinely needed, `Scope.REQUEST` works but
  bubbles request-scoping up the whole injection chain (every consumer
  of a request-scoped provider becomes request-scoped too, which hurts
  performance). Prefer a request-context library (e.g. `nestjs-cls`)
  over `Scope.REQUEST` for this use case. This is a practical nuance the
  docs mention but under-stress; it does not conflict with docs guidance.
- **[community] Avoid service-locator style** — resolving dependencies via
  `ModuleRef.get()`/a global container at call time hides dependencies and
  makes the class untestable without a real container; use constructor
  injection. The one legitimate exception is a factory that must pick an
  implementation by a runtime-only value (e.g. a payment-gateway-by-name
  dispatcher).

## 3. Thin controllers

A controller does exactly: bind the route (`@Get`/`@Post`/...), accept a
validated DTO as input, delegate to **one** service method, map the
service's result to the response shape (status code, headers, response
DTO). No business logic, no direct DB/repository calls, no domain-level
`try/catch` (let a global exception filter handle domain errors — a
controller `try/catch` around a service call to reformat *that specific*
error is a smell that it belongs in a filter instead).

## 4. Services stay framework-light

Application services hold business/orchestration logic. Keep them free of
HTTP-specific types: no `@Res()`/`Request`/`Response` imports, no reading
headers/cookies directly. This keeps services callable from a queue
worker, CLI, or test harness without an HTTP context.

- **[community] Single responsibility** — watch for "god services": a
  service whose name reads like "...And..." (e.g. `UserAndBillingService`)
  or one accumulating unrelated methods over time is a sign it should
  split into two services with a thin orchestrator (controller or a
  dedicated orchestrator service) calling both.

## 5. DTOs + validation

- Request DTOs are **classes** (not interfaces/types — `class-validator`
  needs a real class to attach decorators to and to run
  `class-transformer` against) decorated with `class-validator` rules
  (`@IsString()`, `@IsEmail()`, `@IsUUID()`, ...).
- Register a global pipe:
  ```ts
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  }));
  ```
  `whitelist` strips unknown properties; `forbidNonWhitelisted` rejects the
  request outright instead of silently dropping fields; `transform` turns
  plain objects into the DTO class instance (needed for
  `class-transformer` decorators and for built-in pipes like
  `ParseIntPipe` to see the right types).
- Never consume raw `@Body()`/`@Query()`/`@Param()` typed as `any` or a
  plain interface — always type it as the validated DTO class.
- **[community]** Use the built-in parameter pipes (`ParseIntPipe`,
  `ParseUUIDPipe`, `ParseEnumPipe`, `DefaultValuePipe`) for single-value
  route/query params rather than hand-rolled parsing; write a custom pipe
  only for a genuine domain-specific transform.

## 6. Config

- `@nestjs/config`'s `ConfigModule.forRoot({ isGlobal: true })` — load env
  once, everywhere.
- Validate configuration at boot (schema validation option, e.g. Joi or a
  class-validator-based config class) so a misconfigured deployment fails
  fast at startup instead of failing on the first request that touches the
  bad value.
- Inject the typed `ConfigService` (or a `registerAs()`-namespaced typed
  slice) into services; never call `process.env` directly outside the
  config module's own setup.
- ⚠️ **Version-gated (ConfigModule v4 / NestJS v11):** internal
  (`ConfigModule.forRoot({ load: [...] })`) config values now take
  precedence **over** `process.env` by default (previously env vars won).
  `ignoreEnvVars` is deprecated in favor of `validatePredefined` /
  `skipProcessEnv`. Check the installed `@nestjs/config` major version
  before assuming precedence order.

## 7. Exceptions & HTTP error model

- Throw `HttpException` subclasses (`NotFoundException`,
  `ConflictException`, `BadRequestException`, ...) from services to
  signal domain-level failures — this keeps the controller free of
  manual `@Res()` status-code juggling.
- Add **one** global exception filter (`@Catch()` or a broad
  `AllExceptionsFilter`) that normalizes every error response to a
  consistent envelope, e.g. `{ statusCode, message, error, timestamp,
  path }`, maps unexpected/non-HTTP errors to a generic 500, and never
  leaks a stack trace or internal error detail in production.
- **[community, flagged as opinion not doctrine]** The community skill
  takes the stance that services should throw `HttpException` directly;
  docs.nestjs.com stay neutral and also support layer-agnostic domain
  exceptions mapped to HTTP status codes by the filter. Either is
  acceptable — pick one project-wide and be consistent; if the project
  keeps services framework-agnostic (see `nestjs-architecture`), prefer
  domain exceptions mapped by the filter over throwing `HttpException`
  from application-layer services.
- **[community] Async errors outside the request/response cycle** —
  Nest's built-in exception handling only wraps the HTTP
  request/response cycle. A fire-and-forget promise, an `@OnEvent()`
  listener, or a `@Cron()` job that throws is **not** caught by Nest —
  it becomes an unhandled rejection. Wrap such code in `.catch()`/
  try-catch and additionally register process-level
  `unhandledRejection`/`uncaughtException` handlers as a backstop. This
  is a concrete, easy-to-miss failure mode not called out prominently in
  the docs' exception-filter page.

## 8. Interceptors

- Use interceptors for cross-cutting response concerns: logging/timing,
  a response envelope, caching, timeouts.
- `ClassSerializerInterceptor` + `@Exclude()`/`@Expose()` on response DTO
  classes strips sensitive fields (password hash, internal ids) before
  the response leaves the process. Apply it to response shapes, not to
  persistence entities directly — see `nestjs-architecture` for the
  DTO/entity/row separation.

## 9. Guards / Pipes / Filters — separate responsibilities

- **Guards** = authentication/authorization only (`canActivate`).
- **Pipes** = validation and input transformation.
- **Filters** = exception → HTTP response mapping.
Don't blend these — an authz check inside a pipe, or validation logic
inside a guard, makes the pipeline harder to reason about and test in
isolation.

Request pipeline order: middleware → guards → interceptors (pre-controller)
→ pipes → route handler → interceptors (post-controller) → exception
filters.

## 10. Lifecycle & graceful shutdown

- Use `OnModuleInit`/`OnApplicationBootstrap` for startup work (opening
  connections, warming caches). **[community]** Return the promise from
  `onModuleInit`/`onApplicationBootstrap` — Nest awaits it before
  continuing bootstrap — so the app cannot start serving before a
  required dependency is ready; keep constructors themselves synchronous
  and fast.
- Use `OnModuleDestroy`/`OnApplicationShutdown` plus
  `app.enableShutdownHooks()` for graceful shutdown (closing DB pools,
  draining in-flight requests).
- ⚠️ **Version-gated (v11):** termination lifecycle hooks now run in the
  **reverse** of their initialization order.
- **[community]** For zero-downtime deploys, flip a readiness signal to
  "not ready" (503) as soon as shutdown begins so an orchestrator (k8s)
  stops routing new traffic while in-flight requests drain, then close
  resources in `OnApplicationShutdown`.

## 11. Logging

- Use the built-in `Logger` (or a swapped-in logger implementing the
  same interface); never `console.log` in application code.
- ⚠️ **Version-gated (v11):** `ConsoleLogger` supports built-in JSON
  output — prefer JSON logging in production for structured log
  ingestion.
- **[community]** Never log secrets (tokens, passwords, full card
  numbers) — redact before logging; attach request-scoped context
  (request id, user id) to log lines for traceability. This does not
  conflict with docs, just adds a redaction reminder.

## 12. Platform notes (v11)

⚠️ **Version-gated (v11 platform):**
- Node 20+ is the minimum supported runtime.
- Express v5 is the new default underlying HTTP adapter:
  - Named route wildcards are required — `@Get('users/*splat')`, not a
    bare `*`.
  - Optional route parameters use `/:file{.:ext}` syntax.
  - The query-string parser defaults to `simple` — set `extended` if the
    route relies on nested/array query parsing (`?a[b]=1`).
- `CacheModule` now uses Keyv-based store adapters rather than the older
  `cache-manager-*` store packages directly.

## 13. Security & operational additions (community-corroborated)

These reinforce and extend docs.nestjs.com's security chapter with
concrete, easy-to-forget rules; all are consistent with current NestJS
APIs (checked against docs.nestjs.com's rate-limiting and Terminus pages).

- **[community] Rate limiting** — `@nestjs/throttler` with multiple named
  tiers (e.g. short/medium/long), a stricter `@Throttle()` override on
  sensitive endpoints (login, password reset), `@SkipThrottle()` where
  appropriate, and a custom tracker (`userId || ip`) instead of IP alone
  when users are authenticated. Easy to omit in a "happy path" skill but
  matches docs.nestjs.com's rate-limiting recipe.
- **[community] Output sanitization** — JSON responses are not
  inherently unsafe, but any stored user-supplied HTML rendered
  elsewhere (emails, admin UI, another surface) must be sanitized with
  an allowlist sanitizer before storage or before render; apply `helmet()`
  for baseline security headers/CSP; validate/format any value that is
  echoed back in an error message (e.g. `ParseUUIDPipe` before it hits a
  logged/returned error) to avoid reflected-input classes of issues.
- **[community] Health checks** — even a plain REST service benefits
  from `@nestjs/terminus`: separate liveness (process is up) and
  readiness (dependencies — DB, downstream APIs — are reachable) probes;
  flip readiness to unhealthy during graceful shutdown (see §10) so an
  orchestrator stops sending traffic before the process exits. See also:
  microservices-specific health/queue patterns are out of scope for this
  REST-focused increment.

## Sources

- https://docs.nestjs.com/techniques/validation
- https://docs.nestjs.com/techniques/configuration
- https://docs.nestjs.com/exception-filters
- https://docs.nestjs.com/interceptors
- https://docs.nestjs.com/techniques/serialization
- https://docs.nestjs.com/guards
- https://docs.nestjs.com/fundamentals/lifecycle-events
- https://docs.nestjs.com/fundamentals/custom-providers
- https://docs.nestjs.com/security/rate-limiting
- https://docs.nestjs.com/recipes/terminus
- NestJS v11 migration guide (docs.nestjs.com/migration-guide)
- Corroborating reference only (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills
