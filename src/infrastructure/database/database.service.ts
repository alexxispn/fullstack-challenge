import { Injectable, OnModuleDestroy, Optional } from '@nestjs/common';
import { Pool, QueryResult, QueryResultRow } from 'pg';

import { getDatabaseConfig } from './database.config';

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor(@Optional() pool?: Pool) {
    this.pool = pool ?? new Pool(getDatabaseConfig());
  }

  query<T extends QueryResultRow = QueryResultRow>(
    text: string,
    values: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
