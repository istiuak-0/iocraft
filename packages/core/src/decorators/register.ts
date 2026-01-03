import { SERVICE_INTERNAL_METADATA } from '../libs/registry';
import type { ServiceConfig, ServiceConstructor } from '../libs/types';

export function Register<T extends ServiceConfig>(config: T) {
  return function <C extends ServiceConstructor>(constructor: C) {
    (constructor as any)[SERVICE_INTERNAL_METADATA] = config;
    return constructor;
  };
}
