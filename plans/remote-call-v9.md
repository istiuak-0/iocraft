```ts
// Create a resource factory with default options
interface ResourceFactory {
  create<T = any>(options: ResourceOptions<T>): Resource<T>;
}

interface ResourceFactoryOptions {
  // Default options that will be applied to all resources created by this factory
  baseURL?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retry?: number;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
  onError?: (error: Error) => void;
  transformResponse?: (response: Response, data: any) => any;
  transformError?: (error: any) => Error;
  interceptors?: {
    request?: (config: any) => any;
    response?: (response: any) => any;
  };
}

// Factory creator function
function createResourceClient(options: ResourceFactoryOptions): ResourceFactory {
  return {
    create<T = any>(resourceOptions: ResourceOptions<T>): Resource<T> {
      // Merge factory defaults with resource-specific options
      const mergedOptions = {
        ...options,
        ...resourceOptions,
        query: async (...args: any[]) => {
          // Apply baseURL and other defaults to the query function
          let url = args[0];
          if (options.baseURL && typeof url === 'string') {
            url = options.baseURL + (url.startsWith('/') ? url.slice(1) : url);
          }
          
          // Execute the original query with merged options
          return resourceOptions.query(...args);
        }
      };
      
      return defineResource(mergedOptions);
    }
  };
}

// Create a client with default configuration
const apiClient = createResourceClient({
  baseURL: 'https://api.example.com',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  timeout: 10000,
  retry: 3,
  staleTime: 5 * 60 * 1000, // 5 minutes
  cacheTime: 10 * 60 * 1000, // 10 minutes
  refetchOnReconnect: true,
  transformResponse: (response, data) => {
    // Automatically handle API response structure
    if (response.ok) {
      return data;
    }
    throw new Error(data.message || 'Request failed');
  },
  transformError: (error) => {
    // Normalize error structure
    if (error.response) {
      return new Error(`${error.response.status}: ${error.response.data?.message || 'API Error'}`);
    }
    return new Error(error.message || 'Network Error');
  }
});

// Create resources using the configured client
const userResource = apiClient.create({
  query: (userId) => fetch(`/users/${userId}`).then(r => r.json()),
  initWhen: 'manual',
  onSuccess: (data) => {
    console.log('User loaded:', data);
  }
});

const postsResource = apiClient.create({
  query: (userId) => fetch(`/users/${userId}/posts`).then(r => r.json()),
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
  // Use the configured client for consistency
  usersResource = apiClient.create({
    query: () => fetch('/users').then(r => r.json()),
    initWhen: 'immediate',
    onSuccess: (data) => {
      this.update({ users: data });
    }
  });
  
  userResource = apiClient.create({
    query: (id) => fetch(`/users/${id}`).then(r => r.json()),
    onSuccess: (data) => {
      this.update({ currentUser: data });
    }
  });
}

// Multiple clients for different APIs
const authClient = createResourceClient({
  baseURL: 'https://auth.example.com',
  headers: {
    'Content-Type': 'application/json'
  },
  // Specific error handling for auth API
  transformError: (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return new Error(error.message);
  }
});

const analyticsClient = createResourceClient({
  baseURL: 'https://analytics.example.com',
  // Different settings for analytics
  retry: 1,
  timeout: 5000
});


```