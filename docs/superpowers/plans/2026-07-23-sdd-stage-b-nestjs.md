# SDD Stage B Increment 1 (NestJS + Drizzle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Add three plugins to `claude-market` — `typescript-paved-path`, `nestjs-paved-path` (4 skills), `nestjs-orm-drizzle` — filling the NestJS surface of the Stage A manifest-driven SDD flow.

**Architecture:** `typescript-paved-path` (ported `typescript-expert`) is shared TS foundation; `nestjs-paved-path` (best-practices, architecture, testing, rest-swagger) depends on `engineering-foundations` + `typescript-paved-path`; `nestjs-orm-drizzle` (one library skill) depends on `nestjs-paved-path`. Skills are authored from a research synthesis grounded in `docs.nestjs.com` and `orm.drizzle.team`.

**Tech Stack:** Claude Code plugins (markdown `SKILL.md` skills), JSON manifests, one ported stdlib Python script. Validation via `claude plugin validate .` + `node scripts/build-site.mjs`.

## Global Constraints

- All content ENGLISH-only (skills, docs, commit messages).
- Every plugin: `.claude-plugin/plugin.json` (name = dir, SemVer `version`, `description`, `author.name`, `license: MIT`, `keywords`) + `README.md` + `CHANGELOG.md`. `version` only in `plugin.json`; `category` only in the marketplace entry. Components (`skills/`) at plugin ROOT.
- `${CLAUDE_PLUGIN_ROOT}` for shipped file refs; never `../`.
- Dependency edges (declare via `dependencies` array, form `"<name>@^X.Y.Z"`, all at `^0.1.0`): `nestjs-paved-path` → `engineering-foundations`, `typescript-paved-path`; `nestjs-orm-drizzle` → `nestjs-paved-path`; `typescript-paved-path` → none.
- Every authored NestJS skill MUST have: YAML frontmatter (`name`, `description` starting "Use when…"), an implementer **"Rules to follow"** section, a reviewer **"Review red flags"** section, a **Sources** section with ≥1 authoritative URL (`docs.nestjs.com` / `orm.drizzle.team`), and version-gated rules explicitly marked (e.g. "⚠️ version-gated: check installed version").
- **Shared spine invariant** — state verbatim in `nestjs-architecture`, `nestjs-orm-drizzle`, and `nestjs-testing`: *"Only the infrastructure/repository layer imports Drizzle or holds the DB handle. Application services depend on repository port interfaces via DI tokens (`Symbol` + `@Inject()`), never on `drizzle-orm` or the DB instance."*
- Do NOT claim an official NestJS agent-skill exists; state there is none. Drizzle's `llms.txt` may be cited as a reference feed.
- Scaffold each plugin from `plugins/example-plugin` (`cp -r`), then strip unused component dirs.
- Must pass `claude plugin validate .`; whole marketplace must pass `node scripts/build-site.mjs`.
- Upstream base URL (curl): `https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/`
- Keep each `SKILL.md` focused; move long rule catalogs/examples into sibling `references/` or `examples.md`.

## File Structure

```
plugins/typescript-paved-path/
  .claude-plugin/plugin.json  README.md  CHANGELOG.md
  skills/typescript-expert/SKILL.md (+ references/{tsconfig-strict.json,typescript-cheatsheet.md,utility-types.ts}, scripts/ts_diagnostic.py)
plugins/nestjs-paved-path/
  .claude-plugin/plugin.json  README.md  CHANGELOG.md
  skills/nestjs-best-practices/SKILL.md
  skills/nestjs-architecture/SKILL.md
  skills/nestjs-testing/SKILL.md
  skills/nestjs-rest-swagger/SKILL.md
plugins/nestjs-orm-drizzle/
  .claude-plugin/plugin.json  README.md  CHANGELOG.md
  skills/nestjs-orm-drizzle/SKILL.md
.claude-plugin/marketplace.json   (3 new entries + version bump 0.2.0 → 0.3.0)
README.md                          (optional-plugins list + manifest copy update)
plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md  (api row update)
```

---

### Task 1: `typescript-paved-path` plugin (port `typescript-expert`)

