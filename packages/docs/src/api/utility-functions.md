# Utility Functions

iocraft provides several utility functions for advanced use cases.

## `obtainFromContext(ServiceClass)`

Gets a service from the current component context:

```javascript
import { obtainFromContext } from 'iocraft';
import { MyService } from './services/MyService';

const service = obtainFromContext(MyService);
```

## `exposeToContext(serviceInstance)`

Shares a service with child components:

```javascript
import { obtain, exposeToContext } from 'iocraft';

const service = obtain(MyService);
exposeToContext(service);
```

## `hasService(ServiceClass)`

Checks if a service exists in the container:

```javascript
import { hasService } from 'iocraft';

if (hasService(MyService)) {
  // Service is registered
}
```

## `unRegister(serviceInstance)`

Removes a service from the container:

```javascript
import { unRegister } from 'iocraft';

unRegister(serviceInstance);
```

## `clearRegistry()`

Removes all services from the container:

```javascript
import { clearRegistry } from 'iocraft';

clearRegistry(); // Removes all registered services
```

## `OnUnRegister` Interface

Implement cleanup when a service is unregistered:

```typescript
import { Register, OnUnRegister } from 'iocraft';

@Register()
export class ResourceService implements OnUnRegister {
  resources = [];

  onUnRegister() {
    // Cleanup resources when service is removed
    this.resources.forEach(resource => resource.destroy());
  }
}
```