import { getCurrentInstance, onScopeDispose, provide } from 'vue';
import { ImplementsDispose, type ServiceConstructor, type ServiceWithDispose } from '../libs/types';

export function exposeToChildren<T extends ServiceConstructor>(classOrInstance: T | InstanceType<T>): void {
  let instance: any;
  let shouldCleanUp = false;

  if (typeof classOrInstance === 'function') {
    instance = new (classOrInstance as T)();
    shouldCleanUp = true;
  } else {
    // No need to clean up here
    instance = classOrInstance;
  }

  const constructor = instance.constructor as ServiceConstructor;
  provide(constructor.name, instance);

  if (shouldCleanUp) {
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
        instance = null;
      });
    }

  }
}

