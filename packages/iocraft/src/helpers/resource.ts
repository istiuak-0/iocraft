import { reactive, ref, type ComputedRef, type Ref } from "vue";

export interface ResourceOptions<T = any> {
  // Main Query function to fetch data
  query: (...args: any[]) => Promise<T>;
  // Initialization Option
  initWhen?: 'immediate' | 'manual';


  // Lifecycle Hooks
  onSuccess?: (data: T, params?: any) => void;
  onError?: (error: Error, params?: any) => void;
  onLoading?: () => {},

  // Track different states for declarative data fetching
  track?: Array<Ref | ComputedRef>;


  // Number of retry attempts on failure
  retry?: number;

  // Debounce time in ms to prevent rapid calls
  debounce?: number;

  // Key to group and abort calls (for deduplication/cancellation)
  abortKey?: string;
  // Request timeout in ms
  timeout?: number;
  // Additional context to pass to callbacks
  context?: any;
  // Time after which data is considered stale (ms)
  staleTime?: number;
  // Time to keep unused cache (ms)
  cacheTime?: number;
  // Keep previous data while loading new data             
  keepPreviousData?: boolean;
  // Refetch when window gains focus
  refetchOnWindowFocus?: boolean;
  // Refetch when network reconnects
  refetchOnReconnect?: boolean;
  // Garbage collection time (ms)  
  gcTime?: number;
  // When to execute requests
  networkMode?: 'online' | 'always';
  // Optimistic update function
  optimisticUpdate?: (variables: any) => void;
  // Rollback function on error
  rollbackOnError?: (variables: any) => void;
  // Custom serialization for cache key
  serialize?: (params: any[]) => string;
}


interface Resource<T = any> {
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: Ref<'idle' | 'loading' | 'success' | 'error'>;
  previousData: Ref<T | undefined>;
  isStale: Ref<boolean>;
  isFetching: Ref<boolean>;
  mutate: (...args: any[]) => void;
  refetch: (...args: any[]) => void;
  exec: (...args: any[]) => void;
  clear: () => void;
  abort: () => void;
}


export function defineResource(option: ResourceOptions) {




return {

}

}


// export function resourceFactory() {

// return defineResource()
// }