# Task

The `task()` function handles async operations with built-in state management, retry logic, debouncing, and cancellation.

## Basic Usage

```typescript
import { attach, task } from 'iocraft';

@attach()
export class UserService {
  readonly fetchUser = task({
    fn: async (id: number) => {
      const res = await fetch(`/api/users/${id}`);
      return res.json();
    },
  });
}

const userService = obtain(UserService);
await userService.fetchUser.run(1);
console.log(userService.fetchUser.data.value);
```

## Reactive State

| Property | Type | Description |
|----------|------|-------------|
| `data` | `Ref<T \| undefined>` | Result data |
| `error` | `Ref<Error \| undefined>` | Error object |
| `status` | `Ref<TaskStatus>` | `idle`, `loading`, `success`, `error` |
| `isLoading` | `ComputedRef<boolean>` | Loading state |
| `isSuccess` | `ComputedRef<boolean>` | Success state |
| `isError` | `ComputedRef<boolean>` | Error state |
| `isIdle` | `ComputedRef<boolean>` | Idle state |

## Methods

### `run(...args)`

Execute the task:

```typescript
const [data, error] = await searchTask.run('vue 3');
```

### `start(...args)`

Execute only if not already initialized:

```typescript
await userTask.start(1); // Executes
await userTask.start(1); // Returns cached data
```

### `stop()`

Cancel the current execution. Requires a `key`:

```typescript
const searchTask = task({
  key: 'search',
  fn: async (query) => { /* ... */ },
});

searchTask.stop();
```

### `reset()`

Clear all state:

```typescript
userTask.reset();
```

### `dispose()`

Clean up all resources:

```typescript
onUnmounted(() => {
  userTask.dispose();
});
```

## Options

### `fn`

The async function to execute:

```typescript
task({
  fn: async (id: number) => {
    const res = await fetch(`/api/users/${id}`);
    return res.json();
  },
});
```

### `key`

Unique identifier for cancellation:

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class SearchService {
  readonly search = task({
    key: 'search',
    fn: async (query: string) => {
      const controller = abortable('search');
      return fetch(`/api/search?q=${query}`, { signal: controller.signal });
    },
  });
}
```

### `debounce`

Debounce execution:

```typescript
task({
  fn: async (query) => { /* ... */ },
  debounce: 300,
});
```

### `timeout`

Abort after specified milliseconds:

```typescript
task({
  key: 'fetch',
  fn: async () => {
    const controller = abortable('fetch');
    return fetch('/api/slow', { signal: controller.signal });
  },
  timeout: 5000,
});
```

### `retry`

Retry failed executions:

```typescript
task({
  fn: async (file) => { /* ... */ },
  retry: {
    count: 3,
    delay: 1000,
    backoff: true,
  },
});
```

### `track`

Auto-execute when reactive dependencies change:

```typescript
import { ref } from 'vue';

const userId = ref(1);

const userTask = task({
  fn: async (id) => fetch(`/api/users/${id}`).then(r => r.json()),
  track: {
    deps: () => [userId.value],
    immediate: true,
  },
});
```

## Lifecycle Callbacks

```typescript
task({
  fn: fetchData,
  onLoading: () => { console.log('Loading'); },
  onSuccess: (data) => { console.log('Success:', data); },
  onError: (error) => { console.error('Error:', error); },
  onFinally: ({ data, error }) => { console.log('Done'); },
});
```

## Examples

### Search with Debounce

```typescript
import { attach, task } from 'iocraft';

@attach()
export class SearchService {
  readonly search = task({
    fn: async (query: string) => {
      const res = await fetch(`/api/search?q=${query}`);
      return res.json();
    },
    debounce: 300,
  });
}
```

### Form Submission with Retry

```typescript
import { attach, task } from 'iocraft';

@attach()
export class LoginService {
  readonly login = task({
    fn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return res.json();
    },
    retry: { count: 2, delay: 1000, backoff: true },
  });
}
```

### Request Cancellation

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class FetchService {
  readonly fetchUser = task({
    key: 'fetch-user',
    fn: async (id: number) => {
      const controller = abortable('fetch-user');
      return fetch(`/api/users/${id}`, { signal: controller.signal });
    },
    timeout: 5000,
  });
}

const service = obtain(FetchService);
service.fetchUser.stop();
```

### Auto-Run with Track

```typescript
import { attach, task } from 'iocraft';
import { ref } from 'vue';

const userId = ref(1);

@attach()
export class UserService {
  readonly fetchUser = task({
    fn: async (id: number) => fetch(`/api/users/${id}`).then(r => r.json()),
    track: {
      deps: () => [userId.value],
      immediate: true,
    },
  });
}

userId.value = 2; // Automatically triggers fetchUser.run(2)
```

### Pause/Resume Tracking

```typescript
const userTask = task({
  fn: async (id: number) => fetch(`/api/users/${id}`).then(r => r.json()),
  track: {
    deps: () => [userId.value],
  },
});

userTask.tracker?.pause();
userTask.tracker?.resume();
```

## Related

- [`abortable()`](./abortable)
- [`@attach()`](./attach)
