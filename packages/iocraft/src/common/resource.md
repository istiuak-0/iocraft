```typescript
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