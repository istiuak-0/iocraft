```ts 
interface ResourceOptions<T = any> {
  // The data fetching function (can accept parameters when called)
  query: (...args: any[]) => Promise<T>;
  
  // Auto-fetch options
//  -------- these are not needed
  auto?: boolean;                    // Auto-fetch when created
  enabled?: Ref<boolean>;           // Conditional fetching
  //-----------

/*

instead add a different option like initWhen or call when

it needs will take string or array of string as options like immidiate,manual,only when dependecy chages(tracked refs)
 */

/* i dont need explicit caching options its gonna cache it in memery either way so there is no need to for it at lest i dont thcink so those data and other states will be sotred insdie a interal veraible untill it refetchs or manually cleans the resoce states it will be there no options this are bloat */
  // Cache options
  cacheTime?: number;               // How long to cache data (ms)
  staleTime?: number;               // When data becomes stale (ms)
  
  /*the goal is to make the resocue lazy refetch on connce or interval is that needed?? */
  // Refetch options
  refetchOnReconnect?: boolean;     // Refetch when connection restored
  refetchInterval?: number | false; // Auto-refetch interval
  retry?: number;                   // Number of retries on failure
  
  // Store integration options
  onUpdate?: (data: T) => void;     // Called when data updates
  onError?: (error: Error) => void; // Called when error occurs
  
  // Dependencies that trigger refetch
  track?: Array<Ref | ComputedRef>; // Dependencies that trigger refetch
}

interface Resource<T = any> {
  // Reactive state properties
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: Ref<'idle' | 'loading' | 'success' | 'error'>;
  
  // Methods is diduplication needed its just incharge of data fetching not state management
  call: (...args: any[]) => Promise<T>;      // Trigger the resource (with deduplication)
  refetch: (...args: any[]) => Promise<T>;   // Force refetch regardless of cache
  firstCall: (...args: any[]) => Promise<T>; // Only trigger if not already called
  invalidate: () => void;      
    reset: () => void;                         // Reset to initial state
    //since method to replace invalidte and reset 
                // Invalidate cache with out chachign otpisn there will be a method like this that will clear all thos einternal states like loading error data  isnted of invalid and otehr stuff dont make thigns complicated for users keep it simple and effieicnt

}

// Create a resource
const userResource = defineResource({
  query: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  auto: true,
  cacheTime: 5 * 60 * 1000, // 5 minutes
  onUpdate: (data) => {
    console.log('User data updated:', data);
  }
});

// Usage
const { data, loading, error, call, refetch, firstCall } = userResource;

// Call with parameters
await call(123); // Fetches user with ID 123
await refetch(123); // Force refetch user with ID 123
await firstCall(123); // Only fetch if not already in progress

// With Store integration
@Register()
export class UserStore extends Store({
  users: []
}) {
  usersResource = defineResource({
    query: () => fetch('/api/users').then(r => r.json()),
    auto: true,
    onUpdate: (data) => {
      this.update({ users: data });
    }
  });
}