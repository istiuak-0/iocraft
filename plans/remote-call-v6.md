```ts
interface ResourceOptions<T = any> {
  // The data fetching function (can accept parameters when called)
  query: (...args: any[]) => Promise<T>;
  
  // When to initialize the resource (only 'immediate' or 'manual')
  initWhen?: 'immediate' | 'manual';
  
  // Success and error callbacks
  onSuccess?: (data: T) => void;   // Called when request succeeds
  onError?: (error: Error) => void; // Called when request fails
  
  // Dependencies that trigger refetch (adding track implies dependency-change behavior)
  track?: Array<Ref | ComputedRef>; // Dependencies that trigger refetch
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
}

// Create a resource
const userResource = defineResource({
  query: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  onSuccess: (data) => {
    console.log('User data loaded:', data);
  },
  onError: (error) => {
    console.error('Failed to load user:', error);
  }
});

// Usage - no async/await needed from user
const { data, loading, error, mutate, refetch, exec, clear } = userResource;

// Call with parameters (handled internally)
mutate(123); // Fetches user with ID 123
refetch(123); // Force refetch user with ID 123
exec(123); // Execute only if not already in progress
clear(); // Clear all internal states

// With reactive tracking
const userId = ref(1);
const userResourceWithTrack = defineResource({
  query: (id) => fetch(`/api/users/${id || 1}`).then(r => r.json()),
  track: [userId], // Will refetch when userId changes
  onSuccess: (data) => {
    console.log('User updated:', data);
  }
});

// With Store integration
@Register()
export class UserStore extends Store({
  users: []
}) {
  usersResource = defineResource({
    query: () => fetch('/api/users').then(r => r.json()),
    initWhen: 'immediate',
    onSuccess: (data) => {
      this.update({ users: data });
    },
    onError: (error) => {
      console.error('Failed to load users:', error);
    }
  });
}
```