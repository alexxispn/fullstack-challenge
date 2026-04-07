# Solution

## What I Changed

### 1. Bug fix: `activeOnly` default

The `GET /products` endpoint returned all products (active + inactive) by default. Changed the default from `false` to `true` in the controller so it returns only active products, matching the intended behavior described in the README.

### 2. Runtime fix: tsx to ts-node

Discovered that `tsx` (esbuild) does not emit decorator metadata, which caused `class-validator` and `class-transformer` to silently skip all DTO validation at runtime. Replaced `tsx` with `ts-node` in `start:api` and `dev:api` scripts. Tests were not affected because `ts-jest` compiles with `tsc`.

### 3. Filters: `category` and `maxPrice`

Added optional query parameters to `GET /products`:

- `category` — exact match, case-insensitive (`LOWER(category) = LOWER($N)`)
- `maxPrice` — inclusive upper bound (`price <= $N`)
- Filters combine with AND
- Invalid `maxPrice` returns 400 Bad Request

Changes span: DTO validation, domain criteria type, controller wiring, and repository WHERE clauses. The use case required no changes (pass-through). The frontend already sent these parameters.

### 4. New field: `stock` (end-to-end)

Added `stock` (`integer`, required, min 0) across all layers:

- **Migration** (`002_add_stock_to_products.sql`): `ALTER TABLE` with `DEFAULT 0` for existing rows
- **Seed data**: varied stock values for active products, 0 for inactive
- **Domain**: added to `Product` and `CreateProduct` interfaces
- **DTO**: `@IsInt() @Min(0)` validation on `CreateProductRequestDto`
- **Repository**: added to `SELECT`, `INSERT`, `ProductRow`, and `mapProductRow`
- **Frontend**: already implemented (table shows `stock ?? 'N/A'`)

## How I Validated

Used **Outside-In TDD** throughout:

1. Write a failing acceptance test (RED)
2. Implement from the outermost layer inward (GREEN)
3. Refactor if needed

All tests run through the controller's public interface with a `FakeProductsRepository` injected via NestJS's `overrideProvider` — exercising real validation, transformation, and wiring without a database.

```
npm test

  GET /products
    ✓ returns active products by default, newest first
    ✓ returns inactive products too when activeOnly=false
    ✓ returns products with stock field
    ✓ filters by category and maxPrice combined
    ✓ returns empty array when no products match filters
    ✓ rejects non-numeric maxPrice with 400
  POST /products
    ✓ rejects negative stock with 400
    ✓ creates a product with stock and returns it

  8 passed
```

Baby-step commits follow the TDD cycle — each `test(red):` commit contains failing tests, followed by a `feat:` commit that makes them pass.

## What I Would Improve With More Time

- **Integration tests with Testcontainers**: the current tests use a fake repository. Adding tests against a real PostgreSQL instance would verify that the SQL queries and migrations work correctly end-to-end.

- **Product as an aggregate root**: replace the anemic `Product` interface with a class that encapsulates invariants (e.g., `Product.create(...)` validating price >= 0, non-empty name) instead of relying solely on DTO validation at the infrastructure layer.

- **Domain errors**: introduce typed errors like `InvalidPriceError` or `ProductNotFoundError` with centralized HTTP mapping, rather than depending entirely on NestJS's `ValidationPipe`.

- **Vertical slice architecture**: reorganize from horizontal layers (`domain/`, `application/`, `adapters/`) to vertical bounded contexts (`products/{domain,application,adapters}`). With a single module the difference is negligible, but it scales better.

- **Category as a constrained type**: validate `category` against a known set of values (enum or database lookup) instead of accepting any free-text string.

- **Cursor-based pagination and advanced querying**: `ListProductsCriteria` would grow to support `cursor`/`limit` (not offset — offset is O(n) in Postgres), multi-field sorting with a whitelist of allowed columns, and full-text search via `tsvector`/GIN index. The hexagonal architecture makes this straightforward: the domain criteria type grows, the use case stays pass-through, and all complexity lands in the repository SQL and the DTO validation.

## AI Tools Used

