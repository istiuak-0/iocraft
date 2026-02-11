# iocraft Architecture & Usage Patterns

## Architecture Overview

iocraft is a lightweight dependency injection container designed specifically for Vue 3 applications. The architecture follows the Composition API paradigm and provides a clean way to manage services and their dependencies.

### Core Architecture Components

#### 1. Service Registration System
- **Decorator**: `@Register()` creates unique tokens for each service
- **Metadata Storage**: Uses Symbol-based metadata to store service tokens
- **Token Generation**: Each registered service gets a unique Symbol token

#### 2. Service Registry
- **RootRegistry**: A Map<symbol, object> that stores singleton instances
- **Creation Stack**: A Set<symbol> to detect circular dependencies during instantiation
- **Lifecycle Binding**: Automatically binds Vue lifecycle hooks to service instances

#### 3. Service Retrieval Layer
- **obtain()**: Returns reactive facade for singleton instances
- **obtainRaw()**: Returns raw singleton instance
- **obtainInstance()**: Creates new instance with reactive facade
- **obtainRawInstance()**: Creates new raw instance
- **Context-based**: obtainFromContext() and exposeToContext() for component hierarchies

#### 4. Reactive Facade System
- **Property Addition**: Adds both instance and prototype properties to facade
- **Method Binding**: Binds methods to service instance context
- **Getter/Setter Preservation**: Maintains reactivity for computed properties

## Detailed Architecture Flow

### Service Registration Flow
1. Developer decorates class with `@Register()`
2. Decorator creates unique Symbol token and attaches to constructor
3. Token is stored in SERVICE_METADATA symbol on constructor

### Service Retrieval Flow
1. `obtain(ServiceClass)` is called
2. Metadata is retrieved using `getServiceMetadata()`
3. Check if instance exists in RootRegistry
4. If not exists and not in creation stack:
   - Add token to creation stack (for circular dep detection)
   - Create new instance
   - Store in RootRegistry
   - Remove from creation stack
5. Create reactive facade from instance
6. Return facade

### Reactive Facade Creation
1. `createFacadeObj()` creates empty target object
2. `addInstanceProperties()` adds own properties with getters/setters
3. `addPrototypeProperties()` adds prototype methods with proper binding
4. Returns facade that preserves reactivity when destructured

## Usage Patterns

### 1. Basic Service Pattern
```typescript
@Register()
export class UserService {
  users = [{ id: 1, name: 'John' }];
  
  getUsers() {
    return this.users;
  }
  
  addUser(name: string) {
    const newUser = { id: this.users.length + 1, name };
    this.users.push(newUser);
    return newUser;
  }
}

// In component
const userService = obtain(UserService);
const { users, addUser } = userService; // Destructuring preserves reactivity
```

### 2. Service-to-Service Communication
```typescript
@Register()
export class AuthService {
  isLoggedIn = false;
  
  login() {
    this.isLoggedIn = true;
  }
}

@Register()
export class UserService {
  private get authService() {
    return obtain(AuthService); // Getter prevents circular dependency
  }
  
  getUsers() {
    if (this.authService.isLoggedIn) {
      return this.users;
    }
    return [];
  }
}
```

### 3. Lifecycle-Aware Services
```typescript
@Register()
export class DataService implements OnMounted, OnUnmounted {
  data = [];
  intervalId = null;

  onMounted() {
    this.loadData();
    this.intervalId = setInterval(() => {
      // Periodic updates
    }, 5000);
  }

  onUnmounted() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }
}

// Use with obtainInstance to trigger lifecycle hooks
const dataService = obtainInstance(DataService);
```

### 4. Component Context Sharing
```vue
<!-- Parent Component -->
<script setup>
import { obtain, exposeToContext } from 'iocraft';
import { DataService } from '../services/DataService';

const dataService = obtain(DataService);
exposeToContext(dataService); // Share with children
const { data, loadData } = dataService;
</script>

<!-- Child Component -->
<script setup>
import { obtainFromContext } from 'iocraft';
import { DataService } from '../services/DataService';

// Get service from parent context
const dataService = obtainFromContext(DataService);
const { data, addItem } = dataService;
</script>
```

### 5. State Management with Store Higher-Order Function
```typescript
// Store is a higher-order function that creates a base class with common state management methods
@Register()
export class AppStore extends Store({
  data: 'test',
  count: 0
}) {
  // All state management methods are available from the Store base class
  // This provides an easy way to do state management with proper methods
}

// The Store HOF provides methods like:
// - state: reactive state object
// - update(changes): updates state properties
// - pick(key): picks a specific state property
// - compute(fn): creates computed properties
// - observe(source, callback): watches state changes
// - effect(fn): runs side effects
// - reset(): resets to initial state
// - snapshot: gets a snapshot of current state
```

### 6. Router Integration
```typescript
// In main app setup
app.use(iocraft, { router });

// In components
import { obtain, Nav } from 'iocraft';
const nav = obtain(Nav);
nav.push('/home'); // Navigate
console.log(nav.path); // Current path
```

## Anti-Patterns to Avoid

### 1. Circular Dependencies with Field Initialization
```typescript
// ❌ DON'T DO THIS
@Register()
export class UserService {
  authService = obtain(AuthService); // Causes circular dependency error
}

@Register()
export class AuthService {
  userService = obtain(UserService); // Causes circular dependency error
}

// ✅ DO THIS INSTEAD
@Register()
export class UserService {
  private get authService() {
    return obtain(AuthService); // Use getter to avoid circular dependency
  }
}
```

### 2. Losing Reactivity When Destructuring
```typescript
// ❌ DON'T DO THIS
const userService = obtainRaw(UserService); // Raw instance loses reactivity when destructured
const { users, addUser } = userService; // Destructuring breaks reactivity

// ✅ DO THIS INSTEAD
const userService = obtain(UserService); // Reactive facade preserves reactivity
const { users, addUser } = userService; // Destructuring preserves reactivity
```

### 3. Improper Lifecycle Hook Usage
```typescript
// ❌ DON'T DO THIS
const userService = obtain(UserService); // Lifecycle hooks won't work with obtain()

// ✅ DO THIS INSTEAD
const userService = obtainInstance(UserService); // Lifecycle hooks work with instance methods
```

## Best Practices Summary

1. **Always use `@Register()`** to mark service classes
2. **Use `obtain()` for singleton services** shared across the app
3. **Use `obtainInstance()` for per-component instances** when you need lifecycle hooks
4. **Destructure with `obtain()`/`obtainInstance()`** to maintain reactivity
5. **Use getters for circular dependencies** (never field initialization)
6. **Implement `OnUnRegister` interface** for cleanup when services are unregistered
7. **Use `exposeToContext()` and `obtainFromContext()`** for parent-child communication
8. **Leverage the Store utility** for complex state management
9. **Integrate with Vue Router** using the Nav service
10. **Test services independently** using the different obtain methods as needed

## Performance Considerations

- Singleton services are instantiated only once and reused
- Reactive facades add minimal overhead compared to raw objects
- Creation stack prevents infinite loops in circular dependencies
- Lifecycle hooks are bound only when services are used in component context
- The registry uses efficient Map operations for storage/retrieval