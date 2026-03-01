# Task - User Side Examples

Quick reference for how to use the task system.

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

  <div v-if="userTask.isLoading">Loading...</div>
  <div v-else-if="userTask.error">{{ userTask.error.message }}</div>
  <div v-else-if="userTask.data">
    <h2>{{ userTask.data.name }}</h2>
  </div>
</template>
```

## Reactive State & Methods

```typescript
const userTask = task({ fn: myAsyncFn })

// Reactive state (use .value in setup, direct in templates)
userTask.data.value        // T | undefined
userTask.error.value       // Error | undefined
userTask.status.value      // 'idle' | 'loading' | 'success' | 'error'
userTask.isLoading         // ComputedRef<boolean>
userTask.isSuccess         // ComputedRef<boolean>
userTask.isError           // ComputedRef<boolean>
userTask.isIdle            // ComputedRef<boolean>
userTask.initialized.value // boolean

// Methods
await userTask.run(...args)     // Execute (with debounce if configured)
await userTask.start(...args)   // Execute once (respects initialized state)
userTask.stop()                 // Cancel current execution (requires key)
userTask.clear()                // Clear data and error
userTask.reset()                // Reset to initial state
userTask.dispose()              // Clean up all resources
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
  <div v-if="searchTask.isLoading">Searching...</div>
  <ul v-else-if="searchTask.data">
    <li v-for="item in searchTask.data" :key="item.id">
      {{ item.name }}
    </li>
  </ul>
</template>
```

### Form Submission with Retry

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
  retry: { count: 2, delay: 1000, backoff: true },
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
    <button type="submit" :disabled="loginTask.isLoading">
      {{ loginTask.isLoading ? 'Logging in...' : 'Login' }}
    </button>
  </form>
  <div v-if="loginTask.error">{{ loginTask.error.message }}</div>
</template>
```

### Request Cancellation with Timeout

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
  timeout: 5000, // Abort after 5 seconds
})
</script>

<template>
  <button @click="fetchTask.run(1)">Fetch</button>
  <button @click="fetchTask.stop()">Stop</button>
</template>
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

### Auto-Run with Watch

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
  watch: {
    deps: () => [userId.value],
    immediate: true,
  },
})
</script>

<template>
  <button @click="userId++">Next User</button>
  <div v-if="userTask.data">{{ userTask.data.name }}</div>
</template>
```

### Lifecycle Callbacks

```typescript
const dataTask = task({
  fn: fetchData,
  onLoading: () => console.log('Loading...'),
  onSuccess: (data) => console.log('Success:', data),
  onError: (error) => console.error('Error:', error),
  onFinally: ({ data, error }) => console.log('Done', { data, error }),
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

### Using start() for One-Time Execution

```typescript
const lazyTask = task({
  fn: fetchData,
})

// start() only executes if not initialized
await lazyTask.start()

// Subsequent start() calls return current state
await lazyTask.start() // Returns [data, error] immediately
```

## Options Reference

```typescript
task({
  key?: string | number | symbol,  // Required for stop() cancellation
  fn: AsyncFn,                     // Required
  debounce?: number,               // ms - debounce run() calls
  timeout?: number,                // ms - abort after timeout
  retry?: {
    count: number,    // Number of retries
    delay?: number,   // Base delay in ms
    backoff?: boolean, // Exponential backoff
  },
  polling?: {
    interval: number, // ms - poll after success
  },
  watch?: {
    deps: () => Parameters<TFn>,
    immediate?: boolean,
  },
  onLoading?: () => void,
  onSuccess?: (data: T) => void,
  onError?: (error: Error) => void,
  onFinally?: ({ data, error }) => void,
})
```

## Notes

- Use `.value` for refs (`data`, `error`, `status`, `initialized`) in script
- Templates auto-unwrap refs - use `task.isLoading` not `task.isLoading.value`
- `run()` always executes; `start()` respects `initialized` state
- `stop()` and `timeout` require a `key` to work with `abortable()`
