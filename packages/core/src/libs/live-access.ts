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
 *  to the resolved object, preserving correct context and reactivity.
 *
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






export function resolve(serviceClass: any) {
  const instance = new serviceClass();
  const getterObj: any = {};
  /*  --- --- Logics For Handling Instance Properties --- ---  */

  /* --- --- Logics For Handling Symbol Properties   */

  /// Static Symbols

  const staticSymbolKeys = Object.getOwnPropertySymbols(serviceClass);

  staticSymbolKeys.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(serviceClass, key)!;

    if (typeof descriptor.value === 'function') {
      /// Static Symbol Methods :: Binding to the class
      getterObj[key] = descriptor.value.bind(serviceClass);
    } else if (descriptor.get || descriptor.set) {
      /// Static Symbol Getters/Setters :: Attaching to new Getter/Setter
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

      Object.defineProperty(getterObj, key, newDesc);
    } else {
      /// Static Symbol Properties :: Creating Live Getters

      Object.defineProperty(getterObj, key, {
        get() {
          return serviceClass[key];
        },
        set(v) {
          serviceClass[key] = v;
        },
        enumerable: true,
        configurable: true,
      });
    }
  });

  const instanceSymbolKeys = Object.getOwnPropertySymbols(instance);

  instanceSymbolKeys.forEach(key => {
    Object.defineProperty(getterObj, key, {
      get() {
        return instance[key];
      },
      set(v) {
        instance[key] = v;
      },
      enumerable: true,
      configurable: true,
    });
  });

  return getterObj;
}
