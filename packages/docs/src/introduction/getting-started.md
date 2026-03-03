# Getting Started

## Installation

```bash
npm install iocraft
```

## Create a Service

```typescript
import { attach } from 'iocraft';
import { ref } from 'vue';

@attach()
export class CounterService {
  count = ref(0);

  increment() {
    this.count.value++;
  }

  decrement() {
    this.count.value--;
  }
}
```

## Use in Components

```vue
<script setup>
import { obtain } from 'iocraft';
import { CounterService } from './CounterService';

const { count, increment, decrement } = obtain(CounterService);
</script>

<template>
  <div>
    <h2>Count: {{ count }}</h2>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
  </div>
</template>
```

## Async with task()

```typescript
import { attach, task } from 'iocraft';

@attach()
export class PostService {
  readonly fetchPosts = task({
    fn: async () => {
      const res = await fetch('/api/posts');
      return res.json();
    },
    retry: { count: 2 },
  });
}
```

```vue
<script setup>
import { obtain } from 'iocraft';
import { PostService } from './PostService';

const postService = obtain(PostService);
postService.fetchPosts.run();
</script>

<template>
  <div>
    <div v-if="postService.fetchPosts.isLoading">Loading...</div>
    <div v-else-if="postService.fetchPosts.error">
      Error: {{ postService.fetchPosts.error.message }}
    </div>
    <ul v-else-if="postService.fetchPosts.data">
      <li v-for="post in postService.fetchPosts.data" :key="post.id">
        {{ post.title }}
      </li>
    </ul>
  </div>
</template>
```

## Service Dependencies

```typescript
import { attach, obtain } from 'iocraft';
import { ref } from 'vue';

@attach()
export class AuthService {
  user = ref(null);

  login(username: string, password: string) {
    this.user.value = { username };
  }
}

@attach()
export class PostService {
  private get authService() {
    return obtain(AuthService);
  }

  readonly fetchPosts = task({
    fn: async () => {
      if (!this.authService.user.value) {
        throw new Error('Not authenticated');
      }
      const res = await fetch('/api/posts');
      return res.json();
    },
  });
}
```

## Next Steps

- [Service Registration](/core-concepts/service-registration)
- [Dependency Injection](/core-concepts/dependency-injection)
- [Task System](/api/task)
