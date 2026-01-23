import type { ServiceConstructor, ServiceMetadata, ServiceOptions } from '../utils/core.types';
import { SERVICE_METADATA } from '../utils/core.utils';

export function Service(options?: ServiceOptions) {
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
