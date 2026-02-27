# Task - User Side Examples

Quick reference for how users will interact with the task system.

## Basic Usage

```html
<script setup lang="ts">
import { task } from 'iocraft'

async function fetchUser(id: number) {
  const response = await fetch(`/api/users/${id}`)
  if (!response.ok) throw new Error('Failed to fetch')
  return response.json()
}

const userTask = task({
  fn: fetchUser,
})
</script>

<template>
  <button @click="userTask.run(1)">Fetch User</button>
  
  <div v-if="userTask.isLoading.value">Loading...</div>
  <div v-else-if="userTask.error.value">{{ userTask.error.value.message }}</div>
  <div v-else-if="userTask.data.value">
    <h2>{{ userTask.data.value.name }}</h2>
  </div>
</template>
```

## What Users Get

```typescript
const task = task({ fn: myAsyncFn })

// Reactive state
task.data.value        // T | undefined
task.error.value       // Error | undefined
task.status.value      // 'idle' | 'loading' | 'success' | 'error'
task.isLoading.value   // boolean
task.isSuccess.value   // boolean
task.isError.value     // boolean
task.isIdle.value      // boolean
task.initialized.value // boolean

// Methods
await task.run(...args)     // Execute (with debounce if configured)
await task.start(...args)   // Execute once (respects lazy)
task.stop()                 // Cancel current execution
task.clear()                // Clear data and error
task.reset()                // Reset to initial state
task.dispose()              // Clean up all resources
```

## Examples

### Search with Debounce

```html
<script setup lang="ts">
import { task } from 'iocraft'

const searchTask = task({
  fn: async (query: string) => {
    const res = await fetch(`/api/search?q=${query}`)
    return res.json()
  },
  debounce: 300,
})
</script>

<template>
  <input @input="searchTask.run($event.target.value)" />
  <div v-if="searchTask.isLoading.value">Searching...</div>
  <ul v-else-if="searchTask.data.value">
    <li v-for="item in searchTask.data.value" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

### Form Submission

```html
<script setup lang="ts">
import { ref } from 'vue'
import { task } from 'iocraft'

const form = ref({ email: '', password: '' })

const loginTask = task({
  fn: async (credentials: typeof form.value) => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    })
    if (!response.ok) throw new Error('Login failed')
    return response.json()
  },
  retry: { count: 2 },
})

async function handleSubmit() {
  const [data, error] = await loginTask.run(form.value)
  if (error) return
  // Navigate to dashboard
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <input v-model="form.email" type="email" />
    <input v-model="form.password" type="password" />
    <button type="submit" :disabled="loginTask.isLoading.value">
      {{ loginTask.isLoading.value ? 'Logging in...' : 'Login' }}
    </button>
  </form>
  <div v-if="loginTask.error.value">{{ loginTask.error.value.message }}</div>
</template>
```

### Request Cancellation

```html
<script setup lang="ts">
import { task, abortable } from 'iocraft'

const fetchTask = task({
  key: 'user-fetch',
  fn: async (id: number) => {
    const controller = abortable('user-fetch')
    const response = await fetch(`/api/users/${id}`, {
      signal: controller.signal,
    })
    return response.json()
  },
})
</script>

<template>
  <button @click="fetchTask.run(1)">Fetch</button>
  <button @click="fetchTask.stop()">Stop</button>
</template>
```

### Retry with Backoff

```typescript
const apiTask = task({
  fn: async () => {
    const response = await fetch('/api/unstable')
    return response.json()
  },
  retry: {
    count: 3,
    delay: 1000,
    backoff: true, // 1s, 2s, 4s
  },
})
```

### Polling

```typescript
const messagesTask = task({
  fn: async () => {
    const response = await fetch('/api/messages')
    return response.json()
  },
  polling: {
    interval: 5000, // Poll every 5 seconds
  },
})
```

### Timeout

```typescript
const slowTask = task({
  key: 'slow-op',
  fn: async () => {
    const controller = abortable('slow-op')
    const response = await fetch('/api/slow', {
      signal: controller.signal,
    })
    return response.json()
  },
  timeout: 5000, // Abort after 5 seconds
})
```

### Auto-Run with Track

```html
<script setup lang="ts">
import { ref } from 'vue'
import { task } from 'iocraft'

const userId = ref(1)

const userTask = task({
  fn: async (id: number) => {
    const response = await fetch(`/api/users/${id}`)
    return response.json()
  },
  track: () => [userId.value], // Auto-run when userId changes
})
</script>

<template>
  <button @click="userId++">Next User</button>
  <div v-if="userTask.data.value">{{ userTask.data.value.name }}</div>
</template>
```

### Lifecycle Callbacks

```typescript
const dataTask = task({
  fn: fetchData,
  onLoading: () => console.log('Loading...'),
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
  onFinally: ({ data, error }) => console.log('Done'),
})
```

### Parallel Requests

```typescript
const userTask = task({ fn: fetchUser })
const postsTask = task({ fn: fetchPosts })

await Promise.all([
  userTask.run(1),
  postsTask.run(1),
])

// Access results
const user = userTask.data.value
const posts = postsTask.data.value
```

### Sequential Requests

```typescript
const fetchUser = task({ fn: fetchUserFn })
const fetchPosts = task({ fn: fetchPostsFn })

async function loadUserWithPosts(userId: number) {
  const [user] = await fetchUser.run(userId)
  if (user) {
    await fetchPosts.run(user.id)
  }
}
```

### Lazy Execution

```typescript
const lazyTask = task({
  fn: fetchData,
  lazy: true, // Won't run until manually started
})

// Manually start
lazyTask.run()
```

## Options Reference

```typescript
task({
  key?: string | number | symbol,  // For cancellation
  fn: AsyncFn,                     // Required
  lazy?: boolean,                  // Don't auto-execute
  debounce?: number,               // ms
  timeout?: number,                // ms
  retry?: {
    count: number,
    delay?: number,
    backoff?: boolean,
  },
  initialArgs?: Parameters<TFn>,
  track?: () => Parameters<TFn>,
  onLoading?: () => void,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void,
  onFinally?: ({ data, error }) => void,
})
```
