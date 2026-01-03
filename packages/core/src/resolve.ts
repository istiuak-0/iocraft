import { getCurrentInstance, onUnmounted } from 'vue';
import { SERVICE_INTERNAL_METADATA, serviceRegistry } from './registry';
import { ImplementsUnmounted, type ServiceConfig, type ServiceConstructor, type ServiceWithUnmounted } from './types';

export function resolve<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let config = (serviceClass as any)[SERVICE_INTERNAL_METADATA] as ServiceConfig;

  if (!config) {
    throw new Error('No Config Metadate Found, Make Sure To Use @Register() in Service Class');
  }

  /// For component Scoped Services (No nedd To Add This On Global Registry)
  if (config.in === 'component') {
    const componentInstance = getCurrentInstance();

    if (!componentInstance) {
      throw new Error('Component-scoped services must be resolved inside setup()');
    }

    let instance = new serviceClass();

    onUnmounted(() => {
      if (ImplementsUnmounted(instance)) {
        try {
          (instance as ServiceWithUnmounted<typeof instance>).onUnmounted();
        } catch (error) {
          console.error(`Error in onUnmounted:`, error);
        }
      }

      instance = null;
    });

    return instance as InstanceType<T>;
  }

  // For Root scoped Services
  if (serviceRegistry.has(serviceClass)) {
    return serviceRegistry.get(serviceClass) as InstanceType<T>;
  } else {
    const instance = new serviceClass();
    serviceRegistry.set(serviceClass, instance);
    return instance as InstanceType<T>;
  }
}
