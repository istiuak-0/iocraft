import { SERVICE_INTERNAL_METADATA, serviceRegistry } from '../libs/registry';
import { type ServiceConfig, type ServiceConstructor } from '../libs/types';

/// this will only be used fro global services
export function resolve<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let config = (serviceClass as any)[SERVICE_INTERNAL_METADATA] as ServiceConfig;

  if (!config) {
    throw new Error('No Config Metadate Found, Make Sure To Use @Register() in global Service Classes');
  }

  let instance: InstanceType<T>;

  if (serviceRegistry.has(serviceClass)) {
    instance = serviceRegistry.get(serviceClass) as InstanceType<T>;
  } else {
    instance = new serviceClass() as InstanceType<T>;
    serviceRegistry.set(serviceClass, instance);
  }

  return new Proxy(instance as object, {
    get(target: any, prop: string | symbol) {
      const value = target[prop];
      if (typeof value === 'function') {
        return value.bind(target);
      }

      if (value && typeof value === 'object' && 'value' in value) {
        return value;
      }

      return value;
    },
  }) as InstanceType<T>;
}
