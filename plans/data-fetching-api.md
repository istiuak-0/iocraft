# iocraft Reactive Data Fetching API - Implementation Plan

## Overview
This document outlines the plan for implementing a reactive data fetching API for iocraft that works seamlessly within the existing ecosystem while providing familiar patterns similar to pinia-colada or TanStack Query.

## Goals
1. Create a data fetching solution that works anywhere in the iocraft ecosystem (components, services, composables, pinia stores)
2. Maintain compatibility with the existing reactive facade system
3. Provide destructure-friendly API that preserves reactivity
4. Integrate well with the Store higher-order function
5. Follow the same architectural patterns as the rest of iocraft

## Proposed API Surface

### Core Functions
- `createQuery(queryKey, fetcherFn, options?)` - Creates a reactive data query
- `createMutation(mutationFn, options?)` - Creates a reactive mutation
- `prefetchQuery(queryKey, fetcherFn, options?)` - Prefetches data without returning a subscription
- `invalidateQueries(filters?)` - Invalidates cached queries
- `refetchQueries(filters?)` - Forces refetch of matching queries

### Query Options
- `enabled: boolean` - Whether the query should run automatically
- `refetchInterval: number | false` - Interval to refetch data
- `staleTime: number` - Time in ms after which data becomes stale
- `cacheTime: number` - Time in ms to keep unused cache
- `retry: number | boolean | RetryFunction` - Number of retries or custom retry logic
- `onSuccess: (data) => void` - Callback when query succeeds
- `onError: (error) => void` - Callback when query fails

### Query Result Properties
- `data: Ref<T>` - Reactive data value
- `isLoading: Ref<boolean>` - Loading state
- `isError: Ref<boolean>` - Error state
- `error: Ref<Error | null>` - Error object if any
- `isStale: Ref<boolean>` - Whether data is stale
- `refetch: () => Promise<T>` - Function to manually refetch
- `status: Ref<'loading' | 'success' | 'error'>` - Current status

### Mutation Result Properties
- `mutate: (variables) => Promise<T>` - Function to trigger mutation
- `mutateAsync: (variables) => Promise<T>` - Async version of mutate
- `data: Ref<T | undefined>` - Reactive result data
- `isLoading: Ref<boolean>` - Loading state
- `isError: Ref<boolean>` - Error state
- `error: Ref<Error | null>` - Error object if any
- `reset: () => void` - Reset mutation state

## Architecture Design

### 1. Query Registry
Similar to the existing RootRegistry, we'll implement a QueryCache that:
- Stores query results by unique query keys
- Manages query lifecycles and garbage collection
- Handles cache invalidation and refetching

### 2. Reactive Query Objects
Instead of returning plain objects, we'll return reactive facades that:
- Preserve reactivity when destructured (similar to existing service facades)
- Track subscriptions and automatically refetch when needed
- Handle loading/error states reactively

### 3. Integration with Existing Systems
- Leverage the existing facade creation system for reactivity preservation
- Use the same metadata and registration patterns as services
- Integrate with Vue's reactivity system using refs and computed values
- Work seamlessly with the Store higher-order function

## Implementation Strategy

### Phase 1: Core Infrastructure
1. Create QueryCache system with TTL and garbage collection
2. Implement basic query creation and execution
3. Add reactive facade creation for query results
4. Implement basic caching and deduplication

### Phase 2: Advanced Features
1. Add query invalidation and refetch mechanisms
2. Implement polling and real-time updates
3. Add optimistic updates for mutations
4. Implement error handling and retry logic

### Phase 3: Integration & Optimization
1. Ensure seamless integration with existing iocraft patterns
2. Optimize for performance and memory usage
3. Add comprehensive error boundaries and debugging tools
4. Create helper utilities for common patterns

## Integration Examples

### Using in Services
```typescript
@Register()
export class UserService {
  usersQuery = createQuery(['users'], () => fetch('/api/users').then(r => r.json()));
  
  get users() {
    return this.usersQuery.data.value;
  }
  
  get isLoading() {
    return this.usersQuery.isLoading.value;
  }
}
```

### Using with Store HOF
```typescript
@Register()
export class UserStore extends Store({ users: [], selectedUserId: null }) {
  usersQuery = createQuery(
    ['users'], 
    () => fetch('/api/users').then(r => r.json()),
    {
      onSuccess: (data) => {
        this.update({ users: data });
      }
    }
  );
}
```

### Using in Components
```vue
<script setup>
import { obtain } from 'iocraft';
import { UserService } from './services/UserService';

const userService = obtain(UserService);
const { users, isLoading, refetch } = userService.usersQuery; // Destructuring preserves reactivity
</script>
```

## Technical Considerations

### Memory Management
- Implement proper garbage collection for unused queries
- Use WeakMaps where appropriate to prevent memory leaks
- Allow manual disposal of query subscriptions

### Reactivity Preservation
- Ensure all returned properties are properly reactive when destructured
- Maintain compatibility with Vue's reactivity system
- Handle edge cases with nested reactive objects

### Error Handling
- Provide consistent error handling patterns
- Allow for custom error handlers
- Implement proper error boundaries

### Performance
- Deduplicate identical queries automatically
- Implement smart caching strategies
- Minimize re-renders and unnecessary computations

## File Structure
```
packages/iocraft/src/
├── core/
│   ├── data-fetching/
│   │   ├── cache.ts      # Query cache implementation
│   │   ├── query.ts      # Query creation and management
│   │   ├── mutation.ts   # Mutation creation and management
│   │   └── facade.ts     # Reactive facade for query results
│   └── ... (existing files)
└── helpers/
    └── ... (existing files)
```

## Export Strategy
Add to `packages/iocraft/src/core.ts`:
```typescript
export * from './core/data-fetching/query';
export * from './core/data-fetching/mutation';
export * from './core/data-fetching/cache';
```

## Testing Strategy
- Unit tests for cache management
- Integration tests with Vue's reactivity system
- Performance tests for memory usage
- Compatibility tests with existing iocraft patterns

This plan provides a comprehensive roadmap for implementing a reactive data fetching API that integrates seamlessly with the existing iocraft architecture while providing familiar patterns for developers coming from other solutions like TanStack Query or pinia-colada.