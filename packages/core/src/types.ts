export type ServiceConstructor<T = unknown> = {
  new (): T;
};
export type ServiceConfig = {
  in: 'app' | 'component';
};

export interface UnMounted {
  onUnmounted(): void;
}
export function ImplementsUnmounted(instance: unknown) {
  return typeof (instance as any).onUnmounted === 'function';
}

export type ServiceWithUnmounted<T> = T & {
  onUnmounted(): void;
};
