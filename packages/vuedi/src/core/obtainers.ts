import { getCurrentInstance, inject, onScopeDispose } from 'vue';
import type { ResolvedService, ServiceConstructor, ServiceWithDispose } from '../utils/core.types';
import { getServiceToken, ImplementsDispose, serviceRefView, serviceRegistry } from '../utils/core.utils';
import { addInstanceProperties, addPrototypeProperties, addStaticProperties } from './facade';

/**
 * Resolves a global singleton service into a destructurable object with:
 * - Live getters for reactive state (ref, computed, etc.)
 * - Bound methods that preserve correct `this` context
 *
 * @export
 * @template {ServiceConstructor} T
 * @param {T} serviceClass
 * @returns {InstanceType<T>}
 */
export function obtain<T extends ServiceConstructor>(serviceClass: T) {
  const serviceToken = getServiceToken(serviceClass);

  // Ensure singleton: create once, reuse forever
  if (!serviceRegistry.has(serviceToken)) {
    serviceRegistry.set(serviceToken, new serviceClass());
  }

  const instance = serviceRegistry.get(serviceToken)!;
  const obj: Record<string, any> = {};

  addStaticProperties(serviceClass, obj);
  addInstanceProperties(instance, obj);
  addPrototypeProperties(instance, obj);

  return obj as ResolvedService<T>;
}

export function obtainNew<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let instance = new serviceClass();
  const componentInstance = getCurrentInstance();

  /// here if i want i can tap into other hooks
  if (componentInstance) {
    onScopeDispose(() => {
      if (ImplementsDispose(instance)) {
        try {
          (instance as ServiceWithDispose<typeof instance>).dispose();
        } catch (error) {
          console.error('[VUE DI]: Error in scope dispose:', error);
        }
      }

      if (serviceRefView.has(instance)) {
        serviceRefView.delete(instance);
      }
    });
  }
  return instance as InstanceType<T>;
}

export function passed<T extends ServiceConstructor>(serviceClass: T) {
  const serviceToken = getServiceToken(serviceClass);
  return inject<InstanceType<T>>(serviceToken);
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
