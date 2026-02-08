import { RootRegistry, SERVICE_METADATA } from './internals';
import type { ServiceConstructor, ServiceMetadata } from './types';

/**
 * get service metadata
 *
 * @export
 * @param {(ServiceConstructor | object)} target
 * @returns {ServiceMetadata}
 */
export function getServiceMetadata(target: ServiceConstructor | object) {
  const ctor = typeof target === 'function' ? target : target.constructor;

  const meta = (ctor as any)[SERVICE_METADATA] as ServiceMetadata;
  if (!meta?.token) {
    throw new Error(`[IOCRAFT]: ${ctor?.name || 'Unknown'} is not decorated with @Register()`);
  }
  return meta;
}


export function HasService(serviceClass: ServiceConstructor) {
  const meta = getServiceMetadata(serviceClass);
  return RootRegistry.has(meta.token);
}

export function IsFacade(_serviceInstance: object) {}
