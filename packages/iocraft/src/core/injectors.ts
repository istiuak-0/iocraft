import { getCurrentInstance, inject, onScopeDispose } from 'vue';

import { createFacadeObj } from './facade';
import { getServiceMeta, RootRegistry, TempRegistry, type ServiceConstructor } from './internals';

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
  let instance = new serviceClass();
  const componentInstance = getCurrentInstance();

  if (componentInstance) {
    onScopeDispose(() => {
      console.error('[IocRaft]: Scope Dispose Run');
    });
  }
  return instance as InstanceType<T>;
}






/**
 * Description placeholder
 *
 * @export
 * @template {ServiceConstructor} T 
 * @param {T} serviceClass 
 * @returns {*} 
 */
export function InjectFromContext<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMeta(serviceClass);
  return inject<InstanceType<T>>(serviceMeta.token);
}




/**
 * Description placeholder
 *
 * @export
 * @template {ServiceConstructor} T 
 * @param {InstanceType<T>} _classOrInstance 
 */
export function ExposeToContext<T extends ServiceConstructor>(_classOrInstance: InstanceType<T>) {
  let ownsInstance = false;

  if (ownsInstance) {
    const componentInstance = getCurrentInstance();
    if (componentInstance) {
      onScopeDispose(() => {});
    }
  }
}

