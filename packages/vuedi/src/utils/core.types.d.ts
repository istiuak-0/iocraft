export type ServiceOptions = {
  facade?: boolean=true;
};

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
export type VueDIOptions = {
  services: ServiceConstructor[];
};

export type ServiceConstructor<T extends object = object> = new () => T;

export interface Disposable {
  dispose(): void;
}
