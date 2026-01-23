import { SERVICE_INTERNAL_METADATA, type ServiceConstructor } from './utils';

export function Register() {
  return function <C extends ServiceConstructor>(constructor: C) {
    // Its Already Registered
    if ((constructor as any)[SERVICE_INTERNAL_METADATA]?.token) {
      return constructor;
    }

    const token = Symbol(`vuedi:service:${constructor.name || 'Anonymous'}`);
    (constructor as any)[SERVICE_INTERNAL_METADATA] = { token };
    return constructor;
  };
}
