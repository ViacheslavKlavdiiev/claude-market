# NestJS Testing — Full Rule Catalog

Authority: docs.nestjs.com + testcontainers.node.org. A community skill
(`Kadajett/agent-nestjs-skills`, MIT) was consulted as corroborating
reference for items marked **[community]**; where its examples are
ORM-specific (TypeORM `dataSource`/`getRepositoryToken`) they are
reframed for the Drizzle-based repository-port pattern this plugin's
shared spine assumes, with no conflict on the underlying testing
pattern.

## 1. Unit tests

```ts
describe('OrdersService', () => {
  let service: OrdersService;
  let repo: jest.Mocked<OrderRepository>; // port interface, not Drizzle

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: ORDER_REPOSITORY, useValue: { findById: jest.fn(), save: jest.fn() } },
      ],
    }).compile();

    service = module.get(OrdersService);
    repo = module.get(ORDER_REPOSITORY);
  });

  it('throws NotFoundException when the order does not exist', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(service.cancel('missing-id')).rejects.toThrow(NotFoundException);
  });
});
```

Stub the injected repository **port**, not the class under test. Every
test must assert something observable: a return value, a thrown
exception (type + message), or a call made to a collaborator with
specific arguments (`expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({...}))`).
A test that only checks `repo.save` was called once, with no assertion on
what it was called *with* or what the service *returned*, proves almost
nothing.

Overrides for cross-cutting concerns:
```ts
const module = await Test.createTestingModule({ imports: [AppModule] })
  .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
  .overrideProvider(EmailService).useValue({ send: jest.fn() })
  .compile();
```

## 2. Mock at the port boundary (shared spine consequence)

Because application services depend on `UserRepository`
(interface + `Symbol` token), not `drizzle-orm`, a type-safe stub is:

```ts
const stubUserRepo: jest.Mocked<UserRepository> = {
  findById: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
}; // must implement every method of UserRepository — TS will catch drift
```

**Do not** write a unit test that mocks `db.select().from(users).where(...)`
directly — that couples the test to Drizzle's fluent API shape instead of
to the port contract, and it tests nothing about whether the *service*
correctly calls the repository. If the port interface changes, a stub
missing a method fails to compile — that's the safety net; a stub that
doesn't fully implement the interface (e.g. cast with `as any`) throws
that safety net away.

## 3. e2e / integration tests

```ts
// test/orders.e2e-spec.ts
let app: INestApplication;

beforeAll(async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();

  // MUST mirror main.ts exactly:
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  await app.init();
});

afterAll(async () => { await app.close(); });

it('POST /orders creates an order', async () => {
  const res = await request(app.getHttpServer())
    .post('/orders')
    .send({ items: [{ sku: 'A1', qty: 2 }] })
    .expect(201);

  expect(res.body).toMatchObject({ id: expect.any(String), status: 'pending' });
});
```

If the e2e bootstrap doesn't call the exact same `useGlobalPipes`/
`useGlobalFilters` setup as `main.ts`, the test suite is exercising a
different pipeline than production — a passing e2e suite would then not
guarantee the deployed API behaves the same way. Extract the pipe/filter
construction into a shared `configureApp(app)` function called from both
`main.ts` and the e2e bootstrap to guarantee they can't drift apart.

## 4. Mandatory ValidationPipe test

```ts
it('rejects an invalid DTO with 400', async () => {
  const res = await request(app.getHttpServer())
    .post('/orders')
    .send({ items: 'not-an-array' })
    .expect(400);

  expect(res.body.message).toEqual(expect.arrayContaining([expect.stringContaining('items')]));
});

it('rejects unexpected extra fields (forbidNonWhitelisted)', async () => {
  await request(app.getHttpServer())
    .post('/orders')
    .send({ items: [{ sku: 'A1', qty: 1 }], extraField: 'nope' })
    .expect(400);
});
```

Every endpoint accepting a validated DTO needs at least these two cases
in its e2e suite. Skipping them means the security-relevant
`whitelist`/`forbidNonWhitelisted`/`transform` configuration is never
actually verified end-to-end — it could silently regress (e.g. someone
removes `forbidNonWhitelisted` from the global pipe config) with no test
catching it.

