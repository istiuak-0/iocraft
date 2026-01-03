import type { FunctionPlugin } from 'vue';
import { serviceRegistry } from './registry';
import { ImplementsUnmounted, type ServiceConstructor, type ServiceWithUnmounted } from './types';

type VueDIOptions = {
  services: ServiceConstructor[];
};

export const vuedi: FunctionPlugin<VueDIOptions> = (app, options) => {
  options.services.forEach(item => {
    const serviceInstance = serviceRegistry.has(item);
    if (!serviceInstance) {
      serviceRegistry.set(item, new item());
    }
  });

  app.onUnmount(() => {
    serviceRegistry.forEach((value,_key) => {
      if (ImplementsUnmounted(value)) {
        (value as ServiceWithUnmounted<typeof value>).onUnmounted();
      }
    });
  });
  
};
