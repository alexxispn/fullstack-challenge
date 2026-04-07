import 'dotenv/config';

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Pool, PoolClient } from 'pg';

import { getDatabaseConfig } from '../database.config';

export async function createPool(): Promise<Pool> {
  const pool = new Pool(getDatabaseConfig());
  await pool.query('SELECT 1');
  return pool;
}

export async function readSqlFiles(directory: string): Promise<Array<{ name: string; sql: string }>> {
  const entries = await readdir(directory);
  const sqlFiles = entries.filter((entry) => entry.endsWith('.sql')).sort();

  return Promise.all(
    sqlFiles.map(async (name) => ({
      name,
      sql: await readFile(join(directory, name), 'utf8'),
    })),
  );
}

export async function withTransaction(pool: Pool, fn: (client: PoolClient) => Promise<void>): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await fn(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
