import { type FunctionPlugin } from 'vue';
import { Nav } from '../common/nav';
import { generateRouterFacade } from './facade';
import { RootRegistry } from './internals';
import type { PluginOptions } from './types';
import { getServiceMetadata } from './utils';

export const iocraft: FunctionPlugin<[Partial<PluginOptions>?]> = (_app, options?: Partial<PluginOptions>) => {
  if (options?.router) {
    RootRegistry.set(getServiceMetadata(Nav).token, generateRouterFacade(options.router));
  }

  // Eagerly create Service instances
  if (options?.eagerLoad) {
    options.eagerLoad.forEach(service => {
      const serviceMeta = getServiceMetadata(service);

      if (!RootRegistry.has(serviceMeta.token)) {
        RootRegistry.set(serviceMeta.token, new service());
      }
    });
  }
};
