# Utility Functions

Helper functions for managing services.

## Service Management

### `hasService(ServiceClass)`

Check if a service is registered:

```typescript
import { attach, hasService } from 'iocraft';

@attach()
class MyService {}

if (hasService(MyService)) {
  // Service is registered
}
```

### `unRegister(serviceInstance)`

Remove a service instance:

```typescript
import { attach, obtain, unRegister } from 'iocraft';

@attach()
class MyService {}

const service = obtain(MyService);
unRegister(service);
```

### `clearRegistry()`

Remove all services:

```typescript
import { clearRegistry } from 'iocraft';

clearRegistry();
```

## Context Functions

### `exposeCtx(serviceInstance)`

Expose a service to child components:

```vue
<script setup>
import { attach, obtain, exposeCtx } from 'iocraft';

@attach()
class MyService {}

const service = obtain(MyService);
exposeCtx(service);
</script>
```

### `obtainCtx(ServiceClass)`

Obtain a service from parent context:

```vue
<script setup>
import { attach, obtainCtx } from 'iocraft';

@attach()
class MyService {}

const service = obtainCtx(MyService);
</script>
```

### `getServiceMeta(serviceInstance)`

Get service metadata:

```typescript
import { attach, obtain, getServiceMeta } from 'iocraft';

@attach()
class MyService {}

const service = obtain(MyService);
const meta = getServiceMeta(service);
```

## Related

- [`@attach()`](./attach)
- [`obtain` Methods](./obtain-methods)
