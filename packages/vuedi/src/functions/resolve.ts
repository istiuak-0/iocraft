import { addInstanceProperties } from '../libs/live-access/instance-properties';
import { addPrototypeProperties } from '../libs/live-access/prototype-properties';
import { addStaticProperties } from '../libs/live-access/static-properties';
import { getServiceToken, serviceRegistry, type ResolvedService, type ServiceConstructor } from '../libs/utils';



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
  addInstanceProperties(instance, obj);
  addPrototypeProperties(instance, obj);

  return obj as ResolvedService<T>;
}
