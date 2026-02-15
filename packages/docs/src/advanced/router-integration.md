# Router Integration

iocraft provides seamless integration with Vue Router through the Nav helper service.

## Setting Up Router Integration

First, register the plugin with your router:

```javascript
import { createApp } from 'vue';
import { iocraft } from 'iocraft';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [...]
});

const app = createApp(App);

// Register iocraft with router
app.use(iocraft, {
  router
});

app.mount('#app');
```

## Using the Nav Service

Once integrated, you can use the Nav service anywhere in your application:

```javascript
import { obtain } from 'iocraft';
import { Nav } from 'iocraft/helpers';

const nav = obtain(Nav);

// Navigate programmatically
nav.push('/home');
nav.replace('/about');

// Access route information
console.log(nav.path);    // Current path
console.log(nav.params);  // Route parameters
console.log(nav.query);   // Query parameters
```

## Available Nav Methods

- `push(path)`: Navigate to a new route
- `replace(path)`: Replace current route
- `back()`: Go back in history
- `forward()`: Go forward in history
- `go(n)`: Go forward/backward n steps

## Available Nav Properties

- `path`: Current route path
- `params`: Route parameters
- `query`: Query parameters
- `currentRoute`: Full route object