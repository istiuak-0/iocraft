type TaskStatus = 'idle' | 'loading' | 'success' | 'error'
type AsyncFn = (...args: unknown[]) => Promise<unknown>
type TaskResult<TFn extends AsyncFn> = [Awaited<ReturnType<TFn>> | undefined, Error | undefined]

type Primitives = string | number | symbol
interface RetryConfig {
  count: number
  delay?: number
  backoff?: boolean
}


interface TaskOptions<TFn extends AsyncFn> {
  key?: Primitives
  fn: TFn

  lazy?: boolean
  debounce?: number
  retry?: RetryConfig
  timeout:number
  polling:number
  track?: () => Parameters<TFn>

  onLoading?: () => void
  onSuccess?: (data: Awaited<ReturnType<TFn>>) => void
  onError?: (error: Error) => void
  onFinally?: (result: { data?: Awaited<ReturnType<TFn>>; error?: Error }) => void
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

  start: (...args: Parameters<TFn>) => Promise<TaskResult<TFn>>
  run: (...args: Parameters<TFn>) => Promise<TaskResult<TFn>>
  stop: () => void
  clear: () => void
  reset: () => void
  dispose: () => void
}