# Helper Services

Built-in helper services.

## Nav

Navigation service for router integration.

### Setup

```typescript
import { createApp } from 'vue';
import { createRouter } from 'vue-router';
import { iocraft } from 'iocraft';

const router = createRouter({
  history: createWebHistory(),
  routes: [/* your routes */],
});

const app = createApp(App);
app.use(iocraft, { router });
```

### Usage

```typescript
import { Nav, attach } from 'iocraft';
import { obtain } from 'iocraft';

@attach()
export class MyService {}

const nav = obtain(Nav);
```

### Methods

```typescript
nav.push('/home');
nav.replace('/about');
nav.back();
nav.forward();
nav.go(-1);
```

### Reactive Properties

```typescript
nav.path;
nav.name;
nav.params;
nav.query;
nav.hash;
nav.fullPath;
nav.matched;
nav.meta;
```

### Example

```typescript
import { attach, task } from 'iocraft';

@attach()
export class AuthService {
  readonly login = task({
    fn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      return res.json();
    },
    onSuccess: () => {
      const nav = obtain(Nav);
      nav.push('/dashboard');
    },
  });
}
```

## store

Create a reactive store.

### Basic Usage

```typescript
import { attach, store } from 'iocraft';
import { ref } from 'vue';

const BaseCounterStore = store({
  count: 0,
});

@attach()
export class CounterService extends BaseCounterStore {
  increment() {
    this.update({ count: this.state.count + 1 });
  }

  decrement() {
    this.update({ count: this.state.count - 1 });
  }
}

const counter = new CounterService();
counter.increment();
```

### State Access

```typescript
const counter = new CounterService();

// Access state
counter.state.count;

// Update state
counter.update({ count: 5 });

// Get single value
counter.pick('count');

// Reset to initial
counter.reset();
```

### Computed Properties

```typescript
@attach()
export class CounterService extends BaseCounterStore {
  get doubled() {
    return this.compute((s) => s.count * 2);
  }
}
```

### Watch State

```typescript
@attach()
export class CounterService extends BaseCounterStore {
  setupWatcher() {
    this.observe('count', (newVal, oldVal) => {
      console.log('Count changed:', newVal);
    });
  }
}
```

### Effect

```typescript
@attach()
export class CounterService extends BaseCounterStore {
  setupEffect() {
    this.effect((s) => {
      console.log('Count is:', s.count);
    });
  }
}
```

### With task()

```typescript
import { attach, store, task } from 'iocraft';

const BaseUserStore = store({
  users: [],
  loading: false,
});

@attach()
export class UserService extends BaseUserStore {
  readonly fetchUsers = task({
    fn: async () => {
      const res = await fetch('/api/users');
      return res.json();
    },
    onLoading: () => this.update({ loading: true }),
    onSuccess: (data) => this.update({ users: data, loading: false }),
    onError: () => this.update({ loading: false }),
  });
}
```

## Related

- [`task()`](./task)
- [`@attach()`](./attach)
