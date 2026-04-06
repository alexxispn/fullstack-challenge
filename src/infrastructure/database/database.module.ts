import { Module } from '@nestjs/common';
import { Pool } from 'pg';

import { getDatabaseConfig } from './database.config';
import { DatabaseService } from './database.service';

@Module({
  providers: [
    {
      provide: DatabaseService,
      useFactory: () => new DatabaseService(new Pool(getDatabaseConfig())),
    },
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
