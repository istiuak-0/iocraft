import type { ServiceConstructor } from "../utils/core.types";
import { SERVICE_INTERNAL_METADATA } from "../utils/core.utils";


export function Register() {
  return function <C extends ServiceConstructor>(constructor: C) {

    if ((constructor as any)[SERVICE_INTERNAL_METADATA]?.token) {
      return constructor;
    }

    const token = Symbol(`[VUE DI]: Service - ${constructor.name || 'Anonymous'}`);
    (constructor as any)[SERVICE_INTERNAL_METADATA] = { token };
    return constructor;
  };
}
