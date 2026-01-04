import { getCurrentInstance, onUnmounted } from 'vue';
import { ImplementsUnmounted, type ServiceConstructor, type ServiceWithUnmounted } from '../libs/types';

export function resolveInstance<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  let instance = new serviceClass();
  const componentInstance = getCurrentInstance();

  if (componentInstance) {
    onUnmounted(() => {
      if (ImplementsUnmounted(instance)) {
        try {
          (instance as ServiceWithUnmounted<typeof instance>).onUnmounted();
        } catch (error) {
          console.error('Error in onUnmounted:', error);
        }
      }
      instance = null;
    });
  }

  return instance as InstanceType<T>;
}
