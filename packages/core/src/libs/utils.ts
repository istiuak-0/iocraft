export const SERVICE_INTERNAL_METADATA = Symbol('VUEDI_SERVICE_METADATA');
export const serviceRegistry = new Map<symbol, object>();
export const serviceRefView = new WeakMap<InstanceType<ServiceConstructor>, any>();

export function hasKey(obj: Record<PropertyKey, unknown>, key: PropertyKey): boolean {
  if (typeof key === 'symbol') {
    return Object.getOwnPropertySymbols(obj).includes(key);
  }
  return Object.hasOwn(obj, key);
}

export function getServiceToken(target: ServiceConstructor | object) {
  const ctor = typeof target === 'function' ? target : target.constructor;

  const meta = (ctor as any)[SERVICE_INTERNAL_METADATA] as ServiceMetadata;
  if (!meta?.token) {
    throw new Error(`[VUE DI]: ${ctor?.name || 'Unknown'} is not decorated with @Register()`);
  }
  return meta.token;
}

export const NATIVE_OBJECT_KEYS = new Set([
  ...Object.getOwnPropertyNames(Object.prototype),
  ...Object.getOwnPropertySymbols(Object.prototype),
]);



/// Util Types
export type ServiceConstructor<T extends object = object> = new () => T;

export interface Disposable {
  dispose(): void;
}

export function ImplementsDispose(instance: unknown) {
  return typeof (instance as any).dispose === 'function';
}

export type ServiceWithDispose<T> = T & {
  dispose(): void;
};

export type ServiceMetadata = {
  token: symbol;
};


export type ResolvedService<T extends ServiceConstructor> = {
  [K in keyof InstanceType<T>]: InstanceType<T>[K];
} & {
  [K in keyof T]: T[K];
};
