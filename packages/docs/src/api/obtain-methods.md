# obtain Methods

iocraft provides four methods to obtain services, each with different behaviors regarding instance sharing and reactivity.

## `obtain(ServiceClass)`

Gets a shared instance (singleton) with reactivity preserved when destructured:

```javascript
import { obtain } from 'iocraft';
import { MyService } from './services/MyService';

const service = obtain(MyService);
const { property, method } = service; // Reactivity preserved
```

## `obtainRaw(ServiceClass)`

Gets a shared instance (singleton) without reactivity preservation when destructured:

```javascript
import { obtainRaw } from 'iocraft';

const service = obtainRaw(MyService);
const { property, method } = service; // Reactivity lost
```

## `obtainInstance(ServiceClass)`

Gets a new instance each time with reactivity preserved when destructured:

```javascript
import { obtainInstance } from 'iocraft';

const service = obtainInstance(MyService);
const { property, method } = service; // Reactivity preserved
```

## `obtainRawInstance(ServiceClass)`

Gets a new instance each time without reactivity preservation when destructured:

```javascript
import { obtainRawInstance } from 'iocraft';

const service = obtainRawInstance(MyService);
const { property, method } = service; // Reactivity lost
```

## When to Use Each Method

- Use `obtain()` for services that should be shared globally
- Use `obtainRaw()` when you don't need reactivity after destructuring
- Use `obtainInstance()` when you need a fresh instance per component
- Use `obtainRawInstance()` when you need a fresh instance without reactivity