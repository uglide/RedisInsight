import { Module } from '@nestjs/common';
import { DatabaseController } from 'src/modules/database/database.controller';
import { DatabaseService } from 'src/modules/database/database.service';
import { providerStrategyManager } from 'src/common/provider-strategy.manager';
import * as path from 'path';
import { DatabaseProviderStrategy } from 'src/modules/database/constants';
import config from 'src/utils/config';

const STRATEGIES_CONFIG = config.get('strategies');

@Module({
  controllers: [
    DatabaseController,
  ],
  providers: [
    DatabaseService,
    providerStrategyManager.registerProvider(DatabaseProviderStrategy, {
      dirname: path.join(__dirname, 'providers'),
      strategyName: STRATEGIES_CONFIG.databaseProvider,
    }),
  ],
})
export class DatabaseModule {
  register() {
    return {
      module: DatabaseModule,
      controllers: [
        DatabaseController,
      ],
      providers: [
        DatabaseService,
      ],
    };
  }
}
