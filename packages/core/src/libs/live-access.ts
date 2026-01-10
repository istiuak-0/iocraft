import type { ServiceConstructor } from './types';

function hasKey(obj: any, key: string | symbol): boolean {
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
        set(value: unknown) {
          (serviceClass[key as keyof typeof serviceClass] as unknown) = value;
        },
        enumerable: true,
        configurable: true,
      });
    }
  });
}







export function resolve(serviceClass: any) {
  const instance = new serviceClass();
  const getterObj: any = {};

  /* --- --- Logics For Handling Static Properties/Methods --- ---   */

  /// it also includes objects internals that is not defined by user
  const staticKeys = Object.getOwnPropertyNames(serviceClass);

  /// filtering out the the static's that are not defined in service class
  const ownStatics = staticKeys.filter(key => !['length', 'name', 'prototype'].includes(key));

  ownStatics.forEach(key => {
    const descriptor = Object.getOwnPropertyDescriptor(serviceClass, key)!;

    if (typeof descriptor.value === 'function') {
      /// Static Methods :: Binding to the class
      getterObj[key] = descriptor.value.bind(serviceClass);
    } else if (descriptor.get || descriptor.set) {
      /// Static Getters/Setters :: Attaching to new Getter/Setter

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
      /// Static Properties :: Creating Live Getters

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

  /*  --- --- Logics For Handling ProtoType Properties  (Methods, Getter/Setter, Property) --- ---  */

  let currentProto = Object.getPrototypeOf(instance);

  /// Loop Over The Whole Prototype Chain
  while (currentProto && currentProto !== Object.prototype) {
    /// It Contains All Keys Including Constructor
    const protoKeys = Object.getOwnPropertyNames(currentProto);

    const filteredKeys = protoKeys.filter(key => key !== 'constructor');

    filteredKeys.forEach(key => {
      if (hasKey(getterObj, key)) return;

      const descriptor = Object.getOwnPropertyDescriptor(currentProto, key)!;

      /// Instance Getters/Setters :: Attaching to new Getter/Setter
      if (descriptor.get || descriptor.set) {
        const newDesc: PropertyDescriptor = {
          enumerable: true,
          configurable: true,
        };

        if (descriptor.get) {
          newDesc.get = () => descriptor.get!.call(instance);
        }

        if (descriptor.set) {
          newDesc.set = (value: any) => descriptor.set!.call(instance, value);
        }

        Object.defineProperty(getterObj, key, newDesc);
      } else if (typeof descriptor.value === 'function') {
        /// Instance Methods :: Binding to the Instance
        getterObj[key] = descriptor.value.bind(instance);
      } else {
        /// Prototype Properties :: Creating Live Getters
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
      }
    });

    /// For Prototype Symbols
    const symbolKeys = Object.getOwnPropertySymbols(currentProto);

    symbolKeys.forEach(key => {
      if (hasKey(getterObj, key)) return;

      const descriptor = Object.getOwnPropertyDescriptor(currentProto, key)!;

      /// Instance Getters/Setters :: Attaching to new Getter/Setter
      if (descriptor.get || descriptor.set) {
        const newDesc: PropertyDescriptor = {
          enumerable: true,
          configurable: true,
        };

        if (descriptor.get) {
          newDesc.get = () => descriptor.get!.call(instance);
        }

        if (descriptor.set) {
          newDesc.set = (value: any) => descriptor.set!.call(instance, value);
        }

        Object.defineProperty(getterObj, key, newDesc);
      } else if (typeof descriptor.value === 'function') {
        /// Instance Methods :: Binding to the Instance
        getterObj[key] = descriptor.value.bind(instance);
      } else {
        /// Prototype Properties :: Creating Live Getters
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
      }
    });

    currentProto = Object.getPrototypeOf(currentProto);
  }

  /*  --- --- Logics For Handling Instance Properties --- ---  */
  const instanceKeys = Object.keys(instance);

  instanceKeys.forEach(key => {
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
