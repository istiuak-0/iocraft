import { inject } from 'vue';
import type { ServiceConstructor } from '../libs/types';

export function resolveFromContext<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> | undefined {
  return inject<InstanceType<T>>(serviceClass.name);
}
