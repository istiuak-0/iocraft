# attach

The `@attach()` decorator marks a class as a service. It is required for proper dependency injection.

## Usage

```typescript
import { attach } from 'iocraft';

@attach()
export class MyService {
  // Service implementation
}
```

## Required for DI

The `@attach()` decorator must be used on all service classes:

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

Without `@attach()`, the service cannot be obtained:

```typescript
// Missing @attach() - will throw error
export class BadService {}

const service = obtain(BadService); // Error: not decorated with @attach()
```

## With Reactive State

```typescript
import { attach } from 'iocraft';
import { ref, computed } from 'vue';

@attach()
export class UserService {
  users = ref([
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' },
  ]);

  get userCount() {
    return computed(() => this.users.value.length);
  }

  addUser(name: string) {
    const newUser = { id: Date.now(), name };
    this.users.value.push(newUser);
  }

  removeUser(id: number) {
    this.users.value = this.users.value.filter(u => u.id !== id);
  }
}
```

## With task()

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

## With Lifecycle Hooks

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

  cleanup() {
    this.data.value = [];
  }
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

  addItem(item: { id: number; price: number }) {
    this.update({
      items: [...this.state.items, item],
      total: this.state.total + item.price,
    });
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

  logout() {
    this.user.value = null;
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

## Nav Service

The built-in `Nav` service uses `@attach()` internally:

```typescript
import { Nav } from 'iocraft';

const nav = obtain(Nav);
nav.push('/home');
```

## Related

- [`obtain` Methods](./obtain-methods)
- [Service Registration](/core-concepts/service-registration)
