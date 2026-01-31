import { getCurrentInstance, inject, onScopeDispose } from 'vue';
import type { ServiceConstructor } from '../utils/core.types';
import { getServiceMeta, RootRegistry, TempRegistry } from '../utils/core.utils';
import { createFacadeObj } from './facade';

/**
 * Injects a global singleton service From Root Registry;
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function Inject<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  const serviceMeta = getServiceMeta(serviceClass);

  // Ensure singleton
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

export function InjectInstance<T extends ServiceConstructor>(serviceClass: T) {
  let instance = new serviceClass();
  const componentInstance = getCurrentInstance();

  if (componentInstance) {
    onScopeDispose(() => {
      console.error('[IocRaft]: Scope Dispose Run');
    });
  }
  return instance as InstanceType<T>;
}

export function InjectFromContext<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMeta(serviceClass);
  return inject<InstanceType<T>>(serviceMeta.token);
}

export function ExposeToContext<T extends ServiceConstructor>(_classOrInstance: InstanceType<T>) {
  let ownsInstance = false;

  if (ownsInstance) {
    const componentInstance = getCurrentInstance();
    if (componentInstance) {
      onScopeDispose(() => {});
    }
  }
}

export function RemoveFromRegistry() {
  console.log('removing from registry');
}

export function InstanceOf() {
  console.log('deciding instance');
}
