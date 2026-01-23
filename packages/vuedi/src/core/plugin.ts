import type { FunctionPlugin } from 'vue';
import { getServiceToken, serviceRegistry } from '../utils/core.utils';
import type { VueDIOptions } from '../utils/core.types';


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
