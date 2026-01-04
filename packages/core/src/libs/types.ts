export type ServiceConstructor<T = unknown> = {
  new (): T;
};
export type ServiceConfig = {
  in: 'app';
};

export interface Disposable {
  dispose(): void;
}

export function ImplementsDispose(instance: unknown) {
  return typeof (instance as any).dispose === 'function';
}

export type ServiceWithDispose<T> = T & {
  dispose(): void;
};
