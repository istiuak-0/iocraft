```ts
// Direct API for simple usage
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
  
  // Context for additional data that doesn't trigger calls
  context?: Record<string, any>;    // Non-reactive data accessible to query function
  
  // Enterprise features (optional)
  retry?: number;                   // Number of retry attempts on failure
  debounce?: number;                // Debounce time in ms to prevent rapid calls
  abortKey?: string;                // Key to group and abort calls (for deduplication/cancellation)
  timeout?: number;                 // Request timeout in ms
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
  
  // Context for additional data
  context: Record<string, any>;      // Access to context data
  
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
  // Default options that will be applied to all resources created by this factory
  retry?: number;
  debounce?: number;
  abortKey?: string;
  timeout?: number;
  staleTime?: number;
  cacheTime?: number;
  keepPreviousData?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  gcTime?: number;
  networkMode?: 'online' | 'always';
  onSuccess?: (data: any, params?: any) => void;
  onError?: (error: Error, params?: any) => void;
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
  context: { apiKey: 'abc123' }, // Context data accessible to query
  onSuccess: (data) => {
    console.log('User loaded:', data);
  }
});

// Factory usage (preconfigured approach)
const apiFactory = createResourceFactory({
  retry: 3,
  timeout: 10000,
  staleTime: 5 * 60 * 1000
});

const postsResource = apiFactory.create({
  query: (userId) => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
  initWhen: 'manual',
  context: { searchQuery: '', filters: [] }, // Context for search
  onSuccess: (data) => {
    console.log('Posts loaded:', data);
  }
});

// Usage with context
const { data, loading, error, mutate, context } = postsResource;

// Update context without triggering the call
context.searchQuery = 'reactive search term';
context.filters = ['published', 'featured'];

// Later, trigger the call with current context
mutate(context.searchQuery, context.filters); // Pass context values as needed

// With Store integration
@Register()
export class SearchStore extends Store({
  searchResults: [],
  searchQuery: '',
  filters: []
}) {
  searchResource = defineResource({
    query: (query, filters) => {
      // Access context data inside query function
      const headers = { 'Authorization': `Bearer ${this.context.authToken}` };
      const params = new URLSearchParams({ q: query, ...filters });
      return fetch(`/api/search?${params}`, { headers }).then(r => r.json());
    },
    context: { authToken: localStorage.getItem('token') },
    track: [() => this.state.searchQuery, () => this.state.filters],
    onSuccess: (data) => {
      this.update({ searchResults: data.results });
    }
  });
  
  updateSearch(query: string) {
    // Update store state
    this.update({ searchQuery: query });
    // Context can be updated separately if needed
    this.searchResource.context.searchQuery = query;
  }
  
  setSearchFilters(filters: any[]) {
    this.update({ filters });
  }
}

```