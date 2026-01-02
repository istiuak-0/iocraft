# @vuedi/core

**Work in Progress — Not ready for production use.**

A lightweight, type-safe Dependency Injection (DI) container for Vue 3, built on top of Vue’s native `provide`/`inject` and the Composition API.

## Usage (Preview)

The API is not finalized. The following is a conceptual example only:

```ts
import { resolve,  Register } from '@vuedi/core';

@Register()
class MyService {
  fetchData() { /* ... */ }
}


// In a Vue component
const myService = resolve(MyService);
```

## Build

From the monorepo root:

```bash
pnpm core:build
```

This outputs ESM, CJS, and declaration files to `packages/core/dist`.

---

Documentation, tests, and a stable release will follow. Watch the repository for updates.