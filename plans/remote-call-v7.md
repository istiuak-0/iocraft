```ts
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
  
  // Enterprise features (optional)
  retry?: number;                   // Number of retry attempts on failure
  debounce?: number;                // Debounce time in ms to prevent rapid calls
  abortKey?: string;                // Key to group and abort calls (for deduplication/cancellation)
  timeout?: number;                 // Request timeout in ms
  context?: any;                    // Additional context to pass to callbacks
}

interface Resource<T = any> {
  // Reactive state properties
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: Ref<'idle' | 'loading' | 'success' | 'error'>;
  
  // Methods (internal async handling, no need for async/await from user)
  mutate: (...args: any[]) => void;      // Trigger the resource (handles async internally)
  refetch: (...args: any[]) => void;     // Force refetch (handles async internally)
  exec: (...args: any[]) => void;        // Execute only if not already in progress (handles async internally)
  clear: () => void;                     // Clear all internal states (data, error, loading)
  abort: () => void;                     // Abort ongoing requests
}

// Create a resource
const userResource = defineResource({
  query: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  retry: 3,                           // Retry failed requests up to 3 times
  debounce: 300,                      // Debounce calls by 300ms
  timeout: 10000,                     // Timeout after 10 seconds
  onSuccess: (data) => {
    console.log('User data loaded:', data);
  },
  onError: (error) => {
    console.error('Failed to load user:', error);
  }
});

// Usage - no async/await needed from user
const { data, loading, error, mutate, refetch, exec, clear, abort } = userResource;

// Call with parameters (handled internally)
mutate(123); // Fetches user with ID 123
refetch(123); // Force refetch user with ID 123
exec(123); // Execute only if not already in progress
clear(); // Clear all internal states
abort(); // Cancel ongoing requests

// With reactive tracking and abort key for deduplication
const userId = ref(1);
const userResourceWithTrack = defineResource({
  query: (id) => fetch(`/api/users/${id || 1}`).then(r => r.json()),
  track: [userId], // Will refetch when userId changes
  abortKey: 'user-fetch', // Group calls for cancellation
  onSuccess: (data) => {
    console.log('User updated:', data);
  }
});

// With Store integration for enterprise state management
@Register()
export class UserStore extends Store({
  users: [],
  currentUser: null
}) {
  usersResource = defineResource({
    query: () => fetch('/api/users').then(r => r.json()),
    initWhen: 'immediate',
    retry: 2,
    debounce: 100,
    onSuccess: (data) => {
      this.update({ users: data });
    },
    onError: (error) => {
      console.error('Failed to load users:', error);
    }
  });
  
  userResource = defineResource({
    query: (id) => fetch(`/api/users/${id}`).then(r => r.json()),
    abortKey: 'current-user',
    onSuccess: (data) => {
      this.update({ currentUser: data });
    }
  });
}
```