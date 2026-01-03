import { SERVICE_INTERNAL_METADATA, serviceRegistry } from './registry';
import type { ServiceConfig, ServiceConstructor } from './types';

export function Register<C extends ServiceConfig>(config: C) {
  return function <T extends ServiceConstructor>(constructor: T) {
    (constructor as any)[SERVICE_INTERNAL_METADATA] = config;

    if (config.in === 'root' && config.eger) {
      serviceRegistry.set(constructor, new constructor());
    } else if (config.in === 'root') {
      serviceRegistry.set(constructor, null);
    }

    return constructor;
  };
}
