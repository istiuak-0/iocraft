import { inject, type FunctionPlugin } from 'vue';
import type { PluginOptions, ServiceMetadata } from '../utils/core.types';
import { getServiceMeta, RootRegistry, SERVICE_METADATA, TempRegistry } from '../utils/core.utils';
import { ReactiveFacade } from './facade';
import { routeLocationKey, routerKey } from 'vue-router';
import { RouterService, RouteService } from '../router';



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

  if (options?.router) {
    app.runWithContext(() => {
      const router = inject(routerKey);
      const route = inject(routeLocationKey);

      if (router && route) {
        (RouterService as any)[SERVICE_METADATA] = {
          facade: false,
          token: Symbol(`[VUE DI]: Service - ${RouterService.name || 'Anonymous'}`),
        } satisfies ServiceMetadata;

        (RouteService as any)[SERVICE_METADATA] = {
          facade: false,
          token: Symbol(`[VUE DI]: Service - ${RouteService.name || 'Anonymous'}`),
        } satisfies ServiceMetadata;

        const routerServiceInstance = new RouterService(router);
        const routeServiceInstance = new RouteService(route);

        RootRegistry.set(getServiceMeta(RouterService).token, routerServiceInstance);
        RootRegistry.set(getServiceMeta(RouteService).token, routeServiceInstance);
      }
    });
  }
};
