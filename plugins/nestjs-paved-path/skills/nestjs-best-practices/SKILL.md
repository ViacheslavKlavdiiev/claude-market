---
name: nestjs-best-practices
description: Use when writing or reviewing NestJS application code — modules, providers/DI, controllers, DTO validation, config, exception handling, interceptors, guards, lifecycle. Rules grounded in docs.nestjs.com.
---

# NestJS Best Practices

There is **no official NestJS agent-skill**. This skill is authored from
docs.nestjs.com; a community skill (`Kadajett/agent-nestjs-skills`) was
consulted as corroborating reference only — see Sources.

Full rule catalog with rationale and code shape lives in
[references/rules.md](references/rules.md). This file is the summary; use it
to navigate, open the reference for the details of a specific rule.

## Rule groups (see references/rules.md for each)

1. **Modules** — one module per bounded feature; export only what others
   need; `@Global()` only for cross-cutting infra; `AppModule` is a
   composition root, not a place for business logic.
2. **Providers & DI** — constructor-inject abstractions; injection tokens
   (`Symbol`/string + `@Inject()`) for interfaces, the DB handle, and config
   objects, since TS interfaces are erased at runtime; prefer
   `useClass`/`useFactory`/`useValue` over `new`.
3. **Thin controllers** — bind route, validate/shape input via DTO, delegate
   to a service, map response. No business logic, no DB calls, no domain
   `try/catch` in controllers.
4. **Services** — hold business logic, stay framework-light: no HTTP
   decorators, no `Request`/`Response`.
5. **DTOs + validation** — request DTOs are classes with `class-validator`
   decorators; global `ValidationPipe` with whitelist/transform on; never
   consume raw `@Body()` without a DTO.
6. **Config** — `@nestjs/config` global module, validate env at boot, inject
   typed `ConfigService`, never read `process.env` in services. ⚠️
   version-gated (v11 / ConfigModule v4).
7. **Exceptions & HTTP error model** — throw `HttpException` subclasses from
   services; one global exception filter normalizing the error envelope and
   never leaking stack traces in prod.
8. **Interceptors** — response shaping, logging/timing, and
   `ClassSerializerInterceptor` + `@Exclude()`/`@Expose()` to strip sensitive
   fields from responses.
9. **Guards / Pipes / Filters** — distinct responsibilities (authn/authz,
   validation/transform, exception mapping); documented request pipeline
   order.
10. **Lifecycle & shutdown** — startup/shutdown hooks, graceful shutdown with
    `app.enableShutdownHooks()`. ⚠️ version-gated (v11 reverse-order
    termination).
11. **Logging** — built-in `Logger`, never `console.log`. ⚠️ version-gated
    (v11 JSON logging).
12. **Platform notes** — ⚠️ version-gated (v11): Node 20+, Express v5
    defaults (named wildcards, `query parser`), Keyv-based `CacheModule`.
13. **Security additions** (community-corroborated) — rate limiting, output
    sanitization for stored HTML, DI scope awareness, async error handling
    outside the request/response cycle, health checks.

## Review red flags

- Business logic, DB calls, or a domain `try/catch` inside a controller.
- Missing global `ValidationPipe`, or `whitelist: false` / no
  `forbidNonWhitelisted`.
- `process.env` read directly in a service; no env validation at boot.
- Raw entities/persistence rows returned from a controller with no
  `ClassSerializerInterceptor` (secret/PII leakage).
- A catch-all that swallows domain errors, or an inconsistent error envelope
  across endpoints.
- `@Global()` overuse; circular or "god" modules.
- Unnamed Express v5 route wildcards (bare `*` instead of `*splat`).
- Mutable per-request state stored on a singleton provider (DI scope bug).
- No rate limiting on auth/sensitive endpoints; stored HTML rendered
  unsanitized.
- A fire-and-forget promise, `@OnEvent` handler, or `@Cron` job with no
  `.catch()`/try-catch — Nest's built-in exception handling only covers the
  request/response cycle.
- No liveness/readiness endpoint on a deployed service.

## Sources

- https://docs.nestjs.com/techniques/validation
- https://docs.nestjs.com/techniques/configuration
- https://docs.nestjs.com/exception-filters
- https://docs.nestjs.com/interceptors
- https://docs.nestjs.com/techniques/serialization
- https://docs.nestjs.com/guards
- https://docs.nestjs.com/fundamentals/lifecycle-events
- https://docs.nestjs.com/security/rate-limiting
- https://docs.nestjs.com/recipes/terminus
- NestJS v11 migration guide (docs.nestjs.com)
- Corroborating community reference (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills — folded in as
  reinforcing, non-conflicting practice for rate limiting, output
  sanitization, health checks, async error handling, and DI scope
  awareness; see `references/rules.md` §13 for where it agrees with vs.
  supplements docs.nestjs.com.
