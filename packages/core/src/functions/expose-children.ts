import { getCurrentInstance, onScopeDispose, provide } from 'vue';
import { ImplementsDispose, type ServiceConstructor, type ServiceWithDispose } from '../libs/types';
import { getServiceRef } from '../libs/service-refs';
import { serviceRefView } from '../libs/registry';
import { getServiceToken } from '../libs/service-token';

export function exposeToChildren<T extends ServiceConstructor>(classOrInstance: T | InstanceType<T>): void {
  let instance: InstanceType<T>;
  let ownsInstance = false;

  if (typeof classOrInstance === 'function') {
    instance = new classOrInstance() as InstanceType<T>;
    ownsInstance = true;
  } else {
    instance = classOrInstance;
  }

  const refView = getServiceRef(instance) as InstanceType<T>;
  const serviceToken = getServiceToken(instance);
  provide(serviceToken, refView);

  if (ownsInstance) {
    const componentInstance = getCurrentInstance();

    if (componentInstance) {
      onScopeDispose(() => {
        if (ImplementsDispose(instance)) {
          try {
            (instance as ServiceWithDispose<T>).dispose();
          } catch (error) {
            console.error('[VUE DI]: Error in scope dispose:', error);
          }
        }

        if (serviceRefView.has(instance)) {
          serviceRefView.delete(instance);
        }
      });
    }
  }
}
