# NestJS + Drizzle ORM — Full Rule Catalog

Authority: [orm.drizzle.team](https://orm.drizzle.team). A community skill
(`Kadajett/agent-nestjs-skills`, MIT) was consulted as corroborating
reference for items marked **[community]** — its examples are TypeORM
(occasionally Prisma) specific; every one is reframed for Drizzle below,
never copied verbatim. No conflict with orm.drizzle.team was found in any
item folded in.

## 1. Schema

Define tables with `pgTable(...)` in a dedicated `schema.ts` (or several
per-table files re-exported from one `schema` barrel that `drizzle()` and
`drizzle-kit` both import):

```ts
// infrastructure/db/schema.ts
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().primaryKey().defaultRandom(),
  email: varchar({ length: 255 }).notNull().unique(),
  createdAt: timestamp().defaultNow(),
});
```

Derive persistence types from the schema rather than hand-writing them:

```ts
export type UserRow = typeof users.$inferSelect;   // or InferSelectModel<typeof users>
export type NewUserRow = typeof users.$inferInsert; // or InferInsertModel<typeof users>
```

These row types are an **infrastructure-layer concept only** — they map to
a domain entity inside the repository; they never appear in a service or
controller signature (see the shared spine invariant, and
`nestjs-architecture`'s "three object types, three locations" rule).

## 2. ⚠️ Version-gated: Relations API / RQB v2

Drizzle is pre-1.0 and mid-rollout of a new Relations API (Relational
Query Builder v2). The classic `relations()` helper and the new API
differ in shape and setup. Before writing any relational code:

- Pin the installed `drizzle-orm` version in `package.json` (no `^`/`~`
  drift across a migration to the new API without a deliberate bump).
- Follow the docs for that exact pinned version — don't mix examples from
  different major/minor releases.
- For **any** `db.query.<table>.findMany/findFirst` relational read, the
  full schema object must be passed when the DB handle is created:
  `drizzle(client, { schema })`. Omitting `schema` doesn't error loudly —
  `db.query` is simply absent/undefined, which surfaces as a confusing
  runtime failure far from the actual cause.

## 3. `DatabaseModule` + `DRIZZLE` token

Drizzle ships no official NestJS integration; this factory-provider shape
is the community-standard pattern:

```ts
// infrastructure/db/database.module.ts
import { Global, Module, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

export const DRIZZLE = Symbol('DRIZZLE');
export type DrizzleDb = NodePgDatabase<typeof schema>;

@Global()
@Module({
  providers: [
    {
      provide: DRIZZLE,
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const pool = new Pool({ connectionString: cfg.getOrThrow('DATABASE_URL') });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
```

Use `drizzle-orm/postgres-js` + `postgres(url, { max })` instead of
`node-postgres`/`Pool` if the project standardizes on postgres.js — type
the handle `PostgresJsDatabase<typeof schema>` in that case. Only
`DatabaseModule` (and the repositories it feeds) ever imports
`drizzle-orm`.

## 4. Shared spine invariant (verbatim)

> Only the infrastructure/repository layer imports Drizzle or holds the DB
> handle. Application services depend on repository port interfaces via DI
> tokens (`Symbol` + `@Inject()`), never on `drizzle-orm` or the DB
> instance.

```ts
// domain/ports/user-repository.ts — defined by nestjs-architecture, pure interface
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

// infrastructure/db/drizzle-user.repository.ts — the only place that imports drizzle-orm + injects DRIZZLE
@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDb) {}
  async findById(id: string): Promise<User | null> {
    const row = await this.db.query.users.findFirst({ where: eq(users.id, id) });
    return row ? User.fromRow(row) : null;
  }
  async save(user: User): Promise<void> {
    await this.db.insert(users).values(user.toRow())
      .onConflictDoUpdate({ target: users.id, set: user.toRow() });
  }
}

// application/user.service.ts — depends on the port, never on drizzle-orm
@Injectable()
export class UserService {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}
}

// users.module.ts — binds the concrete impl to the token
@Module({
  providers: [UserService, { provide: USER_REPOSITORY, useClass: DrizzleUserRepository }],
  exports: [UserService],
})
export class UsersModule {}
```

## 5. Queries

- **Writes** — the query builder: `db.insert(users).values({...}).returning()`,
  `db.update(users).set({...}).where(eq(users.id, id))`,
  `db.delete(users).where(eq(users.id, id))`.
- **Reads with relations** — the relational query API:
  `db.query.users.findMany({ with: { orders: true } })`. Reserve the
  builder's `select().from().where(eq(...))` for reads that don't need
  related rows or need a projection the relational API doesn't express
  cleanly (aggregates, custom joins).

## 6. Transactions

```ts
await db.transaction(async (tx) => {
  await tx.insert(orders).values(orderRow);
  await tx.update(inventory).set({ qty: sql`${inventory.qty} - 1` })
    .where(eq(inventory.sku, sku));
});
```

Pass `tx` down explicitly to every repository method invoked within one
unit of work — a repository method should accept an optional `tx`/executor
parameter (defaulting to the injected `db`) so it can run standalone or
inside a caller's transaction. For propagating one transaction across
multiple repositories/services within a request without threading `tx`
through every call site, use `nestjs-cls` with the community
`TransactionalAdapterDrizzleOrm` adapter.

**[community, reframed]** Any write that touches more than one
table/row as a single logical operation belongs inside one
`db.transaction(...)` call — not sequential unguarded statements. Without
it, a failure partway through the sequence leaves earlier statements
committed and the data in an inconsistent state (e.g. an order row
inserted with no matching inventory decrement).

## 7. Pooling

One application-scoped connection pool, created once by
`DatabaseModule`'s factory (`Pool` for node-postgres, `postgres(url,
{ max })` for postgres.js) — never a client/pool created per request.
Close it on shutdown:

```ts
@Injectable()
export class DatabaseModule implements OnModuleDestroy {
  async onModuleDestroy() { await this.pool.end(); }
}
```

and ensure `app.enableShutdownHooks()` is called in `main.ts` so
`onModuleDestroy` actually fires on `SIGTERM`/`SIGINT`.

## 8. Migrations

`drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- `drizzle-kit generate` — diffs the schema against the last generated
  migration and writes versioned SQL into `out`.
- `drizzle-kit migrate` — applies pending SQL migrations in order against
  the target database.
- Commit the generated SQL files to git; they are the reviewable,
  reversible record of every schema change.
- `drizzle-kit push` (direct schema sync, no SQL file) is prototyping-only
  — never point it at a shared, staging, or production database.
- Run `drizzle-kit migrate` as an explicit deploy step (CI/CD job, release
  hook), never triggered from `main.ts`/application bootstrap in
  production — concurrent app instances racing to apply migrations on
  boot is a correctness and downtime risk.

**[community, reframed]** No `synchronize`/auto-sync equivalent in prod
— `drizzle-kit push` is the Drizzle analogue of TypeORM's `synchronize:
true` and carries the same prohibition. For a breaking rename/retype,
prefer an **expand-contract** two-step over one destructive migration:
generate a migration that adds the new column and backfills/dual-writes,
deploy, then a second migration that drops the old column once all
readers have moved on — this avoids a deploy window where old and new
application code can't both run against the same schema shape.

## 9. Testing

Prefer a real Postgres instance (Testcontainers,
`@testcontainers/postgresql`) with migrations applied, running the actual
Drizzle repository implementation, over mocking the query-builder chain —
a mocked builder only proves the mock was called, not that the generated
SQL/relational query is correct. See `nestjs-testing` for the full
unit-test-mocks-the-port vs. repository-test-hits-real-Postgres split.

## 10. Avoid N+1

**[community, reframed]** Fetching a parent list, then issuing one query
per row inside a loop for its children, is the N+1 pattern — it scales
linearly with result size and is a common source of slow endpoints that
look fine in dev with a handful of rows. Fix it by fetching in one round
trip:

```ts
// good: one query, relation loaded via RQB
const usersWithOrders = await db.query.users.findMany({ with: { orders: true } });

// good: explicit join when RQB doesn't fit the shape needed
const rows = await db.select().from(users).leftJoin(orders, eq(orders.userId, users.id));
```

Enable Drizzle's built-in query logger in development
(`drizzle(client, { schema, logger: true })`) to make an accidental
per-row query pattern visible before it reaches production. The
DataLoader-style batching pattern the community reference applies to
GraphQL resolvers is the same idea at a different layer — batch, don't
loop — and remains ORM-agnostic advice.

## 11. Select columns, index hot paths, always paginate

**[community, reframed]**

- **Column selection** — use `.select({ id: users.id, email: users.email })`
  instead of unqualified `select()` when a query doesn't need every
  column, especially for wide tables or list endpoints.
- **Indexes** — declare indexes on frequently-filtered, joined, or sorted
  columns directly in the schema:
  ```ts
  import { index } from 'drizzle-orm/pg-core';
  export const orders = pgTable('orders', { /* ... */ }, (t) => ({
    userIdIdx: index('orders_user_id_idx').on(t.userId),
  }));
  ```
- **Avoid over-fetching relation trees** — bound `with: {}` depth/fields
  to what the endpoint actually needs rather than pulling every nested
  relation by default.
- **Pagination** — every list endpoint applies `.limit()`/`.offset()` (or
  keyset pagination for large/hot tables) and computes total-count
  metadata from a separate `count(*)` query rather than loading the full
  result set to measure it.

## Out of scope

Non-Postgres Drizzle dialects (MySQL, SQLite), Drizzle Studio, and
`drizzle-zod`/schema-validation integration are out of scope for this
Postgres-focused increment.

## Sources

- https://orm.drizzle.team/docs/get-started/postgresql-new
- https://orm.drizzle.team/docs/rqb
- https://orm.drizzle.team/docs/transactions
- https://orm.drizzle.team/docs/migrations
- https://orm.drizzle.team/docs/drizzle-kit-generate
- https://orm.drizzle.team/docs/drizzle-kit-migrate
- Reference feed: https://orm.drizzle.team/llms.txt
- Corroborating reference only (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills
