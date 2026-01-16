import {
  addInstanceProperties,
  addInstanceSymbols,
  addPrototypeProperties,
  addStaticProperties,
  addStaticSymbols,
} from '../libs/live-access';
import { serviceRegistry } from '../libs/registry';
import { getServiceToken } from '../libs/service-token';
import type { ServiceConstructor } from '../libs/types';

/**
 * Resolves a global singleton service into a destructurable object with:
 * - Live getters for reactive state (ref, computed, etc.)
 * - Bound methods that preserve correct `this` context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function resolve<T extends ServiceConstructor>(serviceClass: T) {
  const serviceToken = getServiceToken(serviceClass);

  // Ensure singleton: create once, reuse forever
  if (!serviceRegistry.has(serviceToken)) {
    serviceRegistry.set(serviceToken, new serviceClass());
  }

  const instance = serviceRegistry.get(serviceToken)!;
  const obj: Record<string, any> = {};

  addStaticProperties(serviceClass, obj);
  addStaticSymbols(serviceClass, obj);

  addInstanceProperties(instance, obj);
  addInstanceSymbols(instance, obj);

  addPrototypeProperties(instance, obj);

  return obj as InstanceType<T>;
}
