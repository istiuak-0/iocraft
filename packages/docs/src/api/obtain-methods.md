# obtain Methods

Functions to obtain service instances.

## Overview

| Method | Instance | Reactivity | Lifecycle Hooks |
|--------|----------|------------|-----------------|
| `obtain()` | Singleton | Yes | No |
| `obtainRaw()` | Singleton | No | No |
| `obtainNew()` | New each time | Yes | Yes |
| `obtainNewRaw()` | New each time | No | Yes |

## `obtain(ServiceClass)`

Get a shared singleton instance with reactivity preserved:

```typescript
import { attach, obtain } from 'iocraft';
import { ref } from 'vue';

@attach()
export class CounterService {
  count = ref(0);

  increment() {
    this.count.value++;
  }
}

const counter = obtain(CounterService);
const { count, increment } = counter;
```

## `obtainRaw(ServiceClass)`

Get a shared singleton instance without reactivity:

```typescript
import { attach, obtainRaw } from 'iocraft';

@attach()
export class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

const logger = obtainRaw(LoggerService);
```

## `obtainNew(ServiceClass)`

Get a new instance each time with reactivity and lifecycle hooks:

```typescript
import { attach, obtainNew } from 'iocraft';
import { ref } from 'vue';

@attach()
export class FormState {
  formData = ref({ name: '', email: '' });

  updateField(key: string, value: string) {
    this.formData.value[key] = value;
  }
}

const form1 = obtainNew(FormState);
const form2 = obtainNew(FormState);
```

## `obtainNewRaw(ServiceClass)`

Get a new instance without reactivity:

```typescript
import { attach, obtainNewRaw } from 'iocraft';

@attach()
export class UtilityService {
  formatDate(date: Date) {
    return date.toLocaleDateString();
  }
}

const utility = obtainNewRaw(UtilityService);
```

## Lifecycle Hooks

Lifecycle hooks only work with `obtainNew()` and `obtainNewRaw()`:

```typescript
import { attach, obtainNew } from 'iocraft';
import { ref } from 'vue';

@attach()
class DataService implements OnMounted, OnUnmounted {
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

// Hooks will run
const service = obtainNew(DataService);
```

## In Components

```vue
<script setup>
import { obtain, obtainNew } from 'iocraft';
import { CounterService } from './CounterService';
import { FormState } from './FormState';

// Singleton - shared across components
const { count, increment } = obtain(CounterService);

// New instance - unique to this component
const { formData, updateField } = obtainNew(FormState);
</script>
```

## Related

- [`@attach()`](./attach)
- [Service Registration](/core-concepts/service-registration)
