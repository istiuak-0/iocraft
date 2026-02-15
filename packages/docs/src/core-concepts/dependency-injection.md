# Dependency Injection

iocraft provides several methods to inject dependencies into your components.

## Four Obtain Methods

There are four primary ways to get services, each with different behavior:

### `obtain(Service)`

Get a shared instance (singleton) with reactivity preserved when destructured:

```javascript
import { obtain } from 'iocraft';
import { MyService } from './services/MyService';

const service = obtain(MyService);
const { property, method } = service; // Reactivity preserved
```

### `obtainRaw(Service)`

Get a shared instance (singleton) without reactivity preservation when destructured:

```javascript
const service = obtainRaw(MyService);
const { property, method } = service; // Reactivity lost
```

### `obtainInstance(Service)`

Get a new instance each time with reactivity preserved when destructured:

```javascript
const service = obtainInstance(MyService);
const { property, method } = service; // Reactivity preserved
```

### `obtainRawInstance(Service)`

Get a new instance each time without reactivity preservation when destructured:

```javascript
const service = obtainRawInstance(MyService);
const { property, method } = service; // Reactivity lost
```

Choose the appropriate method based on your needs for instance sharing and reactivity.