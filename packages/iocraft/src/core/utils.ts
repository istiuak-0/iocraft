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


/**
 * Check if a service is present in registry
 *
 * @export
 * @param {ServiceConstructor} serviceClass 
 * @returns {*} 
 */
export function hasService(serviceClass: ServiceConstructor) {
  const meta = getServiceMetadata(serviceClass);
  return RootRegistry.has(meta.token);
}


/**
 * unRegister (remove) a service from registry
 *
 * @export
 * @param {ServiceConstructor} serviceClass 
 * @returns {*} 
 */
export function unRegister(serviceClass: ServiceConstructor) {
  const meta = getServiceMetadata(serviceClass);
  return RootRegistry.delete(meta.token)
}




/**
 * clear service registry
 *
 * @export
 */
export function clearRegistry() {
  RootRegistry.clear()
}