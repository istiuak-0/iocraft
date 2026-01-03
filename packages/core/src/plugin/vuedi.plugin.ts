import type { FunctionPlugin } from 'vue';
import { serviceRegistry } from '../libs/registry';
import { ImplementsUnmounted, type ServiceConstructor, type ServiceWithUnmounted } from '../libs/types';

type VueDIOptions = {
  services: ServiceConstructor[];
};

export const vuedi: FunctionPlugin<[Partial<VueDIOptions>?]> = (app, options?: Partial<VueDIOptions>) => {
  ///Eagerly create instances
  if (options?.services) {
    options.services.forEach(item => {
      const serviceInstance = serviceRegistry.has(item);
      if (!serviceInstance) {
        serviceRegistry.set(item, new item());
      }
    });
  }

  /// Run unmount hook for app scoped services
  app.onUnmount(() => {
    serviceRegistry.forEach((value, _key) => {
      if (ImplementsUnmounted(value)) {
        (value as ServiceWithUnmounted<typeof value>).onUnmounted();
      }
    });
  });
};
