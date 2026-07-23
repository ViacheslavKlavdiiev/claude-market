# NestJS REST + Swagger — Full Rule Catalog

Authority: docs.nestjs.com. A community skill (`Kadajett/agent-nestjs-skills`,
MIT) was consulted as corroborating reference for the one item marked
**[community]** below; it has no dedicated `@nestjs/swagger` rule, so
everything else here is authored directly from docs.

## 1. Setup

```bash
npm install @nestjs/swagger
```

```ts
// main.ts
const config = new DocumentBuilder()
  .setTitle('Orders API')
  .setDescription('Order management endpoints')
  .setVersion('1.0')
  .addBearerAuth()
  .build();
const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('docs', app, document);
```

Gate `/docs` behind a non-production check (`if (!isProd) SwaggerModule.setup(...)`)
or behind the same auth guard as the API itself. An unauthenticated docs UI
in production leaks the entire API surface (routes, DTO shapes, auth
scheme) to anyone who finds the URL.

## 2. CLI plugin

```json
// nest-cli.json
{
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "plugins": [
      {
        "name": "@nestjs/swagger",
        "options": {
          "classValidatorShim": true,
          "introspectComments": true,
          "dtoFileNameSuffix": [".dto.ts"]
        }
      }
    ]
  }
}
```

With the plugin enabled, the compiler infers, for every class in a
`*.dto.ts` file:
- `@ApiProperty()` from the TS type;
- `required: false` from an optional (`?`) property;
- `description`/`example` from JSDoc comments above the property.

Add `@ApiProperty({...})` manually only for what the plugin cannot infer:
format constraints (`format: 'email'`), explicit `minimum`/`maximum`,
or an example the plugin didn't pick up from a comment.

## 3. DTO-driven schemas as single source of truth

```ts
export class CreateUserDto {
  @IsEmail()
  @ApiProperty({ example: 'jane@example.com' })
  email: string;

  @IsString()
  @MinLength(8)
  @ApiProperty({ minLength: 8 })
  password: string;
}

// Derive, never hand-rewrite:
export class UpdateUserDto extends PartialType(CreateUserDto) {}
// or: PickType, OmitType, IntersectionType — all from '@nestjs/swagger'
```

Import `PartialType`/`PickType`/`OmitType`/`IntersectionType` from
`@nestjs/swagger`, not the plain `@nestjs/mapped-types`: the swagger
variants preserve both the `class-validator` metadata *and* regenerate
the `@ApiProperty` schema, so validation and documentation cannot drift
apart. A hand-rewritten `UpdateUserDto` that copies fields manually is a
recurring source of "the docs say optional but validation says required"
bugs.

Controller-level decorators:
```ts
@ApiTags('users')
@Controller('users')
export class UsersController {
  @Post()
  @ApiOperation({ summary: 'Create a user' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, type: ErrorResponseDto })
  create(@Body() dto: CreateUserDto) { /* ... */ }
}
```

## 4. REST conventions & versioning

- Plural nouns for collections: `/users`, `/users/:id`, not `/getUser` or
  `/user`.
- No verbs in the path — the HTTP method carries the verb
  (`POST /users` not `POST /users/create`).
- Nest sub-resources one level: `/users/:id/orders`, not
  `/users/:id/orders/:orderId/items/:itemId/detail` — flatten deeper
  relationships behind their own top-level collection with a filter query
  param when it gets that deep.

Versioning:
```ts
// main.ts
app.enableVersioning({ type: VersioningType.URI }); // → /v1/users
```
```ts
@Controller({ path: 'users', version: '1' })
// or per-route: @Version('1') / @Version(['1', '2']) / @Version(VERSION_NEUTRAL)
```

**[community, matches current docs — no conflict]** When retiring a
version, don't just delete it: add an interceptor on the deprecated
route(s) that sets `Deprecation`, `Sunset`, and `Link` response headers
pointing clients at the replacement, giving consumers a migration window
before the route is actually removed.

## 5. Status codes

| Method | Success code | Notes |
|---|---|---|
| GET | 200 | |
| POST | 201 | resource created; return the created representation |
| PUT/PATCH | 200 | |
| DELETE | 204 | **no response body** |

Error codes: 400 (validation failure), 401 (missing/invalid credentials),
403 (authenticated but not authorized), 404 (resource doesn't exist), 409
(conflict — e.g. duplicate unique key), 422 (semantically invalid request
that passes schema validation). Override Nest's default status with
`@HttpCode(204)` etc. when a handler's correct code isn't the framework
default for its decorator (e.g. `@Post()` defaults to 201 already, but a
`@Post()` action that doesn't create a resource — like a login endpoint —
should be `@HttpCode(200)`).

## 6. Pagination

Pick **one** strategy per API and standardize it:

- **Offset** — `?page=1&limit=20`. Simple, supports "jump to page N",
  but can skip/duplicate rows under concurrent writes.
- **Cursor/keyset** — `?cursor=<opaque>&limit=20`. Stable under
  concurrent mutation, required for large or actively-written tables;
  cursor is typically an encoded last-seen sort key.

Envelope (generic, documented via `getSchemaPath`):
```ts
export class PaginatedDto<T> {
  @ApiProperty({ isArray: true }) data: T[];
  @ApiProperty() meta: { total?: number; limit: number; nextCursor?: string };
}
```
```ts
@ApiExtraModels(PaginatedDto, UserResponseDto)
@ApiOkResponse({
  schema: {
    allOf: [
      { $ref: getSchemaPath(PaginatedDto) },
      { properties: { data: { type: 'array', items: { $ref: getSchemaPath(UserResponseDto) } } } },
    ],
  },
})
```
Always cap `limit` server-side (e.g. `Math.min(requested, 100)`) —
an unbounded `limit` is an easy denial-of-service / over-fetch vector.

## 7. Error docs

```ts
export class ErrorResponseDto {
  @ApiProperty() statusCode: number;
  @ApiProperty() message: string | string[];
  @ApiProperty() error: string;
  @ApiProperty() path: string;
  @ApiProperty() timestamp: string;
}
```
Shape this to match exactly what the global exception filter emits (see
`nestjs-best-practices` §7), then attach it to every response that isn't
a 2xx:
```ts
@ApiResponse({ status: 400, type: ErrorResponseDto })
@ApiResponse({ status: 404, type: ErrorResponseDto })
```
An endpoint documenting only its happy path leaves clients guessing at
error shapes they will definitely encounter.

## 8. Response shape discipline

**[community]** The community skill's `api-use-dto-serialization` rule
(digested from a TypeORM-era example — reframe for Drizzle/DTOs, not
entities) reinforces a rule owned by `nestjs-best-practices`: never
return a raw entity/persistence row from a controller. Pair the
`@nestjs/swagger` decorators on a dedicated response DTO class with
`ClassSerializerInterceptor` + `@Exclude()`/`@Expose()` so what Swagger
documents and what the client actually receives cannot diverge (e.g. a
`passwordHash` field excluded from the response but present on the
entity).

## Out of scope

Microservice transport docs (`@MessagePattern`/`@EventPattern`, gRPC/RMQ
docs generation) are out of scope for this REST-focused skill.

## Sources

- https://docs.nestjs.com/openapi/introduction
- https://docs.nestjs.com/openapi/cli-plugin
- https://docs.nestjs.com/openapi/types-and-parameters
- https://docs.nestjs.com/openapi/operations
- https://docs.nestjs.com/techniques/versioning
- Corroborating reference only (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills
