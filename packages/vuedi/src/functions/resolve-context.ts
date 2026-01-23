import { inject } from 'vue';
import { getServiceToken, type ServiceConstructor } from '../libs/utils';

export function resolveFromContext<T extends ServiceConstructor>(serviceClass: T) {
  const serviceToken = getServiceToken(serviceClass);
  return inject<InstanceType<T>>(serviceToken);
}
