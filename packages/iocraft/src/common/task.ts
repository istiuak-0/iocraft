import { computed, ref, watch } from "vue"



function debounce<TArgs extends any[], TResult>(
  fn: (...args: TArgs) => Promise<TResult | undefined>,
  ms: number
): (...args: TArgs) => Promise<TResult | undefined> {

  let timer: ReturnType<typeof setTimeout> | null = null

  return (...args: TArgs): Promise<TResult | undefined> => {

    if (timer) clearTimeout(timer)

    return new Promise((resolve, reject) => {

      timer = setTimeout(async () => {
        timer = null

        try {
          const result = await fn(...args)
          resolve(result)
        } catch (err) {
          reject(err)
        }
      }, ms)
    })
  }
}



















export function task<TArgs extends any[], TResult>(
  options: TaskOptions<TArgs, TResult>
): TaskReturn<TArgs, TResult> {




  /// resource states
  const data = ref<TResult | undefined>()
  const error = ref<Error | undefined>()
  const status = ref<TaskStatus>('idle')
  const initialized = ref(false)



  const isLoading = computed(() => status.value === 'loading')
  const isIdle = computed(() => status.value === 'idle')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')



  // Execution tracking for race condition prevention
  let currentExecutionId = 0;

  // In-flight promise for deduplication
  let inFlightPromise: Promise<TResult | undefined> | null = null;



  let retryConfig: RetryConfig | undefined;

  if (options.retry && typeof options.retry === 'number') {
    retryConfig = { count: options.retry, delay: 1000, backoff: true }
  } else if (options.retry && typeof options.retry === 'object') {
    retryConfig = { delay: 1000, backoff: true, ...options.retry }
  }



  // Core execution logic
  async function execute(...args: TArgs): Promise<TResult | undefined> {
    // Deduplication: return in-flight promise if already running
    if (inFlightPromise && status.value === 'loading') {
      if (__DEV__) {
        console.info('[task] Returning in-flight promise', {
          fn: options.fn.name || 'anonymous'
        })
      }
      return inFlightPromise
    }

    // Assign unique execution ID for race condition prevention
    const executionId = ++currentExecutionId

    // Create new in-flight promise
    inFlightPromise = (async () => {
      const maxAttempts = (retryConfig?.count ?? 0) + 1
      let lastError: Error | undefined

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          status.value = 'loading'
          error.value = undefined

          // Only call onLoading on first attempt
          if (attempt === 1) {
            options.onLoading?.(args)
          }

          const result = await options.fn(...args)

          // Check if this execution was superseded
          if (executionId !== currentExecutionId) {
            if (__DEV__) {
              console.info('[task] Stale execution ignored', {
                fn: options.fn.name || 'anonymous',
                executionId,
                currentExecutionId
              })
            }
            return undefined
          }

          // Success
          data.value = result
          status.value = 'success'
          options.onSuccess?.(args, result)

          return result

        } catch (e) {
          lastError = e instanceof Error ? e : new Error(String(e))

          const isLastAttempt = attempt === maxAttempts
          const willRetry = !isLastAttempt

          // Check if execution was superseded
          if (executionId !== currentExecutionId) {
            if (__DEV__) {
              console.info('[task] Stale execution error ignored', {
                executionId,
                currentExecutionId
              })
            }
            throw lastError
          }

          // Call onError with context
          options.onError?.(args, lastError, {
            attempt,
            willRetry
          })

          if (isLastAttempt) {
            // Final failure
            error.value = lastError
            status.value = 'error'
            throw lastError
          }

          // Calculate retry delay
          const baseDelay = retryConfig?.delay ?? 1000
          const delay = retryConfig?.backoff
            ? baseDelay * Math.pow(2, attempt - 1)
            : baseDelay

          if (__DEV__) {
            console.info(
              `[task] Retry ${attempt}/${retryConfig?.count} in ${delay}ms`,
              { fn: options.fn.name || 'anonymous' }
            )
          }

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      // Should never reach here, but TypeScript needs it
      throw lastError

    })().finally(() => {
      // Clear in-flight promise when done
      if (inFlightPromise && executionId === currentExecutionId) {
        inFlightPromise = null
        options.onFinally?.(args, data.value, error.value)
      }
    })

    return inFlightPromise
  }





  const runImpl = options.debounce
    ? debounce(execute, options.debounce)
    : execute



  // Public run method (debounced if configured)
  async function run(...args: TArgs): Promise<TResult | undefined> {
    return runImpl(...args)
  }




  // Public start method (always immediate, never debounced)
  async function start(...args: TArgs): Promise<TResult | undefined> {
    if (initialized.value) {
      if (__DEV__) {
        console.info(
          '[task] Already initialized, returning cached data',
          {
            fn: options.fn.name || 'anonymous',
            hasCachedData: data.value !== undefined
          }
        )
      }
      // Return cached data if available
      return data.value
    }

    initialized.value = true
    return execute(...args)
  }


  // Clear data but keep initialized flag
  function clear(): void {
    currentExecutionId++ // Invalidate in-flight requests
    data.value = undefined
    error.value = undefined
    status.value = 'idle'

    if (__DEV__) {
      console.info('[task] Cleared', { fn: options.fn.name || 'anonymous' })
    }
  }


  // Full reset including initialized flag
  function reset(): void {
    currentExecutionId++ // Invalidate in-flight requests
    data.value = undefined
    error.value = undefined
    status.value = 'idle'
    initialized.value = false

    if (__DEV__) {
      console.info('[task] Reset', { fn: options.fn.name || 'anonymous' })
    }
  }


  // Setup reactive tracking
  if (options.track) {
    watch(
      options.track,
      (newArgs) => {
        run(...newArgs)
      },
      { immediate: !options.lazy }
    )
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
    reset
  }




}

