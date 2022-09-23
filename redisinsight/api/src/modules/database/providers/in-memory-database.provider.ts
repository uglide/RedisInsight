import { ClassProvider, Injectable, NotFoundException } from '@nestjs/common';
import { Database } from 'src/modules/database/models/database';
import { plainToClass } from 'class-transformer';
import { IDatabaseProviderStrategy } from 'src/modules/database/database.provider.strategy.interface';

@Injectable()
export class InMemoryDatabaseProvider implements IDatabaseProviderStrategy {
  private DBS = {
    id1: {
      id: 'id1',
      name: 'db1',
      host: 'host1',
      port: 6379,
    },
    id2: {
      id: 'id2',
      name: 'db2',
      host: 'host2',
      port: 6379,
    },
  };

  async get(id: string): Promise<Database> {
    const db = this.DBS[id];

    if (!db) {
      throw new NotFoundException('No db - no problems');
    }

    return plainToClass(Database, this.DBS[id]);
  }

  async list(): Promise<Database[]> {
    return plainToClass(Database, Object.values(this.DBS));
  }
}

export default {
  strategy: 'IN_MEMORY',
  provide: InMemoryDatabaseProvider,
  useClass: InMemoryDatabaseProvider,
} as ClassProvider;
