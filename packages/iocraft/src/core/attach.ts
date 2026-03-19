import { SERVICE_METADATA } from "./internals";
import type { ServiceConstructor, ServiceMetadata } from "./types";

/**
 * Attaches some internal meta data to a class that is needed for di system
 */
export function attach(){
  return function <C extends ServiceConstructor>(constructor: C) {
    if ((constructor as any)[SERVICE_METADATA]?.token) {
      return constructor;
    }

    // Add more metadata here if needed
    (constructor as any)[SERVICE_METADATA] = {
      token: Symbol(`[IOCRAFT]: Service - ${constructor.name || "Anonymous"}`),
    } satisfies ServiceMetadata;

    return constructor;
  };
}
