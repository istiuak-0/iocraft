import { inject, provide } from 'vue';
import type { ServiceConstructor } from '../libs/types';

export function exposeToChildren<T extends ServiceConstructor>(serviceClass: T): void {
  provide(serviceClass.name, new serviceClass());
}

export function resolveFromContext<T extends ServiceConstructor>(serviceClass: T) {
  inject(serviceClass.name);
}