## 5. Repository tests (real Postgres)

```ts
describe('DrizzleOrderRepository', () => {
  let db: NodePgDatabase;
  let repo: DrizzleOrderRepository;

  beforeAll(async () => {
    db = drizzle(testPool);
    await migrate(db, { migrationsFolder: './drizzle' });
  });

  beforeEach(async () => { await db.execute(sql`begin`); });
  afterEach(async () => { await db.execute(sql`rollback`); });

  it('persists and retrieves an order', async () => {
    repo = new DrizzleOrderRepository(db);
    const saved = await repo.save(newOrder());
    const found = await repo.findById(saved.id);
    expect(found).toMatchObject({ id: saved.id, status: 'pending' });
  });
});
```

Run the real repository class against a real Postgres — never mock the
query builder here; that would defeat the entire purpose of a repository
test, which is to prove the SQL Drizzle generates actually does what the
port contract promises. Isolate each test with a transaction opened
before and rolled back after (or `TRUNCATE` between tests if the
transaction-per-test approach doesn't fit the schema/triggers involved).

## 6. Test database provisioning

```ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: StartedPostgreSqlContainer;

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16').start();
  pool = new Pool({ connectionString: container.getConnectionUri() });
  await migrate(drizzle(pool), { migrationsFolder: './drizzle' });
}, 60_000);

afterAll(async () => { await pool.end(); await container.stop(); });
```

Start the container **once per test suite** (not per test — that's slow
and unnecessary once transaction-per-test isolation is in place) and run
migrations before any test runs. This gives a hermetic, reproducible DB
in CI with no shared external Postgres instance to coordinate.

## 7. Runner: Jest default, Vitest note

Jest ships as the NestJS default (`@nestjs/testing` + `ts-jest`/SWC
transform, `jest-e2e.json` for the e2e project). ⚠️ Projects migrating to
Vitest can mostly swap `jest.fn()` → `vi.fn()` and `jest.Mocked<T>` →
equivalents, but must configure a decorator-aware transform (Vitest's
default esbuild transform does not enable
`experimentalDecorators`/`emitDecoratorMetadata` the way `ts-jest`/SWC
does) or DI metadata silently breaks. Default to Jest for new NestJS
projects in this plugin's guidance; only follow Vitest conventions where
the project has already completed that migration.

## 8. Suite separation

- Unit specs: `*.spec.ts`, colocated next to the source file they test,
  run via the default Jest project — fast, no I/O.
- e2e specs: `test/*.e2e-spec.ts`, run via a separate `jest-e2e.json`
  config — slower, real DB/HTTP server.
- Run e2e serially (`--runInBand`) or give each parallel worker its own
  isolated database (e.g. one Testcontainer per worker) — never point
  multiple parallel e2e workers at one shared mutable database.

## 9. Community-corroborated additions

**[community]**
- **`test-use-testing-module`** — the `Test.createTestingModule` shape
  above is directly corroborated, including testing guards via a mock
  `ExecutionContext` factory (`{ switchToHttp: () => ({ getRequest: () => req }) }`)
  rather than spinning up a full HTTP request just to exercise a guard's
  logic.
- **`test-e2e-supertest`** — corroborates the exact
  `Test.createTestingModule({ imports: [AppModule] })` →
  `createNestApplication()` → same global `ValidationPipe` → supertest
  shape in §3; its cleanup example uses TypeORM's
  `dataSource.synchronize(true)`, which does not apply here — use
  migrations + transaction rollback/truncate (§5/§6) for Drizzle instead.
- **`test-mock-external-services`** — never let a unit test hit a real
  third-party API or DB; mock the SDK client via a factory and cover
  realistic failure edges (timeout, e.g. `ETIMEDOUT`; rate-limit, e.g. a
  `429` response) in addition to the happy path. For time-dependent logic
  (token expiry, retry backoff, scheduled jobs), use
  `jest.useFakeTimers()` + `jest.setSystemTime(...)` rather than real
  `sleep()`s in tests, so time-based edge cases are deterministic and
  fast.

## Sources

- https://docs.nestjs.com/fundamentals/testing
- https://node.testcontainers.org/
- Corroborating reference only (not authoritative):
  https://github.com/Kadajett/agent-nestjs-skills
