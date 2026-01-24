export type ServiceConstructor<T extends object = object> = new (...args: any[]) => T;

export type PluginOptions = {
  EagerLoad: ServiceConstructor[];
  router: boolean;
};

export interface ServiceOptions {
  facade?: boolean;
}

export type ServiceMetadata = {
  token: symbol;
  facade: boolean;
};


export type FacadeService<T extends ServiceConstructor> = {
  [K in keyof InstanceType<T>]: InstanceType<T>[K];
} & {
  [K in keyof T]: T[K];
};