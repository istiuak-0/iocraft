import type { ComputedRef, Ref } from "vue";

export type TaskStatus = "idle" | "loading" | "success" | "error";
export type AsyncFn = (...args: unknown[]) => Promise<unknown>;
export type TaskResult<TFn extends AsyncFn> = [Awaited<ReturnType<TFn>> | undefined, Error | undefined];
export type Primitives = string | number | symbol;

export interface RetryConfig {
  count: number;
  delay?: number;
  backoff?: boolean;
}

export interface PollingConfig {
  interval: number;
  backoff?: boolean;
}

export interface TaskOptions<TFn extends AsyncFn> {
  key?: Primitives;
  fn: TFn;
  lazy?: boolean;
  debounce?: number;
  timeout?: number;
  polling?: PollingConfig;
  retry?: RetryConfig;
  initialArgs?: Parameters<TFn>;
  track?: () => Parameters<TFn>;
  onLoading?: () => void;
  onSuccess?: (data: Awaited<ReturnType<TFn>>) => void;
  onError?: (error: Error) => void;
  onFinally?: (result: { data?: Awaited<ReturnType<TFn>>; error?: Error }) => void;
}

export interface TaskReturn<TFn extends AsyncFn> {
  data: Ref<Awaited<ReturnType<TFn>> | undefined>;
  error: Ref<Error | undefined>;
  status: Ref<TaskStatus>;
  isLoading: ComputedRef<boolean>;
  isIdle: ComputedRef<boolean>;
  isSuccess: ComputedRef<boolean>;
  isError: ComputedRef<boolean>;
  initialized: Ref<boolean>;
  start: (...args: Parameters<TFn>) => Promise<TaskResult<TFn>>;
  run: (...args: Parameters<TFn>) => Promise<TaskResult<TFn>>;
  stop: () => void;
  clear: () => void;
  reset: () => void;
  dispose: () => void;
}