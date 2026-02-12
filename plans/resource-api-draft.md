# iocraft Resource API - Final Draft

## Overview
This document outlines the final design for a unified resource API for iocraft that combines the best features from all previous iterations. The API consists of two main functions:
- `defineResource` - Creates a reactive resource with built-in state management
- `resourceFactory` - Creates a configured factory function that returns resources when called

The factory function returns a function (not an object with a create method) that accepts the same arguments as `defineResource`.

## Goals
1. Create a unified API that handles both queries and mutations
2. Provide both simple direct usage and configurable factory usage
3. Eliminate repetitive loading/error state boilerplate
4. Support reactive tracking and automatic refetching
5. Enable seamless integration with iocraft's Store pattern
6. Maintain simplicity while offering advanced features

## Final API Surface

### defineResource(options)
Creates a reactive resource with built-in state management.

```typescript
interface ResourceOptions<T = any> {
  // The data fetching/mutation function (can accept parameters when called)
  execute: (...args: any[]) => Promise<T>;

  // When to initialize the resource (only 'immediate' or 'manual')
  initWhen?: 'immediate' | 'manual';

  // Success and error callbacks
  onSuccess?: (data: T) => void;   // Called when request succeeds
  onError?: (error: Error) => void; // Called when request fails

  // Dependencies that trigger refetch
  track?: Array<Ref | ComputedRef>; // Dependencies that trigger refetch

  // Resource management features
  staleTime?: number;               // Time after which data is considered stale (ms)
  cacheTime?: number;               // Time to keep unused cache (ms)
  keepPreviousData?: boolean;       // Keep previous data while loading new data
  refetchOnWindowFocus?: boolean;   // Refetch when window gains focus
  refetchOnReconnect?: boolean;     // Refetch when network reconnects
  gcTime?: number;                  // Garbage collection time (ms)
  retry?: number;                   // Number of retry attempts on failure
  debounce?: number;                // Debounce time in ms to prevent rapid calls
  abortKey?: string;                // Key to group and abort calls (for deduplication/cancellation)
  optimisticUpdate?: (variables: any) => void; // Optimistic update function
  rollbackOnError?: (variables: any) => void;  // Rollback function on error
  serialize?: (params: any[]) => string;       // Custom serialization for cache key
}

interface Resource<T = any> {
  // Reactive state properties
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: Ref<'idle' | 'loading' | 'success' | 'error'>;
  previousData: Ref<T | undefined>;  // Previous data (when keepPreviousData is true)
  isStale: Ref<boolean>;             // Whether data is stale
  isFetching: Ref<boolean>;          // Whether a request is in progress (separate from loading)

  // Methods (internal async handling, no need for async/await from user)
  mutate: (...args: any[]) => void;      // Trigger the resource (handles async internally)
  refetch: (...args: any[]) => void;     // Force refetch (handles async internally)
  exec: (...args: any[]) => void;        // Execute only if not already in progress (handles async internally)
  clear: () => void;                     // Clear all internal states (data, error, loading)
  abort: () => void;                     // Abort ongoing requests
}

function defineResource<T = any>(options: ResourceOptions<T>): Resource<T> {
  // Implementation here
}
```

### resourceFactory(defaults)
Creates a factory function with default configurations that returns a resource when called.

```typescript
interface ResourceDefaults {
  // Default resource management options
  staleTime?: number;
  cacheTime?: number;
  keepPreviousData?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  gcTime?: number;
  retry?: number;
  debounce?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  optimisticUpdate?: (variables: any) => void;
  rollbackOnError?: (variables: any) => void;
  serialize?: (params: any[]) => string;
}

function resourceFactory(defaults: ResourceDefaults = {}): <T = any>(options: ResourceOptions<T>) => Resource<T> {
  return function <T = any>(resourceOptions: ResourceOptions<T>): Resource<T> {
    // Merge factory defaults with resource-specific options
    const mergedOptions = {
      ...defaults,
      ...resourceOptions,
      // Preserve the original execute function
      execute: resourceOptions.execute
    };

    return defineResource(mergedOptions);
  };
}
```

## Usage Examples

### 1. Direct Usage (Simple Approach)
```typescript
// Create a resource directly for fetching data
const userResource = defineResource({
  execute: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 3,
  onSuccess: (data) => {
    console.log('User loaded:', data);
  },
  onError: (error) => {
    console.error('Failed to load user:', error);
  }
});

// Create a resource for mutations
const createUserResource = defineResource({
  execute: (userData) => fetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData)
  }).then(r => r.json()),
  initWhen: 'manual',
  optimisticUpdate: (userData) => {
    console.log('Optimistically creating user:', userData);
  },
  rollbackOnError: (userData) => {
    console.log('Rolling back user creation:', userData);
  },
  onSuccess: (data) => {
    console.log('User created:', data);
  },
  onError: (error) => {
    console.error('Failed to create user:', error);
  }
});

// Usage - no async/await needed from user
const { 
  data, 
  loading, 
  error, 
  status, 
  isStale, 
  isFetching, 
  previousData,
  mutate, 
  refetch, 
  exec, 
  clear, 
  abort 
} = userResource;

// Call with parameters (handled internally)
mutate(123); // Fetches user with ID 123
refetch(123); // Force refetch user with ID 123
exec(123); // Execute only if not already in progress
clear(); // Clear all internal states
abort(); // Cancel ongoing requests

// For mutations
createUserResource.mutate({ name: 'John Doe', email: 'john@example.com' });
```

