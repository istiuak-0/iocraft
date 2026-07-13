<div align="center">
  <img src="https://raw.githubusercontent.com/istiuak-0/iocraft/main/assets/banner.svg" alt="iocraft" width="100%" />

[![npm version](https://img.shields.io/npm/v/iocraft?color=3dd68c&labelColor=0d0d0e&label=npm)](https://www.npmjs.com/package/iocraft)
[![license](https://img.shields.io/badge/license-MIT-3dd68c?labelColor=0d0d0e)](./LICENSE)
[![typescript](https://img.shields.io/badge/TypeScript-ready-3dd68c?labelColor=0d0d0e)](https://www.typescriptlang.org/)

</div>

**iocraft** is a dependency injection container for Vue 3 built on the Composition API. Write plain TypeScript classes as services with full Vue reactivity and zero boilerplate.

## Table of Contents

- [Installation](#installation)
- [TypeScript Configuration](#typescript-configuration)
- [Setup](#setup)
- [Services](#services)
- [Obtaining Services](#obtaining-services)
- [Context (Scoped) Services](#context-scoped-services)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Router Integration](#router-integration)

## Installation

```bash
npm install iocraft
```


## TypeScript Configuration

iocraft uses decorators, so you must enable experimental decorators in your TypeScript config.

Update your `tsconfig.app.json` (typical Vue / Vite setup):

```jsonc
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "paths": {
      "@/*": ["./src/*"]
    },

    "experimentalDecorators": true, // Add this

    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo"
  }
}
```




## Setup

```ts
import { createApp } from "vue";
import { iocraft } from "iocraft";
import App from "./App.vue";

const app = createApp(App);
app.use(iocraft);
app.mount("#app");
```

With options:

```ts
app.use(iocraft, {
  router, // enables the built-in Nav service
  eagerLoad: [AuthService], // Eagerly initiate services
});
```

## Services

Decorate a class with `@attach()` to register it with the DI system.

```ts
import { ref, computed } from "vue";
import { attach } from "iocraft";

@attach()
export class CounterService {
  count = ref(0);
  double = computed(() => this.count.value * 2);

  increment() {
    this.count.value++;
  }

  reset() {
    this.count.value = 0;
  }
}
```

`@attach()` assigns a unique symbol token to the class that the registry uses for lookup. Without it, iocraft cannot resolve the service and will throw.

## Obtaining Services

### `obtain` — Global Singleton

Resolves a singleton from the root registry. Created once on first call, reused for the lifetime of the app. Returns a facade — a thin wrapper that proxies each property through getters/setters linked to the original instance, preserving reactivity even when destructuring.

```vue
<script setup lang="ts">
import { obtain } from "iocraft";
import { CounterService } from "./services";

const counter = obtain(CounterService);
const { count, increment, reset } = obtain(CounterService);
</script>

<template>
  <p>Count: {{ count }} — Double: {{ counter.double }}</p>
  <button @click="increment">+1</button>
  <button @click="reset">Reset</button>
</template>
```

### `obtain.raw()` — Raw Singleton

Resolves a singleton from the root registry, just like `obtain`, but returns the actual class instance with no facade applied.

```ts
const auth = obtain.raw(AuthService);
```

### `obtain.instance()` — Scoped Instance

Returns a fresh facade of the given service on each call — no singleton, no registry, just a new instance wrapped in a reactive facade.

```vue
<script setup lang="ts">
import { obtain } from "iocraft";
import { FormService } from "./services";

const { values, errors, submit, reset } = obtain.instance(FormService);
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="values.email" />
    <span v-if="errors.email">{{ errors.email }}</span>
    <button type="submit">Submit</button>
  </form>
</template>
```

## Context (Scoped) Services

Provide a service from a parent component and inject it into any descendant. Uses Vue's `provide` / `inject` under the hood.

**Parent:**

```vue
<script setup lang="ts">
import { expose, obtain } from "iocraft";
import { CartService } from "./services";

const cartService = obtain.instance(CartService);
expose(cartService);
</script>
```

**Child:**

```vue
<script setup lang="ts">
import { obtain } from "iocraft";
import { CartService } from "./services";

const cart = obtain.exposed(CartService); // CartService | undefined
</script>
```

## Router Integration

iocraft provides a built-in `Nav` service that exposes all routing features as a plain injectable service — no need to call `useRouter()` and `useRoute()` separately. To enable it, pass your router when registering the plugin:

```ts
app.use(iocraft, { router });
```

Once registered, `Nav` is available as a global singleton anywhere in your app:

```vue
<script setup lang="ts">
import { obtain, Nav } from "iocraft";

const nav = obtain(Nav);
</script>

<template>
  <p>
    Path: <code>{{ nav.path }}</code>
  </p>
  <p>
    Name: <code>{{ nav.name?.toString() ?? "-" }}</code>
  </p>
  <p>
    Full path: <code>{{ nav.fullPath }}</code>
  </p>
  <button @click="nav.push('/home')">Home</button>
  <button @click="nav.back()">Back</button>
  <button @click="nav.forward()">Forward</button>
</template>
```

### Nav API

Reactive route properties: `path` · `name` · `params` · `query` · `hash` · `fullPath` · `meta` · `matched` · `redirectedFrom` · `currentRoute`

Router state: `options` · `listening` (readable and writable)

Navigation: `push(to)` · `replace(to)` · `go(delta)` · `back()` · `forward()`

Route resolution: `resolve(to)`

Route registry: `addRoute()` · `removeRoute()` · `getRoutes()` · `hasRoute()` · `clearRoutes()`

Guards: `beforeEach()` · `beforeResolve()` · `afterEach()` · `onError()`

Lifecycle: `isReady()`

## License

MIT · [istiuak-0](https://github.com/istiuak-0/iocraft)
