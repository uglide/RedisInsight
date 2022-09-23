import { Injectable, NotFoundException } from '@nestjs/common';
import { Database } from 'src/modules/database/models/database';
import { plainToClass } from 'class-transformer';
import { IDatabaseProviderStrategy } from 'src/modules/database/database.provider.strategy.interface';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileDatabaseProvider implements IDatabaseProviderStrategy {
  private file = path.join(process.cwd(), 'dbs.json');

  async get(id: string): Promise<Database> {
    const db = this.getDbsObject()[id];

    if (!db) {
      throw new NotFoundException('No db - no problems');
    }

    return plainToClass(Database, db);
  }

  async list(): Promise<Database[]> {
    return plainToClass(Database, Object.values(this.getDbsObject()));
  }

  private getDbsObject(): object {
    return JSON.parse(fs.readFileSync(this.file, 'utf8'));
  }
}

export default {
  strategy: 'FILE',
  useClass: FileDatabaseProvider,
};
