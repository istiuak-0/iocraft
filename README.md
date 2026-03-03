# iocraft

Dependency Injection for Vue 3.

## Installation

```bash
npm install iocraft
```

## Quick Start

### Create a Service

```typescript
import { attach } from "iocraft";
import { ref } from "vue";

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
import { obtain } from "iocraft";

const { count, increment } = obtain(CounterService);
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>
```

## License

MIT
