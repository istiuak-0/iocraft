import { SERVICE_INTERNAL_METADATA, serviceRegistry } from '../libs/registry';
import { serviceToRefs } from '../libs/service-to-refs';
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

  return serviceToRefs(instance as object) as InstanceType<T>;
}
