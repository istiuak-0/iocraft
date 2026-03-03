# iocraft

Dependency Injection for Vue 3.

## Installation

```bash
npm install iocraft
```

## Quick Start

### Create a Service

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

### Use in Components

```vue
<script setup>
import { obtain } from 'iocraft';

const { count, increment } = obtain(CounterService);
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

### Async with task()

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class SearchService {
  readonly search = task({
    key: 'search',
    fn: async (query: string) => {
      const controller = abortable('search');
      const res = await fetch(`/api/search?q=${query}`, { signal: controller.signal });
      return res.json();
    },
    debounce: 300,
    retry: { count: 2 },
  });
}
```

## Documentation

[View Full Documentation](https://iocraft.netlify.app)

## License

MIT
