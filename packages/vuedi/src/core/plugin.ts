import type { FunctionPlugin } from 'vue';
import type { PluginOptions } from '../utils/core.types';
import { getServiceMeta, RootRegistry } from '../utils/core.utils';

export const VuediPlugin: FunctionPlugin<[Partial<PluginOptions>?]> = (_app, options?: Partial<PluginOptions>) => {
  ///Eagerly create instances
  if (options?.EagerLoad) {
    options.EagerLoad.forEach(service => {
      const serviceMeta = getServiceMeta(service);

      const serviceInstance = RootRegistry.has(serviceMeta.token);
      if (!serviceInstance) {
        RootRegistry.set(serviceMeta.token, new service());
      }
    });
  }
};
