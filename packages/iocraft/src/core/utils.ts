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

/**
 * Check if a service is registered
 */
// export function HasService(serviceClass: ServiceConstructor){}
// export function HasService(token: symbol | string){}

/**
 * Get the token for a service class
 */
// export function GetToken(serviceClass: ServiceConstructor){

// }

/**
 * Check if an object is a facade
 */
// export function IsFacade(instance: object){

// }

/**
 * Get the original instance from a facade
 * Returns the same object if not a facade
 */
// export function GetOriginalInstance<T>(facade: T){

// }

/**
 * Get all registered services (debugging)
 */

// export function GetAllServices(): Array<{
//   token: symbol | string;
//   serviceClass?: ServiceConstructor;
//   isFacade: boolean;
//   isInstantiated: boolean;
// }>{

// }

/**
 * Get instance count (memory debugging)
 */
// export function GetInstanceCount(){}

/**
 * Check if service is instantiated (lazy loading check)
 */
// export function IsInstantiated(serviceClass: ServiceConstructor){}

/**
 * Unregister a service and dispose instance
 * Use case: Module hot-reload, testing, cleanup
 */
// export function UnregisterService(serviceClass: ServiceConstructor){}

/**
 * Clear all services from a specific registry
 * Use case: Testing, reset app state
 */
// export function ClearRegistry(scope?: 'root' | 'temp' | 'all'){}

/**
 * Dispose a specific service instance
 * Calls onDispose hooks if registered
 */
// export function DisposeService(serviceClass: ServiceConstructor){}

/**
 * Manually trigger disposal for all services
 * Use case: App shutdown, testing cleanup
 */
// export function DisposeAll(){}

/**
 * Reset a singleton to force re-instantiation
 * Use case: Testing, state reset
 */
// export function ResetService(serviceClass: ServiceConstructor){}
