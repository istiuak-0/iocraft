import { serviceRefView } from './registry';
import { computed, isReactive, isRef, toRaw, toRef } from 'vue';
import type { ServiceConstructor } from './types';

function serviceToRefs<T extends InstanceType<ServiceConstructor>>(service: T) {
  const rawService = toRaw(service);
  const refs: any = {};

  /// loop through all object properties
  for (const key in service) {
    const value = rawService[key];

    if ((value as any).effect) {
      refs[key] = computed({
        get: () => service[key],
        set: newValue => {
          service[key] = newValue;
        },
      });
    } else if (isRef(value) || isReactive(value)) {
      refs[key] = toRef(service, key);
    }
  }
  return refs;
}

export function getServiceRef<T extends InstanceType<ServiceConstructor>>(instance: T): T {
  const cached = serviceRefView.get(instance);
  if (cached) return cached;
  const refs = serviceToRefs(instance);
  serviceRefView.set(instance, refs);
  return refs;
}

