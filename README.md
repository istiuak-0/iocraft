<div align="center">
  <img src="./assets/banner.svg" alt="iocraft" width="100%" />

[![npm version](https://img.shields.io/npm/v/iocraft?color=3dd68c&labelColor=0d0d0e&label=npm)](https://www.npmjs.com/package/iocraft)
[![license](https://img.shields.io/badge/license-MIT-3dd68c?labelColor=0d0d0e)](./LICENSE)
[![typescript](https://img.shields.io/badge/TypeScript-ready-3dd68c?labelColor=0d0d0e)](https://www.typescriptlang.org/)

</div>



**iocraft** is a dependency injection container for Vue 3 built on the Composition API. It lets you write plain TypeScript classes as services — with full Vue reactivity, lifecycle hooks, and zero boilerplate — and resolve them anywhere in your app without breaking reactivity.


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


## Installation

```bash
npm install iocraft
```


## Setup

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


## Core Concepts

When you destructure a plain class instance or reactive object, Vue's reactivity bindings are severed — you get a snapshot, not a live reference.

```ts
// Destructuring a class instance — reactivity lost
const service = new CounterService()
const { count } = service // count is a plain value, no longer reactive
```

iocraft wraps every resolved service in a **facade** — a thin object that re-exposes every property and method through proper getters and setters bound back to the original reactive instance. Destructuring the facade gives you live reactive references.

```ts
// Destructuring a facade — reactivity preserved
const { count, increment } = obtain(CounterService)
```

Services are plain TypeScript classes. Use `ref`, `computed`, `watch`, `reactive` — anything from Vue — directly inside them. No special base class required.



## Services

Decorate a class with `@attach()` to register it with the DI system.

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

`@attach()` assigns a unique symbol token to the class that the registry uses for lookup. Without it, iocraft cannot resolve the service and will throw.



## Obtaining Services

### `obtain` — Global Singleton

Resolves a singleton from the root registry. The instance is created on first call and reused for the lifetime of the app. Returns a **facade** — safe to destructure with full reactivity.

```vue
<script setup lang="ts">
import { obtain } from 'iocraft'
import { CounterService } from './services'

// use as an object — all access is reactive
const counter = obtain(CounterService)

// or destructure — reactivity is preserved through the facade
const { count, increment, reset } = obtain(CounterService)
</script>

<template>
  <p>Count: {{ count }} — Double: {{ counter.double }}</p>
  <button @click="increment">+1</button>
  <button @click="reset">Reset</button>
</template>
```

### `obtainNew` — Component-Scoped Instance

Creates a fresh instance for each component that calls it. The instance is not shared with anything else. If the service defines lifecycle hook methods, they are automatically bound to the component that resolved it.

```vue
<script setup lang="ts">
import { obtainNew } from 'iocraft'
import { FormService } from './services'

const { values, errors, submit, reset } = obtainNew(FormService)
</script>

<template>
  <form @submit.prevent="submit">
    <input v-model="values.email" />
    <span v-if="errors.email">{{ errors.email }}</span>
    <button type="submit">Submit</button>
  </form>
</template>
```

### `obtainRaw` — Raw Singleton

Same as `obtain` but returns the actual class instance with no facade. Use this when you need to pass a service into another service, or when you need access to private internals.

```ts
import { obtainRaw } from 'iocraft'
import { AuthService } from './services'

const auth = obtainRaw(AuthService) // raw instance
```

### `obtainRawNew` — Raw Component-Scoped Instance

Creates a fresh raw instance bound to the current component's lifecycle. No facade is applied. Useful when composing services that need to call each other directly.

```ts
import { obtainRawNew } from 'iocraft'
import { UploadService } from './services'

const uploader = obtainRawNew(UploadService) // raw instance, component-scoped
```

---

## Store

`store()` is a factory that generates a reactive base class you can extend. It is designed to replace Pinia stores for cases where your state lives inside a service — you get reactive state, computed values, watchers, and a reset mechanism without any external store library.

### Defining a store

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
  // Computed via getter
  get isAdmin() {
    return this.state.role === 'admin'
  }

  // Derived computed ref — reactive in templates
  nameUppercase = this.compute(s => s.name.toUpperCase())

  // Watch for changes and react
  constructor() {
    super()
    this.observe('role', (next, prev) => {
      console.log(`Role changed from ${prev} to ${next}`)
    })
  }

  setUser(id: string, name: string, role: UserState['role']) {
    this.update({ id, name, role })
  }

  logout() {
    this.reset()
  }
}
```

### Using the store

```vue
<script setup lang="ts">
import { obtain } from 'iocraft'
import { UserStore } from './stores'

const user = obtain(UserStore)

// state is fully reactive — use directly in template
// snapshot gives you a plain object copy when you need to serialize
console.log(user.snapshot) // { id: null, name: '', role: 'guest' }
</script>

<template>
  <p>{{ user.state.name }}</p>
  <p>{{ user.nameUppercase }}</p>
  <button v-if="user.isAdmin" @click="user.logout">Logout</button>
</template>
```

### Store API

**`state`**
The reactive state object. Mutate it directly or via `update`. Access it in templates as `store.state.key`.

```ts
user.state.name       // read
user.state.name = 'x' // write — reactive
```

**`update(partial)`**
Merges a partial object into state. Prefer this over direct mutation when updating multiple keys at once.

```ts
user.update({ name: 'Alice', role: 'admin' })
```

**`snapshot`**
Returns a plain (non-reactive) copy of the current state via `toRaw`. Use when you need to serialize state, log it, or pass it outside Vue's reactivity system.

```ts
const data = user.snapshot
JSON.stringify(data) // safe — no reactive proxies
```

**`pick(key)`**
Reads a single key from state. Useful when you only need one value and want a clean access pattern.

```ts
const role = user.pick('role') // equivalent to user.state.role
```

**`compute(fn)`**
Returns a `ComputedRef` derived from state. Stays reactive. Ideal for derived values you want to expose from the store.

```ts
@attach()
class CartStore extends store({ items: [] as string[], discount: 0 }) {
  total = this.compute(s => s.items.length - s.discount)
}

const cart = obtain(CartStore)
cart.total.value // reactive computed
```

**`observe(key, callback)` / `observe(fn, callback)`**
Watches state for changes. Accepts either a key name or a getter function for derived observation.

```ts
// Watch a single key
this.observe('role', (next, prev) => {
  if (next === 'admin') this.loadAdminData()
})

// Watch a derived value
this.observe(s => s.items.length, (next) => {
  console.log(`Cart has ${next} items`)
})
```

**`effect(fn)`**
Runs a `watchEffect` scoped to state. Re-runs whenever any accessed state property changes.

```ts
this.effect(s => {
  document.title = `${s.name} — Dashboard`
})
```

**`reset()`**
Restores state to the values passed to `store()` at definition time.

```ts
user.reset() // back to { id: null, name: '', role: 'guest' }
```

---

## Context (Scoped) Services

Context services are provided by a parent component and injected into any descendant. Under the hood this uses Vue's `provide` / `inject`.

**Parent — provide:**

```vue
<script setup lang="ts">
import { exposeCtx, obtainNew } from 'iocraft'
import { CartService } from './services'

// create a fresh instance scoped to this component tree
const cart = obtainNew(CartService)
exposeCtx(cart)
</script>
```

**Child — inject:**

```vue
<script setup lang="ts">
import { obtainCtx } from 'iocraft'
import { CartService } from './services'

const cart = obtainCtx(CartService) // CartService instance | undefined
</script>
```

Use this for state that should be shared within a subtree but not globally — shopping carts, multi-step wizards, nested form sections.

---

## Lifecycle Hooks

Services resolved with `obtainNew` or `obtainRawNew` can define Vue lifecycle hook methods directly on the class. iocraft detects and binds them to the component that resolved the service.

iocraft exports typed interfaces for every supported hook so your service can implement them safely without typos.

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

```vue
<script setup lang="ts">
import { obtainNew } from 'iocraft'
import { PollingService } from './services'

// onMounted and onUnmounted on the service fire with this component
const { data } = obtainNew(PollingService)
</script>
```

**Exported hook interfaces:**

`OnMounted` · `OnUnmounted` · `OnUpdated` · `OnBeforeMount` · `OnBeforeUpdate` · `OnBeforeUnmount` · `OnErrorCaptured` · `OnActivated` · `OnDeactivated` · `OnRenderTracked` · `OnRenderTriggered` · `OnServerPrefetch` · `OnScopeDispose`

> Lifecycle hooks only fire when the service is resolved with `obtainNew` or `obtainRawNew` inside a component. Global singletons resolved via `obtain` have no component context to bind to.

---

## Router Integration

Pass your router to the plugin and iocraft registers a built-in `Nav` service that wraps `vue-router` with flat, reactive getters. No more importing `useRouter` and `useRoute` separately.

```ts
app.use(iocraft, { router })
```

```vue
<script setup lang="ts">
import { obtain } from 'iocraft'
import { Nav } from 'iocraft/common'

const nav = obtain(Nav)
const { push } = obtain(Nav) // destructuring also works
</script>

<template>
  <p>Path: <code>{{ nav.path }}</code></p>
  <p>Name: <code>{{ nav.name?.toString() ?? '-' }}</code></p>
  <p>Full path: <code>{{ nav.fullPath }}</code></p>
  <button @click="nav.push('/home')">Home</button>
  <button @click="nav.back()">Back</button>
  <button @click="nav.forward()">Forward</button>
</template>
```

**Reactive route properties:** `path` · `name` · `params` · `query` · `hash` · `fullPath` · `meta` · `matched` · `redirectedFrom` · `currentRoute`

**Navigation:** `push(to)` · `replace(to)` · `go(delta)` · `back()` · `forward()`

**Route registry:** `addRoute()` · `removeRoute()` · `getRoutes()` · `hasRoute()` · `clearRoutes()`

**Guards:** `beforeEach()` · `beforeResolve()` · `afterEach()` · `onError()`

**Other:** `resolve(to)` · `isReady()`

---

## License

MIT · [istiuak-0](https://github.com/istiuak-0/iocraft)
