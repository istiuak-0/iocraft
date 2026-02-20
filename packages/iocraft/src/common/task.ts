import { computed, ref, watch } from "vue"

// ----  internal utils ----
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
const controllerRegistry = new Map<Primitives, AbortController>()






/**
 * This is a wrapper around Abort Controller
 * This Function creates a AbortController And Registers It In Internal Registry for later used
 * Its necessary for stopping the request 
 *
 * @export
 * @param {Primitives} key 
 * @returns {AbortController} 
 */
export function abortable(key: Primitives): AbortController {
  if (controllerRegistry.has(key)) {
    controllerRegistry.delete(key)
  }
  const controller = new AbortController();
  controllerRegistry.set(key, controller)
  return controller
}


export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>): TaskReturn<TFn> {
  type Result = Awaited<ReturnType<TFn>>
  type Arguments = Parameters<TFn>


  // ---- resource states ----
  const data = ref<Result | undefined>()
  const error = ref<Error | undefined>()
  const status = ref<TaskStatus>('idle')

  const isLoading = computed(() => status.value === 'loading')
  const isIdle = computed(() => status.value === 'idle')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')

  const initialized = ref(false)






  async function attemptWithRetry(...args: Arguments): Promise<[Result | undefined, Error | undefined]> {

    const maxAttempts = options.retry ? options.retry.count + 1 : 1
    let lastError: Error | undefined


    for (let attempt = 0; attempt < maxAttempts; attempt++) {

      if (attempt > 0 && options.retry?.delay) {
        const delay = options.retry.backoff
          ? options.retry.delay * 2 ** (attempt - 1)  // 1s, 2s, 4s, 8s...
          : options.retry.delay                         // always same delay

        await sleep(delay)
      }


      try {
        const result = await options.fn(...args) as Result
        return [result, undefined]
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e))
      }
    }

    return [undefined, lastError]
  }





  // ---- This is the main execution function ----

  let currentExecutionId = 0 // Execution tracking for race condition prevention

  async function execute(...args: Arguments): Promise<[Result | undefined, Error | undefined]> {
    const executionId = ++currentExecutionId

    if (options.key) {
      controllerRegistry.get(options.key)?.abort()
    }


    try {

      status.value = 'loading'
      error.value = undefined
      options.onLoading?.()

      const [result, retryError] = await attemptWithRetry(...args)
      if (executionId !== currentExecutionId) return [undefined, undefined]


      if (retryError) {
        error.value = retryError;
        status.value = 'error'
        options.onError?.(retryError)
        return [undefined, retryError]
      }

      data.value = result
      status.value = 'success'
      options.onSuccess?.(result!)
      return [result, undefined]

    } finally {

      if (executionId === currentExecutionId) {
        options.onFinally?.({ data: data.value, error: error.value })
      }

    }
  }








  let debounceTimer: ReturnType<typeof setTimeout> | undefined

  async function run(...args: Arguments): Promise<[Result | undefined, Error | undefined]> {
    if (options.debounce) {
      return new Promise((resolve) => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => resolve(execute(...args)), options.debounce)
      })
    }
    return execute(...args)
  }





  async function start(...args: Arguments): Promise<[Result | undefined, Error | undefined]> {
    if (initialized.value) {
      return [data.value, error.value]  // return current state as tuple
    }

    initialized.value = true
    return execute(...args)
  }




  function clear(): void {
    currentExecutionId++
    data.value = undefined
    error.value = undefined
    status.value = 'idle'
  }


  function reset(): void {
    currentExecutionId++
    data.value = undefined
    error.value = undefined
    status.value = 'idle'
    initialized.value = false
  }




  // --- track reactive data ----
  let stopWatch: (() => void) | undefined

  if (options.track) {
    stopWatch = watch(options.track, (newArgs) => {
      run(...newArgs)
    }, { immediate: !options.lazy })
  }


  function dispose(): void {
    currentExecutionId++
    clearTimeout(debounceTimer)
    debounceTimer = undefined
    stopWatch?.()

    if (options.key) {
      controllerRegistry.get(options.key)?.abort()
      controllerRegistry.delete(options.key)
    }

  }




  function stop() {
    if (options.key) {
      controllerRegistry.get(options.key)?.abort()
    }
  }



  return {
    data,
    error,
    status,
    isLoading,
    isIdle,
    isSuccess,
    isError,
    initialized,
    start,
    run,
    clear,
    reset,
    dispose,
    stop
  }
}