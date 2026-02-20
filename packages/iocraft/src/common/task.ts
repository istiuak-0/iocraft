import { computed, ref, watch, type ComputedRef, type Ref } from "vue"

// function debounce<TArgs extends any[], TResult>(
//   fn: (...args: TArgs) => Promise<TResult | undefined>,
//   ms: number
// ): (...args: TArgs) => Promise<TResult | undefined> {
//   let timer: ReturnType<typeof setTimeout> | null = null

//   return (...args: TArgs): Promise<TResult | undefined> => {
//     if (timer) clearTimeout(timer)

//     return new Promise((resolve, reject) => {
//       timer = setTimeout(async () => {
//         timer = null

//         try {
//           const result = await fn(...args)
//           resolve(result)
//         } catch (err) {
//           reject(err)
//         }
//       }, ms)
//     })
//   }
// }

export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>): TaskReturn<TFn> {
  type Result = Awaited<ReturnType<TFn>>
  type Arguments = Parameters<TFn>

  // === resource states  ===
  const data = ref<Result | undefined>()
  const error = ref<Error | undefined>()
  const status = ref<TaskStatus>('idle')

  const isLoading = computed(() => status.value === 'loading')
  const isIdle = computed(() => status.value === 'idle')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')

  const initialized = ref(false)

  // === internal states ===
  let currentExecutionId = 0 // Execution tracking for race condition prevention
  let inFlightPromise: Promise<Result | undefined> // In-flight promise for deduplication




  async function execute(...args: Arguments): Promise<Result | undefined> {

    if (inFlightPromise && status.value === 'loading') {
      return inFlightPromise
    }

    // Assigning unique execution ID for race condition prevention
    const executionId = ++currentExecutionId

    inFlightPromise = (async (): Promise<Result | undefined> => {
      try {
        status.value = 'loading'
        error.value = undefined
        options.onLoading?.()

        const result = await options.fn(...args) as Result

        // Check if this execution was superseded
        if (executionId !== currentExecutionId) {
          return undefined
        }

        data.value = result
        status.value = 'success'
        options.onSuccess?.(result)
        return result

      } catch (e) {
        error.value = e instanceof Error ? e : new Error(String(e))
        status.value = 'error'
        options.onError?.(error.value)
      }
    })()

    return inFlightPromise
  }



  async function run(...args: Arguments): Promise<Result | undefined> {
    return execute(...args)
  }




  async function start(...args: Arguments): Promise<Result | undefined> {
    if (initialized.value) {
      return data.value  // Return cached data if available
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



  if (options.track) {
    watch(
      options.track,
      (newArgs) => {
        run(...newArgs)
      },
      { immediate: !options.lazy },
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
    reset,
  }
}