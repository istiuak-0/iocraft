import { getCurrentInstance, onUnmounted } from 'vue';
import { SERVICE_INTERNAL_METADATA, serviceRegistry } from './registry';
import type { ServiceConfig, ServiceConstructor } from './types';

function hasUnmounted(instance: unknown) {
  return typeof (instance as any).onUnmounted === 'function';
}

export function resolve<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let config = (serviceClass as any)[SERVICE_INTERNAL_METADATA] as ServiceConfig;

  /// For component Scoped Services
  if (config && config.in === 'component') {
    const componentInstance = getCurrentInstance();

    if (!componentInstance) {
      throw new Error('Component-scoped services must be resolved inside setup()');
    }

    let instance = new serviceClass();

    onUnmounted(() => {
      if (!instance) return;

      if (hasUnmounted(instance as any)) {
        try {
          (instance as { onUnmounted(): void }).onUnmounted();
        } catch (error) {
          console.error(`Error in onUnmounted:`, error);
        }
      }

      instance = null;
    });

    return instance as InstanceType<T>;
  }

  // For Root scoped Services
  let instance = serviceRegistry.get(serviceClass);
  if (instance === null) {
    instance = new serviceClass();
    serviceRegistry.set(serviceClass, instance);
  }

  if (!instance) {
    throw new Error(`Service ${serviceClass.name} not registered`);
  }

  return instance as InstanceType<T>;
}
