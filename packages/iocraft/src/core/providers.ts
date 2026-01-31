import type { ServiceConstructor, ServiceMetadata, ServiceOptions } from '../utils/core.types';
import { SERVICE_METADATA } from '../utils/core.utils';

/**
 * Registers A Class as Service
 *
 * @export
 * @param {?ServiceOptions} [options]
 * @returns {<C extends ServiceConstructor>(constructor: C) => C}
 */
export function Provide(options?: ServiceOptions): <C extends ServiceConstructor>(constructor: C) => C {
  return function <C extends ServiceConstructor>(constructor: C) {
    if ((constructor as any)[SERVICE_METADATA]?.token) {
      return constructor;
    }

    (constructor as any)[SERVICE_METADATA] = {
      token: Symbol(`[VUE DI]: Service - ${constructor.name || 'Anonymous'}`),
      facade: options?.facade ?? true,
    } satisfies ServiceMetadata;

    return constructor;
  };
}
