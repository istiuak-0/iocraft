import { serviceRefView } from './registry';
import { serviceToRefs } from './service-to-refs';

export function getServiceRefs<T extends object>(instance: T): T {
  const cached = serviceRefView.get(instance);
  if (cached) return cached;
  const refs = serviceToRefs(instance);
  serviceRefView.set(instance, refs);
  return refs;
}
