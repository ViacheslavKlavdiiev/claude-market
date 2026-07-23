---
name: nestjs-rest-swagger
description: Use when designing/documenting NestJS REST APIs with @nestjs/swagger — setup, DTO-driven schema, decorators, versioning, status codes, pagination, error docs.
---

# NestJS REST + Swagger

There is **no official NestJS agent-skill**. This skill is authored from
docs.nestjs.com; a community skill (`Kadajett/agent-nestjs-skills`) was
consulted as corroborating reference only — see Sources. The community
skill has no dedicated `@nestjs/swagger` rule at all, so the
setup/decorator/pagination/error-doc content here is net-new from docs;
its one REST-shaped item (API versioning) is folded in below and matches
current docs with no conflicts.

Full rule catalog with rationale and code shape lives in
[references/rules.md](references/rules.md). This file is the summary; use
it to navigate, open the reference for the details of a specific rule.

## Rules to follow (see references/rules.md for each)

1. **Setup** — install `@nestjs/swagger`; in `main.ts` build a
   `DocumentBuilder` (`.setTitle().setDescription().setVersion().addBearerAuth()`
   `.build()`), `SwaggerModule.createDocument(app, config)`,
   `SwaggerModule.setup('docs', app, document)`. Gate `/docs` behind
   non-production or an auth check — never ship an unauthenticated docs UI
   to prod.
2. **CLI plugin** — enable `@nestjs/swagger` in `nest-cli.json`
   (`classValidatorShim`, `introspectComments`, `dtoFileNameSuffix`) so
   types/`?`/JSDoc are inferred into `@ApiProperty`/`required`/
   description+example automatically; add `@ApiProperty` by hand only for
   constraints the plugin can't infer (format, min/max, examples it
   couldn't derive).
3. **DTO-driven schemas** — the DTO is the single source of truth for both
   validation and docs. Use `@ApiTags`, `@ApiOperation`,
   `@ApiResponse`/`@ApiOkResponse`/`@ApiCreatedResponse`, `@ApiBearerAuth`.
   Derive update/partial DTOs with `PartialType`/`PickType`/`OmitType`/
   `IntersectionType` **from `@nestjs/swagger`** (not the plain
   `@nestjs/mapped-types` versions) so validation metadata and Swagger
   schema stay in sync — never hand-rewrite an update DTO.
4. **REST conventions & versioning** — plural nouns (`/users`,
   `/users/:id`), no verbs in routes, nest sub-resources one level deep.
   Version public APIs with `app.enableVersioning({ type: VersioningType.URI })`
   (→ `/v1/...`); `@Version()` per controller/route (array for multi-version
   support), `VERSION_NEUTRAL` for endpoints outside versioning. **[community,
   matches current docs]** deprecate old versions via an interceptor setting
   `Deprecation`/`Sunset`/`Link` response headers rather than silently
   removing them.
5. **Status codes** — 200 for GET/PUT, 201 for POST, 204 for DELETE (no
   body), 400 validation, 401/403 auth, 404 missing, 409 conflict, 422
   semantic; override the default with `@HttpCode()` when a handler's
   correct code differs from Nest's decorator default.
6. **Pagination** — standardize on one strategy per API: offset
   (`?page=&limit=`) for simple lists, cursor/keyset (`?cursor=&limit=`)
   for large or actively-mutating sets. Return a documented
   `{ data, meta }` envelope via a generic `PaginatedDto<T>` (document the
   generic with `getSchemaPath` + `@ApiExtraModels`). Always cap `limit`
   server-side.
7. **Error docs** — define one `ErrorResponseDto` matching the global
   exception filter's envelope (see `nestjs-best-practices`) and attach
   `@ApiResponse({ status, type: ErrorResponseDto })` to every
   non-2xx outcome a client can actually hit.
8. **Response shape discipline** — **[community]** never return a raw
   entity/persistence row; pair the `@nestjs/swagger` decorators with
   `ClassSerializerInterceptor` + `@Expose()`/`@Exclude()` on the response
   DTO class (see `nestjs-best-practices` §8) so the documented schema and
   the actual serialized response cannot drift apart.

## Review red flags

- Swagger UI (`/docs`) reachable and unauthenticated in production.
- An endpoint or DTO field with no `@ApiResponse`/`@ApiTags`/`@ApiProperty`
  coverage — undocumented surface.
- Error responses (400/401/403/404/409) with no matching `@ApiResponse`.
- An update DTO hand-rewritten instead of derived with
  `PartialType`/`PickType`/`OmitType` from `@nestjs/swagger` — a common
  source of validation/docs drift.
- Verbs in route paths, inconsistent pluralization, or a public API with
  no version prefix.
- Wrong or implicit status codes (e.g. 200 returned for a POST that
  creates a resource, or a DELETE returning a body with 204).
- An unbounded `limit` query parameter (DoS/large-payload risk).
- A controller returning a raw entity/row with no `ClassSerializerInterceptor`,
  so the Swagger-documented shape and the actual response can diverge.

## Sources

- https://docs.nestjs.com/openapi/introduction
- https://docs.nestjs.com/openapi/cli-plugin
- https://docs.nestjs.com/openapi/types-and-parameters
- https://docs.nestjs.com/openapi/operations
- https://docs.nestjs.com/techniques/versioning
- Corroborating community reference (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills — folded in for the API
  versioning/deprecation-headers pattern (consistent with current docs, no
  conflicts) and the response-serialization discipline reminder; that
  reference has no `@nestjs/swagger`-specific rule of its own, so the
  setup/DTO-schema/pagination/error-doc content here is authored directly
  from docs.nestjs.com.
