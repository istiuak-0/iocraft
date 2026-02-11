```ts 
interface ResourceOptions<T = any> {
  // The data fetching function (can accept parameters when called)
  query: (...args: any[]) => Promise<T>;
  
  // When to initialize the resource
  initWhen?: 'immediate' | 'manual' | 'dependency-change' | Array<'immediate' | 'manual' | 'dependency-change'>;
  
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
  
  // Methods
  call: (...args: any[]) => Promise<T>;      // Trigger the resource
  refetch: (...args: any[]) => Promise<T>;   // Force refetch
  firstCall: (...args: any[]) => Promise<T>; // Only trigger if not already called
  clear: () => void;                         // Clear all internal states (data, error, loading)
}

// Create a resource
const userResource = defineResource({
  query: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  onUpdate: (data) => {
    console.log('User data updated:', data);
  }
});

// Usage
const { data, loading, error, call, refetch, firstCall, clear } = userResource;

// Call with parameters
await call(123); // Fetches user with ID 123
await refetch(123); // Force refetch user with ID 123
await firstCall(123); // Only fetch if not already in progress
clear(); // Clear all internal states

// With Store integration
@Register()
export class UserStore extends Store({
  users: []
}) {
  usersResource = defineResource({
    query: () => fetch('/api/users').then(r => r.json()),
    initWhen: 'immediate',
    onUpdate: (data) => {
      this.update({ users: data });
    }
  });
}
```