# Service Registration

The foundation of iocraft is service registration using the `@Register()` decorator.

## Basic Registration

To register a service, simply decorate your class with `@Register()`:

```typescript
import { Register } from 'iocraft';

@Register()
export class MyService {
  // Your service implementation
}
```

## Service Lifecycle

Registered services are instantiated as singletons by default when first accessed through one of the obtain methods.

## Multiple Registrations

Each class decorated with `@Register()` becomes a unique service in the container. You cannot register the same class twice.