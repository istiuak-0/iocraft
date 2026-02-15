# Helper Services

iocraft provides utility services to assist with common tasks.

## Nav Service

The Nav service provides programmatic navigation when router integration is enabled:

```javascript
import { obtain } from 'iocraft';
import { Nav } from 'iocraft/helpers';

const nav = obtain(Nav);

// Navigate
nav.push('/home');
nav.replace('/about');

// Get route info
console.log(nav.path);    // Current path
console.log(nav.params);  // Route params
console.log(nav.query);   // Query params
```

## Setting Up Nav

To use the Nav service, register iocraft with your router:

```javascript
app.use(iocraft, {
  router, // Pass your Vue Router instance
});
```

## Other Helpers

Additional helper services may be added in future releases to provide common functionality for Vue applications.