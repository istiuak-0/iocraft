export type ServiceConstructor<T = unknown> = {
  new (): T;
};
export type ServiceConfig = {
  in: 'root' | 'component';
  eger: boolean;
};

export interface UnMounted {
  onUnmounted(): void;
}
