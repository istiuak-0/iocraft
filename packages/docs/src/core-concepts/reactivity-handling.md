# Reactivity Handling

One of the key features of iocraft is how it handles Vue's reactivity system when services are destructured.

## The Problem

When Vue services are destructured, reactivity is typically lost:

```javascript
// Without iocraft - reactivity lost
const { count } = someService;
// count is no longer reactive
```

## iocraft Solution

iocraft provides two approaches to preserve reactivity:

### Using `obtain()` and `obtainInstance()`

These methods return a proxy that preserves reactivity even after destructuring:

```javascript
import { obtain } from 'iocraft';
import { CounterService } from './services/CounterService';

// Reactivity preserved after destructuring
const { count, increment } = obtain(CounterService);
```

### Using `obtainRaw()` and `obtainRawInstance()`

These methods return the raw service instance without reactivity preservation:

```javascript
// Reactivity lost after destructuring
const { count, increment } = obtainRaw(CounterService);
```

## Best Practices

- Use `obtain()` or `obtainInstance()` when you plan to destructure the service
- Use `obtainRaw()` or `obtainRawInstance()` when you only need to call methods directly
- Always use `obtainInstance()` if you need lifecycle hooks to work