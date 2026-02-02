import {
  Provide,
  type OnActivated,
  type OnBeforeMount,
  type OnBeforeUnmount,
  type OnBeforeUpdate,
  type OnDeactivated,
  type OnErrorCaptured,
  type OnMounted,
  type OnRenderTracked,
  type OnRenderTriggered,
  type OnScopeDispose,
  type OnServerPrefetch,
  type OnUnmounted,
  type OnUpdated,
} from 'iocraft';

@Provide()
export class LifecycleTestService
  implements
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
    OnScopeDispose
{
  onBeforeMount(): void {
    console.log('[Service] onBeforeMount');
  }

  onMounted(): void {
    console.log('[Service] onMounted');
  }

  onBeforeUpdate(): void {
    console.log('[Service] onBeforeUpdate');
  }

  onUpdated(): void {
    console.log('[Service] onUpdated');
  }

  onBeforeUnmount(): void {
    console.log('[Service] onBeforeUnmount');
  }

  onUnmounted(): void {
    console.log('[Service] onUnmounted');
  }

  onActivated(): void {
    console.log('[Service] onActivated');
  }

  onDeactivated(): void {
    console.log('[Service] onDeactivated');
  }

  onRenderTracked(): void {
    console.log('[Service] onRenderTracked');
  }

  onRenderTriggered(): void {
    console.log('[Service] onRenderTriggered');
  }

  onErrorCaptured(): void {
    console.log('[Service] onErrorCaptured');
  }

  onServerPrefetch(): void {
    console.log('[Service] onServerPrefetch');
  }

  onScopeDispose(): void {
    console.log('[Service] onScopeDispose');
  }
}
