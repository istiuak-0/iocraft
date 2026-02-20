// task.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'

import {task,Store} from './../src/common'
import { Register } from '../src/core'

// Helper to wait for all pending promises
const flushPromises = () => new Promise(resolve => setTimeout(resolve, 0))

// Helper to create delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

describe('Task API - Basic Functionality', () => {
  
  it('should initialize with idle status', () => {
    const t = task({
      fn: async () => 'result'
    })

    expect(t.status.value).toBe('idle')
    expect(t.isIdle.value).toBe(true)
    expect(t.isLoading.value).toBe(false)
    expect(t.isSuccess.value).toBe(false)
    expect(t.isError.value).toBe(false)
    expect(t.data.value).toBeUndefined()
    expect(t.error.value).toBeUndefined()
    expect(t.initialized.value).toBe(false)
  })

  it('should execute successfully and update state', async () => {
    const t = task({
      fn: async (x: number) => x * 2
    })

    const result = await t.run(5)

    expect(result).toBe(10)
    expect(t.data.value).toBe(10)
    expect(t.status.value).toBe('success')
    expect(t.isSuccess.value).toBe(true)
    expect(t.isLoading.value).toBe(false)
  })

  it('should handle errors and update state', async () => {
    const t = task({
      fn: async () => {
        throw new Error('Test error')
      }
    })

    await expect(t.run()).rejects.toThrow('Test error')

    expect(t.status.value).toBe('error')
    expect(t.isError.value).toBe(true)
    expect(t.error.value?.message).toBe('Test error')
    expect(t.data.value).toBeUndefined()
  })

  it('should show loading state during execution', async () => {
    const t = task({
      fn: async () => {
        await delay(50)
        return 'done'
      }
    })

    const promise = t.run()
    
    await nextTick()
    expect(t.isLoading.value).toBe(true)
    expect(t.status.value).toBe('loading')

    await promise

    expect(t.isLoading.value).toBe(false)
    expect(t.status.value).toBe('success')
  })

  it('should pass arguments correctly', async () => {
    const fn = vi.fn(async (a: number, b: string, c: boolean) => ({ a, b, c }))
    
    const t = task({ fn })

    const result = await t.run(42, 'test', true)

    expect(fn).toHaveBeenCalledWith(42, 'test', true)
    expect(result).toEqual({ a: 42, b: 'test', c: true })
  })
})

describe('Task API - Lifecycle Hooks', () => {
  
  it('should call onLoading hook', async () => {
    const onLoading = vi.fn()
    
    const t = task({
      fn: async (x: number) => x,
      onLoading
    })

    await t.run(5)

    expect(onLoading).toHaveBeenCalledTimes(1)
    expect(onLoading).toHaveBeenCalledWith([5])
  })

  it('should call onSuccess hook with data', async () => {
    const onSuccess = vi.fn()
    
    const t = task({
      fn: async (x: number) => x * 2,
      onSuccess
    })

    await t.run(5)

    expect(onSuccess).toHaveBeenCalledTimes(1)
    expect(onSuccess).toHaveBeenCalledWith([5], 10)
  })

  it('should call onError hook with error', async () => {
    const onError = vi.fn()
    
    const t = task({
      fn: async () => {
        throw new Error('Failed')
      },
      onError
    })

    await expect(t.run()).rejects.toThrow()

    expect(onError).toHaveBeenCalledTimes(1)
    expect(onError).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ message: 'Failed' }),
      expect.objectContaining({ attempt: 1, willRetry: false })
    )
  })

  it('should call onFinally hook regardless of success/failure', async () => {
    const onFinally = vi.fn()
    
    const t = task({
      fn: async (x: number) => x,
      onFinally
    })

    await t.run(5)
    expect(onFinally).toHaveBeenCalledWith([5], 5, undefined)

    const t2 = task({
      fn: async () => {
        throw new Error('Fail')
      },
      onFinally
    })

    await expect(t2.run()).rejects.toThrow()
    expect(onFinally).toHaveBeenCalledWith(
      [],
      undefined,
      expect.objectContaining({ message: 'Fail' })
    )
  })

  it('should call hooks in correct order', async () => {
    const calls: string[] = []
    
    const t = task({
      fn: async () => 'result',
      onLoading: () => calls.push('loading'),
      onSuccess: () => calls.push('success'),
      onFinally: () => calls.push('finally')
    })

    await t.run()

    expect(calls).toEqual(['loading', 'success', 'finally'])
  })
})

