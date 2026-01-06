import { getCurrentInstance, onScopeDispose } from 'vue';
import { ImplementsDispose, type ServiceConstructor, type ServiceWithDispose } from '../libs/types';
import { serviceToRefs } from '../libs/service-to-refs';

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
      instance = null;
    });
  }

  return serviceToRefs(instance as object) as InstanceType<T> 
}
