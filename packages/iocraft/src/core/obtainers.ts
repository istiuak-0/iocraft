import { getCurrentInstance, inject, provide } from "vue";
import { createFacadeObj } from "./facade";
import { bindLifecycleHooks, creationStack, RootRegistry } from "./internals";
import type { ServiceConstructor } from "./types";
import { getServiceMeta } from "./utils";

/**
 * obtain Facade of a global singleton service From Root Registry
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 */
export function obtain<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMeta(serviceClass);

  if (RootRegistry.has(serviceMeta.token)) {
    const instance = RootRegistry.get(serviceMeta.token)!;
    return createFacadeObj<InstanceType<T>>(instance);
  }

  if (creationStack.has(serviceMeta.token)) {
    throw new Error(`[IocRaft] Circular dependency detected on: ${serviceClass.name}\n`);
  }

  creationStack.add(serviceMeta.token);

  try {
    const instance = new serviceClass();
    RootRegistry.set(serviceMeta.token, instance);
    return createFacadeObj<InstanceType<T>>(instance);
  } finally {
    creationStack.delete(serviceMeta.token);
  }
}

/**
 * obtain a facade of a new Service Instance
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 */
export function obtainNew<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMeta(serviceClass);

  if (creationStack.has(serviceMeta.token)) {
    throw new Error(`[IocRaft] Circular dependency detected on: ${serviceClass.name}\n`);
  }

  creationStack.add(serviceMeta.token);

  try {
    const componentInstance = getCurrentInstance();
    const instance = new serviceClass();

    if (componentInstance) {
      bindLifecycleHooks(instance);
    }

    return createFacadeObj<InstanceType<T>>(instance);
  } finally {
    creationStack.delete(serviceMeta.token);
  }
}

/**
 * Expose a service to context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {InstanceType<T>} serviceInstance
 */
export function exposeCtx<T extends ServiceConstructor>(serviceInstance: InstanceType<T>) {
  const serviceMeta = getServiceMeta(serviceInstance);
  provide(serviceMeta.token, serviceInstance);
}

/**
 * obtain A Service From Context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 */
export function obtainCtx<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMeta(serviceClass);
  return inject<InstanceType<T>>(serviceMeta.token);
}
