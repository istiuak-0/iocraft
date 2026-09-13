import type { ServiceConstructor } from "./types";

function hasKey(obj: Record<PropertyKey, unknown>, key: PropertyKey): boolean {
  if (typeof key === "symbol") {
    return Object.getOwnPropertySymbols(obj).includes(key);
  }
  return Object.hasOwn(obj, key);
}

const NativeKeys = new Set([
  ...Object.getOwnPropertyNames(Object.prototype),
  ...Object.getOwnPropertySymbols(Object.prototype),
  ...Object.getOwnPropertyNames(Function.prototype),
  ...Object.getOwnPropertySymbols(Function.prototype),
  // ...Object.getOwnPropertyNames(Array.prototype),
  // ...Object.getOwnPropertySymbols(Array.prototype),
]);

function addInstanceProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>,
) {
  const ownKeys = [
    ...Object.getOwnPropertyNames(serviceInstance),
    ...Object.getOwnPropertySymbols(serviceInstance),
  ];

  for (const key of ownKeys) {
    if (hasKey(targetObj, key)) continue;

    const descriptor = Object.getOwnPropertyDescriptor(serviceInstance, key)!;

    if (typeof descriptor.value === "function") {
      console.warn(
        `[IOCRAFT]: Instance method "${String(key)}" found as own property. Consider moving to prototype.`,
      );
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

function addPrototypeProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>,
) {
  let currentProto = Object.getPrototypeOf(serviceInstance);

  while (currentProto && currentProto !== Object.prototype) {
    const protoKeys = [
      ...Object.getOwnPropertyNames(currentProto),
      ...Object.getOwnPropertySymbols(currentProto),
    ];

    for (const key of protoKeys) {
      if (hasKey(targetObj, key)) continue;

      if (NativeKeys.has(key)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(currentProto, key)!;

      if (descriptor.get || descriptor.set) {
        Object.defineProperty(targetObj, key, {
          get: descriptor.get
            ? () => descriptor.get!.call(serviceInstance)
            : undefined,
          set: descriptor.set
            ? (v: any) => descriptor.set!.call(serviceInstance, v)
            : undefined,
          enumerable: true,
          configurable: true,
        });
      } else if (typeof descriptor.value === "function") {
        targetObj[key] = descriptor.value.bind(serviceInstance);
      }
    }

    currentProto = Object.getPrototypeOf(currentProto);
  }
}

/**
 * CREATES A FACADE OBJECT
 */
export function createFacadeObj<T extends object>(serviceInstance: object) {
  const targetObj = {};

  addInstanceProperties(serviceInstance, targetObj);
  addPrototypeProperties(serviceInstance, targetObj);

  Object.defineProperty(targetObj, "constructor", {
    get: () => serviceInstance.constructor,
    enumerable: false,
    configurable: true,
  });

  return targetObj as T;
}
