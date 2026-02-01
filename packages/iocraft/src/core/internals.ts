import type { Router } from 'vue-router';

export const SERVICE_METADATA = Symbol('IOCRAFT_SERVICE_METADATA');
export const RootRegistry = new Map<symbol, object>();
export const TempRegistry = new Map<symbol, object>();

export function getServiceMeta(target: ServiceConstructor | object) {
  const ctor = typeof target === 'function' ? target : target.constructor;

  const meta = (ctor as any)[SERVICE_METADATA] as ServiceMetadata;
  if (!meta?.token) {
    throw new Error(`[IOCRAFT]: ${ctor?.name || 'Unknown'} is not decorated with @Provide()`);
  }
  return meta;
}


export type ServiceConstructor<T extends object = object> = new (...args: any[]) => T;

export type PluginOptions = {
  EagerLoad: ServiceConstructor[];
  router: Router;
};

export interface ServiceOptions {
  facade?: boolean;
}

export type ServiceMetadata = {
  token: symbol;
  facade: boolean;
};
