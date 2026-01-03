import { getCurrentInstance, onUnmounted } from 'vue';
import { SERVICE_INTERNAL_METADATA } from './registry';
import { ImplementsUnmounted, type ServiceConfig, type ServiceConstructor, type ServiceWithUnmounted } from './types';

export function resolveInstance<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let config = (serviceClass as any)[SERVICE_INTERNAL_METADATA] as ServiceConfig;

  if (!config) {
    throw new Error('No Config Metadate Found, Make Sure To Use @Register() in Service Class');
  }

  let instance = new serviceClass();

  const componentInstance = getCurrentInstance();

  if (!componentInstance) {
    throw new Error('Resolve instace need to run inside setup()');
  }

  onUnmounted(() => {
    if (ImplementsUnmounted(instance)) {
      try {
        (instance as ServiceWithUnmounted<typeof instance>).onUnmounted();
      } catch (error) {
        console.error('Error in onUnmounted:', error);
      }
    }
    instance = null;
  });

  return instance as InstanceType<T>;
}
