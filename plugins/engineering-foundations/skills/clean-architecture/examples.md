# Clean Architecture — good / bad examples

One ❌ Bad / ✅ Good pair per rule in [SKILL.md](SKILL.md). Paths and package
names below are **placeholders** (`@core/*` for the domain/application core,
`@app/*` for the outer application, `@shared/*` for the shared ports/contracts
package) — substitute the project's own layer names from its Stack Manifest
layer map. The Good column reflects the pattern to follow; the Bad column is
the violation to catch in review.

---

## 1. Dependencies point inward — the core stays pure (CRITICAL)

❌ **Bad** — the core fetches its own input and reads the DB itself:
```ts
// @core/src/review/run.ts
import { VcsClient } from 'some-vcs-sdk';   // I/O in the core
import { db } from '@app/db/client';        // and a back-edge to the outer app!

export async function runReview(input: { base: string; head: string }) {
  const diff = await new VcsClient().diff(input.base, input.head); // fetches, not given
  const prior = await db.query.reviews.findMany();                 // DB in the core
  // ...
}
```

✅ **Good** — the diff and provider are **inputs**; the only side effect is an injected port:
```ts
// @core/src/review/run.ts
export interface ReviewInput {
  systemPrompt: string;
  model: string;
  diff: UnifiedDiff;     // already parsed — an input, not fetched
  llm: LLMProvider;      // injected port; the ONLY side effect
}
export async function runReview(input: ReviewInput): Promise<Review> {
  const prompt = assemblePrompt(/* ... */);
  const res = await input.llm.completeStructured({ schema: ReviewSchema, /* ... */ });
  return groundFindings(res.data, input.diff); // pure
}
```
Whoever owns the I/O (the outer app, a CI runner) loads the diff and passes it in.

---

## 2. External systems only behind interfaces (CRITICAL)

❌ **Bad** — a service imports and constructs a concrete SDK adapter:
```ts
// @app/modules/reviews/service.ts
import { VendorLlmProvider } from '@app/adapters/llm/vendor-provider'; // concrete impl
export class ReviewService {
  private llm = new VendorLlmProvider(process.env.LLM_API_KEY!); // unmockable
}
```

✅ **Good** — depend on the `LLMProvider` port, resolved from the composition root:
```ts
// @app/modules/reviews/service.ts
import type { Container } from '@app/platform/container';
export class ReviewService {
  constructor(private container: Container) {}
  private async provider(): Promise<LLMProvider> {
    return this.container.llm('default'); // returns LLMProvider (a port)
  }
}
```
The port lives in `@shared/ports`; the only place that names the concrete
`VendorLlmProvider` class is the composition root.

---

## 3. Instantiate only in the composition root (HIGH)

❌ **Bad** — `new`-ing an adapter ad hoc inside a feature, bypassing overrides:
```ts
// @app/modules/repos/service.ts
import { VendorVcsClient } from '@app/adapters/vcs/vendor-client';
const vcs = new VendorVcsClient(token); // tests can't swap this
```

✅ **Good** — the composition root owns construction; tests inject overrides:
```ts
// @app/platform/container.ts
async vcs(): Promise<VcsClient> {
  if (this.overrides.vcs) return this.overrides.vcs;    // test seam
  const token = await this.secrets.get('VCS_TOKEN');
  if (!token) throw new ConfigError('VCS_TOKEN is not configured');
  return (this._vcs ??= new VendorVcsClient(token));
}

// in a test
const container = new Container(config, db, { vcs: new FakeVcsClient() });
```

---

## 4. All data access lives in repositories (CRITICAL)

❌ **Bad** — the ORM/query layer used inside a service (and a leaked query builder):
```ts
// @app/modules/reviews/service.ts
import { db } from '@app/db/client';
import * as t from '@app/db/schema';
import { eq } from 'some-orm';

async listReviews(prId: string) {
  return db.select().from(t.reviews).where(eq(t.reviews.prId, prId)); // ORM in service
}
// even worse — returning the builder so callers keep chaining it:
reviewsQuery() { return db.select().from(t.reviews); }
```

✅ **Good** — the query lives in the repository; the service calls a named method:
```ts
// @app/modules/reviews/repository/review.repo.ts
export async function reviewsForPull(db: Db, prId: string): Promise<ReviewRow[]> {
  return db.select().from(t.reviews)
    .where(eq(t.reviews.prId, prId))
    .orderBy(desc(t.reviews.createdAt));
}

// @app/modules/reviews/service.ts
async listReviews(prId: string) {
  return this.repo.reviewsForPull(prId); // returns domain rows, not a builder
}
```

---

## 5. Schema contracts are the single source of truth at boundaries (HIGH)

