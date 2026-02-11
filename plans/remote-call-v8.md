```ts
interface ResourceOptions<T = any> {
  // The data fetching function (can accept parameters when called)
  query: (...args: any[]) => Promise<T>;
  
  // When to initialize the resource (only 'immediate' or 'manual')
  initWhen?: 'immediate' | 'manual';
  
  // Success and error callbacks
  onSuccess?: (data: T, params?: any) => void;   // Called when request succeeds
  onError?: (error: Error, params?: any) => void; // Called when request fails
  
  // Dependencies that trigger refetch
  track?: Array<Ref | ComputedRef>; // Dependencies that trigger refetch
  
  // Enterprise features (optional)
  retry?: number;                   // Number of retry attempts on failure
  debounce?: number;                // Debounce time in ms to prevent rapid calls
  abortKey?: string;                // Key to group and abort calls (for deduplication/cancellation)
  timeout?: number;                 // Request timeout in ms
  context?: any;                    // Additional context to pass to callbacks
  staleTime?: number;               // Time after which data is considered stale (ms)
  cacheTime?: number;               // Time to keep unused cache (ms)
  keepPreviousData?: boolean;       // Keep previous data while loading new data
  refetchOnWindowFocus?: boolean;   // Refetch when window gains focus
  refetchOnReconnect?: boolean;     // Refetch when network reconnects
  gcTime?: number;                  // Garbage collection time (ms)
  networkMode?: 'online' | 'always'; // When to execute requests
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

// Basic usage
const userResource = defineResource({
  query: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  retry: 3,
  debounce: 300,
  timeout: 10000,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  onSuccess: (data) => {
    console.log('User data loaded:', data);
  },
  onError: (error) => {
    console.error('Failed to load user:', error);
  }
});

// Advanced usage with optimistic updates
const postResource = defineResource({
  query: (postData) => fetch('/api/posts', {
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
  }
});

// Usage - no async/await needed from user
const { 
  data, 
  loading, 
  error, 
  previousData, 
  isStale, 
  isFetching,
  mutate, 
  refetch, 
  exec, 
  clear, 
  abort 
} = userResource;

// With reactive tracking and advanced features
const searchResource = defineResource({
  query: (query, page = 1) => fetch(`/api/search?q=${query}&page=${page}`).then(r => r.json()),
  track: [() => searchQuery.value, () => currentPage.value],
  debounce: 500,
  keepPreviousData: true,  // Show old results while loading new ones
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  serialize: (params) => `${params[0]}-${params[1]}`, // Custom cache key
  onSuccess: (data) => {
    console.log('Search results:', data);
  }
});

// With Store integration for enterprise state management
@Register()
export class UserStore extends Store({
  users: [],
  currentUser: null,
  pagination: { page: 1, total: 0 }
}) {
  usersResource = defineResource({
    query: (page = 1, limit = 10) => fetch(`/api/users?page=${page}&limit=${limit}`).then(r => r.json()),
    initWhen: 'immediate',
    retry: 2,
    debounce: 100,
    keepPreviousData: true,
    refetchOnReconnect: true,
    onSuccess: (data, params) => {
      const [page = 1] = params;
      this.update({ 
        users: page === 1 ? data.items : [...this.state.users, ...data.items],
        pagination: { page, total: data.total }
      });
    },
    onError: (error) => {
      console.error('Failed to load users:', error);
    }
  });
}
```