describe('Task API - Start Method', () => {
  
  it('should execute only once with start()', async () => {
    const fn = vi.fn(async () => 'result')
    
    const t = task({ fn })

    expect(t.initialized.value).toBe(false)

    await t.start()
    expect(t.initialized.value).toBe(true)
    expect(fn).toHaveBeenCalledTimes(1)

    await t.start()
    await t.start()
    expect(fn).toHaveBeenCalledTimes(1) // Still only once
  })

  it('should return cached data on subsequent start() calls', async () => {
    const t = task({
      fn: async () => 'original'
    })

    const result1 = await t.start()
    expect(result1).toBe('original')

    // Subsequent calls return cached data
    const result2 = await t.start()
    const result3 = await t.start()

    expect(result2).toBe('original')
    expect(result3).toBe('original')
  })

  it('start() should not be debounced', async () => {
    const fn = vi.fn(async () => 'result')
    
    const t = task({
      fn,
      debounce: 500
    })

    const startTime = Date.now()
    await t.start()
    const duration = Date.now() - startTime

    expect(duration).toBeLessThan(100) // Should be immediate
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('run() can still be called after start()', async () => {
    const fn = vi.fn(async (x: number) => x)
    
    const t = task({ fn })

    await t.start(1)
    expect(fn).toHaveBeenCalledTimes(1)

    await t.run(2)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(t.data.value).toBe(2)
  })
})

describe('Task API - Race Condition Prevention', () => {
  
  it('should ignore stale executions', async () => {
    let resolveFirst: (value: string) => void
    let resolveSecond: (value: string) => void
    let resolveThird: (value: string) => void

    const firstPromise = new Promise<string>(resolve => {
      resolveFirst = resolve
    })
    const secondPromise = new Promise<string>(resolve => {
      resolveSecond = resolve
    })
    const thirdPromise = new Promise<string>(resolve => {
      resolveThird = resolve
    })

    let callCount = 0
    const t = task({
      fn: async () => {
        callCount++
        if (callCount === 1) return await firstPromise
        if (callCount === 2) return await secondPromise
        return await thirdPromise
      }
    })

    // Start three executions
    const exec1 = t.run()
    const exec2 = t.run()
    const exec3 = t.run()

    await nextTick()

    // Resolve in reverse order (3, 2, 1)
    resolveThird!('third')
    await flushPromises()
    
    resolveSecond!('second')
    await flushPromises()
    
    resolveFirst!('first')
    await flushPromises()

    await Promise.all([exec1, exec2, exec3])

    // Only the last (third) execution should update state
    expect(t.data.value).toBe('third')
  })

  it('should handle rapid consecutive calls', async () => {
    const results: number[] = []
    
    const t = task({
      fn: async (x: number) => {
        await delay(50)
        return x
      },
      onSuccess: (args, data) => {
        results.push(data)
      }
    })

    // Fire 5 rapid calls
    t.run(1)
    t.run(2)
    t.run(3)
    t.run(4)
    t.run(5)

    await delay(200) // Wait for all to complete

    // Only the last one should update state
    expect(t.data.value).toBe(5)
    expect(results).toEqual([5])
  })

  it('should work correctly with track and rapid changes', async () => {
    const page = { value: 1 }
    let currentPage = 1
    
    const t = task({
      fn: async (p: number) => {
        await delay(50)
        return `page-${p}`
      },
      track: () => [page.value]
    })

    // Simulate rapid page changes
    page.value = 1
    t.run(1)
    
    page.value = 2
    t.run(2)
    
    page.value = 3
    t.run(3)

    await delay(200)

    // Should show last page's data
    expect(t.data.value).toBe('page-3')
  })
})

describe('Task API - Request Deduplication', () => {
  
  it('should deduplicate simultaneous calls', async () => {
    const fn = vi.fn(async () => {
      await delay(50)
      return 'result'
    })
    
    const t = task({ fn })

    // Fire two simultaneous calls
    const promise1 = t.run()
    const promise2 = t.run()

    // Should be the same promise
    expect(promise1).toBe(promise2)

    await promise1

    // Function should only be called once
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should deduplicate multiple start() calls', async () => {
    const fn = vi.fn(async () => 'result')
    
    const t = task({ fn })

    const promise1 = t.start()
    const promise2 = t.start()
    const promise3 = t.start()

    expect(promise1).toBe(promise2)
    expect(promise2).toBe(promise3)

    await promise1

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should allow new calls after previous completes', async () => {
    const fn = vi.fn(async (x: number) => x)
    
    const t = task({ fn })

    await t.run(1)
    expect(fn).toHaveBeenCalledTimes(1)

    await t.run(2)
    expect(fn).toHaveBeenCalledTimes(2)

    await t.run(3)
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

describe('Task API - Retry Logic', () => {
  
  it('should retry failed requests', async () => {
    let attempts = 0
    
    const t = task({
      fn: async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Fail')
        }
        return 'success'
      },
      retry: 3
    })

    const result = await t.run()

    expect(attempts).toBe(3)
    expect(result).toBe('success')
    expect(t.data.value).toBe('success')
    expect(t.status.value).toBe('success')
  })

  it('should give up after max retries', async () => {
    let attempts = 0
    
    const t = task({
      fn: async () => {
        attempts++
        throw new Error(`Attempt ${attempts}`)
      },
      retry: 2 // 2 retries = 3 total attempts
    })

    await expect(t.run()).rejects.toThrow('Attempt 3')

    expect(attempts).toBe(3)
    expect(t.status.value).toBe('error')
  })

  it('should call onError with retry context', async () => {
    const onError = vi.fn()
    let attempts = 0
    
    const t = task({
      fn: async () => {
        attempts++
        throw new Error('Fail')
      },
      retry: 2,
      onError
    })

    await expect(t.run()).rejects.toThrow()

    expect(onError).toHaveBeenCalledTimes(3)
    
    // First two calls: willRetry = true
    expect(onError).toHaveBeenNthCalledWith(
      1,
      [],
      expect.any(Error),
      { attempt: 1, willRetry: true }
    )
    expect(onError).toHaveBeenNthCalledWith(
      2,
      [],
      expect.any(Error),
      { attempt: 2, willRetry: true }
    )
    
    // Last call: willRetry = false
    expect(onError).toHaveBeenNthCalledWith(
      3,
      [],
      expect.any(Error),
      { attempt: 3, willRetry: false }
    )
  })

  it('should support object-based retry config', async () => {
    let attempts = 0
    
    const t = task({
      fn: async () => {
        attempts++
        if (attempts < 2) throw new Error('Fail')
        return 'success'
      },
      retry: {
        count: 3,
        delay: 10,
        backoff: false
      }
    })

    const start = Date.now()
    await t.run()
    const duration = Date.now() - start

    expect(attempts).toBe(2)
    // Should have one 10ms delay
    expect(duration).toBeGreaterThanOrEqual(10)
    expect(duration).toBeLessThan(100)
  })

  it('should apply exponential backoff', async () => {
    const delays: number[] = []
    let attempts = 0
    let lastTime = Date.now()
    
    const t = task({
      fn: async () => {
        attempts++
        if (attempts > 1) {
          delays.push(Date.now() - lastTime)
        }
        lastTime = Date.now()
        if (attempts < 4) throw new Error('Fail')
        return 'success'
      },
      retry: {
        count: 3,
        delay: 50,
        backoff: true
      }
    })

    await t.run()

    expect(attempts).toBe(4)
    expect(delays.length).toBe(3)
    
    // Delays should increase exponentially: ~50ms, ~100ms, ~200ms
    expect(delays[0]).toBeGreaterThanOrEqual(40)
    expect(delays[0]).toBeLessThan(80)
    
    expect(delays[1]).toBeGreaterThanOrEqual(90)
    expect(delays[1]).toBeLessThan(150)
    
    expect(delays[2]).toBeGreaterThanOrEqual(180)
    expect(delays[2]).toBeLessThan(250)
  })
})

describe('Task API - Debouncing', () => {
  
  it('should debounce rapid calls', async () => {
    const fn = vi.fn(async (x: number) => x)
    
    const t = task({
      fn,
      debounce: 100
    })

    t.run(1)
    t.run(2)
    t.run(3)
    t.run(4)
    t.run(5)

    // Wait for debounce to complete
    await delay(150)

    // Should only execute once with last value
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(5)
    expect(t.data.value).toBe(5)
  })

  it('should reset debounce timer on each call', async () => {
    const fn = vi.fn(async (x: number) => x)
    
    const t = task({
      fn,
      debounce: 100
    })

    t.run(1)
    await delay(50)
    
    t.run(2)
    await delay(50)
    
    t.run(3)
    await delay(50)

    // No execution yet (timer keeps resetting)
    expect(fn).toHaveBeenCalledTimes(0)

    await delay(100)

    // Now it executes with last value
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(3)
  })

  it('should handle errors in debounced calls', async () => {
    const t = task({
      fn: async () => {
        throw new Error('Debounced error')
      },
      debounce: 50
    })

    const promise = t.run()

    await delay(100)

    await expect(promise).rejects.toThrow('Debounced error')
    expect(t.status.value).toBe('error')
  })

  it('start() should not be debounced even when debounce is set', async () => {
    const fn = vi.fn(async () => 'result')
    
    const t = task({
      fn,
      debounce: 500
    })

    const start = Date.now()
    await t.start()
    const duration = Date.now() - start

    expect(duration).toBeLessThan(100)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})

describe('Task API - Reactive Tracking', () => {
  
  it('should execute when tracked dependencies change', async () => {
    const fn = vi.fn(async (x: number) => x * 2)
    const counter = { value: 1 }
    
    const t = task({
      fn,
      track: () => [counter.value]
    })

    await flushPromises()
    expect(fn).toHaveBeenCalledTimes(0) // Lazy by default

    counter.value = 2
    await delay(10)
    
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(2)
  })

  it('should execute immediately when lazy: false', async () => {
    const fn = vi.fn(async (x: number) => x)
    const value = { value: 10 }
    
    const t = task({
      fn,
      track: () => [value.value],
      lazy: false
    })

    await flushPromises()

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(10)
  })

  it('should not execute immediately when lazy: true', async () => {
    const fn = vi.fn(async (x: number) => x)
    const value = { value: 10 }
    
    const t = task({
      fn,
      track: () => [value.value],
      lazy: true
    })

    await flushPromises()

    expect(fn).toHaveBeenCalledTimes(0)
  })

  it('should combine track with debounce', async () => {
    const fn = vi.fn(async (x: number) => x)
    const value = { value: 1 }
    
    const t = task({
      fn,
      track: () => [value.value],
      debounce: 100
    })

    // Rapid changes
    value.value = 2
    await delay(20)
    value.value = 3
    await delay(20)
    value.value = 4
    await delay(20)
    value.value = 5

    // Wait for debounce
    await delay(150)

    // Should only execute once with last value
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(5)
  })
})

describe('Task API - Clear and Reset', () => {
  
  it('clear() should wipe data but keep initialized', async () => {
    const t = task({
      fn: async () => 'result'
    })

    await t.start()

    expect(t.initialized.value).toBe(true)
    expect(t.data.value).toBe('result')
    expect(t.status.value).toBe('success')

    t.clear()

    expect(t.initialized.value).toBe(true) // Still initialized
    expect(t.data.value).toBeUndefined()
    expect(t.status.value).toBe('idle')
  })

  it('reset() should do full reset including initialized', async () => {
    const t = task({
      fn: async () => 'result'
    })

    await t.start()

    expect(t.initialized.value).toBe(true)
    expect(t.data.value).toBe('result')

    t.reset()

    expect(t.initialized.value).toBe(false) // Reset
    expect(t.data.value).toBeUndefined()
    expect(t.status.value).toBe('idle')
  })

  it('clear() should invalidate in-flight requests', async () => {
    const t = task({
      fn: async () => {
        await delay(100)
        return 'result'
      }
    })

    const promise = t.run()
    
    await delay(20)
    t.clear()

    await promise

    // Data should not be set because execution was invalidated
    expect(t.data.value).toBeUndefined()
    expect(t.status.value).toBe('idle')
  })

  it('reset() should allow start() to work again', async () => {
    const fn = vi.fn(async () => 'result')
    
    const t = task({ fn })

    await t.start()
    expect(fn).toHaveBeenCalledTimes(1)

    await t.start()
    expect(fn).toHaveBeenCalledTimes(1) // Doesn't execute again

    t.reset()

    await t.start()
    expect(fn).toHaveBeenCalledTimes(2) // Executes after reset
  })
})

describe('Task API - Integration with Store', () => {
  
  it('should work with Store class', async () => {
    @Register()
    class UserStore extends Store({
      users: [] as string[],
      loading: false
    }) {
      readonly fetchUsers = task({
        fn: async () => {
          await delay(50)
          return ['Alice', 'Bob', 'Charlie']
        },
        onLoading: () => {
          this.update({ loading: true })
        },
        onSuccess: (args, data) => {
          this.update({ users: data, loading: false })
        }
      })
    }

    const store = new UserStore()

    expect(store.state.users).toEqual([])
    expect(store.state.loading).toBe(false)

    await store.fetchUsers.run()

    expect(store.state.users).toEqual(['Alice', 'Bob', 'Charlie'])
    expect(store.state.loading).toBe(false)
    expect(store.fetchUsers.data.value).toEqual(['Alice', 'Bob', 'Charlie'])
  })

  it('should work with Store and track', async () => {
    @Register()
    class PageStore extends Store({
      page: 1,
      data: null as string | null
    }) {
      readonly fetchPage = task({
        fn: async (page: number) => {
          await delay(20)
          return `Page ${page} data`
        },
        track: () => [this.pick('page')],
        onSuccess: (args, data) => {
          this.update({ data })
        }
      })

      nextPage() {
        this.update({ page: this.state.page + 1 })
      }
    }

    const store = new PageStore()

    store.nextPage()
    await delay(50)

    expect(store.state.page).toBe(2)
    expect(store.state.data).toBe('Page 2 data')

    store.nextPage()
    await delay(50)

    expect(store.state.page).toBe(3)
    expect(store.state.data).toBe('Page 3 data')
  })

  it('should handle multiple tasks in one service', async () => {
    @Register()
    class DataService extends Store({
      users: [] as string[],
      posts: [] as string[]
    }) {
      readonly fetchUsers = task({
        fn: async () => {
          await delay(30)
          return ['User1', 'User2']
        },
        onSuccess: (args, data) => {
          this.update({ users: data })
        }
      })

      readonly fetchPosts = task({
        fn: async () => {
          await delay(30)
          return ['Post1', 'Post2']
        },
        onSuccess: (args, data) => {
          this.update({ posts: data })
        }
      })

      async loadAll() {
        await Promise.all([
          this.fetchUsers.run(),
          this.fetchPosts.run()
        ])
      }
    }

    const service = new DataService()

    await service.loadAll()

    expect(service.state.users).toEqual(['User1', 'User2'])
    expect(service.state.posts).toEqual(['Post1', 'Post2'])
  })

  it('should work with start() in constructor', async () => {
    @Register()
    class ConfigService extends Store({
      config: null as any
    }) {
      readonly loadConfig = task({
        fn: async () => {
          await delay(20)
          return { apiUrl: 'https://api.example.com' }
        },
        onSuccess: (args, data) => {
          this.update({ config: data })
        }
      })

      constructor() {
        super()
        this.loadConfig.start()
      }
    }

    const service = new ConfigService()

    await delay(50)

    expect(service.state.config).toEqual({ apiUrl: 'https://api.example.com' })
    expect(service.loadConfig.initialized.value).toBe(true)
  })
})

describe('Task API - Complex Scenarios', () => {
  
  it('should handle sequential dependent calls', async () => {
    const getUser = task({
      fn: async (id: number) => ({ id, name: `User${id}`, teamId: id + 10 })
    })

    const getTeam = task({
      fn: async (teamId: number) => ({ id: teamId, name: `Team${teamId}` })
    })

    const user = await getUser.run(1)
    expect(user).toEqual({ id: 1, name: 'User1', teamId: 11 })

    const team = await getTeam.run(user!.teamId)
    expect(team).toEqual({ id: 11, name: 'Team11' })
  })

  it('should handle parallel independent calls', async () => {
    const task1 = task({
      fn: async () => {
        await delay(50)
        return 'result1'
      }
    })

    const task2 = task({
      fn: async () => {
        await delay(50)
        return 'result2'
      }
    })

    const task3 = task({
      fn: async () => {
        await delay(50)
        return 'result3'
      }
    })

    const start = Date.now()
    const results = await Promise.all([
      task1.run(),
      task2.run(),
      task3.run()
    ])
    const duration = Date.now() - start

    expect(results).toEqual(['result1', 'result2', 'result3'])
    expect(duration).toBeLessThan(100) // All ran in parallel
  })

  it('should handle retry with race conditions', async () => {
    let call1Attempts = 0
    let call2Attempts = 0

    const t = task({
      fn: async (id: number) => {
        if (id === 1) {
          call1Attempts++
          if (call1Attempts < 3) throw new Error('Fail')
          await delay(100)
          return 'result1'
        } else {
          call2Attempts++
          await delay(50)
          return 'result2'
        }
      },
      retry: 3
    })

    // Start two calls, second one completes first
    const promise1 = t.run(1) // Will retry, takes longer
    const promise2 = t.run(2) // No retry, faster

    await Promise.all([promise1, promise2])

    // Second call should win despite first being called earlier
    expect(t.data.value).toBe('result2')
  })

  it('should work with complex Store logic', async () => {
    @Register()
    class TodoStore extends Store({
      todos: [] as Array<{ id: number; text: string; done: boolean }>,
      filter: 'all' as 'all' | 'active' | 'completed'
    }) {
      readonly loadTodos = task({
        fn: async () => {
          await delay(20)
          return [
            { id: 1, text: 'Task 1', done: false },
            { id: 2, text: 'Task 2', done: true },
            { id: 3, text: 'Task 3', done: false }
          ]
        },
        onSuccess: (args, data) => {
          this.update({ todos: data })
        }
      })

      readonly toggleTodo = task({
        fn: async (id: number) => {
          await delay(10)
          return id
        },
        onSuccess: (args, data) => {
          const todos = this.state.todos.map(todo =>
            todo.id === data ? { ...todo, done: !todo.done } : todo
          )
          this.update({ todos })
        }
      })

      get filteredTodos() {
        return this.compute(state => {
          if (state.filter === 'active') {
            return state.todos.filter(t => !t.done)
          }
          if (state.filter === 'completed') {
            return state.todos.filter(t => t.done)
          }
          return state.todos
        })
      }
    }

    const store = new TodoStore()

    await store.loadTodos.run()

    expect(store.state.todos.length).toBe(3)
    expect(store.filteredTodos.value.length).toBe(3)

    store.update({ filter: 'active' })
    expect(store.filteredTodos.value.length).toBe(2)

    await store.toggleTodo.run(1)
    expect(store.state.todos[0].done).toBe(true)
    expect(store.filteredTodos.value.length).toBe(1)
  })

  it('should handle errors in onSuccess hooks', async () => {
    const t = task({
      fn: async () => 'result',
      onSuccess: () => {
        throw new Error('Hook error')
      }
    })

    // The main execution should succeed, hook error doesn't propagate
    await t.run()

    expect(t.status.value).toBe('success')
    expect(t.data.value).toBe('result')
  })

  it('should work with TypeScript generics', async () => {
    interface User {
      id: number
      name: string
    }

    const t = task<[number], User>({
      fn: async (id) => ({
        id,
        name: `User${id}`
      })
    })

    const user = await t.run(42)

    expect(user).toEqual({ id: 42, name: 'User42' })
    
    // TypeScript should know the types
    if (t.data.value) {
      const name: string = t.data.value.name
      const id: number = t.data.value.id
      expect(name).toBe('User42')
      expect(id).toBe(42)
    }
  })
})

describe('Task API - Edge Cases', () => {
  
  it('should handle synchronous errors', async () => {
    const t = task({
      fn: async () => {
        throw new Error('Sync error')
      }
    })

    await expect(t.run()).rejects.toThrow('Sync error')
    expect(t.status.value).toBe('error')
  })

  it('should handle non-Error throws', async () => {
    const t = task({
      fn: async () => {
        throw 'string error'
      }
    })

    await expect(t.run()).rejects.toThrow()
    expect(t.error.value?.message).toBe('string error')
  })

  it('should handle undefined results', async () => {
    const t = task({
      fn: async () => undefined
    })

    const result = await t.run()

    expect(result).toBeUndefined()
    expect(t.data.value).toBeUndefined()
    expect(t.status.value).toBe('success')
  })

  it('should handle null results', async () => {
    const t = task({
      fn: async () => null
    })

    const result = await t.run()

    expect(result).toBeNull()
    expect(t.data.value).toBeNull()
    expect(t.status.value).toBe('success')
  })

  it('should handle very rapid calls (stress test)', async () => {
    const fn = vi.fn(async (x: number) => x)
    
    const t = task({ fn })

    // Fire 100 calls rapidly
    const promises = Array.from({ length: 100 }, (_, i) => t.run(i))

    await Promise.all(promises)

    // Last call should win
    expect(t.data.value).toBe(99)
  })

  it('should handle task with no arguments', async () => {
    const t = task({
      fn: async () => 'no args'
    })

    const result = await t.run()

    expect(result).toBe('no args')
  })

  it('should handle task with many arguments', async () => {
    const t = task({
      fn: async (a: number, b: string, c: boolean, d: object, e: any[]) => ({
        a, b, c, d, e
      })
    })

    const result = await t.run(1, 'test', true, { key: 'value' }, [1, 2, 3])

    expect(result).toEqual({
      a: 1,
      b: 'test',
      c: true,
      d: { key: 'value' },
      e: [1, 2, 3]
    })
  })
})