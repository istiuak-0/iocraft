# Lifecycle Hooks

Services can use Vue lifecycle hooks with `obtainNew()`.

## Available Hooks

All Vue lifecycle hooks are supported:

- `onMounted`
- `onUpdated`
- `onUnmounted`
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

## Usage

```typescript
import { attach } from 'iocraft';
import { ref } from 'vue';

@attach()
export class DataService implements OnMounted, OnUnmounted {
  data = ref([]);

  onMounted() {
    this.loadData();
  }

  onUnmounted() {
    this.cleanup();
  }

  async loadData() {
    const res = await fetch('/api/data');
    this.data.value = await res.json();
  }

  cleanup() {
    this.data.value = [];
  }
}
```

## When Hooks Run

Lifecycle hooks only run with `obtainNew()` or `obtainNewRaw()`:

```typescript
// Hooks will run
const service = obtainNew(DataService);

// Hooks won't run (singleton)
const singleton = obtain(DataService);
```

## Example: Polling Service

```typescript
import { attach } from 'iocraft';
import { ref } from 'vue';

@attach()
export class PollingService implements OnMounted, OnUnmounted {
  data = ref([]);
  intervalId: number | null = null;

  onMounted() {
    this.loadData();
    this.intervalId = setInterval(() => {
      this.loadData();
    }, 30000);
  }

  onUnmounted() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async loadData() {
    const res = await fetch('/api/data');
    this.data.value = await res.json();
  }
}
```

## Example: Form with Cleanup

```typescript
import { attach, obtainNew } from 'iocraft';
import { ref } from 'vue';

@attach()
export class FormService implements OnUnmounted {
  formData = ref({ name: '', email: '' });
  subscribers: (() => void)[] = [];

  subscribe(fn: () => void) {
    this.subscribers.push(fn);
  }

  onUnmounted() {
    this.subscribers.forEach(unsub => unsub());
  }
}

// In component
const form = obtainNew(FormService);
```

## Related

- [`@attach()`](/api/attach)
- [`obtain` Methods](/api/obtain-methods)
