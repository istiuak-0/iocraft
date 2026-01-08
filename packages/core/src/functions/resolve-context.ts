import { inject } from 'vue';
import type { ServiceConstructor } from '../libs/types';
import { getServiceToken } from '../libs/service-token';

export function resolveFromContext<T extends ServiceConstructor>(serviceClass: T) {
  const serviceToken = getServiceToken(serviceClass);
  return inject<InstanceType<T>>(serviceToken);
}
