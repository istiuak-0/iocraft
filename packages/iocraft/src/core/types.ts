import type { Router } from "vue-router";

export type ServiceConstructor<T extends object = object> = new (
  ...args: any[]
) => T;

export interface PluginOptions {
  eagerLoad: ServiceConstructor[];
  router: Router;
}

export interface ServiceMetadata {
  token: symbol;
}