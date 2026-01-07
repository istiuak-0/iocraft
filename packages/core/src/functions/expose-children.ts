import { getCurrentInstance, onScopeDispose, provide } from 'vue';
import { ImplementsDispose, type ServiceConstructor, type ServiceWithDispose } from '../libs/types';
import { getServiceRef } from '../libs/service-refs';
import { serviceRefView } from '../libs/registry';

export function exposeToChildren<T extends ServiceConstructor>(classOrInstance: T | InstanceType<T>): void {
  let instance: any;
  let ownsInstance = false;

  if (typeof classOrInstance === 'function') {
    instance = new (classOrInstance as T)();
    ownsInstance = true;
  } else {
    instance = classOrInstance;
  }

  const refView = getServiceRef(instance) as InstanceType<T>;

  provide(instance.constructor, refView);

  if (ownsInstance) {
    const componentInstance = getCurrentInstance();

    if (componentInstance) {
      onScopeDispose(() => {
        if (ImplementsDispose(instance)) {
          try {
            (instance as ServiceWithDispose<T>).dispose();
          } catch (error) {
            console.error('Error in context service onUnmounted:', error);
          }
        }

        if (serviceRefView.has(instance)) {
          serviceRefView.delete(instance);
        }
        instance = null;
      });
    }
  }
}