**Files:**
- Create: `plugins/typescript-paved-path/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/typescript-paved-path/skills/typescript-expert/SKILL.md` (+ `references/{tsconfig-strict.json,typescript-cheatsheet.md,utility-types.ts}`, `scripts/ts_diagnostic.py`)
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Produces: skill id `typescript-expert`. Plugin `typescript-paved-path` v0.1.0, no dependencies.

- [ ] **Step 1: Scaffold + fetch upstream skill**

```bash
cp -r plugins/example-plugin plugins/typescript-paved-path
rm -rf plugins/typescript-paved-path/commands plugins/typescript-paved-path/agents plugins/typescript-paved-path/skills/hello-skill
S=plugins/typescript-paved-path/skills/typescript-expert
BASE=https://raw.githubusercontent.com/SyukPublic/dev-digest-ai-marketplace/main/plugins/engineering-paved-path/skills/typescript-expert
mkdir -p $S/references $S/scripts
curl -s $BASE/SKILL.md                      -o $S/SKILL.md
curl -s $BASE/references/tsconfig-strict.json -o $S/references/tsconfig-strict.json
curl -s $BASE/references/typescript-cheatsheet.md -o $S/references/typescript-cheatsheet.md
curl -s $BASE/references/utility-types.ts   -o $S/references/utility-types.ts
curl -s $BASE/scripts/ts_diagnostic.py      -o $S/scripts/ts_diagnostic.py
```

- [ ] **Step 2: Port verbatim + fix paths**

Read `SKILL.md`; it is stack-neutral TS content — keep it. Only: (a) if any script path is bare/relative, rewrite to `${CLAUDE_PLUGIN_ROOT}/skills/typescript-expert/scripts/ts_diagnostic.py`; (b) confirm no `../`. Confirm `ts_diagnostic.py` is stdlib-only:
```bash
python3 -c "import ast,sys; t=ast.parse(open('plugins/typescript-paved-path/skills/typescript-expert/scripts/ts_diagnostic.py').read()); m={n.names[0].name.split('.')[0] for n in ast.walk(t) if isinstance(n,ast.Import)}|{n.module.split('.')[0] for n in ast.walk(t) if isinstance(n,ast.ImportFrom) and n.module}; print('NON-STDLIB:', m-set(sys.stdlib_module_names) or 'NONE')"
```
Expected `NON-STDLIB: NONE`. If curl fails, note it (no scratchpad copy exists for this skill — curl is required).

- [ ] **Step 3: plugin.json**

```json
{
  "name": "typescript-paved-path",
  "version": "0.1.0",
  "description": "Advanced TypeScript guidance shared across TS stacks (strict config, type-level programming, utility types, diagnostics).",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["typescript", "types", "tsconfig", "paved-path", "sdd"]
}
```

- [ ] **Step 4: README + CHANGELOG**

README: purpose (shared TS skill loaded per TS surface via the Stack Manifest; used by NestJS now, Angular later), the one skill, note it ships a strict tsconfig + diagnostics script. CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 5: Register in marketplace.json**

