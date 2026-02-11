# iocraft Data Fetching API - Version 3.0

## Overview
This document outlines a refined plan for a simple function-based reactive data fetching API for iocraft that can optionally integrate with the Store base class. The API is a single function that eliminates repetitive boilerplate for loading/error states while providing seamless integration with existing Store functionality.

## Goals
1. Create a simple function (not a base class) for data fetching
2. Provide optional integration with Store base class
3. Eliminate repetitive loading/error state boilerplate
4. Maintain a streamlined, cohesive API surface
5. Enable rapid development with feature-rich options

## Proposed API: `defineResource`

A simple function that creates a resource object with integrated state management:

```typescript
// Basic usage - returns a reactive resource object
const userResource = defineResource({
  fetch: () => fetch('/api/users').then(r => r.json()),
  auto: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
});

// Usage with Store integration
@Register()
export class UserStore extends Store({
  users: [],
  selectedUser: null
}) {
  // Define resource that optionally integrates with store
  usersResource = defineResource({
    fetch: () => fetch('/api/users').then(r => r.json()),
    auto: true,
    // Optional integration with store state
    onUpdate: (data) => {
      this.update({ users: data }); // Update store state when resource updates
    },
    onError: (error) => {
      console.error('Failed to load users:', error);
    }
  });
  
  // Method to trigger the resource fetch
  loadUsers() {
    return this.usersResource.fetch();
  }
  
  // Access resource states
  get usersLoading() {
    return this.usersResource.loading.value;
  }
  
  get usersError() {
    return this.usersResource.error.value;
  }
}
```

## API Surface

### defineResource(options) Function
```typescript
interface ResourceOptions<T = any> {
  // The fetch function (can be query or mutation)
  fetch: (...args: any[]) => Promise<T>;
  
  // Auto-fetch options
  auto?: boolean;                    // Auto-fetch when created
  enabled?: Ref<boolean>;           // Conditional fetching
  
  // Cache options
  cacheTime?: number;               // How long to cache data (ms)
  staleTime?: number;               // When data becomes stale (ms)
  
  // Refetch options
  refetchOnWindowFocus?: boolean;   // Refetch when window gains focus
  refetchOnReconnect?: boolean;     // Refetch when connection restored
  refetchInterval?: number | false; // Auto-refetch interval
  retry?: number | false;           // Number of retries on failure
  retryDelay?: number | ((attempt: number) => number); // Delay between retries
  
  // Store integration options
  onUpdate?: (data: T, resource: Resource<T>) => void;  // Called on success
  onError?: (error: Error, resource: Resource<T>) => void; // Called on error
  onLoading?: (resource: Resource<T>) => void;          // Called on start
  
  // Dependencies that trigger refetch
  track?: Array<Ref | ComputedRef>; // Dependencies that trigger refetch
}

interface Resource<T = any> {
  // Reactive state properties
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: Ref<'idle' | 'loading' | 'success' | 'error'>;
  lastFetched: Ref<number | null>;
  
  // Methods
  fetch: (...args: any[]) => Promise<T>;
  refetch: (...args: any[]) => Promise<T>;
  invalidate: () => void;
  reset: () => void;
}
```

## Integration Patterns

### 1. Standalone Usage
```typescript
// Just use the resource directly
const postsResource = defineResource({
  fetch: () => fetch('/api/posts').then(r => r.json()),
  auto: true
});

// In component
const { data, loading, error, fetch: refetchPosts } = postsResource;
```

### 2. With Store Integration
```typescript
@Register()
export class BlogStore extends Store({
  posts: [],
  currentPost: null
}) {
  postsResource = defineResource({
    fetch: () => fetch('/api/posts').then(r => r.json()),
    auto: true,
    onUpdate: (data) => {
      this.update({ posts: data });
    }
  });
  
  postResource = defineResource({
    fetch: (id) => fetch(`/api/posts/${id}`).then(r => r.json()),
    onUpdate: (data) => {
      this.update({ currentPost: data });
    }
  });
  
  async loadPost(id) {
    await this.postResource.fetch(id);
  }
}
```

### 3. With Reactive Tracking
```typescript
@Register()
export class UserStore extends Store({
  users: [],
  filter: ''
}) {
  usersResource = defineResource({
    fetch: () => fetch(`/api/users?q=${this.state.filter}`).then(r => r.json()),
    auto: true,
    track: [() => this.state.filter], // Refetch when filter changes
    onUpdate: (data) => {
      this.update({ users: data });
    }
  });
}
```

## Simplified Component Usage
```vue
<script setup>
import { obtain } from 'iocraft';
import { UserStore } from '../stores/UserStore';

const userStore = obtain(UserStore);

// Destructure with reactivity preserved
const { 
  state: { users, filter },
  usersResource: { loading, error, refetch }
} = userStore;

// Or access standalone resources
const postsResource = defineResource({
  fetch: () => fetch('/api/posts').then(r => r.json()),
  auto: true
});

const { data: posts, loading: postsLoading } = postsResource;
</script>

<template>
  <div>
    <input v-model="filter" placeholder="Filter users..." />
    
    <div v-if="loading">Loading users...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <div v-for="user in users" :key="user.id">
        {{ user.name }}
      </div>
    </div>
    
    <button @click="refetch">Refresh</button>
  </div>
</template>
```

## Key Benefits

### 1. Eliminates Repetitive Code
- No need to manually manage loading/error states
- Built-in caching and refetching logic
- Automatic cleanup and invalidation

### 2. Flexible Integration
- Use standalone when you don't need Store integration
- Integrate with Store when you want to sync data
- Choose the level of integration you need

### 3. Rapid Development
- Simple function-based API
- Familiar patterns from existing libraries
- Type-safe with full TypeScript support

### 4. Cohesive API
- Single function handles all data fetching needs
- Consistent patterns across the application
- Easy to learn and use

This approach provides a simple, function-based solution that optionally integrates with Store while eliminating boilerplate and accelerating development.