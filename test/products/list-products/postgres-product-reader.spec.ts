import { join } from 'node:path';

import { Pool } from 'pg';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { PostgresProductReader } from '../../../src/products/list-products/postgres-product-reader';
import { DatabaseService } from '../../../src/shared/database/database.service';
import { readSqlFiles } from '../../../src/shared/database/scripts/shared';

describe('PostgresProductReader', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let reader: PostgresProductReader;

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
      join(__dirname, '../../../src/shared/database/migrations'),
    );
    for (const migration of migrations) {
      await pool.query(migration.sql);
    }

    const databaseService = new DatabaseService(pool);
    reader = new PostgresProductReader(databaseService);
  });

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE products RESTART IDENTITY');
  });

  interface InsertProductParams {
    name?: string;
    category?: string;
    price?: number;
    isActive?: boolean;
    stock?: number;
  }

  async function insertProduct(overrides: InsertProductParams = {}): Promise<void> {
    const { name = 'Default Product', category = 'rings', price = 100, isActive = true, stock = 10 } = overrides;
    await pool.query(
      'INSERT INTO products (name, category, price, is_active, stock) VALUES ($1, $2, $3, $4, $5)',
      [name, category, price, isActive, stock],
    );
  }

  it('returns products ordered by newest first', async () => {
    await insertProduct({ name: 'Older' });
    await insertProduct({ name: 'Newer' });

    const results = await reader.findAll({ activeOnly: false });
    const names = results.map((p) => p.toPrimitives().name);

    expect(names).toEqual(['Newer', 'Older']);
  });

  it('filters active products only', async () => {
    await insertProduct({ name: 'Active', isActive: true });
    await insertProduct({ name: 'Inactive', isActive: false });

    const results = await reader.findAll({ activeOnly: true });
    const names = results.map((p) => p.toPrimitives().name);

    expect(names).toEqual(['Active']);
  });

  it('filters by category case-insensitively', async () => {
    await insertProduct({ name: 'Ring', category: 'rings' });
    await insertProduct({ name: 'Necklace', category: 'necklaces' });

    const results = await reader.findAll({ activeOnly: false, category: 'RINGS' });
    const names = results.map((p) => p.toPrimitives().name);

    expect(names).toEqual(['Ring']);
  });

  it('filters by maxPrice inclusively', async () => {
    await insertProduct({ name: 'Cheap', price: 50 });
    await insertProduct({ name: 'Exact', price: 100 });
    await insertProduct({ name: 'Expensive', price: 150 });

    const results = await reader.findAll({ activeOnly: false, maxPrice: 100 });
    const names = results.map((p) => p.toPrimitives().name);

    expect(names).toEqual(['Exact', 'Cheap']);
  });

  it('combines all filters with AND', async () => {
    await insertProduct({ name: 'Match', category: 'rings', price: 80, isActive: true });
    await insertProduct({ name: 'Wrong category', category: 'necklaces', price: 80, isActive: true });
    await insertProduct({ name: 'Too expensive', category: 'rings', price: 200, isActive: true });
    await insertProduct({ name: 'Inactive', category: 'rings', price: 80, isActive: false });

    const results = await reader.findAll({
      activeOnly: true,
      category: 'rings',
      maxPrice: 100,
    });
    const names = results.map((p) => p.toPrimitives().name);

    expect(names).toEqual(['Match']);
  });
});
