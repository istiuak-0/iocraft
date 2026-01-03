import type { FunctionPlugin } from 'vue';
import { serviceRegistry } from './registry';
import { ImplementsUnmounted, type ServiceConstructor, type ServiceWithUnmounted } from './types';

type VueDIOptions = {
  services: ServiceConstructor[];
};

export const vuedi: FunctionPlugin<[Partial<VueDIOptions>?]> = (app, options?: Partial<VueDIOptions>) => {
  
  ///Eagerly crete instances
  if (options?.services) {
    options.services.forEach(item => {
      const serviceInstance = serviceRegistry.has(item);
      if (!serviceInstance) {
        serviceRegistry.set(item, new item());
      }
    });
  }

  /// Run unmount hook for global hooks
  app.onUnmount(() => {
    serviceRegistry.forEach((value, _key) => {
      if (ImplementsUnmounted(value)) {
        (value as ServiceWithUnmounted<typeof value>).onUnmounted();
      }
    });
  });
};
