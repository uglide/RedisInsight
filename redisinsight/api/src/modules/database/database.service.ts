import { Inject, Injectable } from '@nestjs/common';
import { Database } from 'src/modules/database/models/database';
import { IDatabaseProviderStrategy } from 'src/modules/database/database.provider.strategy.interface';
import { DatabaseProviderStrategy } from 'src/modules/database/constants';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(DatabaseProviderStrategy)
    private readonly databaseProvider: IDatabaseProviderStrategy,
  ) {}

  async get(id: string): Promise<Database> {
    return this.databaseProvider.get(id);
  }

  async list(): Promise<Database[]> {
    return this.databaseProvider.list();
  }
}
