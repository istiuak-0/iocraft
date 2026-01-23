import type { FunctionPlugin } from 'vue';
import { getServiceToken, serviceRegistry, type VueDIOptions } from './utils';

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
