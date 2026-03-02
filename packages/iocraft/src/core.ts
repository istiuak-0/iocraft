export { obtain, obtainRaw, obtainNew, obtainNewRaw, exposeCtx, obtainCtx } from "./core/obtainers";
export { iocraft } from "./core/plugin";
export { attach } from "./core/attach";

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
export {
  hasService,
  
} from "./core/utils";
