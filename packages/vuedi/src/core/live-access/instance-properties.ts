import { hasKey, type ServiceConstructor } from '../utils';

/**
 * Copies all own instance properties (including symbols) from a service instance
 * to the target object as reactive getters/setters.
 *
 * - Skips methods (functions) — they should live on the prototype
 * - Skips accessors (getters/setters) — also handled via prototype
 * - Only wraps plain data properties (e.g., refs, state) in get/set accessors
 *
 * @export
 * @template {object} T
 * @param {InstanceType<ServiceConstructor<T>>} serviceInstance
 * @param {Record<PropertyKey, unknown>} targetObj
 */
export function addInstanceProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>
) {
  const ownKeys = [...Object.getOwnPropertyNames(serviceInstance), ...Object.getOwnPropertySymbols(serviceInstance)];

  for (const key of ownKeys) {
    if (hasKey(targetObj, key)) continue;

    const descriptor = Object.getOwnPropertyDescriptor(serviceInstance, key)!;

    if (typeof descriptor.value === 'function') {
      console.warn(`Instance method "${String(key)}" found as own property. Consider moving to prototype.`);
      continue;
    }

    if (descriptor.get || descriptor.set) {
      continue;
    }

    Object.defineProperty(targetObj, key, {
      get() {
        return serviceInstance[key as keyof typeof serviceInstance];
      },
      set(v) {
        serviceInstance[key as keyof typeof serviceInstance] = v;
      },
      enumerable: true,
      configurable: true,
    });
  }
}
