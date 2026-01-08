import { SERVICE_INTERNAL_METADATA } from './registry';
import type { ServiceConstructor } from './types';

export function getServiceToken(target: ServiceConstructor | object): symbol {
  const ctor = typeof target === 'function' ? target : target.constructor;

  const meta = (ctor as any)[SERVICE_INTERNAL_METADATA];
  if (!meta?.token) {
    throw new Error(`[vuedi] ${ctor?.name || 'Unknown'} is not decorated with @Register()`);
  }
  return meta.token;
}
