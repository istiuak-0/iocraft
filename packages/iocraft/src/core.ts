export { obtain, obtainNew, exposeCtx, obtainCtx } from "./core/obtainers";
export { iocraft } from "./core/plugin";
export { attach } from "./core/attach";
export { getServiceMeta } from "./core/utils";

export type {
  OnMounted,
  OnUpdated,
  OnUnmounted,
  OnBeforeMount,
  OnBeforeUpdate,
  OnBeforeUnmount,
  OnErrorCaptured,
  OnRenderTracked,
  OnRenderTriggered,
  OnActivated,
  OnDeactivated,
  OnServerPrefetch,
  OnScopeDispose,
} from "./core/types";
