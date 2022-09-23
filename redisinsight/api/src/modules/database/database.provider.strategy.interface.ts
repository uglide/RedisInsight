import { Database } from 'src/modules/database/models/database';

export interface IDatabaseProviderStrategy {
  get(id: string): Promise<Database>
  list(): Promise<Database[]>
}
