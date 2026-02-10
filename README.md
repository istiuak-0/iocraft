# iocraft

A lightweight dependency injection container for Vue 3. *(Beta)*

## Installation

```bash
npm install iocraft
```

*Note: iocraft is currently in beta. The API is stable but may evolve.*

## Quick Start

### 1. Create a Service

Create a service class and decorate it with `@Register()`:

```typescript
import { Register } from 'iocraft';

@Register()
export class UserService {
  users = [
    { id: 1, name: 'John' },
    { id: 2, name: 'Jane' }
  ];

  getUsers() {
    return this.users;
  }

  addUser(name: string) {
    const newUser = { id: this.users.length + 1, name };
    this.users.push(newUser);
    return newUser;
  }
}
```

### 2. Use in Components

Get your service in any component:

```vue
<script setup>
import { onMounted } from 'vue';
import { obtain } from 'iocraft';
import { UserService } from './services/UserService';

// Get the service instance
const userService = obtain(UserService);

// Destructure with reactivity preserved
const { users, addUser } = userService;

onMounted(() => {
  console.log(users); // Works!
});
</script>

<template>
  <div>
    <ul>
      <li v-for="user in users" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
    <button @click="addUser('New User')">Add User</button>
  </div>
</template>
```

## Four Ways to Get Services

There are four ways to get services, each with different behavior:

- `obtain(Service)` - Single shared instance, reactive when destructured
- `obtainRaw(Service)` - Single shared instance, NOT reactive when destructured
- `obtainInstance(Service)` - New instance each time, reactive when destructured
- `obtainRawInstance(Service)` - New instance each time, NOT reactive when destructured


Use `obtain()` and `obtainInstance()` when you want to destructure services and keep reactivity!

```javascript
// Keeps reactivity after destructuring
const { count, increment } = obtain(CounterService);

// Loses reactivity after destructuring
const { count, increment } = obtainRaw(CounterService);
```

## Lifecycle Hooks

Services can use Vue lifecycle hooks. They only work when using `obtainInstance()` or `obtainRawInstance()` inside a component:

```typescript
@Register()
export class DataService {
  data = [];

  // This runs when the component mounts
  onMounted() {
    this.loadData();
  }

  // This runs when the component unmounts
  onUnmounted() {
    console.log('Cleaning up...');
  }

  loadData() {
    // Load data
  }
}

// Use inside a component setup function
const dataService = obtainInstance(DataService); // Lifecycle hooks will work
```

## Plugin Setup (Optional)

For router integration, register the plugin:

```javascript
import { createApp } from 'vue';
import { iocraft } from 'iocraft';
import { createRouter } from 'vue-router';

const app = createApp(App);

app.use(iocraft, {
  router, // Makes router available via Nav service
  eagerLoad: [UserService] // Pre-load services
});

app.mount('#app');
```

## API Reference

### `@Register()`

Mark a class as a service:

```typescript
import { Register } from 'iocraft';

@Register()
export class MyService {
  // Your service code
}
```

### Getting Services

#### `obtain(ServiceClass)`

Get a shared instance (singleton):

```javascript
const service = obtain(MyService);
```

#### `obtainRaw(ServiceClass)`

Get a shared instance without reactivity after destructuring:

```javascript
const service = obtainRaw(MyService);
```

#### `obtainInstance(ServiceClass)`

Get a new instance each time:

```javascript
const service = obtainInstance(MyService);
```

#### `obtainRawInstance(ServiceClass)`

Get a new instance without reactivity after destructuring:

```javascript
const service = obtainRawInstance(MyService);
```

### Other Functions

#### `obtainFromContext(ServiceClass)`

Get a service from the current component context:

```javascript
const service = obtainFromContext(ServiceClass);
```

#### `exposeToContext(serviceInstance)`

Share a service with child components:

```javascript
exposeToContext(serviceInstance);
```

#### `hasService(ServiceClass)`

Check if a service exists:

```javascript
if (hasService(MyService)) {
  // Service is registered
}
```

#### `unRegister(serviceInstance)`

Remove a service:

```javascript
unRegister(serviceInstance);
```

#### `clearRegistry()`

Remove all services:

```javascript
clearRegistry();
```

#### `onUnRegister` Interface

Implement cleanup when a service is unregistered:

```typescript
import { Register, OnUnRegister } from 'iocraft';

@Register()
export class ResourceService implements OnUnRegister {
  resources = [];
  
  onUnRegister() {
    // Cleanup resources when service is removed
    this.resources.forEach(resource => resource.destroy());
  }
}
```

