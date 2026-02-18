type AsyncFn<TArgs extends any[], TResult> =
  (...args: TArgs) => Promise<TResult>

type TaskStatus = 'idle' | 'loading' | 'success' | 'error'






interface TaskOptions<TArgs extends any[], TResult> {
  fn: AsyncFn<TArgs, TResult>

  lazy?: boolean
  debounce?: number
  track?: () => any[]

  onLoading?: (args: TArgs) => void
  onSuccess?: (args: TArgs, data: TResult) => void
  onError?: (args: TArgs, error: Error) => void
  onFinally?: (args: TArgs, data?: TResult, error?: Error) => void
}






interface TaskReturn<TArgs extends any[], TResult> {
  data: Ref<TResult | undefined>
  error: Ref<Error | undefined>
  status: Ref<TaskStatus>

  isLoading: ComputedRef<boolean>
  isIdle: ComputedRef<boolean>
  isSuccess: ComputedRef<boolean>
  isError: ComputedRef<boolean>

  initialized: Ref<boolean>

  start: (...args: TArgs) => Promise<TResult | undefined>
  run: (...args: TArgs) => Promise<TResult | undefined>
  clear: () => void
}
