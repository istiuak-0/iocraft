type TaskFn = (...args: any[]) => Promise<any>

type TaskContext<TFn extends TaskFn> = {
  args: Parameters<TFn>
  data?: Awaited<ReturnType<TFn>>
  error?: Error
}

type TaskFnWithSignal<TFn extends TaskFn> =
  (...args: [...Parameters<TFn>, $signal: AbortSignal]) => ReturnType<TFn>

type TaskFnWithoutSignal<TFn extends TaskFn> =
  (...args: Parameters<TFn>) => ReturnType<TFn>


interface TaskOptionsWithSignal<TFn extends TaskFn> {
  fn: TaskFnWithSignal<TFn>
  track?: () => any[]
  lazy?: boolean
  debounce?: number
  onLoading?: (ctx: TaskContext<TFn>) => void
  onSuccess?: (ctx: TaskContext<TFn> & { data: Awaited<ReturnType<TFn>> }) => void
  onError?: (ctx: TaskContext<TFn> & { error: Error }) => void
  onFinally?: (ctx: TaskContext<TFn>) => void
  rollback?: (ctx: TaskContext<TFn> & { error: Error }) => void
}


interface TaskOptionsWithoutSignal<TFn extends TaskFn> {
  fn: TaskFnWithoutSignal<TFn>
  track?: () => any[]
  lazy?: boolean
  debounce?: number
  onLoading?: (ctx: TaskContext<TFn>) => void
  onSuccess?: (ctx: TaskContext<TFn> & { data: Awaited<ReturnType<TFn>> }) => void
  onError?: (ctx: TaskContext<TFn> & { error: Error }) => void
  onFinally?: (ctx: TaskContext<TFn>) => void
  rollback?: (ctx: TaskContext<TFn> & { error: Error }) => void
}

type TData<TFn extends TaskFn> = Awaited<ReturnType<TFn>>

type TaskStatus = 'loading' | 'error' | 'idle' | 'success'




interface TaskBaseReturn<TFn extends TaskFn> {
  data: Ref<TData<TFn> | undefined>
  error: Ref<Error | undefined>
  status: Ref<TaskStatus>
  isLoading: ComputedRef<boolean>
  isIdle: ComputedRef<boolean>
  isSuccess: ComputedRef<boolean>
  isError: ComputedRef<boolean>
  initialized: Ref<boolean>
  start: (...args: Parameters<TFn>) => Promise<TData<TFn>>
  run: (...args: Parameters<TFn>) => Promise<TData<TFn>>
  clear: () => void
}


interface TaskReturnWithSignal<TFn extends TaskFn> extends TaskBaseReturn<TFn> {
  stop: () => void
}

interface TaskReturnWithoutSignal<TFn extends TaskFn> extends TaskBaseReturn<TFn> { }