# Service Registration

Services must be decorated with `@attach()` for proper dependency injection.

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

## Required Decorator

The `@attach()` decorator is required. Without it, services cannot be obtained:

```typescript
// Missing @attach() - will throw error
export class BadService {}

const service = obtain(BadService); // Error: not decorated with @attach()
```

## Reactive State

Use Vue's `ref` and `computed`:

```typescript
import { attach } from 'iocraft';
import { ref, computed } from 'vue';

@attach()
export class UserService {
  users = ref([]);
  
  get userCount() {
    return computed(() => this.users.value.length);
  }

  addUser(name: string) {
    this.users.value.push({ id: Date.now(), name });
  }
}
```

## Service Dependencies

Use `obtain()` inside getters to avoid circular dependencies:

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
export class UserService {
  private get authService() {
    return obtain(AuthService);
  }

  getCurrentUser() {
    return this.authService.user.value;
  }
}
```

## Lifecycle Hooks

Services can use Vue lifecycle hooks:

```typescript
import { attach } from 'iocraft';
import { ref } from 'vue';

@attach()
export class DataService implements OnMounted, OnUnmounted {
  data = ref([]);

  onMounted() {
    this.loadData();
  }

  onUnmounted() {
    this.cleanup();
  }

  async loadData() {
    const res = await fetch('/api/data');
    this.data.value = await res.json();
  }
}
```

Lifecycle hooks only run with `obtainNew()`:

```typescript
const service = obtainNew(DataService); // Hooks run
const singleton = obtain(DataService);  // Hooks don't run
```

## Async with task()

```typescript
import { attach, task, abortable } from 'iocraft';

@attach()
export class SearchService {
  readonly search = task({
    key: 'search',
    fn: async (query: string) => {
      const controller = abortable('search');
      const res = await fetch(`/api/search?q=${query}`, {
        signal: controller.signal,
      });
      return res.json();
    },
    debounce: 300,
    retry: { count: 2 },
  });
}
```

## With store()

```typescript
import { attach, store, task } from 'iocraft';

const BaseCartStore = store({
  items: [],
  total: 0,
});

@attach()
export class CartService extends BaseCartStore {
  readonly fetchCart = task({
    fn: async () => {
      const res = await fetch('/api/cart');
      return res.json();
    },
    onSuccess: (data) => {
      this.update({ items: data.items, total: data.total });
    },
  });
}
```

## Related

- [`@attach()`](/api/attach)
- [`obtain` Methods](/api/obtain-methods)
- [`task()`](/api/task)
