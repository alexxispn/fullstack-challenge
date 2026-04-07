import { join } from 'node:path';

import { createPool, readSqlFiles, withTransaction } from './shared';

async function runMigrations(): Promise<void> {
  const pool = await createPool();

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const appliedResult = await pool.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations',
    );
    const applied = new Set(appliedResult.rows.map((row) => row.filename));

    const files = await readSqlFiles(join(__dirname, '..', 'migrations'));

    for (const file of files) {
      if (applied.has(file.name)) {
        continue;
      }

      await withTransaction(pool, async (client) => {
        await client.query(file.sql);
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file.name]);
      });
      console.log(`Applied migration: ${file.name}`);
    }
  } finally {
    await pool.end();
  }
}

void runMigrations();
