# Dependency Injection

How to inject services into components.

## obtain() - Singleton

Get a shared instance with reactivity preserved:

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

const { count, increment } = obtain(CounterService);
```

## obtainRaw() - Singleton without Reactivity

```typescript
import { attach, obtainRaw } from 'iocraft';

@attach()
export class LoggerService {
  log(message: string) {
    console.log(message);
  }
}

const { log } = obtainRaw(LoggerService);
```

## obtainNew() - New Instance

Get a new instance with reactivity and lifecycle hooks:

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

const form = obtainNew(FormState);
```

## obtainNewRaw() - New Instance without Reactivity

```typescript
import { attach, obtainNewRaw } from 'iocraft';

@attach()
export class UtilityService {
  formatDate(date: Date) {
    return date.toLocaleDateString();
  }
}

const { formatDate } = obtainNewRaw(UtilityService);
```

## Context Injection

### Expose to Children

```vue
<script setup>
import { attach, obtain, exposeCtx } from 'iocraft';
import { ref } from 'vue';

@attach()
class DataService {
  data = ref([]);
}

const service = obtain(DataService);
exposeCtx(service);
</script>
```

### Obtain from Parent

```vue
<script setup>
import { attach, obtainCtx } from 'iocraft';

@attach()
class DataService {}

const service = obtainCtx(DataService);
</script>
```

## Comparison

| Method | Instance | Reactivity | Lifecycle Hooks |
|--------|----------|------------|-----------------|
| `obtain()` | Singleton | Yes | No |
| `obtainRaw()` | Singleton | No | No |
| `obtainNew()` | New | Yes | Yes |
| `obtainNewRaw()` | New | No | Yes |

## Related

- [`@attach()`](/api/attach)
- [`obtain` Methods](/api/obtain-methods)
