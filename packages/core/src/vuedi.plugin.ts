import type { FunctionPlugin } from 'vue';
import { serviceRegistry } from './libs/registry';
import { getServiceToken } from './libs/service-token';
import type { ServiceConstructor } from './libs/types';

type VueDIOptions = {
  services: ServiceConstructor[];
};

export const vuediPlugin: FunctionPlugin<[Partial<VueDIOptions>?]> = (_app, options?: Partial<VueDIOptions>) => {
  ///Eagerly create instances
  if (options?.services) {
    options.services.forEach(item => {
      const serviceToken = getServiceToken(item);

      const serviceInstance = serviceRegistry.has(serviceToken);
      if (!serviceInstance) {
        serviceRegistry.set(serviceToken, new item());
      }
    });
  }
};
