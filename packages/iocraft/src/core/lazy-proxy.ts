import { createFacadeObj } from './facade';
import { RootRegistry } from './internals';
import type { ServiceConstructor, ServiceMetadata } from './types';

export function createLazyProxy<T extends ServiceConstructor>(
  _serviceClass: T,
  serviceMeta: ServiceMetadata,
  useFacade: boolean
) {
  let resolved: any = null;

  return new Proxy(
    {},
    {
      get(_target, prop) {
        if (!resolved && RootRegistry.has(serviceMeta.token)) {
          const instance = RootRegistry.get(serviceMeta.token) as object;
          resolved = useFacade ? createFacadeObj(instance) : instance;
        }

        if (!resolved) {
          throw new Error('Accessed too early in constructor!');
        }

        const value = resolved[prop];
        return typeof value === 'function' ? value.bind(resolved) : value;
      },
    }
  ) as InstanceType<T>;
}
