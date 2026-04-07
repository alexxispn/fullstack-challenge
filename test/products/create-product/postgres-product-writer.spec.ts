import { join } from 'node:path';

import { Pool } from 'pg';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';

import { PostgresProductWriter } from '../../../src/products/create-product/postgres-product-writer';
import { Product } from '../../../src/products/domain/product';
import { DatabaseService } from '../../../src/shared/database/database.service';
import { readSqlFiles } from '../../../src/shared/database/scripts/shared';

describe('PostgresProductWriter', () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let writer: PostgresProductWriter;

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
    writer = new PostgresProductWriter(databaseService);
  });

  afterAll(async () => {
    await pool.end();
    await container.stop();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE TABLE products RESTART IDENTITY');
  });

  it('inserts a product and returns it with id and createdAt from Postgres', async () => {
    const product = Product.create({
      name: 'Aurora Ring',
      category: 'rings',
      price: 129,
      isActive: true,
      stock: 25,
    });

    const saved = await writer.create(product);
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
    const product = Product.create({
      name: 'Test Product',
      category: 'rings',
      price: 89.50,
      isActive: true,
      stock: 10,
    });

    const saved = await writer.create(product);

    expect(saved.toPrimitives().price).toBe(89.5);
  });
});
