import { SERVICE_METADATA } from "./internals";
import type { ServiceConstructor, ServiceMetadata } from "./types";

export function getServiceMeta(target: ServiceConstructor | object) {
  const ctor = typeof target === "function" ? target : target.constructor;

  const meta = (ctor as any)[SERVICE_METADATA] as ServiceMetadata;
  if (!meta?.token) {
    throw new Error(`[IOCRAFT]: ${ctor?.name || "Unknown"} is not decorated with @attach()`);
  }
  return meta;
}
