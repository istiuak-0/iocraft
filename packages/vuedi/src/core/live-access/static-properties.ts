import { hasKey, type ServiceConstructor } from '../utils';

/**
 * Copies all own static members (including symbols) from a service class
 * to the target object, preserving correct context and reactivity.
 *
 * - Static methods → bound to the class
 * - Static accessors → wrapped with get/set that call original
 * - Static data properties → wrapped in reactive getter/setter
 *
 * Skips built-in statics like 'name', 'length', 'prototype'.
 *
 * @export
 * @template T
 * @param {ServiceConstructor<T>} serviceClass
 * @param {Record<PropertyKey, unknown>} targetObj
 */
export function addStaticProperties<T extends object>(
  serviceClass: ServiceConstructor<T>,
  targetObj: Record<PropertyKey, unknown>
) {
  const staticKeys = [...Object.getOwnPropertyNames(serviceClass), ...Object.getOwnPropertySymbols(serviceClass)];

  const BUILTIN_KEYS = new Set(['length', 'name', 'prototype']);

  for (const key of staticKeys) {
    if (typeof key === 'string' && BUILTIN_KEYS.has(key)) {
      continue;
    }
    if (hasKey(targetObj, key)) {
      continue;
    }

    const descriptor = Object.getOwnPropertyDescriptor(serviceClass, key)!;

    if (typeof descriptor.value === 'function') {
      targetObj[key] = descriptor.value.bind(serviceClass);
    } else if (descriptor.get || descriptor.set) {
      Object.defineProperty(targetObj, key, {
        get: descriptor.get ? () => descriptor.get!.call(serviceClass) : undefined,
        set: descriptor.set ? (v: any) => descriptor.set!.call(serviceClass, v) : undefined,
        enumerable: true,
        configurable: true,
      });
    } else {
      Object.defineProperty(targetObj, key, {
        get() {
          return serviceClass[key as keyof typeof serviceClass];
        },
        set(v) {
          (serviceClass[key as keyof typeof serviceClass] as unknown) = v;
        },
        enumerable: true,
        configurable: true,
      });
    }
  }
}
