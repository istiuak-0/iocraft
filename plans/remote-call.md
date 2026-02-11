# iocraft Remote Call API - Refined Implementation Plan

## Overview
This document outlines the refined plan for implementing a lean, single-function reactive data fetching API for iocraft called `remoteCall`. Rather than building a full-featured library, this approach creates a simple helper function similar to `Store` and `Nav` that handles both queries and mutations.

## Goals
1. Create a single, lean function similar to `Store` and `Nav` helpers
2. Handle both queries and mutations through one unified API
3. Support both imperative and declarative data fetching
4. Provide automatic refetching based on reactive dependencies
5. Maintain compatibility with existing iocraft patterns
6. Ensure destructure-friendly API that preserves reactivity

## Proposed API Surface

### Core Function
```typescript
remoteCall(config: RemoteCallConfig<T>): RemoteCallResult<T>
```

### Configuration Options
```typescript
interface RemoteCallConfig<T> {
  // Reactive dependencies that trigger refetch when changed
  track?: Array<Ref<any> | ComputedRef<any> | Reactive<any>>;
  
  // The function to execute (can be query or mutation)
  fn: () => Promise<T>;
  
  // Whether to execute immediately when created
  immediate?: boolean;
  
  // When to execute the call (overrides immediate)
  callWhen?: 'immediate' | 'firstAccess' | 'manual';
  
  // Additional options
  enabled?: Ref<boolean>;           // Conditionally enable/disable
  refetchOnReconnect?: boolean;    // Auto-refetch on network reconnect
  retry?: number;                  // Number of retry attempts
  staleTime?: number;              // Time in ms after which data becomes stale
}
```

### Returned Result
```typescript
interface RemoteCallResult<T> {
  // Reactive state properties
  data: Ref<T | undefined>;        // The result data
  loading: Ref<boolean>;           // Loading state
  error: Ref<Error | null>;       // Error state
  status: Ref<'idle' | 'loading' | 'success' | 'error'>; // Request status
  
  // Methods
  call: () => Promise<T>;          // Imperatively trigger the call
  recall: () => Promise<T>;        // Force refetch regardless of cache
  refresh: () => Promise<T>;       // Alias for recall
  reset: () => void;               // Reset to initial state
  setError: (error: Error | null) => void; // Manually set error state
}
```

## Usage Examples

### Basic Query Usage
```typescript
@Register()
export class UserService {
  userId = ref(1);
  
  userData = remoteCall({
    track: [this.userId],  // Will refetch when userId changes
    fn: () => fetch(`/api/users/${this.userId.value}`).then(r => r.json()),
    immediate: true
  });
  
  // Alternative with callWhen
  profileData = remoteCall({
    track: [this.userId],
    fn: () => fetch(`/api/profile/${this.userId.value}`).then(r => r.json()),
    callWhen: 'firstAccess'  // Only calls when data is first accessed
  });
}
```

### Mutation Usage
```typescript
@Register()
export class UserService {
  createUser = remoteCall({
    fn: (userData) => fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    }).then(r => r.json()),
    callWhen: 'manual'  // Only called imperatively
  });
  
  updateUser = remoteCall({
    fn: ({id, userData}) => fetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    }).then(r => r.json()),
    callWhen: 'manual'
  });
}
```

### Component Usage
```vue
<script setup>
import { obtain } from 'iocraft';
import { UserService } from '../services/UserService';

const userService = obtain(UserService);

// Destructure with reactivity preserved
const { userData: { data, loading, error, call, recall } } = userService;

// Access the data
console.log(data.value);  // Reactive data
console.log(loading.value); // Reactive loading state

// Imperatively call or recall
await call();  // Trigger the call
await recall(); // Force refetch
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>{{ data }}</div>
    
    <button @click="recall">Refresh</button>
  </div>
</template>
```

### Advanced Usage with Store Integration
```typescript
@Register()
export class UserStore extends Store({ users: [], currentUser: null }) {
  usersQuery = remoteCall({
    fn: () => fetch('/api/users').then(r => r.json()),
    callWhen: 'immediate',
    enabled: computed(() => this.state.currentUser !== null)
  });
  
  // Update store when query succeeds
  constructor() {
    super();
    this.usersQuery.call().then(result => {
      this.update({ users: result });
    });
  }
}
```

## Implementation Architecture

### 1. Core Module Structure
```
packages/iocraft/src/
├── core/
│   └── remote-call.ts    # Main remoteCall implementation
└── helpers/
    └── remote-call.ts    # Export for helpers index
```

### 2. Internal Components
- **Reactive Tracker**: Watches the `track` array for changes and triggers refetch
- **Execution Manager**: Handles the actual function execution with loading/error states
- **Cache Manager**: Simple caching mechanism with TTL based on staleTime
- **State Manager**: Maintains reactive state (data, loading, error, status)

### 3. Integration Points
- Leverages existing iocraft facade system for reactivity preservation
- Uses Vue's reactivity system (refs, computed, watch) internally
- Compatible with existing service patterns and lifecycle hooks

## Key Features

### 1. Automatic Refetching
- Monitors reactive dependencies in the `track` array
- Automatically re-executes the function when tracked values change
- Prevents unnecessary calls with proper equality checking

### 2. Flexible Execution Timing
- `immediate`: Executes right away when created
- `firstAccess`: Executes when result data is first accessed
- `manual`: Only executes when `call()` or `recall()` is invoked

### 3. Unified Query/Mutation Pattern
- Single API handles both data fetching and mutations
- Differentiated by `callWhen` option and usage pattern
- Consistent return type with reactive state and methods

### 4. Reactivity Preservation
- All returned properties remain reactive when destructured
- Compatible with iocraft's existing facade system
- Maintains Vue's reactivity chain

## Benefits Over Full Library Approach
1. **Simplicity**: Single function instead of multiple specialized functions
2. **Size**: Minimal footprint, similar to other helpers
3. **Consistency**: Follows same patterns as Store and Nav
4. **Flexibility**: Handles both queries and mutations with same API
5. **Integration**: Seamless with existing iocraft patterns

## Technical Considerations

### Memory Management
- Proper cleanup of watchers when services are unregistered
- Efficient cache management with configurable TTL
- Prevention of memory leaks in long-lived applications

### Error Handling
- Consistent error state management
- Configurable retry logic
- Proper error propagation to consuming components

### Performance
- Smart dependency tracking to avoid unnecessary refetches
- Efficient state updates using Vue's batching
- Minimal overhead when not actively watching

This refined approach provides a lean, focused solution that aligns with iocraft's philosophy of simple, composable helpers rather than comprehensive libraries.