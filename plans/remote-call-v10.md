```ts
// Create a resource factory with default options
interface ResourceFactory {
  create<T = any>(options: ResourceOptions<T>): Resource<T>;
}

interface ResourceDefaults {
  // Default options that will be applied to all resources created by this factory
  timeout?: number;
  retry?: number;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  gcTime?: number;
  keepPreviousData?: boolean;
  networkMode?: 'online' | 'always';
  onError?: (error: Error) => void;
  onSuccess?: (data: any) => void;
  transformResponse?: (data: any) => any;
  transformError?: (error: any) => Error;
  debounce?: number;
}

// Factory creator function
function createResourceFactory(defaults: ResourceDefaults = {}): ResourceFactory {
  return {
    create<T = any>(resourceOptions: ResourceOptions<T>): Resource<T> {
      // Merge factory defaults with resource-specific options
      const mergedOptions = {
        ...defaults,
        ...resourceOptions,
        // Preserve the original query function but enhance with defaults
        query: resourceOptions.query
      };
      
      return defineResource(mergedOptions);
    }
  };
}

// Create a factory with default configurations
const apiFactory = createResourceFactory({
  timeout: 10000,
  retry: 3,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnReconnect: true,
  transformError: (error) => {
    // Normalize error structure
    if (error instanceof Error) {
      return error;
    }
    return new Error(typeof error === 'string' ? error : 'Request failed');
  }
});

// Create resources using the configured factory
const userResource = apiFactory.create({
  query: (userId) => fetch(`/api/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  onSuccess: (data) => {
    console.log('User loaded:', data);
  }
});

const postsResource = apiFactory.create({
  query: (userId) => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
  initWhen: 'manual',
  keepPreviousData: true, // Override default
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

// Multiple factories for different scenarios
const authFactory = createResourceFactory({
  retry: 1,
  timeout: 5000,
  // Specific error handling for auth
  onError: (error) => {
    if (error.message.includes('401')) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
});

const analyticsFactory = createResourceFactory({
  // Analytics specific defaults
  retry: 0, // Don't retry analytics calls
  networkMode: 'online' // Skip when offline
});
```