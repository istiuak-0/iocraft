import { hasKey, NATIVE_OBJECT_KEYS, type ServiceConstructor } from '../utils';

export function addPrototypeProperties<T extends object>(
  serviceInstance: InstanceType<ServiceConstructor<T>>,
  targetObj: Record<PropertyKey, unknown>
) {
  let currentProto = Object.getPrototypeOf(serviceInstance);

  while (currentProto && currentProto !== Object.prototype) {
    const protoKeys = [...Object.getOwnPropertyNames(currentProto), ...Object.getOwnPropertySymbols(currentProto)];

    for (const key of protoKeys) {
      if (hasKey(targetObj, key)) continue;

      if (NATIVE_OBJECT_KEYS.has(key)) {
        return;
      }
      const descriptor = Object.getOwnPropertyDescriptor(currentProto, key)!;

      if (descriptor.get || descriptor.set) {
        Object.defineProperty(targetObj, key, {
          get: descriptor.get ? () => descriptor.get!.call(serviceInstance) : undefined,
          set: descriptor.set ? (v: any) => descriptor.set!.call(serviceInstance, v) : undefined,
          enumerable: true,
          configurable: true,
        });
      } else if (typeof descriptor.value === 'function') {
        targetObj[key] = descriptor.value.bind(serviceInstance);
      }
    }

    currentProto = Object.getPrototypeOf(currentProto);
  }
}
