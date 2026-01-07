import { getCurrentInstance, onScopeDispose } from 'vue';
import { ImplementsDispose, type ServiceConstructor, type ServiceWithDispose } from '../libs/types';
import { serviceRefView } from '../libs/registry';
import { getServiceRef } from '../libs/service-refs';

export function resolveInstance<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let instance = new serviceClass();
  const componentInstance = getCurrentInstance();

  if (componentInstance) {
    onScopeDispose(() => {
      if (ImplementsDispose(instance)) {
        try {
          (instance as ServiceWithDispose<typeof instance>).dispose();
        } catch (error) {
          console.error('Error in scope dispose:', error);
        }
      }

      if (serviceRefView.has(instance as object)) {
        serviceRefView.delete(instance as object);
      }

      //@ts-ignore
      instance = null;
    });
  }

  return getServiceRef(instance) as InstanceType<T>;
}
