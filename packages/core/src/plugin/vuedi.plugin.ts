import type { FunctionPlugin } from 'vue';
import { serviceRegistry } from '../libs/registry';
import type { ServiceConstructor } from '../libs/types';


type VueDIOptions = {
  services: ServiceConstructor[];
};

export const vuedi: FunctionPlugin<[Partial<VueDIOptions>?]> = (_app, options?: Partial<VueDIOptions>) => {
  ///Eagerly create instances
  if (options?.services) {
    options.services.forEach(item => {
      const serviceInstance = serviceRegistry.has(item);
      if (!serviceInstance) {
        serviceRegistry.set(item, new item());
      }
    });
  }
};
