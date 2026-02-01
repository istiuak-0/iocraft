import type { ServiceConstructor, ServiceMetadata } from './core';
import { SERVICE_METADATA } from './internals';

/**
 * Get service metadata without instantiating
 *
 * @export
 * @param {(ServiceConstructor | object)} target
 * @returns {ServiceMetadata}
 */
export function GetServiceMetadata(target: ServiceConstructor | object): ServiceMetadata {
  const ctor = typeof target === 'function' ? target : target.constructor;

  const meta = (ctor as any)[SERVICE_METADATA] as ServiceMetadata;
  if (!meta?.token) {
    throw new Error(`[IOCRAFT]: ${ctor?.name || 'Unknown'} is not decorated with @Provide()`);
  }
  return meta;
}