**Claude Code** (Anthropic's CLI agent) was used as a pair programming partner throughout the exercise:

- **Codebase analysis**: initial reconnaissance of architecture, dependencies, and the seeded bug
- **Design decisions**: structured interview (grill-me) before each task to close ambiguities — filter semantics, validation strategy, test scope
- **TDD workflow**: writing tests first, then implementing layer by layer with review at each step
- **Code generation**: supervised generation of DTOs, repository queries, test fixtures, and migrations
- **Commit management**: baby-step commits reflecting the RED/GREEN TDD cycle

All code was reviewed and approved before committing. Architectural decisions and trade-offs were discussed explicitly before implementation.

---

## Extended Solution (`extended-solution` branch)

This branch builds on `main` to implement improvements identified in the "What I Would Improve" section above. The goal is to demonstrate architectural depth beyond the exercise requirements.

### What was implemented and why

#### 1. Rich domain model with Value Objects

**Problem:** The domain was anemic — `Product` and `CreateProduct` were plain interfaces with zero behavior. All validation lived in NestJS DTOs (`class-validator`), meaning domain invariants were only enforced at the HTTP boundary. If a product were created from a message queue or CLI, invalid state would slip through unchecked.

**Solution:**

- **Product aggregate root** with two factory methods: `Product.create(command)` validates invariants at creation, `Product.fromPersistence(primitives)` reconstitutes from the database. `toPrimitives()` serializes to a flat object for controllers.
- **4 Value Objects** — `Price` (>= 0, max 2 decimals), `Stock` (non-negative integer), `Category` (closed enum: rings, necklaces, bracelets, earrings, case-insensitive), `ProductName` (non-empty, trims whitespace).
- **Typed domain errors** — `DomainError` base class with subclasses (`InvalidPriceError`, `InvalidStockError`, `InvalidCategoryError`, `InvalidProductNameError`). A global `DomainErrorFilter` maps any `DomainError` to 400 Bad Request.
- **`CreateProductCommand`** — primitive-based input type. The use case calls `Product.create(command)` which validates and wraps inputs in VOs internally.
- **Use cases gain real logic** — `CreateProductUseCase` orchestrates `Product.create()` + repository persistence. Both use cases return `ProductPrimitives`, so the controller never imports the `Product` class.

DTO validation is kept alongside domain validation as defense in depth: DTOs validate HTTP shape at the boundary, VOs validate business invariants in the domain.

**Testing approach:** Sociable tests through the aggregate's public interface. All Value Object edge cases (negative price, >2 decimals, unknown category, empty name, etc.) are tested via `Product.create()`, not by testing each VO class individually. This keeps tests decoupled from the internal structure — if we refactor or remove a VO, the tests survive as long as the aggregate's behavior is preserved.

#### 2. Testcontainers integration tests

**Problem:** All existing tests used a `FakeProductsRepository` that simulates filtering in JavaScript. Nobody verified that the actual SQL works against Postgres — `LOWER()` for case-insensitive matching, `NUMERIC` → `Number()` coercion, `RETURNING` with auto-generated columns, `ORDER BY created_at DESC` on real timestamps.

**Solution:**

- **7 integration tests** run `PostgresProductRepository` against a real PostgreSQL 16 container:
  - `create`: INSERT + RETURNING with auto-generated id/createdAt, decimal precision for NUMERIC
  - `findAll`: ordering, `activeOnly` filter, case-insensitive category, inclusive `maxPrice`, combined AND semantics
- **Explicit dependency injection** — refactored `DatabaseService` to receive a `Pool` as a constructor argument instead of creating its own from env vars. `DatabaseModule` provides it via `useFactory` in production; tests inject the container's pool directly. No `@Optional()` hacks.
- **Isolated test infrastructure** — `jest.integration.config.ts` with 60s timeout. `npm run test:integration` runs only integration tests; `npm test` excludes them for fast feedback.
- **Per-test isolation** — one container per spec file, migrations applied from SQL files, `TRUNCATE` between tests. Each test creates its own data via `repo.create()`.

#### 3. Test doubles refactor (Interface Segregation + hand-crafted doubles)

**Problem:** The controller tests used a `FakeProductsRepository` that replicated filtering and sorting logic in JavaScript — a "smart double" anti-pattern. This double was shared across all tests and had no contract tests to guarantee it behaved like the real implementation.

**Solution:**

- **Interface Segregation on the repository port** — split `ProductRepositoryPort` into `ProductReader` (findAll) and `ProductWriter` (create), with a composite type alias `ProductRepository = ProductReader & ProductWriter`. Each use case now depends only on the interface it needs.
- **Use case unit tests with hand-crafted doubles:**
  - `ProductsInCatalog` — configurable stub implementing `ProductReader`. Returns whatever products it receives in the constructor. Zero filtering/sorting logic.
  - `ProductCatalogSpy` — spy implementing `ProductWriter`. Records the product passed to `create()` and exposes `savedProduct()` for post-execution assertions.
- **Simplified controller tests** — removed the 4 tests that verified filtering behavior (already covered by integration tests). Kept only the tests that verify NestJS wiring: DTO validation (400 on invalid input) and response shape. The smart Fake was replaced with simple stubs (`ProductsInCatalog`, `PersistingProductCatalog`).
- **Naming convention:** stubs get semantic domain names (describe the scenario), spies keep an explicit `Spy` suffix (honest about their observation role).

#### 4. Object Mothers and shared test infrastructure

**Problem:** Product creation was duplicated across 4 test files — identical `Product.fromPersistence({...})` calls with the same values (`aRing`, `aNecklace`), and identical `validCommand` objects. Test doubles (`ProductsInCatalog`, `ProductCatalogSpy`) were copy-pasted between files. Any change to `Product`'s constructor would require touching every test file.

**Solution:**

- **`ProductExamples`** — Object Mother with semantic methods (`aRing()`, `aNecklace()`, `anEarring()`) returning persisted products. Each method is a named, prototypical example that could be used in business discussions.
- **`CreateProductExamples`** — Object Mother for creation commands (`auroraRing()`). Separated from `ProductExamples` because commands and persisted products represent different lifecycle stages.
- **Shared test doubles** — `ProductsInCatalog` (stub), `ProductCatalogSpy` (spy), and `PersistingProductCatalog` (stub) extracted to `test/test-doubles/`. These doubles are inert (no conditional logic), which makes sharing safe. The signal to duplicate would be if someone adds test-specific logic inside a double.
- **Design decision:** kept `ProductExamples` as a single class rather than splitting by criteria (status, category). With one domain object the split is premature, but the structure supports it — adding `ProductByStatusExamples` later won't affect existing consumers.

### Test summary

```
npm test                    → 28 unit tests     (0.9s, no Docker)
npm run test:integration    → 7 integration tests (4s + container startup)
```

```
  Product  (sociable domain tests — no doubles)
    create
      ✓ creates a product with valid inputs
      ✓ accepts zero price
      ✓ accepts price with 2 decimal places
      ✓ rejects negative price
      ✓ rejects price with more than 2 decimal places
      ✓ accepts zero stock
      ✓ rejects negative stock
      ✓ rejects non-integer stock
      ✓ accepts valid category: rings / necklaces / bracelets / earrings
      ✓ rejects unknown category
      ✓ normalizes category to lowercase
      ✓ rejects empty name
      ✓ rejects whitespace-only name
      ✓ trims name whitespace
    fromPersistence
      ✓ reconstitutes a product from primitives

  ListProductsUseCase  (ProductsInCatalog stub)
    ✓ returns product primitives from the catalog
    ✓ returns empty list when catalog is empty

  CreateProductUseCase  (ProductCatalogSpy)
    ✓ saves the product and returns primitives with id
    ✓ passes the domain product to the writer
    ✓ rejects invalid price before reaching the writer
    ✓ rejects invalid stock before reaching the writer

  GET /products  (isolated TestingModule — only ListProductsController)
    ✓ returns products with stock field
    ✓ rejects non-numeric maxPrice with 400

  POST /products  (isolated TestingModule — only CreateProductController)
    ✓ rejects negative stock with 400
    ✓ creates a product with stock and returns it

  PostgresProductWriter  (integration with Testcontainers)
    ✓ inserts a product and returns it with id and createdAt from Postgres
    ✓ preserves decimal precision for price

  PostgresProductReader  (integration with Testcontainers — raw SQL arrange)
    ✓ returns products ordered by newest first
    ✓ filters active products only
    ✓ filters by category case-insensitively
    ✓ filters by maxPrice inclusively
    ✓ combines all filters with AND

  35 passed
```

#### 5. Code smell remediation

Ran a systematic analysis against the Jerzyk catalog (56 smells, 10 categories). Out of ~40 candidates, 7 were real findings after filtering false positives (e.g., "Primitive Obsession" on DTOs is wrong — DTOs *should* use primitives at the HTTP boundary). Key fixes applied:

- **Declarative query builder** — replaced imperative `push()`-based SQL construction with `{ applies, clause, value }[]` + filter/map, making clause-value relationships explicit
- **`@TransformBoolean()` decorator** — extracted `class-transformer`'s string-to-boolean workaround into a reusable decorator
- **`withTransaction()` helper** — centralized BEGIN/COMMIT/ROLLBACK lifecycle for migration scripts
- **Named constant** — `CENTS_PER_UNIT` replaces magic `100` in Price validation

#### 6. Vertical Slice Architecture

**Problem:** The codebase was organized by technical layer: `domain/`, `application/`, `adapters/`, `infrastructure/`, `ports/`. Modifying a single feature (e.g., "list products") required navigating 5 directories. The first level of folders described the architecture pattern (Hexagonal), not what the application does — failing the *Screaming Architecture* test.

**Solution:**

Reorganized from horizontal layers to vertical feature slices. Each feature is a self-contained folder with its own controller, DTO, use case, port, and persistence adapter:

```
src/
├── products/                              ← Bounded context
│   ├── products.module.ts                 ← DI wiring
│   ├── domain/                            ← Shared aggregate, VOs, errors
│   ├── list-products/                     ← Feature: GET /products
│   │   ├── list-products.controller.ts
│   │   ├── list-products-query.dto.ts
│   │   ├── list-products.use-case.ts
│   │   ├── product-reader.port.ts
│   │   └── postgres-product-reader.ts
│   └── create-product/                    ← Feature: POST /products
│       ├── create-product.controller.ts
│       ├── create-product-request.dto.ts
│       ├── create-product.use-case.ts
│       ├── product-writer.port.ts
│       └── postgres-product-writer.ts
└── shared/                                ← Cross-cutting (database, filters)
```

Key structural decisions:

- **Split `PostgresProductRepository` into `PostgresProductReader` + `PostgresProductWriter`** — the most valuable change. The ISP ports (`ProductReader`/`ProductWriter`) already existed, but the implementation was a single class. Now the separation is real top-to-bottom, enabling CQRS-lite: reads can optimize SQL independently of writes. Each port lives inside the feature that owns it.
- **Split `ProductsController` into per-feature controllers** — `ListProductsController` and `CreateProductController`, each with a single endpoint. Eliminates the multi-concern controller. Both use `@Controller('products')` so the route prefix stays the same.
- **Shared domain stays at module level** — `products/domain/` contains the `Product` aggregate, value objects, and errors. Both features import from here, which is correct: it's bounded-context cohesion, not cross-feature coupling.
- **Zero cross-feature imports** — `list-products/` never imports from `create-product/` and vice versa. This is enforced by design: each feature owns its port interface.

**Test structure mirrors the source:**

```
test/
├── products/
│   ├── domain/product.spec.ts
│   ├── list-products/
│   │   ├── list-products.use-case.spec.ts
│   │   ├── list-products.controller.spec.ts
│   │   └── postgres-product-reader.spec.ts
│   └── create-product/
│       ├── create-product.use-case.spec.ts
│       ├── create-product.controller.spec.ts
│       └── postgres-product-writer.spec.ts
├── object-mothers/
└── test-doubles/
```

- **Controller tests use isolated `TestingModule`s** — each registers only its controller and use case, not the full `AppModule`. Faster startup, no cross-feature interference.
- **Integration tests are self-contained per feature** — `postgres-product-reader.spec.ts` arranges data with raw SQL `INSERT` (no `ProductWriter` dependency), while `postgres-product-writer.spec.ts` validates via SQL `RETURNING`. Neither test crosses the feature boundary, even in test setup.
- **Unit vs integration discrimination by naming convention** — `postgres-*.spec.ts` files are matched by `jest.integration.config.ts` and excluded from `jest.config.ts`. Co-location with the feature removes the need for a separate `test/integration/` directory.

**Migration approach:** Pure structure refactoring — no behavior changes. All 28 unit tests pass throughout. The migration was atomic: create new structure, update imports, verify tests green, delete old directories. Git detected renames correctly, preserving file history.

### What would still improve with more time

- **CQS on CreateProductUseCase**: currently the command returns `ProductPrimitives`, violating Command-Query Separation. Strict CQS would have it return `void` (or just the id), requiring either domain-generated UUIDs or a separate query after creation.
- **Cursor-based pagination**: `cursor`/`limit` instead of offset, multi-field sorting with a whitelist of allowed columns
- **Domain events**: `ProductCreated` events for side effects (notifications, audit logging, inventory sync)
