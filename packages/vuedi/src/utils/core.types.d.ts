export type ServiceConstructor<T extends object = object> = new (...args: any[]) => T;
export type ServiceView<T extends ServiceConstructor> = InstanceType<T> & T;

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


