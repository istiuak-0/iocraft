import { SERVICE_INTERNAL_METADATA } from './registry';
import type { ServiceConstructor, ServiceMetadata } from './types';

export function getServiceToken(target: ServiceConstructor | object) {
  const ctor = typeof target === 'function' ? target : target.constructor;

  const meta = (ctor as any)[SERVICE_INTERNAL_METADATA] as ServiceMetadata;
  if (!meta?.token) {
    throw new Error(`[VUE DI]: ${ctor?.name || 'Unknown'} is not decorated with @Register()`);
  }
  return meta.token;
}
