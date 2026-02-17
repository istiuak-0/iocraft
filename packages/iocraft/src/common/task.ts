import { computed, ref, watch } from "vue"



export function task<TFn extends TaskFn>(option: TaskOptionsWithSignal<TFn>): TaskReturnWithSignal<TFn>
export function task<TFn extends TaskFn>(option: TaskOptionsWithoutSignal<TFn>): TaskReturnWithoutSignal<TFn>
export function task<TFn extends TaskFn>(option: TaskOptionsWithSignal<TFn> | TaskOptionsWithoutSignal<TFn>): TaskReturnWithSignal<TFn> | TaskReturnWithoutSignal<TFn> {





  const data = ref<TData<TFn> | undefined>()
  const error = ref<Error | undefined>()
  const status = ref<'loading' | 'error' | 'idle' | 'success'>('idle')

  const isLoading = computed(() => status.value === 'loading')
  const isIdle = computed(() => status.value === 'idle')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')


  const initialized = ref(false)

  function start() {

  }


  function run() {

  }

  function clear() {

  }

  function stop() {

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
    stop,
    clear
  }
}


































// async function execute(...args: UserParams<TFn>): Promise<TData> {

//   const executionId = ++currentExecutionId;
//   let signal: AbortSignal | undefined

//   if (hasSignal) {
//     if (abortController) {
//       abortController.abort('Superseded by new execution')
//     }
//     abortController = new AbortController()
//     signal = abortController.signal
//   }


//   try {
//     status.value = 'loading'
//     error.value = undefined
//     onLoading?.({ args: args as Parameters<TFn> })

//     const callArgs = hasSignal ? [...args, signal] : args

//     const result = await fn(...callArgs as any)


//     if (executionId !== currentExecutionId) {
//       if (__DEV__) {
//         console.info('[task] Stale execution ignored', {
//           fn: fn.name || 'anonymous',
//           executionId,
//           currentExecutionId
//         })
//       }
//       return result
//     }

//     data.value = result
//     status.value = 'success'
//     onSuccess?.({ args: args as Parameters<TFn>, data: result })
//     return result

//   } catch (err) {
//     if (executionId !== currentExecutionId) return undefined as TData
//     if (err instanceof DOMException && err.name === 'AbortError') {
//       status.value = 'idle'
//       if (__DEV__) {
//         console.info('[task] Execution aborted', { fn: fn.name || 'anonymous' })
//       }
//       throw err
//     }

//     const e = err instanceof Error ? err : new Error(String(err))
//     error.value = e
//     status.value = 'error'
//     onError?.({ args: args as Parameters<TFn>, error: e })
//     rollback?.({ args: args as Parameters<TFn>, error: e })
//     throw e

//   } finally {
//     if (executionId === currentExecutionId) {
//       onFinally?.({ args: args as Parameters<TFn>, data: data.value, error: error.value })
//       if (hasSignal) abortController = null
//     }
//   }
// }