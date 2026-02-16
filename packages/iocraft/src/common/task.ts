import { computed, ref, watch } from "vue"


type TaskContext<TFn extends (...args: any[]) => Promise<any>> = {
  args: Parameters<TFn>
  data?: Awaited<ReturnType<TFn>>
  error?: Error
}

export function task<TFn extends (...args: any[]) => Promise<any>>(option: {

  fn: TFn
  track?: () => any[]

  lazy?: boolean
  debounce?: number
  throttle?: number


  onLoading?: (ctx: TaskContext<TFn>) => void
  onSuccess?: (ctx: TaskContext<TFn> & { data: Awaited<ReturnType<TFn>> }) => void
  onError?: (ctx: TaskContext<TFn> & { error: Error }) => void
  onFinally?: (ctx: TaskContext<TFn>) => void
  rollback?: (ctx: TaskContext<TFn> & { error: Error }) => void
}) {

  const {
    fn,
    track,
    lazy = true,
    onError,
    onLoading,
    onSuccess,
    onFinally,
    rollback
  } = option;

  type TData = Awaited<ReturnType<TFn>>


  const data = ref<TData | undefined>()
  const error = ref<Error | undefined>()
  const status = ref<'loading' | 'error' | 'idle' | 'success'>('idle')

  const isLoading = computed(() => status.value === 'loading')
  const isIdle = computed(() => status.value === 'idle')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')


  const initialized = ref(false)
  let abortController: AbortController | null = null




  async function start(...args: Parameters<TFn>): Promise<TData> {

  if (initialized.value) {

    if (__DEV__) {
      console.info(
        '[task] Already initialized. Use run() for repeated execution.',
        { fn: fn.name || 'anonymous', status: status.value }
      )
    }


    if (data.value !== undefined) {
      return data.value
    }
  }
  
  initialized.value = true
  return execute(...args)
  }


  async function run(...args: Parameters<TFn>) {
    return await execute(...args)
  }



  async function execute(...args: Parameters<TFn>) {
    try {
      status.value = 'loading'
      error.value = undefined
      onLoading?.({ args })
      const result = await fn(...args)
      data.value = result
      status.value = 'success'
      onSuccess?.({ args, data: result })
      return result;

    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err))
      error.value = e
      status.value = 'error'
      onError?.({ args, error: e })
      rollback?.({ args, error: e })
      throw err;

    } finally {
      onFinally?.({ args, data: data.value, error: error.value })
    }
  }


  function stop() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    status.value = 'idle'
  }


  function clear() {
    data.value = undefined
    error.value = undefined
    status.value = 'idle'
    initialized.value = false
  }


  if (track && !lazy) {
    watch(track, (deps) => {

    }, { immediate: true })

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