### Helpers


#### `Nav`

Access router functionality:

```javascript
import { obtain } from 'iocraft';
import { Nav } from 'iocraft/helpers';

const nav = obtain(Nav);
nav.push('/home'); // Navigate
console.log(nav.path); // Current path
```

## Advanced Features

### Circular Dependencies

Handle circular dependencies with getters:

```typescript
@Register()
export class UserService {
  // Use getter to avoid circular dependency error
  private get authService() {
    return obtain(AuthService);
  }

  getCurrentUser() {
    return this.authService.getToken();
  }
}

@Register()
export class AuthService {
  private get userService() {
    return obtain(UserService);
  }

  login() {
    return this.userService.getCurrentUser();
  }
}
```

Don't use field initialization for circular deps:

```javascript
// Wrong - causes error
private authService = obtain(AuthService);

// Right - use getter
private get authService() {
  return obtain(AuthService);
}
```

### Component Context

Share services between parent and child components:

```javascript
// In parent component
const service = obtain(ServiceClass);
exposeToContext(service);

// In child component
const service = obtainFromContext(ServiceClass);
```

### Lifecycle Hooks

Services can use Vue lifecycle hooks. They only work when using `obtainInstance()` or `obtainRawInstance()` inside a component:

```typescript
@Register()
export class DataService {
  data = [];

  // Runs when component mounts
  onMounted() {
    this.loadData();
  }

  // Runs when component unmounts
  onUnmounted() {
    console.log('Cleaning up...');
  }

  loadData() {
    // Load data
  }
}

// Use inside a component setup function
const dataService = obtainInstance(DataService); // Lifecycle hooks will work
```

All Vue lifecycle hooks are supported: `onMounted`, `onUnmounted`, `onUpdated`, `onBeforeMount`, `onBeforeUpdate`, `onBeforeUnmount`, `onErrorCaptured`, `onRenderTracked`, `onRenderTriggered`, `onActivated`, `onDeactivated`, `onServerPrefetch`, `onScopeDispose`.

### Router Integration

Use the Nav service for router functionality:

```javascript
import { obtain } from 'iocraft';
import { Nav } from 'iocraft/helpers';

const nav = obtain(Nav);

// Navigate
nav.push('/home');
nav.replace('/about');

// Get route info
console.log(nav.path); // Current path
console.log(nav.params); // Route params
console.log(nav.query); // Query params
```

Register the plugin with your router:

```javascript
app.use(iocraft, {
  router, // Pass your Vue Router instance
  eagerLoad: [UserService] // Pre-load services
});
```

## Best Practices

- Use `@Register()` to mark your service classes
- Use `obtain()` for shared services across your app
- Use `obtainInstance()` for unique instances per component
- Destructure with `obtain()`/`obtainInstance()` to keep reactivity
- Use getters for circular dependencies (never field initialization)
- Put business logic in services, not components

## Examples

### Counter Service

```typescript
// services/CounterService.ts
import { Register } from 'iocraft';

@Register()
export class CounterService {
  count = 0;
  
  increment() {
    this.count++;
  }
  
  decrement() {
    this.count--;
  }
}
```

```vue
<!-- components/Counter.vue -->
<script setup>
import { computed } from 'vue';
import { obtain } from 'iocraft';
import { CounterService } from '../services/CounterService';

// Get service and destructure with reactivity preserved!
const { count, increment, decrement } = obtain(CounterService);

// You can still use computed properties with destructured values
const doubledCount = computed(() => count * 2);
</script>

<template>
  <div class="counter">
    <h2>Counter: {{ count }}</h2>
    <p>Doubled: {{ doubledCount }}</p>
    <button @click="increment">+</button>
    <button @click="decrement">-</button>
  </div>
</template>

<style scoped>
.counter {
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 4px;
}
</style>
```

### Service-to-Service Communication

```typescript
// services/AuthService.ts
import { Register } from 'iocraft';

@Register()
export class AuthService {
  isLoggedIn = false;
  currentUser = null;
  
  login(username, password) {
    // In a real app, you'd validate credentials
    this.isLoggedIn = true;
    this.currentUser = { id: 1, username };
    return true;
  }
  
  logout() {
    this.isLoggedIn = false;
    this.currentUser = null;
  }
  
  getToken() {
    return this.isLoggedIn ? 'fake-token' : null;
  }
}
```

