import type { FunctionPlugin } from 'vue';
import { serviceRegistry } from '../libs/registry';
import type { ServiceConstructor } from '../libs/types';
import { getServiceToken } from '../libs/service-token';

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
