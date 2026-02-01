import type { ServiceConstructor, ServiceMetadata, ServiceOptions } from "./core";
import { SERVICE_METADATA } from "./internals";


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
      token: Symbol(`[IOCRAFT]: Service - ${constructor.name || 'Anonymous'}`),
      facade: options?.facade ?? true,
    } satisfies ServiceMetadata;

    return constructor;
  };
}

