import {
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered,
  onActivated,
  onDeactivated,
  onServerPrefetch,
  onScopeDispose,
} from 'vue';

export const SERVICE_METADATA = Symbol('IOCRAFT_SERVICE_METADATA');
export const RootRegistry = new Map<symbol, object>();
export const TempRegistry = new Map<symbol, object>();

const lifecycleHookMap = {
  onMounted,
  onUpdated,
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onErrorCaptured,
  onRenderTracked,
  onRenderTriggered,
  onActivated,
  onDeactivated,
  onServerPrefetch,
  onScopeDispose,
} as const;

export function bindLifecycleHooks(instance: any) {
  for (const key in lifecycleHookMap) {
    const hookName = key as keyof typeof lifecycleHookMap;
    const vueHook = lifecycleHookMap[hookName];

    const handler = instance[hookName];

    if (typeof handler === 'function') {
      vueHook(handler.bind(instance));
    }
  }
}
