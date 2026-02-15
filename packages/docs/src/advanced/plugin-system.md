# Plugin System

iocraft provides a plugin system to extend functionality and integrate with other Vue libraries.

## Registering Plugins

Plugins are registered when initializing iocraft:

```javascript
import { createApp } from 'vue';
import { iocraft } from 'iocraft';
import { createRouter } from 'vue-router';

const app = createApp(App);

app.use(iocraft, {
  router, // Makes router available via Nav service
  eagerLoad: [UserService] // Pre-load services
});

app.mount('#app');
```

## Plugin Options

### Router Integration

Pass a Vue Router instance to enable navigation features through the Nav service.

### Eager Loading

Specify services to be pre-loaded when the application starts:

```javascript
app.use(iocraft, {
  eagerLoad: [UserService, AuthService] // These services will be initialized immediately
});
```

## Custom Plugins

You can create custom plugins to extend iocraft functionality, though this is an advanced use case.