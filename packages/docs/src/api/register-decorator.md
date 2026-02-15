# @Register Decorator

The `@Register()` decorator marks a class as a service that can be injected by iocraft.

## Basic Usage

```typescript
import { Register } from 'iocraft';

@Register()
export class MyService {
  // Your service implementation
}
```

## Service Registration

When you decorate a class with `@Register()`:

- The class becomes available for dependency injection
- A singleton instance is created when first accessed
- The service can be obtained using any of the obtain methods

## Multiple Services

Each class decorated with `@Register()` creates a unique service in the container:

```typescript
@Register()
export class UserService {
  // User-related functionality
}

@Register()
export class AuthService {
  // Authentication-related functionality
}
```

## Service Lifecycle

Services decorated with `@Register()` follow the lifecycle of the obtain method used to retrieve them:

- `obtain()` and `obtainRaw()` create application-singleton services
- `obtainInstance()` and `obtainRawInstance()` create new instances each time