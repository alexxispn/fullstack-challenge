import { join } from 'node:path';

import { createPool, readSqlFiles } from './shared';

async function runSeed(): Promise<void> {
  const pool = await createPool();
  const files = await readSqlFiles(join(__dirname, '..', 'seeds'));

  try {
    for (const file of files) {
      await pool.query(file.sql);
      console.log(`Applied seed: ${file.name}`);
    }
  } finally {
    await pool.end();
  }
}

void runSeed();
