import { type FunctionPlugin } from "vue";
import { Nav, RouterFacade } from "../common/nav";
import { RootRegistry } from "./internals";
import type { PluginOptions } from "./types";
import { getServiceMeta } from "./utils";

export const iocraft: FunctionPlugin<[Partial<PluginOptions>?]> = (_app, options?: Partial<PluginOptions>) => {
  if (options?.router) {
    RootRegistry.set(getServiceMeta(Nav).token, new RouterFacade(options.router));
  }

  // Eagerly create Service instances
  if (options?.eagerLoad) {
    options.eagerLoad.forEach((service) => {
      const serviceMeta = getServiceMeta(service);

      if (!RootRegistry.has(serviceMeta.token)) {
        RootRegistry.set(serviceMeta.token, new service());
      }
    });
  }
};
