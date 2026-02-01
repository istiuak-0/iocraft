import { getCurrentInstance, inject, provide } from 'vue';
import { createFacadeObj } from './facade';
import type { ServiceConstructor } from './core';
import { bindLifecycleHooks, getServiceMetadata, RootRegistry, TempRegistry } from './internals';

/**
 * Injects a global singleton service From Root Registry
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function Inject<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  const serviceMeta = getServiceMetadata(serviceClass);

  if (!RootRegistry.has(serviceMeta.token)) {
    RootRegistry.set(serviceMeta.token, new serviceClass());
  }

  let instance = RootRegistry.get(serviceMeta.token)!;

  if (serviceMeta.facade) {
    if (!TempRegistry.has(serviceMeta.token)) {
      TempRegistry.set(serviceMeta.token, createFacadeObj(instance));
    }

    instance = TempRegistry.get(serviceMeta.token)!;
  }

  return instance as InstanceType<T>;
}

/**
 * Inject a new Service Instance
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function InjectInstance<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  const serviceMeta = getServiceMetadata(serviceClass);
  const componentInstance = getCurrentInstance();
  let instance = new serviceClass();

  if (serviceMeta.facade) {
    if (!TempRegistry.has(serviceMeta.token)) {
      TempRegistry.set(serviceMeta.token, createFacadeObj(instance));
    }
    instance = TempRegistry.get(serviceMeta.token)!;
  }

  if (componentInstance) {
    bindLifecycleHooks(instance);
  }
  return instance as InstanceType<T>;
}

/**
 * Expose a service to context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {InstanceType<T>} serviceInstance
 */
export function ExposeToContext<T extends ServiceConstructor>(serviceInstance: InstanceType<T>) {
  const serviceMeta = getServiceMetadata(serviceInstance);
  provide(serviceMeta.token, serviceInstance);
}

/**
 * Inject A Service From Context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {*}
 */
export function InjectFromContext<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMetadata(serviceClass);
  return inject<InstanceType<T>>(serviceMeta.token);
}