### 2. Factory Usage (Preconfigured Approach)
```typescript
// Create a factory with default configurations
const apiFactory = resourceFactory({
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 3,
  debounce: 300,
  refetchOnReconnect: true
});

// Use the factory to create resources with default settings
const postsResource = apiFactory({
  execute: (userId) => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
  initWhen: 'manual',
  keepPreviousData: true, // Override default
  onSuccess: (data) => {
    console.log('Posts loaded:', data);
  }
});

// Another resource with the same defaults
const commentsResource = apiFactory({
  execute: (postId) => fetch(`/api/posts/${postId}/comments`).then(r => r.json()),
  initWhen: 'manual',
  onSuccess: (data) => {
    console.log('Comments loaded:', data);
  }
});
```

### 3. With Reactive Tracking
```typescript
import { ref } from 'vue';

// Reactive dependencies that trigger refetch
const userId = ref(1);
const searchQuery = ref('');

const userResource = defineResource({
  execute: (id) => fetch(`/api/users/${id || 1}`).then(r => r.json()),
  track: [userId], // Will refetch when userId changes
  initWhen: 'immediate',
  onSuccess: (data) => {
    console.log('User updated:', data);
  }
});

const searchResource = defineResource({
  execute: (query, page = 1) => fetch(`/api/search?q=${query}&page=${page}`).then(r => r.json()),
  track: [searchQuery, () => currentPage.value],
  debounce: 500,
  keepPreviousData: true,  // Show old results while loading new ones
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  serialize: (params) => `${params[0]}-${params[1]}`, // Custom cache key
  onSuccess: (data) => {
    console.log('Search results:', data);
  }
});
```

### 4. With Store Integration
```typescript
@Register()
export class UserStore extends Store({
  users: [],
  currentUser: null,
  pagination: { page: 1, total: 0 }
}) {
  // Use the factory for consistent configuration
  private apiFactory = resourceFactory({
    retry: 2,
    debounce: 100,
    keepPreviousData: true,
    refetchOnReconnect: true
  });

  usersResource = this.apiFactory({
    execute: (page = 1, limit = 10) => fetch(`/api/users?page=${page}&limit=${limit}`).then(r => r.json()),
    initWhen: 'immediate',
    onSuccess: (data) => {
      const [page = 1] = arguments; // Access the page parameter
      this.update({
        users: page === 1 ? data.items : [...this.state.users, ...data.items],
        pagination: { page, total: data.total }
      });
    },
    onError: (error) => {
      console.error('Failed to load users:', error);
    }
  });

  userResource = this.apiFactory({
    execute: (id) => fetch(`/api/users/${id}`).then(r => r.json()),
    initWhen: 'manual',
    onSuccess: (data) => {
      this.update({ currentUser: data });
    }
  });

  // Method to trigger user loading
  loadUser(id: number) {
    this.userResource.mutate(id);
  }
}
```

### 5. Advanced Usage with Optimistic Updates
```typescript
// Resource with optimistic updates
const postResource = defineResource({
  execute: (postData) => fetch('/api/posts', {
    method: 'POST',
    body: JSON.stringify(postData)
  }).then(r => r.json()),
  initWhen: 'manual',
  optimisticUpdate: (postData) => {
    // Optimistically update UI before request completes
    console.log('Optimistically adding post:', postData);
  },
  rollbackOnError: (postData) => {
    // Rollback optimistic update on error
    console.log('Rolling back post addition:', postData);
  },
  onSuccess: (data) => {
    console.log('Post created:', data);
  },
  onError: (error) => {
    console.error('Failed to create post:', error);
  }
});

// Usage
postResource.mutate({ title: 'New Post', content: 'Post content...' });
```

### 6. Multiple Factories for Different Scenarios
```typescript
// Auth API factory with specific defaults
const authFactory = resourceFactory({
  retry: 1,
  timeout: 5000,
  // Specific error handling for auth
  onError: (error) => {
    if (error.message.includes('401')) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
});

// Analytics factory with different defaults
const analyticsFactory = resourceFactory({
  retry: 0, // Don't retry analytics calls
  networkMode: 'online' // Skip when offline
});

// Create resources with appropriate factories
const loginResource = authFactory({
  execute: (credentials) => fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }).then(r => r.json()),
  initWhen: 'manual',
  onSuccess: (data) => {
    localStorage.setItem('token', data.token);
  }
});

const trackEventResource = analyticsFactory({
  execute: (eventData) => fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(eventData)
  }).then(r => r.json()),
  initWhen: 'manual'
});
```

## Key Features

### 1. Unified Query/Mutation Pattern
- Single API handles both data fetching and mutations
- Differentiated by usage pattern rather than different functions
- Consistent return type with reactive state and methods

### 2. Flexible Execution Timing
- `immediate`: Executes right away when created
- `manual`: Only executes when methods are called

### 3. Reactive Dependency Tracking
- Monitors reactive dependencies in the `track` array
- Automatically re-executes when tracked values change
- Prevents unnecessary calls with proper change detection

### 4. Advanced Resource Management
- Built-in caching with configurable TTL
- Stale time management
- Previous data retention
- Request debouncing
- Abort/cancelation support
- Optimistic updates with rollback

### 5. Reactivity Preservation
- All returned properties remain reactive when destructured
- Compatible with iocraft's existing facade system
- Maintains Vue's reactivity chain

## Benefits

### 1. Simplicity with Power
- Simple direct usage for basic cases
- Factory pattern for complex, reusable configurations
- Single API surface for all data fetching needs

### 2. Consistency
- Same patterns as other iocraft helpers (Store, Nav)
- Predictable method names and behaviors
- Type-safe with full TypeScript support

### 3. Flexibility
- Works with or without Store integration
- Configurable defaults through factories
- Extensible with custom serialization and callbacks

### 4. Performance
- Efficient dependency tracking
- Smart caching and stale management
- Minimal overhead when not actively watching

This final API design combines the best features from all previous iterations while maintaining the simplicity and elegance that fits with iocraft's philosophy. The `execute` option name properly reflects that the function can handle both queries and mutations.