```json
{
  "name": "typescript-paved-path",
  "source": "./typescript-paved-path",
  "description": "Advanced TypeScript guidance shared across TS stacks.",
  "category": "development",
  "keywords": ["typescript", "types", "paved-path"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 6: Validate + gates**

```bash
claude plugin validate .
grep -rn '\.\./' plugins/typescript-paved-path || echo "NO-PARENT-PATHS"
```
Expected: PASS; NO-PARENT-PATHS. (If `claude plugin validate .` unavailable, validate JSON via python3 and say so.)

- [ ] **Step 7: Commit**

```bash
git add plugins/typescript-paved-path .claude-plugin/marketplace.json
git commit -m "feat: add typescript-paved-path plugin (typescript-expert)"
```

---

### Task 2: `nestjs-paved-path` — best-practices + architecture skills

**Files:**
- Create: `plugins/nestjs-paved-path/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/nestjs-paved-path/skills/nestjs-best-practices/SKILL.md`
- Create: `plugins/nestjs-paved-path/skills/nestjs-architecture/SKILL.md`

**Interfaces:**
- Consumes: `engineering-foundations` (`clean-architecture`, `security`), `typescript-paved-path` (`typescript-expert`).
- Produces: skill ids `nestjs-best-practices`, `nestjs-architecture`. Plugin `nestjs-paved-path` v0.1.0 (marketplace entry added in Task 3).

- [ ] **Step 1: Scaffold**

```bash
cp -r plugins/example-plugin plugins/nestjs-paved-path
rm -rf plugins/nestjs-paved-path/commands plugins/nestjs-paved-path/agents plugins/nestjs-paved-path/skills/hello-skill
mkdir -p plugins/nestjs-paved-path/skills/nestjs-best-practices plugins/nestjs-paved-path/skills/nestjs-architecture
```

- [ ] **Step 2: Author `nestjs-best-practices/SKILL.md`**

Frontmatter `name: nestjs-best-practices`; `description:` "Use when writing or reviewing NestJS application code — modules, providers/DI, controllers, DTO validation, config, exception handling, interceptors, guards, lifecycle. Rules grounded in docs.nestjs.com."

**Rules to follow** (author each as concrete guidance):
- Modules: one module per bounded feature; export only what others need; `@Global()` only for cross-cutting infra (DB/config); `AppModule` is the composition root — no business logic in it.
- Providers & DI: constructor-inject abstractions; use injection tokens (`Symbol`/string + `@Inject()`) for interfaces / DB handle / config objects (TS interfaces are erased at runtime); prefer `useClass`/`useFactory`/`useValue` over `new`.
- Thin controllers: bind route, validate/shape input via DTO, delegate to a service, map response. No business logic, DB calls, or domain `try/catch` in controllers.
- Services hold business logic and stay framework-light: no HTTP decorators, no `Request`/`Response`.
- DTOs + validation: request DTOs are classes with `class-validator` decorators; register a global `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } })`. Never consume raw `@Body()` without a DTO.
- Config: `@nestjs/config` `ConfigModule.forRoot({ isGlobal: true })`; validate env at boot; inject typed `ConfigService`; never read `process.env` in services. ⚠️ version-gated (ConfigModule v4 / NestJS v11): internal config now precedes env vars; `ignoreEnvVars` deprecated → `validatePredefined`/`skipProcessEnv`.
- Exceptions & HTTP error model: throw `HttpException` subclasses from services; add a global exception filter normalizing the envelope (`statusCode`, `message`, `error`, `timestamp`, `path`), mapping domain errors → HTTP, and never leaking stack traces in prod.
- Interceptors: response shaping/envelope, logging/timing; use `ClassSerializerInterceptor` + `@Exclude()`/`@Expose()` on response entities to strip sensitive fields.
- Guards = authn/authz; Pipes = validation/transform; Filters = exception mapping — keep separate. Document the execution order: middleware → guards → interceptors(pre) → pipes → handler → interceptors(post) → filters.
- Lifecycle: `OnModuleInit`/`OnApplicationBootstrap` for startup; `OnModuleDestroy`/`OnApplicationShutdown` + `app.enableShutdownHooks()` for graceful shutdown (close pools). ⚠️ version-gated (v11): termination hooks run in reverse of init order.
- Logging: built-in `Logger`; ⚠️ version-gated (v11): built-in JSON logging on `ConsoleLogger` — prefer JSON in prod; never `console.log`.
- ⚠️ version-gated (v11 platform): Node 20+; Express v5 default → named route wildcards (`@Get('users/*splat')`), optional params `/:file{.:ext}`, `query parser` defaults to `simple` (set extended for nested/array queries); `CacheModule` uses Keyv adapters.

**Review red flags:** business logic/DB/domain `try-catch` in a controller; missing global `ValidationPipe` or `whitelist:false`/no `forbidNonWhitelisted`; `process.env` read in services / no boot env validation; raw entities returned (secret leakage) with no `ClassSerializerInterceptor`; catch-all swallowing domain errors / inconsistent error envelope; `@Global()` overuse, circular/god modules; unnamed Express-v5 route wildcards.

**Sources:** https://docs.nestjs.com/techniques/validation, /techniques/configuration, /exception-filters, /interceptors, /techniques/serialization, /guards, /fundamentals/lifecycle-events, and the v11 migration guide.

Keep `SKILL.md` focused; if it grows past ~200 lines, move the full rule catalog into `references/rules.md` and summarize in `SKILL.md`.

- [ ] **Step 3: Author `nestjs-architecture/SKILL.md`**

Frontmatter `name: nestjs-architecture`; `description:` "Use when structuring or reviewing NestJS layering — domain/application/infrastructure/presentation, repository ports, DI tokens, where DTOs vs entities vs persistence rows live. Builds on clean-architecture."

Preload/relate: reference `engineering-foundations:clean-architecture` as the general layering skill this specializes.

**Rules to follow:**
- Layer mapping: **domain/core** = entities, value objects, port interfaces (e.g. `UserRepository`), pure TS, zero framework imports. **application** = use-cases / `@Injectable()` services depending only on domain ports (the `@Injectable()` decorator is the only tolerable framework touch). **infrastructure** = adapters implementing ports (Drizzle repos, HTTP clients, DB provider) — the ONLY layer importing the ORM. **presentation** = controllers, DTOs, guards, filters, Swagger, `main.ts`.
- **[SHARED SPINE — verbatim]** Only the infrastructure/repository layer imports Drizzle or holds the DB handle. Application services depend on repository port interfaces via DI tokens (`Symbol` + `@Inject()`), never on `drizzle-orm` or the DB instance. Bind the implementation in the module: `{ provide: USER_REPOSITORY, useClass: DrizzleUserRepository }`.
- Three object types, three locations: **DTO** (presentation — request/response + validation + Swagger) ≠ **domain entity** (domain — behavior + invariants) ≠ **persistence row** (infrastructure — Drizzle `InferSelectModel`). Map explicitly at boundaries (repo maps row↔entity; mapper maps entity↔DTO). Don't return rows to controllers; don't feed DTOs into the domain.
- Module boundaries enforce layering; a feature module wires controller + use-cases + repository binding, exports use-cases/ports (not concrete repos). Composition root = `AppModule` + feature modules.
- Dependency rule: dependencies point inward (presentation → application → domain; infrastructure → domain); domain depends on nothing.
- **Pragmatism tier:** default to the "lite" layering (controller → service → repository-interface → Drizzle repo) for CRUD; reserve the full 4-layer split for complex domains. State this so the agent does not over-engineer.
- Layer-map guidance for `architecture-reviewer` on a NestJS surface: typical globs `apps/api/**/domain`, `.../application`, `.../infrastructure`, `.../presentation` (project's actual paths come from the Stack Manifest Layer map).

**Review red flags:** `import ... from 'drizzle-orm'` outside infrastructure; a service typed to a concrete `DrizzleUserRepository` instead of an interface/token; entities decorated with `@ApiProperty`/`class-validator`; controllers returning DB rows; `HttpException` thrown from a domain/application service; business rules inside a repository.

**Sources:** https://docs.nestjs.com/fundamentals/custom-providers, https://docs.nestjs.com/modules, and clean-architecture references.

- [ ] **Step 4: plugin.json (with dependencies)**

```json
{
  "name": "nestjs-paved-path",
  "version": "0.1.0",
  "description": "NestJS engineering skills: best practices, clean/layered architecture, REST + Swagger, and testing.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["nestjs", "backend", "architecture", "rest", "paved-path", "sdd"],
  "dependencies": ["engineering-foundations@^0.1.0", "typescript-paved-path@^0.1.0"]
}
```

- [ ] **Step 5: README + CHANGELOG**

README: purpose (NestJS surface knowledge; lists the four skills — note testing + rest-swagger arrive with this plugin too in Task 3; state clearly there is NO official NestJS agent-skill and these are authored from docs.nestjs.com), dependency note. CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 6: Grep gate + commit**

```bash
grep -rn '\.\./' plugins/nestjs-paved-path || echo "NO-PARENT-PATHS"
grep -rli 'official.*nestjs.*skill\|nestjs.*official.*skill' plugins/nestjs-paved-path && echo "CHECK-WORDING" || echo "OK"
git add plugins/nestjs-paved-path
git commit -m "feat: add nestjs-paved-path best-practices + architecture skills"
```
(The CHECK-WORDING grep is a prompt to manually confirm any 'official' mention correctly says none exists.)

---

### Task 3: `nestjs-paved-path` — testing + rest-swagger skills + register

**Files:**
- Create: `plugins/nestjs-paved-path/skills/nestjs-testing/SKILL.md`
- Create: `plugins/nestjs-paved-path/skills/nestjs-rest-swagger/SKILL.md`
- Modify: `.claude-plugin/marketplace.json` (add `nestjs-paved-path` entry)

**Interfaces:**
- Produces: skill ids `nestjs-testing`, `nestjs-rest-swagger`.

- [ ] **Step 1: Author `nestjs-rest-swagger/SKILL.md`**

Frontmatter `name: nestjs-rest-swagger`; `description:` "Use when designing/documenting NestJS REST APIs with @nestjs/swagger — setup, DTO-driven schema, decorators, versioning, status codes, pagination, error docs."

**Rules to follow:**
- Setup: install `@nestjs/swagger`; in `main.ts` build `new DocumentBuilder().setTitle().setDescription().setVersion().addBearerAuth().build()`, `SwaggerModule.createDocument(app, config)`, `SwaggerModule.setup('docs', app, document)`. Gate `/docs` behind non-prod or auth.
- Enable the CLI plugin in `nest-cli.json` (`{"name":"@nestjs/swagger","options":{"classValidatorShim":true,"introspectComments":true,"dtoFileNameSuffix":[".dto.ts"]}}`): infers `@ApiProperty` from types, `?`→`required:false`, JSDoc→description/example. Add `@ApiProperty` manually for constraints the plugin can't infer.
- DTO-driven schemas as the single source of truth. Use `@ApiTags`, `@ApiOperation`, `@ApiResponse`/`@ApiOkResponse`/`@ApiCreatedResponse`, `@ApiBearerAuth`. Derive update DTOs with `PartialType`/`PickType`/`OmitType`/`IntersectionType` from `@nestjs/swagger` (keeps validation + docs in sync).
- REST conventions: plural nouns (`/users`, `/users/:id`), no verbs; nest sub-resources one level. Use `@nestjs/common` URI versioning (`app.enableVersioning({ type: VersioningType.URI })` → `/v1/...`).
- Status codes: 200 GET/PUT, 201 POST, 204 DELETE no body, 400 validation, 401/403 auth, 404 missing, 409 conflict, 422 semantic; override with `@HttpCode()`.
- Pagination: standardize one strategy — offset (`?page=&limit=`) simple, cursor/keyset (`?cursor=&limit=`) for large/mutating sets; return a documented `{ data, meta }` envelope as a generic `PaginatedDto<T>` (document with `getSchemaPath`). Cap `limit`.
- Error docs: shared `ErrorResponseDto` matching the exception-filter envelope; attach `@ApiResponse({ status, type: ErrorResponseDto })`.

**Review red flags:** Swagger UI unauthenticated in prod; endpoints/DTOs missing `@ApiResponse`/`@ApiTags`; error responses undocumented; hand-rewritten update DTOs instead of `PartialType` (doc/validation drift); verbs in routes / inconsistent pluralization / unversioned public API; wrong/implicit status codes; unbounded `limit`.

**Sources:** https://docs.nestjs.com/openapi/introduction, /openapi/cli-plugin, /openapi/types-and-parameters, /openapi/operations, /techniques/versioning.

- [ ] **Step 2: Author `nestjs-testing/SKILL.md`**

Frontmatter `name: nestjs-testing`; `description:` "Use when writing/reviewing NestJS tests — unit tests stubbing repository ports, supertest e2e, ValidationPipe tests, real-DB repository tests. Jest default."

**Rules to follow:**
- Unit tests: `Test.createTestingModule({ providers: [Service, { provide: TOKEN, useValue: mock }] }).compile()`. Stub the injected repository port; **never mock the unit under test**. Use `.overrideProvider().useValue()/.useClass()`, `.overrideGuard()`, `.overrideInterceptor()`. Every test asserts observable behavior, ≥1 real assertion (not just call-count).
- **[SHARED SPINE — verbatim]** Only the infrastructure/repository layer imports Drizzle or holds the DB handle; application services depend on repository port interfaces via DI tokens — so unit tests supply a fake implementing that interface (fast, no DB, proves the contract).
- e2e/integration: build with the real DI container (`Test.createTestingModule({ imports: [AppModule] })` → `createNestApplication()`), **apply the same global pipes/filters as `main.ts`**, then `request(app.getHttpServer())` (supertest). Assert status + envelope.
- Mandatory ValidationPipe test: send an invalid DTO → assert 400 + message; send extra fields → assert `forbidNonWhitelisted` behavior. (Verifies the security contract.)
- Repository tests: run the real Drizzle repo against real Postgres; isolate per test via a transaction rolled back in teardown (or truncate); do NOT mock the query builder.
- Test DB: prefer Testcontainers (`@testcontainers/postgresql`) for hermetic CI; run migrations before the suite.
- Runner: Jest is the NestJS default. ⚠️ note: many projects migrating to Vitest (near-drop-in `vi`; needs SWC/ts transform for decorators) — default to Jest unless the project already uses Vitest.
- Keep unit (`*.spec.ts`) and e2e (`test/*.e2e-spec.ts`) separate; run e2e serially or with isolated DBs.

**Review red flags:** mocking the class under test / asserting on mock internals; mocking the Drizzle query-builder chain instead of integration-testing the repo; e2e not applying global ValidationPipe/filters; no invalid-DTO→400 test; shared mutable DB state without rollback/truncate; DB spun up per test instead of per suite / migrations not run; type-unsafe stubs that don't satisfy the port interface.

**Sources:** https://docs.nestjs.com/fundamentals/testing, https://node.testcontainers.org/.

- [ ] **Step 3: Register nestjs-paved-path in marketplace.json**

```json
{
  "name": "nestjs-paved-path",
  "source": "./nestjs-paved-path",
  "description": "NestJS engineering skills: best practices, architecture, REST + Swagger, testing.",
  "category": "development",
  "keywords": ["nestjs", "backend", "architecture", "testing"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```

- [ ] **Step 4: Validate + gates + commit**

```bash
claude plugin validate .
ls plugins/nestjs-paved-path/skills | sort   # expect 4 skills
grep -rn '\.\./' plugins/nestjs-paved-path || echo "NO-PARENT-PATHS"
grep -rl 'Only the infrastructure/repository layer imports Drizzle' plugins/nestjs-paved-path/skills/nestjs-testing  # spine present
git add plugins/nestjs-paved-path .claude-plugin/marketplace.json
git commit -m "feat: add nestjs-paved-path testing + rest-swagger skills and register plugin"
```
Expected: PASS; 4 skills; NO-PARENT-PATHS; spine grep matches.

---

### Task 4: `nestjs-orm-drizzle` plugin

**Files:**
- Create: `plugins/nestjs-orm-drizzle/.claude-plugin/plugin.json`, `README.md`, `CHANGELOG.md`
- Create: `plugins/nestjs-orm-drizzle/skills/nestjs-orm-drizzle/SKILL.md`
- Modify: `.claude-plugin/marketplace.json`

**Interfaces:**
- Consumes: `nestjs-paved-path` (esp. `nestjs-architecture` ports). Produces: skill id `nestjs-orm-drizzle`. Plugin `nestjs-orm-drizzle` v0.1.0, depends on `nestjs-paved-path@^0.1.0`.

- [ ] **Step 1: Scaffold**

```bash
cp -r plugins/example-plugin plugins/nestjs-orm-drizzle
rm -rf plugins/nestjs-orm-drizzle/commands plugins/nestjs-orm-drizzle/agents plugins/nestjs-orm-drizzle/skills/hello-skill
mkdir -p plugins/nestjs-orm-drizzle/skills/nestjs-orm-drizzle
```

- [ ] **Step 2: Author `nestjs-orm-drizzle/SKILL.md`**

Frontmatter `name: nestjs-orm-drizzle`; `description:` "Use when integrating Drizzle ORM (Postgres) into a NestJS app — schema, the DRIZZLE provider, queries, transactions, pooling, drizzle-kit migrations, repository isolation."

**Rules to follow:**
- Schema: `pgTable('users', { id: uuid().primaryKey().defaultRandom(), email: varchar({length:255}).notNull().unique(), createdAt: timestamp().defaultNow() })`. Keep in a dedicated `schema.ts` (or per-table re-exported). Derive persistence types with `InferSelectModel`/`InferInsertModel` (or `$inferSelect`/`$inferInsert`) — infra layer only.
- ⚠️ version-gated: Drizzle is pre-1.0 and rolling out a new Relations API (RQB v2). Pin the installed `drizzle-orm` version and follow the docs for that version; classic `relations()` and the new API differ. For `db.query` relational reads you MUST pass the full schema to `drizzle(client, { schema })`.
- NestJS module pattern: a `@Global() DatabaseModule` provides the handle under a `DRIZZLE` injection token via factory: `export const DRIZZLE = Symbol('DRIZZLE'); { provide: DRIZZLE, inject: [ConfigService], useFactory: (cfg) => drizzle(new Pool({ connectionString: cfg.getOrThrow('DATABASE_URL') }), { schema }) }`. Export `DRIZZLE`. Type as `NodePgDatabase<typeof schema>` (node-postgres) or `PostgresJsDatabase<typeof schema>` (postgres.js). Note: Drizzle has no official NestJS integration — this custom provider is the community-standard pattern.
- **[SHARED SPINE — verbatim]** Only the infrastructure/repository layer imports Drizzle or holds the DB handle. Application services depend on repository port interfaces via DI tokens, never on `drizzle-orm` or the DB instance. Only repositories inject `DRIZZLE`; they implement the domain ports defined in `nestjs-architecture`.
- Queries: builder (`db.select().from().where(eq(...))`, `insert().values().returning()`) for writes; relational `db.query.users.findMany({ with: { orders: true } })` for reads with relations.
- Transactions: `await db.transaction(async (tx) => { ... })`; pass `tx` down so all statements share it. For request-scoped propagation across repos, `nestjs-cls` + `TransactionalAdapterDrizzleOrm` (community).
- Pooling: one app-scoped `Pool` / `postgres(url,{max})`; close on shutdown (`OnModuleDestroy` + `enableShutdownHooks`); never a client per request.
- Migrations: `drizzle.config.ts` (`dialect:'postgresql'`, `schema`, `out`, `dbCredentials`); `drizzle-kit generate` (schema→SQL) then `drizzle-kit migrate` (apply in order); versioned SQL in git; `push` is prototyping-only; run migrations as a deploy step, not from app boot in prod.
- Testing: prefer a real Postgres (Testcontainers) over mocking the query builder (see `nestjs-testing`).

**Review red flags:** `DRIZZLE` injected into a service/controller (not a repository); query-builder chains mocked in unit tests instead of repo integration tests; `db.query` used without schema passed to `drizzle()`; multi-step writes not in `db.transaction`; per-request `Pool`/client or pool never closed; `drizzle-kit push` against prod / migrations run from `main.ts`; persistence row types in service/domain signatures.

**Sources:** https://orm.drizzle.team/docs/get-started/postgresql-new, /docs/rqb, /docs/transactions, /docs/migrations, /docs/drizzle-kit-generate, /docs/drizzle-kit-migrate; reference feed https://orm.drizzle.team/llms.txt.

- [ ] **Step 3: plugin.json**

```json
{
  "name": "nestjs-orm-drizzle",
  "version": "0.1.0",
  "description": "Drizzle ORM (Postgres) integration guidance for NestJS: DRIZZLE provider, queries, transactions, migrations, repository isolation.",
  "author": { "name": "Viacheslav Klavdiiev" },
  "license": "MIT",
  "keywords": ["nestjs", "drizzle", "orm", "postgres", "library", "sdd"],
  "dependencies": ["nestjs-paved-path@^0.1.0"]
}
```

- [ ] **Step 4: README + CHANGELOG**

README: purpose (swappable per-project ORM library skill for NestJS; Postgres-focused; the DRIZZLE-token + repository-isolation spine), dependency note, and that a project picks one ORM library plugin. CHANGELOG `## 0.1.0` dated 2026-07-23.

- [ ] **Step 5: Register + validate + commit**

```json
{
  "name": "nestjs-orm-drizzle",
  "source": "./nestjs-orm-drizzle",
  "description": "Drizzle ORM (Postgres) integration guidance for NestJS.",
  "category": "development",
  "keywords": ["nestjs", "drizzle", "orm", "postgres"],
  "author": { "name": "Viacheslav Klavdiiev" }
}
```
```bash
claude plugin validate .
grep -rn '\.\./' plugins/nestjs-orm-drizzle || echo "NO-PARENT-PATHS"
grep -rl 'Only the infrastructure/repository layer imports Drizzle' plugins/nestjs-orm-drizzle
git add plugins/nestjs-orm-drizzle .claude-plugin/marketplace.json
git commit -m "feat: add nestjs-orm-drizzle library plugin"
```
Expected: PASS; NO-PARENT-PATHS; spine grep matches.

---

### Task 5: Manifest/README wiring + version bump + full quality gate

**Files:**
- Modify: `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md`
- Modify: `README.md`
- Modify: `.claude-plugin/marketplace.json` (bump `metadata.version` 0.2.0 → 0.3.0)

- [ ] **Step 1: Update the shipped Stack Manifest template**

In `plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md`, edit the `api (NestJS)` row's Paved-path skills to `nestjs-best-practices, nestjs-architecture, nestjs-testing, nestjs-rest-swagger` (add `nestjs-rest-swagger`), keep library `nestjs-orm-drizzle`. Add a note below the table: "`typescript-expert` (from `typescript-paved-path`) applies to every TypeScript surface (Angular, NestJS)." Do not change the resolution rules.

- [ ] **Step 2: Update the repo README**

In `README.md`: (a) update the pasted Stack Manifest copy in the "Using the SDD workflow" section to match Step 1; (b) in the optional/Stage-B plugins note, replace the "once published" placeholder for NestJS with the now-available install lines:
```
/plugin install typescript-paved-path@claude-market
/plugin install nestjs-paved-path@claude-market
/plugin install nestjs-orm-drizzle@claude-market
```
and note Angular/Flutter stacks are still forthcoming.

- [ ] **Step 3: Bump marketplace version**

In `.claude-plugin/marketplace.json`, set `metadata.version` to `0.3.0`.

- [ ] **Step 4: Full quality gate**

```bash
node scripts/build-site.mjs
claude plugin validate .
```
Expected: build-site exit 0 (now 8 plugins; components include the 6 new skills), validate PASS. If build-site FAILS, read the error, fix the cause (missing description/version, duplicate id), re-run until green. Do NOT `git add _site` (gitignored).

- [ ] **Step 5: Verify dependency edges**

```bash
for p in typescript-paved-path nestjs-paved-path nestjs-orm-drizzle; do echo "== $p =="; grep -A4 '"dependencies"' plugins/$p/.claude-plugin/plugin.json 2>/dev/null || echo "(none)"; done
```
Expected: typescript-paved-path none; nestjs-paved-path → engineering-foundations + typescript-paved-path; nestjs-orm-drizzle → nestjs-paved-path.

- [ ] **Step 6: Commit**

```bash
git add plugins/sdd-engineering/skills/run-plan/references/stack-manifest.md README.md .claude-plugin/marketplace.json
git commit -m "chore: wire NestJS stack into manifest + README, bump marketplace to 0.3.0"
```

---

## Self-Review

**Spec coverage:** AC-1/2/12 → Tasks 1–5 (manifests, packaging, dependency edges, bump). AC-3 → Tasks 1,2,3,4 (skill inventories). AC-4/6/7 → Tasks 2,3,4 (each authored skill's rules/red-flags/sources/version-gating; the no-official-skill wording). AC-5 → spine text in Tasks 2 (architecture), 3 (testing), 4 (drizzle). AC-8 → Task 3 (rest-swagger). AC-9 → Task 3 (testing). AC-10 → Task 1 (typescript-expert port + stdlib check). AC-11 → Task 5 (manifest + README). AC-13 → validate + build-site in Tasks 1,3,4,5. AC-14 → English-only constraint. All ACs mapped.

**Placeholder scan:** Each authored-skill step carries the full rule + red-flag + source lists to write from (not "add rules here"). Port step gives exact URLs. Verify steps give exact commands + expected output.

**Type/name consistency:** plugin names (`typescript-paved-path`, `nestjs-paved-path`, `nestjs-orm-drizzle`), skill ids (`typescript-expert`, `nestjs-best-practices`, `nestjs-architecture`, `nestjs-testing`, `nestjs-rest-swagger`, `nestjs-orm-drizzle`), dependency versions `^0.1.0`, and the single marketplace bump to `0.3.0` are consistent across tasks. The shared-spine sentence is quoted identically in the Global Constraints and each consuming task.

**Note for executor:** Run tasks 1 → 4 in order (dependency edges); Task 5 is terminal. Upstream URLs needed only in Task 1 (typescript-expert); the four NestJS skills are authored from this plan's embedded rule lists, not fetched.
