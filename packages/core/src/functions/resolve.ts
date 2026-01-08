import { serviceRegistry } from '../libs/registry';
import { getServiceRef } from '../libs/service-refs';
import { getServiceToken } from '../libs/service-token';
import { type ServiceConstructor, } from '../libs/types';

/// this will only be used fro global services
export function resolve<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  const serviceToken = getServiceToken(serviceClass);
  let instance: InstanceType<T>;

  if (serviceRegistry.has(serviceToken)) {
    instance = serviceRegistry.get(serviceToken) as InstanceType<T>;
  } else {
    instance = new serviceClass() as InstanceType<T>;
    serviceRegistry.set(serviceToken, instance);
  }

  return getServiceRef(instance);
}
