# abortable()

The `abortable()` function creates or retrieves an `AbortController` for request cancellation.

## Usage

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class FetchService {
  readonly fetchUser = task({
    key: 'fetch-user',
    fn: async (id: number) => {
      const controller = abortable('fetch-user');
      
      const res = await fetch(`/api/users/${id}`, {
        signal: controller.signal,
      });
      return res.json();
    },
    timeout: 5000,
  });
}

const service = obtain(FetchService);
service.fetchUser.stop();
```

## How It Works

1. Create a task with a `key`
2. Call `abortable(key)` inside the function
3. Pass `controller.signal` to your async function
4. Call `stop()` to cancel

## API

### `abortable(key)`

**Parameters:**
- `key` - Unique identifier matching the task key

**Returns:** `AbortController`

**Throws:** Error if key is not registered

```typescript
const controller = abortable('my-request');
fetch('/api/data', { signal: controller.signal });
```

## Requirements

The key must be registered via `task()` first:

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class SearchService {
  readonly search = task({
    key: 'search',
    fn: async (query: string) => {
      const controller = abortable('search'); // Must match task key
      return fetch(`/api/search?q=${query}`, { signal: controller.signal });
    },
  });
}
```

## With Timeout

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class FetchService {
  readonly fetchData = task({
    key: 'fetch',
    fn: async () => {
      const controller = abortable('fetch');
      return fetch('/api/slow', { signal: controller.signal });
    },
    timeout: 5000,
  });
}
```

## Manual Cancellation

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class UploadService {
  readonly upload = task({
    key: 'upload',
    fn: async (file: File) => {
      const controller = abortable('upload');
      
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      return res.json();
    },
  });

  cancelUpload() {
    this.upload.stop();
  }
}
```

## Related

- [`task()`](./task)
- [`@attach()`](./attach)
