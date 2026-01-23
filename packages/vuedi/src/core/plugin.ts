import { inject, type FunctionPlugin } from 'vue';
import type { PluginOptions } from '../utils/core.types';
import { getServiceMeta, RootRegistry, SERVICE_METADATA, TempRegistry } from '../utils/core.utils';
import { ReactiveFacade } from './facade';
import { routeLocationKey, routerKey } from 'vue-router';
import { Router } from '../router/Router';

const RouterToken = Symbol('[VUE DI]: vue router instance');
const RouteToken = Symbol('[VUE DI]: vue route');

export const VuediPlugin: FunctionPlugin<[Partial<PluginOptions>?]> = (app, options?: Partial<PluginOptions>) => {
  const facade = new ReactiveFacade();
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
  app.runWithContext(() => {
    const router = inject(routerKey);
    const route = inject(routeLocationKey);

if (route && router) {
  
      const routerServiceInstance = new Router(router, route);
      const meta = (Router as any)[SERVICE_METADATA];
      RootRegistry.set(meta.token, routerServiceInstance);

}




  });
};
