# Lifecycle Hooks

Services can use Vue lifecycle hooks, making them behave like components in certain contexts.

## Available Hooks

Services can implement any Vue lifecycle hooks:

- `onMounted`
- `onUnmounted`
- `onUpdated`
- `onBeforeMount`
- `onBeforeUpdate`
- `onBeforeUnmount`
- `onErrorCaptured`
- `onRenderTracked`
- `onRenderTriggered`
- `onActivated`
- `onDeactivated`
- `onServerPrefetch`
- `onScopeDispose`

## Using Lifecycle Hooks

```typescript
import { Register } from 'iocraft';

@Register()
export class DataService {
  data = [];

  // This runs when the service is attached to a component
  onMounted() {
    console.log('DataService mounted to component');
    this.loadData();
  }

  // This runs when the component unmounts
  onUnmounted() {
    console.log('DataService unmounted from component');
    // Perform cleanup
  }

  loadData() {
    // Load data
  }
}
```

## Important Notes

- Lifecycle hooks only work when using `obtainInstance()` or `obtainRawInstance()` inside a component
- When using `obtain()` or `obtainRaw()`, lifecycle hooks won't be triggered since these create global singletons
- These hooks allow services to respond to component lifecycle events