import { getCurrentInstance, inject, provide } from 'vue';
import { createFacadeObj } from './facade';
import { bindLifecycleHooks, creationStack, RootRegistry } from './internals';
import type { ServiceConstructor } from './types';
import { getServiceMetadata } from './utils';
import { createLazyProxy } from './lazy-proxy';

/**
 * obtain Facade of a global singleton service From Root Registry
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function obtain<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  const serviceMeta = getServiceMetadata(serviceClass);

  if (RootRegistry.has(serviceMeta.token)) {
    const instance = RootRegistry.get(serviceMeta.token)!;
    return createFacadeObj(instance);
  }

  if (creationStack.has(serviceMeta.token)) {
    if (__DEV__) {
      console.warn(`[IocRaft] Circular dependency: ${serviceClass.name}`);
    }
    return createLazyProxy(serviceClass, serviceMeta, true); // true = facade
  }

  creationStack.add(serviceMeta.token);

  try {
    const instance = new serviceClass();
    RootRegistry.set(serviceMeta.token, instance);
    return createFacadeObj(instance);
  } finally {
    creationStack.delete(serviceMeta.token);
  }
}

/**
 * obtain a global singleton service From Root Registry
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function obtainRaw<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMetadata(serviceClass);

  if (!RootRegistry.has(serviceMeta.token)) {
    RootRegistry.set(serviceMeta.token, new serviceClass());
  }

  return RootRegistry.get(serviceMeta.token) as InstanceType<T>;
}

/**
 * obtain a new Service Instance
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function obtainRawInstance<T extends ServiceConstructor>(serviceClass: T) {
  const componentInstance = getCurrentInstance();
  let instance = new serviceClass();
  if (componentInstance) {
    bindLifecycleHooks(instance);
  }

  return instance as InstanceType<T>;
}

/**
 * obtain a facade of a new Service Instance
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function obtainInstance<T extends ServiceConstructor>(serviceClass: T) {
  const componentInstance = getCurrentInstance();
  let instance = new serviceClass();

  if (componentInstance) {
    bindLifecycleHooks(instance);
  }

  return createFacadeObj(instance) as InstanceType<T>;
}

/**
 * Expose a service to context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {InstanceType<T>} serviceInstance
 */
export function exposeToContext<T extends ServiceConstructor>(serviceInstance: InstanceType<T>) {
  const serviceMeta = getServiceMetadata(serviceInstance);
  provide(serviceMeta.token, serviceInstance);
}

/**
 * obtain A Service From Context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {*}
 */
export function obtainFromContext<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMetadata(serviceClass);
  return inject<InstanceType<T>>(serviceMeta.token);
}
