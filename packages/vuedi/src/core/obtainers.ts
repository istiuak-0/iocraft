import { getCurrentInstance, inject, onScopeDispose } from 'vue';
import type { FacadeService, ServiceConstructor } from '../utils/core.types';
import { getServiceMeta, ImplementsDispose, RootRegistry } from '../utils/core.utils';
import { ReactiveFacade } from './facade';

/**
 * Resolves a global singleton service into a destructurable object with:
 * - Live getters for reactive state (ref, computed, etc.)
 * - Bound methods that preserve correct `this` context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @param {*} [facade=new ReactiveFacade()]
 * @returns {(InstanceType<T> |  FacadeService<T>)}
 */
export function obtain<T extends ServiceConstructor>(
  serviceClass: T,
  facade = new ReactiveFacade()
): InstanceType<T> | FacadeService<T> {
  const serviceMeta = getServiceMeta(serviceClass);

  // Ensure singleton: create once, reuse forever
  if (!RootRegistry.has(serviceMeta.token)) {
    RootRegistry.set(serviceMeta.token, new serviceClass());
  }
  const instance = RootRegistry.get(serviceMeta.token)!;

  if (serviceMeta.facade) {
    return facade.createFacadeObj(serviceClass, instance) as FacadeService<T>;
  } else {
    return instance as InstanceType<T>;
  }
}

export function obtainNew<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let instance = new serviceClass();
  // const componentInstance = getCurrentInstance();

  // if (componentInstance) {
  //   onScopeDispose(() => {
  //     if (ImplementsDispose(instance)) {
  //       try {
  //         (instance as ServiceWithDispose<typeof instance>).dispose();
  //       } catch (error) {
  //         console.error('[VUE DI]: Error in scope dispose:', error);
  //       }
  //     }
  //   });
  // }
  return instance as InstanceType<T>;
}

export function passed<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMeta(serviceClass);
  return inject<InstanceType<T>>(serviceMeta.token);
}

export function pass<T extends ServiceConstructor>(_classOrInstance: T | InstanceType<T>): void {
  // let instance: InstanceType<T>;
  // let ownsInstance = false;
  // if (typeof classOrInstance === 'function') {
  //   instance = new classOrInstance() as InstanceType<T>;
  //   ownsInstance = true;
  // } else {
  //   instance = classOrInstance;
  // }
  // const refView = getServiceRef(instance) as InstanceType<T>;
  // const serviceToken = getServiceToken(instance);
  // provide(serviceToken, refView);
  // if (ownsInstance) {
  //   const componentInstance = getCurrentInstance();
  //   if (componentInstance) {
  //     onScopeDispose(() => {
  //       if (ImplementsDispose(instance)) {
  //         try {
  //           (instance as ServiceWithDispose<T>).dispose();
  //         } catch (error) {
  //           console.error('[VUE DI]: Error in scope dispose:', error);
  //         }
  //       }
  //       if (serviceRefView.has(instance)) {
  //         serviceRefView.delete(instance);
  //       }
  //     });
  //   }
  // }
}
