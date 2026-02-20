# Task API - Complete Documentation

## Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [API Reference](#api-reference)
4. [Implementation Deep Dive](#implementation-deep-dive)
5. [Usage Patterns](#usage-patterns)
6. [Edge Cases & Solutions](#edge-cases--solutions)

---

## Overview

The `task` function is a lean async state management primitive designed for service-layer business logic. It wraps async operations with reactive state, automatic retry, and race condition prevention.

### Design Goals
- **Lean**: No bloat, only essential features
- **Service-First**: Works with DI/Store patterns, not component hooks
- **Type-Safe**: Full TypeScript support
- **Predictable**: Explicit control, no magic caching

### What It's NOT
- ❌ Not a global cache manager (like TanStack Query)
- ❌ Not a component hook (like SWR)
- ❌ Not handling SSR/hydration

---

## Core Concepts

### 1. Execution States

Every task has a reactive status that flows through states:

```
idle → loading → success
                ↓
              error
```

```typescript
const userTask = task({
  fn: async (id: number) => fetchUser(id)
})

console.log(userTask.status.value) // 'idle'

userTask.run(123)
console.log(userTask.status.value) // 'loading'

// After completion:
console.log(userTask.status.value) // 'success' or 'error'
```

**Why this matters:** UI can react to these states for loading indicators, error messages, etc.

---

### 2. Execution vs Run vs Start

There are three execution paths, each with different semantics:

#### `execute()` - Internal Core
- Direct execution, no debouncing
- Returns a Promise
- Used internally by `run()` and `start()`

#### `run()` - Repeated Execution
- Can be called multiple times
- Respects debounce if configured
- Always makes new request (unless debounced/in-flight)

```typescript
const search = task({
  fn: async (query: string) => api.search(query),
  debounce: 300
})

// User types rapidly:
search.run('a')   // Debounced, cancelled
search.run('ab')  // Debounced, cancelled
search.run('abc') // Fires after 300ms
```

#### `start()` - One-Time Initialization
- Idempotent: only executes once
- Returns cached data on subsequent calls
- Never debounced (always immediate)

```typescript
const config = task({
  fn: async () => fetchConfig()
})

// First call - executes
await config.start()

// Subsequent calls - returns cached data
await config.start() // Returns cached, no fetch
await config.start() // Returns cached, no fetch
```

**Use Cases:**
- `run()` - User actions, search, pagination
- `start()` - App initialization, singleton data

---

### 3. Race Condition Prevention

**The Problem:**
```typescript
// User rapidly changes page: 1 → 2 → 3
updatePage(1) // Request A starts (slow: 2s)
updatePage(2) // Request B starts (fast: 0.5s)
updatePage(3) // Request C starts (fast: 0.5s)

// Completion order: C → B → A
// Without protection: Page shows data for page 1! 💥
```

**The Solution: Execution IDs**

Every execution gets a unique ID. Only the latest ID can update state.

```typescript
let currentExecutionId = 0

async function execute(...args: TArgs) {
  const executionId = ++currentExecutionId // Assign unique ID
  
  const result = await options.fn(...args)
  
  // Only update if still latest
  if (executionId !== currentExecutionId) {
    return undefined // Stale, ignore
  }
  
  data.value = result // Safe to update
}
```

**Why incrementing works:**
- Request A: `executionId = 1, currentExecutionId = 1` ✅
- Request B: `executionId = 2, currentExecutionId = 2` (A becomes stale)
- Request C: `executionId = 3, currentExecutionId = 3` (B becomes stale)
- When A completes: `executionId = 1, currentExecutionId = 3` ❌ Ignored

---

### 3.1. How Execution IDs ACTUALLY Work (The "Aha!" Moment)

**Common Confusion:** "If I increment inside the function, won't they always match?"

**The Key Insight:** Multiple function calls run **concurrently**. Each captures its own ID, but they all share the same counter.

#### Timeline Example

```typescript
let currentExecutionId = 0

// t=0ms: User clicks page 1
async function execute(1) {
  const executionId = ++currentExecutionId  
  // executionId = 1 (captured)
  // currentExecutionId = 1
  
  const result = await api.fetch(1)  // ⏳ Starts 2s request, function PAUSES
  // ... execution suspended here ...
}

// t=100ms: User clicks page 2 (execute(1) still waiting!)
async function execute(2) {
  const executionId = ++currentExecutionId  
  // executionId = 2 (captured)
  // currentExecutionId = 2 (shared variable!)
  
  const result = await api.fetch(2)  // ⏳ Starts 2s request, function PAUSES
  // ... execution suspended here ...
}

// t=200ms: User clicks page 3 (both still waiting!)
async function execute(3) {
  const executionId = ++currentExecutionId  
  // executionId = 3 (captured)
  // currentExecutionId = 3 (shared variable!)
  
  const result = await api.fetch(3)  // ⏳ Starts 2s request, function PAUSES
  // ... execution suspended here ...
}

// t=2000ms: execute(1)'s await completes, function RESUMES
async function execute(1) {
  // Resumes from await with result
  
  // Check captured ID vs shared counter
  if (executionId !== currentExecutionId) {  // 1 !== 3 ✅ TRUE!
    return undefined  // Stale, ignored
  }
  // Never updates state
}

// t=2100ms: execute(2)'s await completes
async function execute(2) {
  // Check: 2 !== 3 ✅ TRUE! → Ignored
}

// t=2200ms: execute(3)'s await completes
async function execute(3) {
  // Check: 3 === 3 ❌ FALSE
  data.value = result  // ✅ Only this one updates!
}
```

#### Visual Representation

```typescript
let currentExecutionId = 0  // Shared by ALL executions

// ═══ Call 1 ═══
const exec1_id = ++currentExecutionId  // exec1_id=1, currentExecutionId=1
await slowAPI()  // 🛑 PAUSES (doesn't block other code)

  // ═══ Call 2 (during Call 1's pause) ═══
  const exec2_id = ++currentExecutionId  // exec2_id=2, currentExecutionId=2
  await slowAPI()  // 🛑 PAUSES

    // ═══ Call 3 (during both pauses) ═══
    const exec3_id = ++currentExecutionId  // exec3_id=3, currentExecutionId=3
    await slowAPI()  // 🛑 PAUSES

    // ═══ Call 3 resumes first (fastest) ═══
    if (exec3_id !== currentExecutionId)  // 3 !== 3 → FALSE
    data.value = result  // ✅ Updates state

  // ═══ Call 2 resumes ═══
  if (exec2_id !== currentExecutionId)  // 2 !== 3 → TRUE
  return  // ✅ Ignored (stale)

// ═══ Call 1 resumes last ═══
if (exec1_id !== currentExecutionId)  // 1 !== 3 → TRUE
return  // ✅ Ignored (stale)
```

#### The Critical Points

**1. Each call captures its own `executionId`:**
```typescript
const executionId = ++currentExecutionId
// This creates a LOCAL variable with the incremented value
// Each function call has its OWN copy
```

**2. They all share the same `currentExecutionId`:**
```typescript
let currentExecutionId = 0
// This is ONE variable shared across ALL function calls
// When Call 2 increments it, Call 1 sees the change
```

**3. `await` pauses the function but doesn't block:**
```typescript
await someAsyncOperation()
// Function execution PAUSES here
// Other code (including new execute() calls) continues running
// When the Promise resolves, execution RESUMES from this point
```

#### Real-World Analogy

**Ticket Counter System:**

```
Ticket Dispenser: 0

👤 Person 1 arrives → Takes ticket #1, goes to waiting room
                      (Dispenser now shows: 1)

👤 Person 2 arrives → Takes ticket #2, goes to waiting room
                      (Dispenser now shows: 2)

👤 Person 3 arrives → Takes ticket #3, goes to waiting room
                      (Dispenser now shows: 3)

--- Services complete in random order ---

👤 Person 1's service done:
   "Is my ticket (#1) the current number (#3)?"
   NO → Get in line again (ignored)

👤 Person 2's service done:
   "Is my ticket (#2) the current number (#3)?"
   NO → Get in line again (ignored)

👤 Person 3's service done:
   "Is my ticket (#3) the current number (#3)?"
   YES → Proceed! ✅
```

#### Why This Pattern Works

**Closures + Async = Magic**

```typescript
async function example(page) {
  // ✅ myId is captured when function is CALLED
  const myId = ++currentExecutionId
  
  console.log(`[Call ${page}] Captured ID: ${myId}`)
  
  await delay(1000)  // Function PAUSES, other calls continue
  
  // ✅ myId is STILL the captured value
  // ❌ currentExecutionId may have changed!
  console.log(`[Call ${page}] My ID: ${myId}, Current: ${currentExecutionId}`)
  
  if (myId !== currentExecutionId) {
    console.log(`[Call ${page}] I'm stale!`)
  }
}

example(1)  // Captures myId=1
example(2)  // Captures myId=2, currentExecutionId now 2
example(3)  // Captures myId=3, currentExecutionId now 3

// Output after 1 second:
// [Call 1] Captured ID: 1
// [Call 2] Captured ID: 2
// [Call 3] Captured ID: 3
// [Call 1] My ID: 1, Current: 3  → Stale!
// [Call 2] My ID: 2, Current: 3  → Stale!
// [Call 3] My ID: 3, Current: 3  → Valid!
```

#### Common Misconception Addressed

**❌ Wrong Thinking:**
> "The function increments the ID, so when it checks later, it will always match."

**✅ Correct Understanding:**
> "The function **captures** the incremented ID, then **pauses**. During the pause, **other calls** can increment the **shared** counter. When the function **resumes**, its captured ID is compared to the **potentially changed** shared counter."

#### Test Your Understanding

**Quiz:**
```typescript
let currentExecutionId = 0

async function execute(name) {
  const myId = ++currentExecutionId
  console.log(`${name} captured ${myId}`)
  
  await delay(100)
  
  if (myId !== currentExecutionId) {
    console.log(`${name} (${myId}) is stale! Current is ${currentExecutionId}`)
  } else {
    console.log(`${name} (${myId}) is current!`)
  }
}

execute('A')
execute('B')
execute('C')
```

**Answer:**
```
A captured 1
B captured 2
C captured 3
A (1) is stale! Current is 3
B (2) is stale! Current is 3
C (3) is current!
```

**Why?** All three calls start almost simultaneously, each capturing their ID before any `await` completes. The shared `currentExecutionId` ends at 3, so only C's captured ID matches.

---

### 4. Request Deduplication

**The Problem:**
```typescript
constructor() {
  this.userTask.start()
  this.userTask.start() // Duplicate request! 💥
}
```

**The Solution: In-Flight Promise Tracking**

```typescript
let inFlightPromise: Promise<TResult | undefined> | null = null

async function execute(...args: TArgs) {
  // Already running? Return same promise
  if (inFlightPromise && status.value === 'loading') {
    return inFlightPromise
  }
  
  inFlightPromise = (async () => {
    // ... execute logic
  })().finally(() => {
    inFlightPromise = null // Clear when done
  })
  
  return inFlightPromise
}
```

**Result:**
```typescript
// Both calls share the same promise
const promise1 = userTask.start()
const promise2 = userTask.start()

promise1 === promise2 // true ✅
```

**Why this matters:** Prevents wasted API calls and potential state corruption.

---

### 5. Retry Logic with Exponential Backoff

**Network failures are common.** Production apps must retry.

#### Simple Retry
```typescript
const task = task({
  fn: async () => fetchData(),
  retry: 3 // Retry 3 times
})
```

#### Advanced Retry
```typescript
const task = task({
  fn: async () => fetchData(),
  retry: {
    count: 3,
    delay: 1000,     // 1s between retries
    backoff: true    // Exponential: 1s, 2s, 4s
  }
})
```

**Exponential Backoff Formula:**
```typescript
const delay = baseDelay * Math.pow(2, attempt - 1)

// Example with baseDelay = 1000ms:
// Attempt 1: 1000 * 2^0 = 1000ms (1s)
// Attempt 2: 1000 * 2^1 = 2000ms (2s)
// Attempt 3: 1000 * 2^2 = 4000ms (4s)
```

**Why exponential?** Gives the server time to recover. Linear delays can overwhelm failing servers.

---

### 6. Debouncing

Delays execution until user stops triggering for X milliseconds.

```typescript
const search = task({
  fn: async (query: string) => api.search(query),
  debounce: 300 // Wait 300ms after last call
})

// User types: "h" → "he" → "hel" → "hell" → "hello"
// Only searches once, 300ms after "hello"
```

**Implementation:**
```typescript
function debounce(fn, ms) {
  let timer = null
  
  return (...args) => {
    clearTimeout(timer) // Cancel previous
    
    return new Promise((resolve, reject) => {
      timer = setTimeout(async () => {
        try {
          resolve(await fn(...args))
        } catch (err) {
          reject(err) // Must reject, not just resolve(undefined)
        }
      }, ms)
    })
  }
}
```

**Critical:** Must reject on error, otherwise errors get swallowed.

---

### 7. Reactive Tracking

Auto-runs when reactive dependencies change.

```typescript
const route = useRoute()

const userTask = task({
  fn: async (id: number) => fetchUser(id),
  track: () => [Number(route.params.id)] // Returns args
})

// When route.params.id changes:
// → track() returns new args
// → run() is called with new args
// → previous request is invalidated (execution ID)
```

**With lazy option:**
```typescript
// lazy: true (default) - waits for first change
track: () => [searchQuery.value],
lazy: true

// lazy: false - runs immediately
track: () => [userId.value],
lazy: false // Runs on task creation
```

---

## API Reference

### `task<TArgs, TResult>(options)`

Creates a new task instance.

#### Options

```typescript
interface TaskOptions<TArgs extends any[], TResult> {
  // Required: The async function to execute
  fn: (...args: TArgs) => Promise<TResult>
  
  // Optional: Reactive tracking
  track?: () => TArgs
  
  // Optional: Execution behavior
  lazy?: boolean      // Default: true
  debounce?: number   // Milliseconds
  
  // Optional: Retry configuration
  retry?: number | {
    count: number
    delay?: number      // Default: 1000ms
    backoff?: boolean   // Default: true
  }
  
  // Optional: Lifecycle hooks
  onLoading?: (args: TArgs) => void
  onSuccess?: (args: TArgs, data: TResult) => void
  onError?: (args: TArgs, error: Error, context: ErrorContext) => void
  onFinally?: (args: TArgs, data?: TResult, error?: Error) => void
}

interface ErrorContext {
  attempt: number      // Which retry attempt (1-indexed)
  willRetry: boolean   // Is another retry coming?
}
```

#### Return Value

```typescript
interface TaskReturn<TArgs extends any[], TResult> {
  // Reactive state
  data: Ref<TResult | undefined>
  error: Ref<Error | undefined>
  status: Ref<'idle' | 'loading' | 'success' | 'error'>
  
  // Computed flags
  isLoading: ComputedRef<boolean>
  isIdle: ComputedRef<boolean>
  isSuccess: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  
  // Initialization flag
  initialized: Ref<boolean>
  
  // Methods
  start: (...args: TArgs) => Promise<TResult | undefined>
  run: (...args: TArgs) => Promise<TResult | undefined>
  clear: () => void
  reset: () => void
}
```

---

## Implementation Deep Dive

### State Management

```typescript
const data = ref<TResult | undefined>()
const error = ref<Error | undefined>()
const status = ref<TaskStatus>('idle')
const initialized = ref(false)
```

**Why `undefined` instead of `null`?**
- Consistent with Vue's `ref()` default
- TypeScript narrowing works better
- Matches `Promise<T | undefined>` pattern

### Computed Flags

```typescript
const isLoading = computed(() => status.value === 'loading')
const isIdle = computed(() => status.value === 'idle')
const isError = computed(() => status.value === 'error')
const isSuccess = computed(() => status.value === 'success')
```

**Why not just use `status.value === 'loading'`?**
- Better DX: `if (task.isLoading.value)` vs `if (task.status.value === 'loading')`
- Type narrowing in templates: `v-if="task.isSuccess.value"` narrows `task.data.value` type
- Computed caching prevents unnecessary re-renders

### Execution Tracking

```typescript
let currentExecutionId = 0
let inFlightPromise: Promise<TResult | undefined> | null = null
```

**Why `let` instead of `ref`?**
- Not reactive state - internal tracking only
- No need for `.value` access
- Better performance (no reactivity overhead)

### Retry Configuration Parsing

```typescript
const retryConfig: RetryConfig | undefined = options.retry
  ? typeof options.retry === 'number'
    ? { count: options.retry, delay: 1000, backoff: true }
    : { delay: 1000, backoff: true, ...options.retry }
  : undefined
```

**Why normalize config upfront?**
- Parse once, use many times
- Simplifies retry loop logic
- Provides sensible defaults

### The Execute Function

This is the heart of the implementation. Let's break it down:

#### Step 1: Deduplication Check

```typescript
if (inFlightPromise && status.value === 'loading') {
  if (__DEV__) {
    console.info('[task] Returning in-flight promise')
  }
  return inFlightPromise
}
```

**Why check both conditions?**
- `inFlightPromise` - ensures promise exists
- `status.value === 'loading'` - extra safety (should always match, but defensive)

#### Step 2: Assign Execution ID

```typescript
const executionId = ++currentExecutionId
```

**Why increment BEFORE execution?**
- New execution immediately invalidates previous ones
- Prevents race where old execution checks before new one starts

**How this actually works:**
```typescript
// Three rapid calls
execute(1)  // executionId=1 captured, currentExecutionId=1, awaits...
execute(2)  // executionId=2 captured, currentExecutionId=2, awaits...
execute(3)  // executionId=3 captured, currentExecutionId=3, awaits...

// When execute(1) resumes: 1 !== 3 → ignored ✅
// When execute(2) resumes: 2 !== 3 → ignored ✅
// When execute(3) resumes: 3 === 3 → updates state ✅
```

#### Step 3: Create In-Flight Promise

```typescript
inFlightPromise = (async () => {
  // ... retry loop
})().finally(() => {
  if (inFlightPromise && executionId === currentExecutionId) {
    inFlightPromise = null
    options.onFinally?.(args, data.value, error.value)
  }
})
```

**Why wrap in IIFE and immediately invoke?**
- Returns Promise immediately (deduplication works)
- `finally` ensures cleanup even if error thrown
- `finally` check prevents race conditions

#### Step 4: Retry Loop

```typescript
const maxAttempts = (retryConfig?.count ?? 0) + 1

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  try {
    // ... execute
    return result
  } catch (e) {
    // ... handle error
    if (isLastAttempt) throw lastError
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}
```

**Why `maxAttempts = count + 1`?**
- `count: 3` means "3 retries"
- Initial attempt + 3 retries = 4 total attempts
- Simpler than `attempt <= count + 1`

**Why await timeout in catch?**
- Pauses execution for retry delay
- Non-blocking (doesn't freeze app)
- Can be cancelled if execution superseded

#### Step 5: Staleness Check

```typescript
if (executionId !== currentExecutionId) {
  if (__DEV__) {
    console.info('[task] Stale execution ignored')
  }
  return undefined
}
```

**Why return `undefined` instead of throwing?**
- Not an error - just superseded
- Calling code shouldn't treat as failure
- Still settles the promise (no hanging)

**Deep dive on how this check works:**

```typescript
// Timeline demonstration
let currentExecutionId = 0

// t=0: Call A
async function execute('page-1') {
  const executionId = ++currentExecutionId  // executionId=1, currentExecutionId=1
  const result = await fetch('page-1')      // Takes 2 seconds, pauses here
  
  // t=2000: Resumes here
  if (executionId !== currentExecutionId) { // 1 !== 3 ✅ TRUE
    return undefined                        // Ignored
  }
  data.value = result                       // Never reached
}

// t=500: Call B (A still waiting)
async function execute('page-2') {
  const executionId = ++currentExecutionId  // executionId=2, currentExecutionId=2
  const result = await fetch('page-2')      // Takes 1.5 seconds, pauses
  
  // t=2000: Resumes here
  if (executionId !== currentExecutionId) { // 2 !== 3 ✅ TRUE
    return undefined                        // Ignored
  }
}

// t=1000: Call C (A and B still waiting)
async function execute('page-3') {
  const executionId = ++currentExecutionId  // executionId=3, currentExecutionId=3
  const result = await fetch('page-3')      // Takes 1 second, pauses
  
  // t=2000: Resumes here
  if (executionId !== currentExecutionId) { // 3 === 3 ❌ FALSE
    return undefined
  }
  data.value = result                       // ✅ Updates state
}

// Result: Only page-3 data is shown, despite A and B completing
```

**The key insight:** The `executionId` constant captures a value that never changes within that function call, but the `currentExecutionId` variable is shared and gets modified by every new call.

#### Step 6: Success Path

```typescript
data.value = result
status.value = 'success'
options.onSuccess?.(args, result)
return result
```

**Order matters:**
1. Update state first (atomic)
2. Call callback second (can read new state)
3. Return value last

#### Step 7: Error Path

```typescript
options.onError?.(args, lastError, {
  attempt,
  willRetry
})

if (isLastAttempt) {
  error.value = lastError
  status.value = 'error'
  throw lastError
}
```

**Why call onError before setting state on retry?**
- User can show retry notification
- State still shows `loading` (accurate)

**Why throw instead of return?**
- Calling code can `try/catch`
- Follows Promise semantics
- Distinguishes success from failure

### The Run Function

```typescript
const runImpl = options.debounce
  ? debounce(execute, options.debounce)
  : execute

async function run(...args: TArgs): Promise<TResult | undefined> {
  return runImpl(...args)
}
```

**Why separate `runImpl` from `run`?**
- `runImpl` is the actual implementation (debounced or not)
- `run` is the public API (stable reference)
- Allows conditional debouncing without recreating function

### The Start Function

```typescript
async function start(...args: TArgs): Promise<TResult | undefined> {
  if (initialized.value) {
    if (__DEV__) {
      console.info('[task] Already initialized, returning cached data')
    }
    return data.value
  }

  initialized.value = true
  return execute(...args)
}
```

**Why use `execute` not `run`?**
- `start` should never be debounced
- Initialization should be immediate
- User expects instant execution

**Why return `data.value` not `Promise.resolve(data.value)`?**
- Already in async function - auto-wrapped
- Simpler code
- Same result

### Clear vs Reset

```typescript
function clear(): void {
  currentExecutionId++ // Invalidate in-flight
  data.value = undefined
  error.value = undefined
  status.value = 'idle'
  // initialized stays true
}

function reset(): void {
  currentExecutionId++ // Invalidate in-flight
  data.value = undefined
  error.value = undefined
  status.value = 'idle'
  initialized.value = false // Full reset
}
```

**Use cases:**
- `clear()` - User logs out, wipe data but keep task usable
- `reset()` - Full teardown, can call `start()` again

**Why increment `currentExecutionId`?**
- Cancels any in-flight requests
- Prevents them from updating state after clear
- Essential for correctness

**How incrementing cancels in-flight requests:**
```typescript
// Request is in-flight
async function execute() {
  const executionId = 5  // Captured when started
  await someSlowAPI()    // Takes 10 seconds...
  
  // Meanwhile, clear() is called:
  // currentExecutionId++ → now 6
  
  // When request completes:
  if (executionId !== currentExecutionId) {  // 5 !== 6 ✅
    return undefined  // Request result ignored!
  }
}
```

### Track Setup

```typescript
if (options.track) {
  watch(
    options.track,
    (newArgs) => {
      run(...newArgs)
    },
    { immediate: !options.lazy }
  )
}
```

**Why `immediate: !options.lazy`?**
- `lazy: false` → run immediately
- `lazy: true` → wait for first change
- Single configuration point

**Why use `run` not `execute`?**
- Respects debounce if configured
- Consistent behavior
- User expects debouncing on reactive changes

---

## Usage Patterns

### Pattern 1: Simple Data Fetching

```typescript
const fetchUsers = task({
  fn: async () => {
    const res = await fetch('/api/users')
    return res.json()
  }
})

// In component
onMounted(() => {
  fetchUsers.run()
})
```

**Template:**
```vue
<div v-if="fetchUsers.isLoading.value">Loading...</div>
<div v-else-if="fetchUsers.isError.value">
  Error: {{ fetchUsers.error.value?.message }}
</div>
<div v-else>
  <div v-for="user in fetchUsers.data.value" :key="user.id">
    {{ user.name }}
  </div>
</div>
```

### Pattern 2: Service Layer

```typescript
@Register()
class UserService extends Store({
  users: [] as User[],
  page: 1,
  pageSize: 10
}) {
  
  readonly fetchUsers = task({
    fn: async (page: number, size: number) => {
      const res = await api.getUsers(page, size)
      return res
    },
    track: () => [this.pick('page'), this.pick('pageSize')],
    retry: 3,
    onSuccess: (args, data) => {
      this.update({ users: data.users })
    }
  })

  constructor() {
    super()
    this.fetchUsers.start(1, 10)
  }

  nextPage() {
    this.update({ page: this.state.page + 1 })
    // Auto-refetches via track
  }
}
```

**Why this works:**
- Store owns the state (`users`)
- Task manages the async operation
- Track keeps them in sync
- Clear separation of concerns

### Pattern 3: Debounced Search

```typescript
const searchQuery = ref('')

const searchTask = task({
  fn: async (query: string) => {
    const res = await fetch(`/api/search?q=${query}`)
    return res.json()
  },
  debounce: 300,
  track: () => [searchQuery.value]
})
```

**Template:**
```vue
<input v-model="searchQuery" placeholder="Search..." />

<div v-if="searchTask.isLoading.value">Searching...</div>
<div v-else-if="searchTask.data.value">
  {{ searchTask.data.value.length }} results
</div>
```

**User types "hello":**
```
h   → timer starts (300ms)
he  → timer resets (300ms)
hel → timer resets (300ms)
hell → timer resets (300ms)
hello → timer resets (300ms)
... 300ms pass ...
→ Search executes for "hello"
```

### Pattern 4: Form Submission with Retry

```typescript
const submitForm = task({
  fn: async (data: FormData) => {
    const res = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (!res.ok) throw new Error('Submission failed')
    return res.json()
  },
  retry: {
    count: 3,
    delay: 2000,
    backoff: true
  },
  onError: (args, error, { attempt, willRetry }) => {
    if (willRetry) {
      toast.warning(`Attempt ${attempt} failed, retrying...`)
    } else {
      toast.error('Submission failed after 3 attempts')
    }
  },
  onSuccess: () => {
    toast.success('Form submitted!')
    router.push('/success')
  }
})

async function handleSubmit() {
  try {
    await submitForm.run(formData)
  } catch (err) {
    // Already handled in onError
  }
}
```

**Retry timeline:**
```
t=0s    → Attempt 1 fails
t=2s    → Attempt 2 fails (2s delay)
t=6s    → Attempt 3 fails (4s backoff)
t=14s   → Attempt 4 fails (8s backoff)
→ Gives up, shows final error
```

### Pattern 5: Route-Based Data Loading

```typescript
const route = useRoute()

const pageTask = task({
  fn: async (pageId: string) => {
    const res = await fetch(`/api/pages/${pageId}`)
    return res.json()
  },
  track: () => [route.params.id as string]
})
```

**Navigation flow:**
```
/page/1 → pageTask.run('1') (execId=1)
/page/2 → pageTask.run('2') (execId=2, invalidates 1)
/page/3 → pageTask.run('3') (execId=3, invalidates 2)

// If request for page 1 completes after page 3:
→ Ignored (execId 1 !== 3)
→ UI shows correct data for page 3 ✅
```

### Pattern 6: Parallel Requests

```typescript
const userTask = task({ fn: (id) => fetchUser(id) })
const postsTask = task({ fn: (id) => fetchPosts(id) })
const commentsTask = task({ fn: (id) => fetchComments(id) })

onMounted(() => {
  const userId = 123
  
  // All fire in parallel
  userTask.run(userId)
  postsTask.run(userId)
  commentsTask.run(userId)
})
```

**Template:**
```vue
<div>
  <UserCard v-if="userTask.isSuccess.value" :user="userTask.data.value" />
  <PostsList v-if="postsTask.isSuccess.value" :posts="postsTask.data.value" />
  <Comments v-if="commentsTask.isSuccess.value" :comments="commentsTask.data.value" />
</div>
```

Each shows loading independently.

### Pattern 7: Sequential with Dependencies

```typescript
async function loadDashboard() {
  // Step 1: Load user
  const user = await userTask.run(userId)
  if (!user) return
  
  // Step 2: Load user's team
  const team = await teamTask.run(user.teamId)
  if (!team) return
  
  // Step 3: Load team's projects
  const projects = await projectsTask.run(team.id)
}
```

**Why await?**
- Each step depends on previous
- Can't parallelize
- Clear error handling at each step

---

## Edge Cases & Solutions

### Edge Case 1: Rapid Track Changes

**Scenario:**
```typescript
const page = ref(1)

const task = task({
  fn: async (p: number) => {
    await delay(1000)
    return fetchPage(p)
  },
  track: () => [page.value]
})

// User rapidly clicks: 1 → 2 → 3 → 4 → 5
page.value = 1
page.value = 2
page.value = 3
page.value = 4
page.value = 5
```

**Without execution IDs:**
```
Request 1 (page=1) starts, completes 1s later → updates UI
Request 2 (page=2) starts, completes 1s later → updates UI
Request 3 (page=3) starts, completes 1s later → updates UI
Request 4 (page=4) starts, completes 1s later → updates UI
Request 5 (page=5) starts, completes 1s later → updates UI
→ UI flashes through all pages! 💥
```

**With execution IDs:**
```
Request 1 (execId=1) starts
Request 2 (execId=2) starts, 1 becomes stale
Request 3 (execId=3) starts, 2 becomes stale
Request 4 (execId=4) starts, 3 becomes stale
Request 5 (execId=5) starts, 4 becomes stale

All complete, but only 5 updates UI ✅
```

**Detailed execution flow:**
```typescript
let currentExecutionId = 0

// t=0: page.value = 1
async function execute(1) {
  const executionId = 1  // Captured
  await api.fetch(1)     // Pauses 1s
  if (1 !== currentExecutionId) return  // Will check later
}

// t=100: page.value = 2
async function execute(2) {
  const executionId = 2  // Captured, currentExecutionId now 2
  await api.fetch(2)     // Pauses 1s
}

// t=200: page.value = 3
async function execute(3) {
  const executionId = 3  // Captured, currentExecutionId now 3
  await api.fetch(3)     // Pauses 1s
}

// ... more calls ...

// t=1000: execute(1) resumes
if (1 !== currentExecutionId) {  // 1 !== 5 ✅ TRUE
  return undefined  // Ignored
}

// Only execute(5) passes the check and updates state
```

### Edge Case 2: Double Start in Constructor

**Scenario:**
```typescript
class Service {
  task = task({ fn: async () => fetchData() })
  
  constructor() {
    this.task.start()
    this.task.start() // Accidental duplicate
  }
}
```

**Without deduplication:**
```
First start()  → Request A fires
Second start() → Request B fires
→ Two identical requests! 💥
```

**With deduplication:**
```
First start()  → Request A fires, inFlightPromise = A
Second start() → Returns inFlightPromise (A)
→ One request, both callers get same result ✅
```

### Edge Case 3: Error During Retry

**Scenario:**
```typescript
const task = task({
  fn: async () => {
    throw new Error('Network error')
  },
  retry: 3
})

await task.run()
```

**Flow:**
```
Attempt 1: Error → willRetry=true → onError(attempt=1, willRetry=true)
Wait 1s...
Attempt 2: Error → willRetry=true → onError(attempt=2, willRetry=true)
Wait 2s...
Attempt 3: Error → willRetry=true → onError(attempt=3, willRetry=true)
Wait 4s...
Attempt 4: Error → willRetry=false → onError(attempt=4, willRetry=false)
→ status='error', throws error
```

User can show different UI based on `willRetry`.

### Edge Case 4: Clear During Loading

**Scenario:**
```typescript
task.run() // Starts request
task.clear() // Called before request completes
// Request completes...
```

**Without executionId increment:**
```
Request completes → updates data.value
→ UI shows data even though clear() was called! 💥
```

**With executionId increment:**
```
task.run()    → executionId=1, request starts
task.clear()  → executionId=2 (incremented)
Request completes → checks: execId 1 !== 2 → ignored ✅
```

**Detailed flow:**
```typescript
let currentExecutionId = 0

// Start request
async function execute() {
  const executionId = ++currentExecutionId  // executionId=1, currentExecutionId=1
  
  const result = await slowAPI()  // Takes 5 seconds...
  
  // At this point, clear() may have been called
  if (executionId !== currentExecutionId) {  // 1 !== 2 if cleared
    return undefined  // Ignored ✅
  }
  
  data.value = result  // Only updates if NOT cleared
}

// User calls clear() after 1 second
function clear() {
  currentExecutionId++  // Now 2, invalidates the in-flight request
  data.value = undefined
  status.value = 'idle'
}
```

### Edge Case 5: Debounce with Errors

**Scenario:**
```typescript
const task = task({
  fn: async () => {
    throw new Error('Fail')
  },
  debounce: 300
})

try {
  await task.run()
} catch (err) {
  console.log('Caught:', err)
}
```

**Bad debounce implementation:**
```typescript
return new Promise((resolve) => {
  setTimeout(async () => {
    const result = await fn(...args) // Throws here
    resolve(result) // Never reached!
  }, ms)
})
// Promise never rejects → await hangs forever! 💥
```

**Good implementation:**
```typescript
return new Promise((resolve, reject) => {
  setTimeout(async () => {
    try {
      const result = await fn(...args)
      resolve(result)
    } catch (err) {
      reject(err) // Must reject!
    }
  }, ms)
})
```

### Edge Case 6: Track with Lazy

**Scenario:**
```typescript
const page = ref(1)

const task = task({
  fn: async (p: number) => fetchPage(p),
  track: () => [page.value],
  lazy: true // Default
})

// What happens?
```

**Answer:**
```
Task created → watch set up with immediate: false
→ No initial execution (lazy)

page.value = 2 → watch triggers → run(2)
→ Executes ✅
```

**With lazy: false:**
```
Task created → watch set up with immediate: true
→ run(1) executes immediately
```

### Edge Case 7: Multiple In-Flight Requests

**Scenario:**
```typescript
// Component A
taskA.run()

// Component B (same task instance)
taskB.run()
```

**This depends on your architecture:**

**If shared singleton service:**
```typescript
const userService = obtain(UserService) // Same instance

// Both get same promise ✅
userService.task.run()
userService.task.run()
```

**If separate instances:**
```typescript
const serviceA = new UserService()
const serviceB = new UserService()

// Different instances, different tasks, different requests
serviceA.task.run()
serviceB.task.run()
```

**No global deduplication** - each task instance is independent. This is intentional (service-scoped state).

---

## Performance Considerations

### Memory Usage

**Each task instance stores:**
- 4 refs (data, error, status, initialized): ~100 bytes
- 4 computed refs: ~100 bytes
- 2 internal variables: ~16 bytes
- Functions (shared): ~0 bytes (prototype)

**Total per task: ~200 bytes**

For 100 tasks: ~20KB (negligible)

### Reactivity Overhead

**Computed refs are cached:**
```typescript
const isLoading = computed(() => status.value === 'loading')
// Only recomputes when status.value changes
// No overhead if not accessed
```

**Best practice:**
```vue
<!-- Good: computed flags -->
<div v-if="task.isLoading.value">Loading...</div>

<!-- Also fine: direct comparison -->
<div v-if="task.status.value === 'loading'">Loading...</div>

<!-- Bad: inline function -->
<div v-if="() => task.status.value === 'loading'">Loading...</div>
```

### Execution ID Overflow

**Could `currentExecutionId++` overflow?**

```typescript
let currentExecutionId = 0 // Max: 2^53 - 1

// At 1000 requests/second:
// 9,007,199,254,740,991 / 1000 / 60 / 60 / 24 / 365
// = 285,616 years to overflow
```

**Verdict:** Not a concern.

---

## TypeScript Tips

### Inferring Result Type

```typescript
const task = task({
  fn: async (id: number) => {
    return { id, name: 'John' }
  }
})

// TypeScript infers:
// task.data.value: { id: number, name: string } | undefined
```

### Explicit Typing

```typescript
interface User {
  id: number
  name: string
}

const task = task<[number], User>({
  fn: async (id) => {
    return { id, name: 'John' }
  }
})

// Now strongly typed
```

### Type Guards

```typescript
if (task.isSuccess.value && task.data.value) {
  // TypeScript knows data.value is User
  console.log(task.data.value.name)
}
```

---

## Debugging Tips

### Enable Dev Logs

All debug logs are behind `__DEV__` checks:

```typescript
// vite.config.ts
define: {
  __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
}
```

**Logs you'll see:**
```
[task] Returning in-flight promise
[task] Stale execution ignored { executionId: 1, currentExecutionId: 3 }
[task] Retry 2/3 in 2000ms
[task] Already initialized, returning cached data
[task] Cleared
```

### Vue DevTools

Tasks are reactive, so they show up in Vue DevTools:

```
UserService
  ├─ state: { users: [...] }
  └─ fetchUsers
      ├─ data: [...]
      ├─ error: undefined
      ├─ status: 'success'
      └─ isLoading: false
```

### Common Issues

**Issue:** Task runs twice on mount
```typescript
// Bad
onMounted(() => {
  task.start()
})

// track with lazy: false
task = task({
  track: () => [...],
  lazy: false
})

// Runs twice!
```

**Fix:** Choose one initialization method.

---

**Issue:** Data doesn't update
```typescript
// Check execution ID mismatch
if (__DEV__) {
  console.log('Execution ignored:', { executionId, currentExecutionId })
}
```

---

**Issue:** Errors silently swallowed
```typescript
// Make sure to await or catch
await task.run() // Throws error

// Or
task.run().catch(err => {
  console.error(err)
})
```

---

## Migration Guide

### From TanStack Query

**Before:**
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['user', id],
  queryFn: () => fetchUser(id)
})
```

**After:**
```typescript
const userTask = task({
  fn: async (id: number) => fetchUser(id)
})

userTask.run(id)

// In template
userTask.data.value
userTask.isLoading.value
userTask.error.value
```

**Key differences:**
- No query keys (task instances are the "keys")
- Manual execution (no auto-fetch)
- Service-scoped (not global cache)

### From Pinia Actions

**Before:**
```typescript
export const useUserStore = defineStore('user', {
  state: () => ({ user: null, loading: false }),
  actions: {
    async fetchUser(id) {
      this.loading = true
      try {
        this.user = await api.getUser(id)
      } catch (err) {
        console.error(err)
      } finally {
        this.loading = false
      }
    }
  }
})
```

**After:**
```typescript
@Register()
class UserService extends Store({ user: null }) {
  readonly fetchUser = task({
    fn: async (id: number) => api.getUser(id),
    onSuccess: (args, data) => {
      this.update({ user: data })
    }
  })
}
```

**Benefits:**
- Automatic loading/error states
- Retry logic built-in
- Race condition prevention
- Type-safe

---

## Conclusion

The `task` API is a lean, type-safe primitive for async state management in service layers. It handles the hard parts (race conditions, deduplication, retry) while staying simple and predictable.

**Core principles:**
- ✅ Explicit over implicit
- ✅ Service-first (not hook-based)
- ✅ Type-safe by default
- ✅ No magic caching
- ✅ Production-ready error handling

**When to use:**
- ✅ Service layer business logic
- ✅ Async operations with state
- ✅ Data fetching in stores
- ✅ Form submissions with retry

**When NOT to use:**
- ❌ Global cache management (use TanStack Query)
- ❌ SSR/hydration (different problem)
- ❌ Offline sync (need service worker)