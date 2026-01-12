import type { ServiceConstructor } from './types';

/**
 * Checks if given key exist in that given object
 *
 * @param {*} obj
 * @param {(string | symbol)} key
 * @returns {boolean}
 */
function hasKey(obj: Record<PropertyKey, unknown>, key: PropertyKey): boolean {
  if (typeof key === 'symbol') {
    return Object.getOwnPropertySymbols(obj).includes(key);
  }
  return Object.hasOwn(obj, key);
}

/**
 * Copies static members (methods, accessors, and properties) from a service class
 * to the resolved object, preserving correct context and reactivity.
 *
 * @export
 * @template {object} T
 * @param {ServiceConstructor<T>} serviceClass
 * @param {Record<PropertyKey, unknown>} targetObj
 */
export function addStaticProperties<T extends object>(
  serviceClass: ServiceConstructor<T>,
  targetObj: Record<PropertyKey, unknown>
): void {
  const allStaticKeys = Object.getOwnPropertyNames(serviceClass);

  const userDefinedStaticKeys = allStaticKeys.filter(key => !['length', 'name', 'prototype'].includes(key));

  userDefinedStaticKeys.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(serviceClass, key)!;

    if (typeof descriptor.value === 'function') {
      targetObj[key] = descriptor.value.bind(serviceClass);
    } else if (descriptor.get || descriptor.set) {
      const newDesc: PropertyDescriptor = {
        enumerable: true,
        configurable: true,
      };

      if (descriptor.get) {
        newDesc.get = () => descriptor.get!.call(serviceClass);
      }

      if (descriptor.set) {
        newDesc.set = (value: any) => descriptor.set!.call(serviceClass, value);
      }

      Object.defineProperty(targetObj, key, newDesc);
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
  });
}

/**
 *  Copies All Prototype members (methods, accessors, and properties) from a object ( service instance )
 *  to the resolved object .
 *
 * @export
 * @template {object} T
 * @param {InstanceType<ServiceConstructor<T>>} serviceInstance
 * @param {Record<PropertyKey, unknown>} targetObj
 */
export function addPrototypeProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>
) {
  let currentProto = Object.getPrototypeOf(serviceInstance);

  /// Loop Over The Whole Prototype Chain To Get All inherited Properties
  while (currentProto && currentProto !== Object.prototype) {
    const protoKeys = Object.getOwnPropertyNames(currentProto);
    const filteredKeys = protoKeys.filter(key => key !== 'constructor');

    filteredKeys.forEach(key => {
      if (hasKey(targetObj, key)) return;

      const descriptor = Object.getOwnPropertyDescriptor(currentProto, key)!;

      if (descriptor.get || descriptor.set) {
        const newDesc: PropertyDescriptor = {
          enumerable: true,
          configurable: true,
        };

        if (descriptor.get) {
          newDesc.get = () => descriptor.get!.call(serviceInstance);
        }

        if (descriptor.set) {
          newDesc.set = (value: any) => descriptor.set!.call(serviceInstance, value);
        }

        Object.defineProperty(serviceInstance, key, newDesc);
      } else if (typeof descriptor.value === 'function') {
        serviceInstance[key as keyof typeof serviceInstance] = descriptor.value.bind(serviceInstance);
      } else {
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
    });

    currentProto = Object.getPrototypeOf(currentProto);
  }
}

/**
 *  Copies All object properties
 *  to the resolved object .
 *
 * @export
 * @template {object} T
 * @param {InstanceType<ServiceConstructor<T>>} serviceInstance
 * @param {Record<PropertyKey, unknown>} targeObj
 */
export function addInstanceProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targeObj: Record<PropertyKey, unknown>
) {
  const instanceKeys = Object.keys(serviceInstance);

  instanceKeys.forEach(key => {
    Object.defineProperty(targeObj, key, {
      get() {
        return serviceInstance[key as keyof typeof serviceInstance];
      },
      set(v) {
        serviceInstance[key as keyof typeof serviceInstance] = v;
      },
      enumerable: true,
      configurable: true,
    });
  });
}

/**
 *  Copies All static symbols
 *  to the resolved object .
 *
 * @export
 * @template {object} T
 * @param {ServiceConstructor<T>} serviceClass
 * @param {Record<PropertyKey, unknown>} targeObj
 */
export function addStaticSymbols<T extends object>(
  serviceClass: ServiceConstructor<T>,
  targeObj: Record<PropertyKey, unknown>
) {
  const staticSymbolKeys = Object.getOwnPropertySymbols(serviceClass);

  staticSymbolKeys.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(serviceClass, key)!;

    if (typeof descriptor.value === 'function') {
      targeObj[key] = descriptor.value.bind(serviceClass);
    } else if (descriptor.get || descriptor.set) {
      const newDesc: PropertyDescriptor = {
        enumerable: true,
        configurable: true,
      };

      if (descriptor.get) {
        newDesc.get = () => descriptor.get!.call(serviceClass);
      }

      if (descriptor.set) {
        newDesc.set = (value: any) => descriptor.set!.call(serviceClass, value);
      }

      Object.defineProperty(targeObj, key, newDesc);
    } else {
      Object.defineProperty(targeObj, key, {
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
  });
}

/**
 *  Copies All object Symbols
 *  to the resolved object
 *
 * @export
 * @template {object} T
 * @param {InstanceType<ServiceConstructor<T>>} serviceInstance
 * @param {Record<PropertyKey, unknown>} targetObj
 */
export function addInstanceSymbols<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>
) {
  const instanceSymbolKeys = Object.getOwnPropertySymbols(serviceInstance);

  instanceSymbolKeys.forEach(key => {
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
  });
}
