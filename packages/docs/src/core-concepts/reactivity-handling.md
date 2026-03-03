# Reactivity Handling

iocraft preserves Vue's reactivity system.

## Reactive State in Services

Use Vue's `ref` and `computed`:

```typescript
import { attach } from 'iocraft';
import { ref, computed } from 'vue';

@attach()
export class CounterService {
  count = ref(0);
  
  get doubled() {
    return computed(() => this.count.value * 2);
  }

  increment() {
    this.count.value++;
  }
}
```

## Destructuring with Reactivity

`obtain()` and `obtainNew()` preserve reactivity when destructuring:

```typescript
import { obtain } from 'iocraft';

const { count, doubled, increment } = obtain(CounterService);

// count.value updates trigger UI updates
```

## In Templates

```vue
<script setup>
import { obtain } from 'iocraft';
import { CounterService } from './CounterService';

const { count, doubled, increment } = obtain(CounterService);
</script>

<template>
  <div>
    <p>Count: {{ count }}</p>
    <p>Doubled: {{ doubled }}</p>
    <button @click="increment">+</button>
  </div>
</template>
```

## Without Reactivity

Use `obtainRaw()` or `obtainNewRaw()` when you don't need reactivity:

```typescript
import { obtainRaw } from 'iocraft';

const { log } = obtainRaw(LoggerService);
```

## store() Reactivity

The `store()` function provides reactive state management:

```typescript
import { attach, store } from 'iocraft';

const BaseCounterStore = store({ count: 0 });

@attach()
export class CounterService extends BaseCounterStore {
  increment() {
    this.update({ count: this.state.count + 1 });
  }
  
  get doubled() {
    return this.compute((s) => s.count * 2);
  }
}
```

## Related

- [`@attach()`](/api/attach)
- [`store`](/api/helper-services)
