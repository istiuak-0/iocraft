import { SERVICE_INTERNAL_METADATA, serviceRegistry } from '../libs/registry';
import { getServiceRef } from '../libs/service-refs';
import { type ServiceConstructor, type ServiceMetadata } from '../libs/types';

/// this will only be used fro global services
export function resolve<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  const config = (serviceClass as any)[SERVICE_INTERNAL_METADATA] as ServiceMetadata;

  if (!config) {
    throw new Error('[VUE DI]: No Config Meta date Found, Make Sure To Use @Register() Service Classes');
  }

  const serviceToken = config.token;
  let instance: InstanceType<T>;

  if (serviceRegistry.has(serviceToken)) {
    instance = serviceRegistry.get(serviceToken) as InstanceType<T>;
  } else {
    instance = new serviceClass() as InstanceType<T>;
    serviceRegistry.set(serviceToken, instance);
  }

  return getServiceRef(instance);
}
