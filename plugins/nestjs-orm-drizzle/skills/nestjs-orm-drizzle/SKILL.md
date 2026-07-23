---
name: nestjs-orm-drizzle
description: Use when integrating Drizzle ORM (Postgres) into a NestJS app — schema, the DRIZZLE provider, queries, transactions, pooling, drizzle-kit migrations, repository isolation.
---

# NestJS + Drizzle ORM (Postgres)

Drizzle has **no official NestJS integration** — the `DRIZZLE`-token
provider shown here is the community-standard pattern, not a first-party
Nest module. This skill is authored from
[orm.drizzle.team](https://orm.drizzle.team) docs. A community skill
(`Kadajett/agent-nestjs-skills`) was consulted as corroborating reference
for the migrations/transactions/N+1/pagination items (all originally
TypeORM-flavored, reframed for Drizzle here) — see Sources.

This is one of several swappable per-project **ORM library** plugins: a
project picks exactly one (this one, for Postgres + Drizzle) and installs
it alongside `nestjs-paved-path`. Repositories authored under this skill
implement the domain ports defined by `nestjs-paved-path`'s
`nestjs-architecture` skill.

Full rule catalog with rationale and code shape lives in
[references/rules.md](references/rules.md). This file is the summary; open
the reference for the detail behind any rule below.

## Shared spine invariant (verbatim — do not paraphrase)

> Only the infrastructure/repository layer imports Drizzle or holds the DB
> handle. Application services depend on repository port interfaces via DI
> tokens (`Symbol` + `@Inject()`), never on `drizzle-orm` or the DB
> instance.

Concretely: only a repository class (infrastructure layer) injects
`DRIZZLE` and imports from `drizzle-orm`; it implements a port interface
defined in `nestjs-architecture` (e.g. `UserRepository`), and the feature
module binds `{ provide: USER_REPOSITORY, useClass: DrizzleUserRepository }`.
No service, controller, or domain type ever imports `drizzle-orm` or sees
the `DRIZZLE` handle directly.

## Rules to follow

(Full detail, code shape, and rationale for every item: see
[references/rules.md](references/rules.md).)

1. **Schema** — define tables with `pgTable(...)` in a dedicated
   `schema.ts` (or per-table files re-exported from one `schema` barrel).
   Derive persistence types with `InferSelectModel`/`InferInsertModel` (or
   `$inferSelect`/`$inferInsert`) — infrastructure layer only, never in a
   domain/application signature.
2. **⚠️ version-gated: Relations API / RQB v2** — Drizzle is pre-1.0 and
   rolling out a new Relations API (RQB v2). Pin the installed
   `drizzle-orm` version and follow the docs for that exact version;
   classic `relations()` and the new API differ. For `db.query.*`
   relational reads you **must** pass the full schema to
   `drizzle(client, { schema })` — omitting it silently disables `.query`.
3. **`DatabaseModule` + `DRIZZLE` token** — a `@Global() DatabaseModule`
   provides the DB handle under a `DRIZZLE` injection token via factory,
   exports `DRIZZLE`; typed `NodePgDatabase<typeof schema>` (node-postgres)
   or `PostgresJsDatabase<typeof schema>` (postgres.js).
4. **Shared spine invariant** — the ORM boundary, verbatim above. Only
   repositories inject `DRIZZLE`.
5. **Queries** — query builder (`db.select().from().where(eq(...))`,
   `insert().values().returning()`) for writes; relational
   `db.query.users.findMany({ with: { orders: true } })` for reads that
   need related rows.
6. **Transactions** — `await db.transaction(async (tx) => { ... })`; pass
   `tx` down to every repository call in the same unit of work so all
   statements share one transaction. For propagating a transaction across
   repositories/services within one request without threading `tx`
   through every method signature, use `nestjs-cls` +
   `TransactionalAdapterDrizzleOrm` (community).
7. **Pooling** — one app-scoped `Pool` (node-postgres) or
   `postgres(url, { max })` (postgres.js); close it on shutdown
   (`OnModuleDestroy` + `app.enableShutdownHooks()`); never open a
   client/pool per request.
8. **Migrations** — `drizzle.config.ts` (`dialect: 'postgresql'`,
   `schema`, `out`, `dbCredentials`); `drizzle-kit generate` (schema diff
   → versioned SQL) then `drizzle-kit migrate` (apply in order); commit
   the generated SQL to git; `drizzle-kit push` is prototyping-only, never
   against a shared/prod database; run migrations as an explicit deploy
   step, never triggered from `main.ts`/app boot in production.
9. **Testing** — prefer a real Postgres (Testcontainers) over mocking the
   query builder for repository tests; see `nestjs-testing` for the
   port-mock vs real-DB split.
10. **Transactions wrap multi-step writes** *(community, reframed)* —
    any write touching more than one table/row as a single logical
    operation belongs in one `db.transaction(...)` call, not sequential
    unguarded statements — otherwise a mid-sequence failure leaves partial
    writes committed.
11. **Avoid N+1** *(community, reframed)* — never fetch a parent list then
    query per-row in a loop for children; use `db.query.*` with `with: {}`
    (relational queries) or an explicit `leftJoin`/`innerJoin` to fetch in
    one round trip. Enable Drizzle's `logger: true` in development to spot
    per-row query patterns before they reach production.
12. **Select only needed columns, index hot columns, always paginate**
    *(community, reframed)* — use `.select({ id: users.id, ... })` instead
    of `select()` (all columns) when a query doesn't need every field;
    declare `index()`/composite indexes in the schema for
    frequently-filtered or joined columns; every list endpoint paginates
    (`.limit().offset()`) and returns pagination metadata from a separate
    `count(*)` query rather than loading the full result set to count it.
13. **Expand-contract for breaking schema changes** *(community,
    reframed)* — rename/retype a column across two migrations (add new
    column, dual-write/backfill, then drop the old one) rather than one
    breaking migration, to avoid a deploy window where old and new code
    can't both run against the schema.

## Review red flags

- `DRIZZLE` injected into a service or controller instead of a
  repository, or any non-infrastructure file `import`ing `drizzle-orm`.
- Persistence row types (`InferSelectModel<...>` etc.) appearing in a
  service/domain method signature instead of a mapped domain entity.
- `db.query.*` used anywhere without the full `schema` object having been
  passed to `drizzle(client, { schema })`.
- Query-builder chains (`.select().from().where(...)`) mocked in a unit
  test instead of stubbing the repository port interface (real Postgres
  belongs in a repository/integration test, per `nestjs-testing`).
- Multi-step writes (more than one table/row mutated as one logical
  operation) not wrapped in `db.transaction(...)`.
- A `Pool`/`postgres()` client created per request, or a pool never closed
  on shutdown.
- `drizzle-kit push` run against a shared/staging/prod database, or
  migrations invoked from `main.ts`/app bootstrap instead of a deploy
  step.
- A list/children fetch issuing one query per parent row (N+1) where a
  relational `with` or a join would do it in one round trip.
- A list endpoint with no pagination, or pagination metadata computed by
  loading the full result set instead of a separate count query.

## Sources

- https://orm.drizzle.team/docs/get-started/postgresql-new
- https://orm.drizzle.team/docs/rqb
- https://orm.drizzle.team/docs/transactions
- https://orm.drizzle.team/docs/migrations
- https://orm.drizzle.team/docs/drizzle-kit-generate
- https://orm.drizzle.team/docs/drizzle-kit-migrate
- Reference feed: https://orm.drizzle.team/llms.txt
- Corroborating community reference (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills — folded in for the
  transaction-wraps-multi-step-writes, N+1-avoidance, and
  select-columns/index/paginate items (rules 10–13 above), plus the
  expand-contract migration pattern; all originally TypeORM-specific
  (`dataSource.transaction`, `QueryRunner`, TypeORM `relations`/
  `@Index`/`findAndCount`) and reframed here for Drizzle's
  `db.transaction`, `db.query...with`/joins, `index()`, and
  `.limit()/.offset()` — the underlying principles transfer directly, no
  conflict with orm.drizzle.team found.
