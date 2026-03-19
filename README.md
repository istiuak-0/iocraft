<div align="center">
  <img src="./assets/banner.svg" alt="iocraft" width="100%" />

[![npm version](https://img.shields.io/npm/v/iocraft?color=3dd68c&labelColor=0d0d0e&label=npm)](https://www.npmjs.com/package/iocraft)
[![license](https://img.shields.io/github/license/istiuak-0/iocraft?color=3dd68c&labelColor=0d0d0e)](https://github.com/istiuak-0/iocraft/blob/main/LICENSE)
[![typescript](https://img.shields.io/badge/TypeScript-ready-3dd68c?labelColor=0d0d0e)](https://www.typescriptlang.org/)

</div>

---

**iocraft** is a dependency injection container for Vue 3 built on the Composition API. It lets you write plain TypeScript classes as services — with full Vue reactivity, lifecycle hooks, and zero boilerplate — and resolve them anywhere in your app without breaking reactivity when destructuring.

---

## Table of Contents

- [Installation](#installation)
- [Setup](#setup)
- [Core Concepts](#core-concepts)
- [Services](#services)
- [Obtaining Services](#obtaining-services)
- [Store](#store)
- [Context (Scoped) Services](#context-scoped-services)
- [Lifecycle Hooks](#lifecycle-hooks)
- [Router Integration](#router-integration)
- [API Reference](#api-reference)

---

## Installation

```bash
npm install iocraft
```

```bash
pnpm add iocraft
```

---

## Setup

Register the plugin in your Vue app entry point.

```ts
import { createApp } from 'vue'
import { iocraft } from 'iocraft'
import App from './App.vue'

const app = createApp(App)

app.use(iocraft)
app.mount('#app')
```

With options:

```ts
import { createApp } from 'vue'
import { createRouter } from 'vue-router'
import { iocraft } from 'iocraft'
import { AuthService } from './services'

const router = createRouter({ /* ... */ })

app.use(iocraft, {
  router,                       // enables the built-in Nav service
  eagerLoad: [AuthService],     // instantiate on boot, not on first use
})
```

---

## Core Concepts

iocraft solves a specific problem: Vue's reactivity system works at the property level, but when you destructure a plain object returned from a composable you lose the reactive bindings. iocraft wraps every service in a **facade** — a proxy object that re-exposes all properties and methods through proper getters/setters — so destructuring always stays reactive.

```ts
// Without iocraft — reactivity lost on destructure
const { count } = useSomeComposable()    // count is now a plain value

// With iocraft — reactivity preserved
const { count } = obtain(CounterService) // count stays reactive
```

Services are plain TypeScript classes. No special base class, no decorators beyond `@attach()`, no magic.

---

## Services

Decorate a class with `@attach()` to register it with the DI system. That is all that is required.

```ts
import { ref, computed } from 'vue'
import { attach } from 'iocraft'

@attach()
export class CounterService {
  count = ref(0)
  double = computed(() => this.count.value * 2)

  increment() {
    this.count.value++
  }

  reset() {
    this.count.value = 0
  }
}
```

Services are plain classes. You can use `ref`, `computed`, `watch`, `reactive` — anything from Vue — directly inside them.

---

## Obtaining Services

iocraft provides four functions to resolve services, each covering a different lifetime and use case.

### `obtain` — Global Singleton

Resolves a singleton from the root registry. The instance is created once and shared across the entire app. Returns a **facade** — safe to destructure.

```ts
import { obtain } from 'iocraft'
import { CounterService } from './services'

const { count, increment } = obtain(CounterService)
```

```html
<template>
  <button @click="increment">{{ count }}</button>
</template>
```

### `obtainNew` — Component-Scoped Instance

Creates a fresh instance tied to the calling component's lifecycle. Lifecycle hooks defined on the service are automatically bound to the component. Returns a facade.

```ts
import { obtainNew } from 'iocraft'
import { FormService } from './services'

const { values, submit, reset } = obtainNew(FormService)
```

### `obtainRaw` — Raw Singleton

Same as `obtain` but returns the actual class instance instead of a facade. Use this when you need to pass the service to another service or access internals not exposed on the facade.

```ts
import { obtainRaw } from 'iocraft'
import { AuthService } from './services'

const auth = obtainRaw(AuthService)
```

### `obtainRawNew` — Raw Component-Scoped Instance

Creates a fresh raw instance tied to the component lifecycle. Useful for composing services internally.

```ts
import { obtainRawNew } from 'iocraft'
import { UploadService } from './services'

const uploader = obtainRawNew(UploadService)
```

---

## Store

`store()` is a factory that returns a base class with reactive state management utilities built in. Extend it in a service to get a full reactive store without repeating the same boilerplate across your app.

```ts
import { attach, store } from 'iocraft'

interface UserState {
  id: string | null
  name: string
  role: 'admin' | 'user' | 'guest'
}

@attach()
export class UserStore extends store<UserState>({
  id: null,
  name: '',
  role: 'guest',
}) {
  get isAdmin() {
    return this.state.role === 'admin'
  }

  setUser(id: string, name: string, role: UserState['role']) {
    this.update({ id, name, role })
  }

  logout() {
    this.reset()
  }
}
```

Resolve it like any other service:

```ts
const userStore = obtain(UserStore)

userStore.state.name            // reactive
userStore.snapshot              // plain object copy of current state
userStore.update({ name: '' }) // partial update
userStore.reset()               // back to initial state
```

### Store API

| Method | Description |
|--------|-------------|
| `state` | Reactive state object |
| `snapshot` | Raw (non-reactive) copy via `toRaw` |
| `update(partial)` | Merge a partial object into state |
| `pick(key)` | Read a single key from state |
| `compute(fn)` | Return a `ComputedRef` derived from state |
| `observe(key, cb)` | Watch a specific key for changes |
| `observe(fn, cb)` | Watch a derived value for changes |
| `effect(fn)` | Run a `watchEffect` scoped to state |
| `reset()` | Restore state to initial values |

---

## Context (Scoped) Services

Scoped services are provided by a parent component and injected into its descendants using Vue's `provide` / `inject` under the hood.

**Parent component — provide:**

```ts
import { exposeCtx, obtainNew } from 'iocraft'
import { CartService } from './services'

const cart = obtainNew(CartService)
exposeCtx(cart)
```

**Child component — inject:**

```ts
import { obtainCtx } from 'iocraft'
import { CartService } from './services'

const cart = obtainCtx(CartService) // InstanceType<CartService> | undefined
```

This is useful for feature-level state that should not be global — shopping carts, multi-step forms, wizard flows.

---

## Lifecycle Hooks

Services can implement Vue lifecycle hooks by defining methods with the matching name. When resolved via `obtainNew` or `obtainRawNew`, iocraft automatically binds them to the calling component.

```ts
import { ref } from 'vue'
import { attach } from 'iocraft'
import type { OnMounted, OnUnmounted } from 'iocraft'

@attach()
export class PollingService implements OnMounted, OnUnmounted {
  data = ref<string[]>([])
  private timer: ReturnType<typeof setInterval> | null = null

  onMounted() {
    this.timer = setInterval(() => this.fetch(), 5000)
  }

  onUnmounted() {
    if (this.timer) clearInterval(this.timer)
  }

  private async fetch() {
    // ...
  }
}
```

**Supported hooks:**

`onMounted` · `onUnmounted` · `onUpdated` · `onBeforeMount` · `onBeforeUpdate` · `onBeforeUnmount` · `onErrorCaptured` · `onActivated` · `onDeactivated` · `onRenderTracked` · `onRenderTriggered` · `onServerPrefetch` · `onScopeDispose`

> Lifecycle hooks only fire when resolved with `obtainNew` or `obtainRawNew` inside a component. Global singletons via `obtain` have no component context to bind to.

---

## Router Integration

Pass your router to the plugin and iocraft registers a built-in `Nav` service that wraps the router with flat, reactive getters.

```ts
app.use(iocraft, { router })
```

```ts
import { obtain } from 'iocraft'
import { Nav } from 'iocraft'

const { path, query, push, back } = obtain(Nav)
```

`Nav` exposes the full `vue-router` surface as reactive properties and bound methods — no need to call `useRouter()` or `useRoute()` separately.

| Property / Method | Description |
|---|---|
| `path`, `name`, `params`, `query`, `hash`, `fullPath` | Current route, reactive |
| `meta`, `matched`, `redirectedFrom` | Route metadata |
| `currentRoute` | Full `Ref<RouteLocationNormalized>` |
| `push(to)`, `replace(to)` | Navigate |
| `go(delta)`, `back()`, `forward()` | History navigation |
| `resolve(to)` | Resolve without navigating |
| `addRoute()`, `removeRoute()`, `getRoutes()`, `hasRoute()`, `clearRoutes()` | Route registry |
| `beforeEach()`, `beforeResolve()`, `afterEach()`, `onError()` | Navigation guards |
| `isReady()` | Wait for initial navigation to complete |

---

## API Reference

### `@attach()`

Attaches a unique symbol token to a class, making it resolvable by the DI system. Required on every service class.

```ts
@attach()
export class MyService { }
```

---

### `obtain(ServiceClass)`

Returns a reactive facade of the global singleton. Creates the instance on first call, then caches it.

```ts
const { prop, method } = obtain(MyService) // safe to destructure
```

---

### `obtainNew(ServiceClass)`

Returns a reactive facade of a new instance bound to the current component's lifecycle.

```ts
const facade = obtainNew(MyService)
```

---

### `obtainRaw(ServiceClass)`

Returns the raw singleton instance with no facade wrapping.

```ts
const instance = obtainRaw(MyService)
```

---

### `obtainRawNew(ServiceClass)`

Returns a raw new instance bound to the current component's lifecycle.

```ts
const instance = obtainRawNew(MyService)
```

---

### `exposeCtx(serviceInstance)`

Provides a service instance to the component tree below the current component.

```ts
exposeCtx(obtainNew(MyService))
```

---

### `obtainCtx(ServiceClass)`

Injects a service provided by an ancestor component. Returns `undefined` if not found.

```ts
const service = obtainCtx(MyService)
```

---

### `store(initialState)`

Returns a base class with reactive state utilities. Extend it inside a service decorated with `@attach()`.

```ts
@attach()
export class MyStore extends store({ count: 0 }) { }
```

---

### `iocraft` — Vue Plugin

```ts
app.use(iocraft, {
  router?: Router                  // registers the Nav service
  eagerLoad?: ServiceConstructor[] // instantiate these services at boot
})
```

---

## License

MIT · [istiuak-0](https://github.com/istiuak-0)