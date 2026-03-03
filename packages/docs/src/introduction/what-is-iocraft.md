# What is iocraft?

iocraft is a lightweight dependency injection container for Vue 3.

## Features

- Services with `@attach()` decorator
- Reactive by default
- Vue Composition API integration
- Built-in task system for async operations

## Basic Usage

```typescript
import { attach } from 'iocraft';
import { ref } from 'vue';

@attach()
export class CounterService {
  count = ref(0);
  
  increment() {
    this.count.value++;
  }
}
```

```vue
<script setup>
import { obtain } from 'iocraft';

const { count, increment } = obtain(CounterService);
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

## Next Steps

- [Getting Started](./getting-started)