❌ **Bad** — an ad-hoc inline shape, then re-validating the same data deeper in:
```ts
// @app/modules/reviews/routes.ts
const body = req.body as { agentId?: string };          // unparsed, untyped trust
const targets = await service.resolveTargets(ws, body);
// ...and again inside the service:
if (typeof input.agentId !== 'string') throw new Error('bad'); // re-validation
```

✅ **Good** — parse once at the edge with a shared contract; inward code trusts the type:
```ts
// @app/modules/reviews/routes.ts
import { RunRequest } from '@shared/contracts';
const body = RunRequest.parse(req.body ?? {});           // parse, don't validate
const targets = await service.resolveTargets(workspaceId, body);
// service signature is typed from the contract — no re-checking inward
```
New contract? Add a **new definition** under `@shared/contracts` and export
it — never edit a generated/barrel file by hand.

---

## 6. Routes are a thin edge (HIGH)

❌ **Bad** — business logic, DB, and an adapter call all in the handler:
```ts
routes.post('/pulls/:id/review', async (req) => {
  const agents = await db.select().from(t.agents);           // DB in route
  const vcs = new VendorVcsClient(token);                    // adapter in route
  const enabled = agents.filter(a => a.enabled && a.model);  // logic in route
  // ...orchestrate the whole run here...
});
```

✅ **Good** — parse, delegate to one service call, return:
```ts
routes.post('/pulls/:id/review', async (req) => {
  const { workspaceId } = await getContext(container, req);
  const body = RunRequest.parse(req.body ?? {});
  const targets = await service.resolveTargets(workspaceId, body);
  const { runs, reviews } = await service.runReview(workspaceId, req.params.id, targets, req.log);
  return { pr_id: req.params.id, runs, reviews };
});
```
(Rate limiting, schema-validation wiring, and other transport-level concerns
are the web framework's own mechanics — see the project's stack-specific
skill for those. This rule only cares that the handler body stays thin.)

---

## 7. Respect facade boundaries (MEDIUM)

❌ **Bad** — deep-importing another subsystem's internal pipeline:
```ts
// @app/modules/reviews/run-executor.ts
import { buildRepoMap } from '@app/modules/repo-intel/pipeline/map-builder'; // internal!
const map = await buildRepoMap(repoId);
```

✅ **Good** — go through the published facade on the composition root:
```ts
// @app/modules/reviews/run-executor.ts
const intel = await this.container.repoIntel.getMapAndCallers(repoId); // facade
```
Same for shared entities: reach them via the composition root's facades
(e.g. `container.agentsRepo`), not a deep import into another module's
`repository/`.

---

## 8. Cross-package import direction (HIGH)

❌ **Bad** — the center importing an outer package (a back-edge / cycle):
```ts
// @core/src/review/run.ts
import { Container } from '@app/platform/container'; // core → outer app
```
```ts
// @shared/contracts/findings.ts
import { db } from '@app/db/client'; // shared must stay runtime-free
```

✅ **Good** — arrows point inward only:
```ts
// @core/src/review/run.ts
import type { LLMProvider, Review, UnifiedDiff } from '@shared/contracts'; // → center
```
Allowed: `outer app → core → @shared/contracts`, and `outer app →
@shared/contracts`. The shared package imports only its schema/validation
library and its own definitions.

---

## 9. Enforce the boundaries mechanically where possible — keep the check green (HIGH)

This rule is tool-agnostic: the *shape* of what to forbid matters, not which
linter enforces it. The table below is illustrative — translate it into
whatever the project's Stack Manifest names (dependency-cruiser,
eslint-plugin-boundaries, ArchUnit, import-linter, deptrac, or none, in which
case these stay review-time checks).

| Forbidden edge | Rule | Why |
|---|---|---|
| routes/services → ORM/query-layer package or raw schema/table definitions | 4 | DB access only through repositories |
| services/core → concrete adapter implementations | 2 | depend on ports, not concrete SDKs |
| any module → another module's internal pipeline/service/repository (bypassing its facade) | 7 | facades are the contract |
| core → outer app internals (except the shared contracts package) | 8 | keeps the core pure and shareable |
| shared contracts package → anything beyond its schema library and its own definitions | 8 | keeps the center dependency-free |
| core → filesystem/process/network built-ins, or a vendor SDK used outside its one sanctioned port implementation | 1 | keeps the core free of I/O |
| circular dependencies, except a narrowly-excluded, documented composition-root cycle | 9 | prevents unbounded coupling |

Wire whichever check applies into a script (e.g. `<package-manager> run
arch:check`) and gate it in CI — a new violation should fail the build, not
just print a warning. When a new boundary needs covering, extend the existing
configuration rather than starting a second, parallel one. Things that
resist mechanization — "business logic in a route" (rule 6), a stray global
network call in the core (rule 1) — stay a review-time judgment; a second,
in-editor linter is an optional faster feedback loop alongside CI, not a
replacement for it.
