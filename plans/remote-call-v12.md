```ts
// Direct API for simple usage
interface ResourceOptions<T = any> {
  // The data fetching function (can accept parameters when called)
  query: (...args: any[]) => Promise<T>;
  
  // When to initialize the resource (only 'immediate' or 'manual')
  initWhen?: 'immediate' | 'manual';
  
  // Success and error callbacks
  onSuccess?: (data: T) => void;   // Called when request succeeds
  onError?: (error: Error) => void; // Called when request fails
  
  // Dependencies that trigger refetch
  track?: Array<Ref | ComputedRef>; // Dependencies that trigger refetch
  
  // Resource management features (not HTTP features)
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

// Create resource directly (simple usage)
function defineResource<T = any>(options: ResourceOptions<T>): Resource<T> {
  // Implementation here
}

// Factory API for preconfigured usage
interface ResourceFactory {
  create<T = any>(options: ResourceOptions<T>): Resource<T>;
}

interface ResourceDefaults {
  // Default resource management options (not HTTP options)
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

// Factory creator function
function createResourceFactory(defaults: ResourceDefaults = {}): ResourceFactory {
  return {
    create<T = any>(resourceOptions: ResourceOptions<T>): Resource<T> {
      // Merge factory defaults with resource-specific options
      const mergedOptions = {
        ...defaults,
        ...resourceOptions,
        // Preserve the original query function
        query: resourceOptions.query
      };
      
      return defineResource(mergedOptions);
    }
  };
}

// Direct usage (simple approach)
const userResource = defineResource({
  query: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 3,
  onSuccess: (data) => {
    console.log('User loaded:', data);
  }
});

// Factory usage (preconfigured approach)
const apiFactory = createResourceFactory({
  staleTime: 5 * 60 * 1000,
  retry: 3,
  debounce: 300
});

const postsResource = apiFactory.create({
  query: (userId) => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
  initWhen: 'manual',
  onSuccess: (data) => {
    console.log('Posts loaded:', data);
  }
});

// Usage remains the same
const { data, loading, error, mutate, refetch } = userResource;

// With Store integration
@Register()
export class UserStore extends Store({
  users: [],
  currentUser: null
}) {
  // Use the configured factory for consistency
  usersResource = apiFactory.create({
    query: () => fetch('/api/users').then(r => r.json()),
    initWhen: 'immediate',
    keepPreviousData: true,
    onSuccess: (data) => {
      this.update({ users: data });
    }
  });
  
  userResource = apiFactory.create({
    query: (id) => fetch(`/api/users/${id}`).then(r => r.json()),
    onSuccess: (data) => {
      this.update({ currentUser: data });
    }
  });
}
```