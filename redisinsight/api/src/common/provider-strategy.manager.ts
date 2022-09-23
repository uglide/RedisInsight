import * as fs from 'fs';
import * as path from 'path';
import { ClassProvider, InjectionToken, InternalServerErrorException } from '@nestjs/common';
import { ExistingProvider, FactoryProvider, ValueProvider } from '@nestjs/common/interfaces/modules/provider.interface';

export class StrategyOptions {
  dirname: string;

  strategyName: string;
}

export type StrategyProvider<T = any> = ClassProvider<T> | ValueProvider<T> | FactoryProvider<T> | ExistingProvider<T>;

export class ProviderStrategyManager {
  registerProvider(provide: InjectionToken, opts: StrategyOptions): StrategyProvider<any> {
    return {
      ...this.getProvider(opts),
      provide,
    };
  }

  discoverStrategies(dirname): Record<string, StrategyProvider> {
    const files = fs.readdirSync(dirname);
    const strategies = {};

    files.forEach((file) => {
      try {
        // eslint-disable-next-line
        const { default: strategy } = require(path.join(dirname, file));

        // todo: validation
        if (strategy && strategy.strategy) {
          strategies[strategy.strategy] = strategy;
        }
      } catch (e) {
        // silently fail
      }
    });

    return strategies;
  }

  getProvider(opts: StrategyOptions): StrategyProvider {
    const strategies = this.discoverStrategies(opts.dirname);
    if (strategies[opts.strategyName]) {
      return strategies[opts.strategyName];
    }

    throw new InternalServerErrorException('No strategy - no problems');
  }
}

export const providerStrategyManager = new ProviderStrategyManager();
