type TaskStatus = 'idle' | 'loading' | 'success' | 'error'
type AsyncFn = (...args: unknown[]) => Promise<unknown>

interface RetryConfig {
  count: number
  delay?: number
  backoff?: boolean
}

interface ErrorContext {
  attempt: number
  willRetry: boolean
}



interface TaskOptions<TFn extends AsyncFn> {
  fn: TFn

  lazy?: boolean
  debounce?: number
  track?: () => Parameters<TFn>
  retry:RetryConfig

  onLoading?: () => void
  onSuccess?: (data: Awaited<ReturnType<TFn>>) => void
  onError?: (error: Error) => void
  onFinally?: (result: { data?: Awaited<ReturnType<TFn>>, error?: Error }) => void
}






interface TaskReturn<TFn extends AsyncFn> {
  data: Ref<Awaited<ReturnType<TFn>> | undefined>
  error: Ref<Error | undefined>
  status: Ref<TaskStatus>

  isLoading: ComputedRef<boolean>
  isIdle: ComputedRef<boolean>
  isSuccess: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  initialized: Ref<boolean>

  start: (...args: Parameters<TFn>) => Promise<Awaited<ReturnType<TFn>> | undefined>
  run: (...args: Parameters<TFn>) => Promise<Awaited<ReturnType<TFn>> | undefined>
  clear: () => void
  reset: () => void
}
