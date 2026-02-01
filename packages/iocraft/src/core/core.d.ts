import type { Router } from "vue-router";

export type ServiceConstructor<T extends object = object> = new () => T;

export type PluginOptions = {
  EagerLoad: ServiceConstructor[];
  router: Router;
};

export interface ServiceOptions {
  facade?: boolean;
}

export type ServiceMetadata = {
  token: symbol;
  facade: boolean;
};

export interface Lifecycle {
  onMounted?: () => void;
  onUpdated?: () => void;
  onUnmounted?: () => void;
  onBeforeMount?: () => void;
  onBeforeUpdate?: () => void;
  onBeforeUnmount?: () => void;
  onErrorCaptured?: () => void;
  onRenderTracked?: () => void;
  onRenderTriggered?: () => void;
  onActivated?: () => void;
  onDeactivated?: () => void;
  onServerPrefetch?: () => void;
  onScopeDispose?: () => void;
}
