import { ref, computed } from "vue"

export function task<TArgs extends any[], TResult>(
  options: TaskOptions<TArgs, TResult>
): TaskReturn<TArgs, TResult> {

  const data = ref<TResult>()
  const error = ref<Error>()
  const status = ref<TaskStatus>('idle')
  const initialized = ref(false)



  const isLoading = computed(() => status.value === 'loading')
  const isIdle = computed(() => status.value === 'idle')
  const isError = computed(() => status.value === 'error')
  const isSuccess = computed(() => status.value === 'success')



  async function run(...args: TArgs) {
    status.value = 'loading'
    error.value = undefined
    options.onLoading?.(args)

    try {
      const result = await options.fn(...args)
      data.value = result
      status.value = 'success'
      options.onSuccess?.(args, result)
      return result
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e))
      error.value = err
      status.value = 'error'
      options.onError?.(args, err)
    } finally {
      options.onFinally?.(args, data.value, error.value)
    }
  }




  async function start(...args: TArgs) {

    if (!initialized.value && !isLoading.value) {
      initialized.value = true
      return run(...args)
    }

    if (status.value === 'success' && data.value !== undefined) {
      return data.value
    }

  }


  function clear() {
    data.value = undefined
    error.value = undefined
    status.value = 'idle'
    initialized.value = false
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
    clear
  }
}








