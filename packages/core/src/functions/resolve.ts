import { SERVICE_INTERNAL_METADATA, serviceRegistry } from '../libs/registry';
import {
  type ServiceConfig,
  type ServiceConstructor,
} from '../libs/types';

/// this will only be used fro global services
export function resolve<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let config = (serviceClass as any)[SERVICE_INTERNAL_METADATA] as ServiceConfig;

  if (!config) {
    throw new Error('No Config Metadate Found, Make Sure To Use @Register() in global Service Classes');
  }

  if (serviceRegistry.has(serviceClass)) {
    return serviceRegistry.get(serviceClass) as InstanceType<T>;
  } else {
    const instance = new serviceClass();
    serviceRegistry.set(serviceClass, instance);
    return instance as InstanceType<T>;
  }
}
