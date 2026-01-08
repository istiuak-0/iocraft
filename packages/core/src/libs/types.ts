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
