import type { Router } from 'vue-router';
import type { ServiceConstructor } from '../utils/core.types';

function hasKey(obj: Record<PropertyKey, unknown>, key: PropertyKey): boolean {
  if (typeof key === 'symbol') {
    return Object.getOwnPropertySymbols(obj).includes(key);
  }
  return Object.hasOwn(obj, key);
}

const NativeKeys = new Set([
  ...Object.getOwnPropertyNames(Object.prototype),
  ...Object.getOwnPropertySymbols(Object.prototype),
  ...Object.getOwnPropertyNames(Function.prototype),
  ...Object.getOwnPropertySymbols(Function.prototype),
  ...Object.getOwnPropertyNames(Array.prototype),
  ...Object.getOwnPropertySymbols(Array.prototype),
]);

function addInstanceProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>
) {
  const ownKeys = [...Object.getOwnPropertyNames(serviceInstance), ...Object.getOwnPropertySymbols(serviceInstance)];

  for (const key of ownKeys) {
    if (hasKey(targetObj, key)) continue;

    const descriptor = Object.getOwnPropertyDescriptor(serviceInstance, key)!;

    if (typeof descriptor.value === 'function') {
      console.warn(`[VUE DI]: Instance method "${String(key)}" found as own property. Consider moving to prototype.`);
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

function addStaticProperties<T extends object>(
  serviceClass: ServiceConstructor<T>,
  targetObj: Record<PropertyKey, unknown>
) {
  const staticKeys = [...Object.getOwnPropertyNames(serviceClass), ...Object.getOwnPropertySymbols(serviceClass)];

  for (const key of staticKeys) {
    if (hasKey(targetObj, key)) {
      continue;
    }

    if (typeof key === 'string' && NativeKeys.has(key)) {
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

function addPrototypeProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>
) {
  let currentProto = Object.getPrototypeOf(serviceInstance);

  while (currentProto && currentProto !== Object.prototype) {
    const protoKeys = [...Object.getOwnPropertyNames(currentProto), ...Object.getOwnPropertySymbols(currentProto)];

    for (const key of protoKeys) {
      if (hasKey(targetObj, key)) continue;

      if (NativeKeys.has(key)) continue;

      const descriptor = Object.getOwnPropertyDescriptor(currentProto, key)!;

      if (descriptor.get || descriptor.set) {
        Object.defineProperty(targetObj, key, {
          get: descriptor.get ? () => descriptor.get!.call(serviceInstance) : undefined,
          set: descriptor.set ? (v: any) => descriptor.set!.call(serviceInstance, v) : undefined,
          enumerable: true,
          configurable: true,
        });
      } else if (typeof descriptor.value === 'function') {
        targetObj[key] = descriptor.value.bind(serviceInstance);
      }
    }

    currentProto = Object.getPrototypeOf(currentProto);
  }
}

/**
 * CREATES A FACADE OBJECT
 *
 * @export
 * @template {object} T
 * @param {ServiceConstructor<T>} serviceClass
 * @param {InstanceType<ServiceConstructor<T>>} serviceInstance
 * @returns {{}}
 */
export function createFacadeObj<T extends object>(
  serviceClass: ServiceConstructor<T>,
  serviceInstance: InstanceType<ServiceConstructor<T>>
) {
  const targetObj = {};

  addStaticProperties(serviceClass, targetObj);
  addInstanceProperties(serviceInstance, targetObj);
  addPrototypeProperties(serviceInstance, targetObj);
  return targetObj;
}

export function generateRouterFacade(router: Router): Record<string, any> {
  return {
    get path() {
      return router.currentRoute.value.path;
    },
    get name() {
      return router.currentRoute.value.name;
    },
    get params() {
      return router.currentRoute.value.params;
    },
    get query() {
      return router.currentRoute.value.query;
    },
    get hash() {
      return router.currentRoute.value.hash;
    },
    get fullPath() {
      return router.currentRoute.value.fullPath;
    },
    get matched() {
      return router.currentRoute.value.matched;
    },
    get meta() {
      return router.currentRoute.value.meta;
    },
    push: router.push.bind(router),
    replace: router.replace.bind(router),
    go: router.go.bind(router),
    back: router.back.bind(router),
    forward: router.forward.bind(router),
    resolve: router.resolve.bind(router),
    getRoutes: router.getRoutes.bind(router),
    hasRoute: router.hasRoute.bind(router),

    // Router guards
    beforeEach: router.beforeEach.bind(router),
    beforeResolve: router.beforeResolve.bind(router),
    afterEach: router.afterEach.bind(router),
    onError: router.onError.bind(router),

    // Dynamic routing
    addRoute: router.addRoute.bind(router),
    removeRoute: router.removeRoute.bind(router),
    clearRoutes: router.clearRoutes.bind(router),

    // State
    isReady: router.isReady.bind(router),
    get currentRoute() {
      return router.currentRoute;
    },
  };
}