```typescript
// services/UserService.ts
import { Register, obtain } from 'iocraft';
import { AuthService } from './AuthService';

@Register()
export class UserService {
  users = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' }
  ];
  
  // Use getter to avoid circular dependency
  private get authService() {
    return obtain(AuthService);
  }
  
  getUsers() {
    // Only return users if authenticated
    if (this.authService.isLoggedIn) {
      return this.users;
    }
    return [];
  }
  
  getCurrentUser() {
    if (!this.authService.isLoggedIn) {
      return null;
    }
    
    return this.users.find(u => u.id === this.authService.currentUser.id);
  }
}
```

```vue
<!-- components/UserList.vue -->
<script setup>
import { onMounted, ref } from 'vue';
import { obtain } from 'iocraft';
import { UserService } from '../services/UserService';
import { AuthService } from '../services/AuthService';

// Get both services
const userService = obtain(UserService);
const authService = obtain(AuthService);

// Destructure with reactivity preserved
const { users, getCurrentUser } = userService;
const { isLoggedIn, login, logout } = authService;

const currentUser = ref(null);

onMounted(() => {
  currentUser.value = getCurrentUser();
});

const handleLogin = () => {
  login('demo', 'password');
  currentUser.value = getCurrentUser();
};
</script>

<template>
  <div class="user-list">
    <div class="auth-section">
      <p>Logged in: {{ isLoggedIn }}</p>
      <p>Current user: {{ currentUser?.name || 'None' }}</p>
      <button v-if="!isLoggedIn" @click="handleLogin">Login as Demo</button>
      <button v-else @click="logout">Logout</button>
    </div>
    
    <div class="users-section">
      <h3>Users:</h3>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
        </li>
      </ul>
    </div>
  </div>
</template>
```

### Component Context Example

```vue
<!-- components/ParentComponent.vue -->
<script setup>
import { provide } from 'vue';
import { obtain, exposeToContext } from 'iocraft';
import { DataService } from '../services/DataService';

// Create a service instance
const dataService = obtain(DataService);

// Expose it to child components
exposeToContext(dataService);

// You can also destructure and use in this component
const { data, loadData } = dataService;
</script>

<template>
  <div>
    <h2>Parent Component</h2>
    <p>Data loaded: {{ data.length }}</p>
    <button @click="loadData">Load Data</button>
    
    <!-- Child components will have access to the exposed service -->
    <ChildComponent />
  </div>
</template>
```

```vue
<!-- components/ChildComponent.vue -->
<script setup>
import { obtainFromContext } from 'iocraft';
import { DataService } from '../services/DataService';

// Get the service from parent context
const dataService = obtainFromContext(DataService);

// Destructure with reactivity preserved
const { data, addItem } = dataService;
</script>

<template>
  <div class="child-component">
    <h3>Child Component</h3>
    <p>Items from parent service: {{ data.length }}</p>
    <button @click="addItem('Item from child')">Add Item from Child</button>
  </div>
</template>
```

### Lifecycle Hooks Example

```typescript
// services/ApiService.ts
import { Register } from 'iocraft';

@Register()
export class ApiService implements OnMounted, OnUnmounted {
  data = [];
  intervalId = null;
  
  async fetchData() {
    // Simulate API call
    console.log('Fetching data...');
    this.data = ['item1', 'item2', 'item3'];
  }
  
  // This runs when the service is attached to a component
  onMounted() {
    console.log('ApiService mounted to component');
    this.fetchData();
    
    // Set up periodic updates when attached to a component
    this.intervalId = setInterval(() => {
      console.log('Periodic update...');
    }, 5000);
  }
  
  // This runs when the component unmounts
  onUnmounted() {
    console.log('ApiService unmounted from component');
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

```vue
<!-- components/DataComponent.vue -->
<script setup>
import { obtainInstance } from 'iocraft'; // Use obtainInstance to get lifecycle hooks
import { ApiService } from '../services/ApiService';

// Use obtainInstance so lifecycle hooks work
const apiService = obtainInstance(ApiService);

// Destructure with reactivity preserved
const { data } = apiService;
</script>

<template>
  <div>
    <h2>Data Component</h2>
    <p>Loaded items: {{ data.length }}</p>
    <ul>
      <li v-for="item in data" :key="item">{{ item }}</li>
    </ul>
  </div>
</template>
```

## License

MIT