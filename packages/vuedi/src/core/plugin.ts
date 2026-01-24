import { type FunctionPlugin } from 'vue';
import type { PluginOptions } from '../utils/core.types';
import { getServiceMeta, RootRegistry, TempRegistry } from '../utils/core.utils';
import { ReactiveFacade } from './facade';
import { RouterService } from '../helpers';

export const VuediPlugin: FunctionPlugin<[Partial<PluginOptions>?]> = (_app, options?: Partial<PluginOptions>) => {
  const facade = new ReactiveFacade();

  if (options?.router) {
    const routerProxy = new Proxy({} as RouterService, {
      get(_, prop) {
        const val = (options.router as any)[prop];
        return typeof val === 'function' ? val.bind(options.router) : val;
      },
    });
    RootRegistry.set(getServiceMeta(RouterService).token, routerProxy);
  }

  ///Eagerly create instances
  if (options?.EagerLoad) {
    options.EagerLoad.forEach(service => {
      const serviceMeta = getServiceMeta(service);

      if (!RootRegistry.has(serviceMeta.token)) {
        RootRegistry.set(serviceMeta.token, new service());
      }

      const instance = RootRegistry.get(serviceMeta.token)!;

      if (serviceMeta.facade) {
        if (!TempRegistry.has(serviceMeta.token)) {
          TempRegistry.set(serviceMeta.token, facade.createFacadeObj(service, instance));
        }
      }
    });
  }
};
