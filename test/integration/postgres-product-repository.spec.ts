import { join } from 'node:path';

import { Pool } from 'pg';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { PostgresProductRepository } from '../../src/adapters/outbound/persistence/postgres/postgres-product.repository';
import { Product } from '../../src/domain/products/product';
import { DatabaseService } from '../../src/infrastructure/database/database.service';
import { readSqlFiles } from '../../src/infrastructure/database/scripts/shared';

describe('PostgresProductRepository', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let repo: PostgresProductRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16-alpine').start();

    pool = new Pool({
      host: container.getHost(),
      port: container.getMappedPort(5432),
      database: container.getDatabase(),
      user: container.getUsername(),
      password: container.getPassword(),
    });

    const migrations = await readSqlFiles(
      join(__dirname, '../../src/infrastructure/database/migrations'),
    );
    for (const migration of migrations) {
      await pool.query(migration.sql);
    }

    const databaseService = new DatabaseService(pool);
    repo = new PostgresProductRepository(databaseService);
  });

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE products RESTART IDENTITY');
  });

  function createProduct(overrides: Partial<Parameters<typeof Product.create>[0]> = {}) {
    return repo.create(
      Product.create({
        name: 'Default Product',
        category: 'rings',
        price: 100,
        isActive: true,
        stock: 10,
        ...overrides,
      }),
    );
  }

  describe('create', () => {
    it('inserts a product and returns it with id and createdAt from Postgres', async () => {
      const saved = await createProduct({
        name: 'Aurora Ring',
        category: 'rings',
        price: 129,
        stock: 25,
      });
      const primitives = saved.toPrimitives();

      expect(primitives).toEqual(
        expect.objectContaining({
          name: 'Aurora Ring',
          category: 'rings',
          price: 129,
          isActive: true,
          stock: 25,
        }),
      );
      expect(primitives.id).toBeGreaterThan(0);
      expect(primitives.createdAt).toBeDefined();
    });

    it('preserves decimal precision for price', async () => {
      const saved = await createProduct({ price: 89.50 });

      expect(saved.toPrimitives().price).toBe(89.5);
    });
  });

  describe('findAll', () => {
    it('returns products ordered by newest first', async () => {
      await createProduct({ name: 'Older' });
      await createProduct({ name: 'Newer' });

      const results = await repo.findAll({ activeOnly: false });
      const names = results.map((p) => p.toPrimitives().name);

      expect(names).toEqual(['Newer', 'Older']);
    });

    it('filters active products only', async () => {
      await createProduct({ name: 'Active', isActive: true });
      await createProduct({ name: 'Inactive', isActive: false });

      const results = await repo.findAll({ activeOnly: true });
      const names = results.map((p) => p.toPrimitives().name);

      expect(names).toEqual(['Active']);
    });

    it('filters by category case-insensitively', async () => {
      await createProduct({ name: 'Ring', category: 'rings' });
      await createProduct({ name: 'Necklace', category: 'necklaces' });

      const results = await repo.findAll({ activeOnly: false, category: 'RINGS' });
      const names = results.map((p) => p.toPrimitives().name);

      expect(names).toEqual(['Ring']);
    });

    it('filters by maxPrice inclusively', async () => {
      await createProduct({ name: 'Cheap', price: 50 });
      await createProduct({ name: 'Exact', price: 100 });
      await createProduct({ name: 'Expensive', price: 150 });

      const results = await repo.findAll({ activeOnly: false, maxPrice: 100 });
      const names = results.map((p) => p.toPrimitives().name);

      expect(names).toEqual(['Exact', 'Cheap']);
    });

    it('combines all filters with AND', async () => {
      await createProduct({ name: 'Match', category: 'rings', price: 80, isActive: true });
      await createProduct({ name: 'Wrong category', category: 'necklaces', price: 80, isActive: true });
      await createProduct({ name: 'Too expensive', category: 'rings', price: 200, isActive: true });
      await createProduct({ name: 'Inactive', category: 'rings', price: 80, isActive: false });

      const results = await repo.findAll({
        activeOnly: true,
        category: 'rings',
        maxPrice: 100,
      });
      const names = results.map((p) => p.toPrimitives().name);

      expect(names).toEqual(['Match']);
    });
  });
});
