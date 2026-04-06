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
