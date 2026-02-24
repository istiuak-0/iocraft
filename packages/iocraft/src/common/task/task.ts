import { watch } from "vue";
import { Aborter } from "./abort";
import { Retry } from "./retry";
import { State } from "./state";
import { Timer } from "./timer";
import type { AsyncFn, TaskOptions, TaskResult, TaskReturn } from "./types";

export class Task<TFn extends AsyncFn> implements TaskReturn<TFn> {
  // Flattening the states so its easier to use and don't require deep nesting
  private readonly state = new State<TFn>();

  readonly data = this.state.data;
  readonly error = this.state.error;
  readonly status = this.state.status;
  readonly isLoading = this.state.isLoading;
  readonly isIdle = this.state.isIdle;
  readonly isError = this.state.isError;
  readonly isSuccess = this.state.isSuccess;
  readonly initialized = this.state.initialized;

  private readonly abort = new Aborter();
  private readonly timer = new Timer();

  private readonly retry: Retry;
  private stopWatch: (() => void) | undefined;

  constructor(private readonly options: TaskOptions<TFn>) {
    this.retry = new Retry(options.retry);

    if (!options.lazy) {
      this.start(...((options.initialArgs ?? []) as Parameters<TFn>));
    }
  }

  private setupTracking(): void {
    if (!this.options.track || this.stopWatch) return;
    this.stopWatch = watch(this.options.track, (newArgs) => this.run(...newArgs), { immediate: false });
  }

  private async execute(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    const executionId = this.abort.next();
    this.abort.abort(this.options.key);

    if (this.options.timeout) {
      this.timer.startTimeout(() => {
        if (!this.options.key) console.warn("[Task] timeout works best with a key — use abortable() to cancel the request");
        this.abort.abort(this.options.key);
        this.abort.invalidate();
        this.state.setIdle();
      }, this.options.timeout);
    }

    try {
      this.state.setLoading();
      this.options.onLoading?.();

      const [result, error] = await this.retry.run(() => this.options.fn(...args));

      if (!this.abort.isCurrent(executionId)) return [undefined, undefined];

      if (error) {
        this.state.setError(error);
        this.options.onError?.(error);
        return [undefined, error];
      }

      this.state.setSuccess(result);
      this.options.onSuccess?.(result!);

      if (this.options.polling && !this.timer.isPolling()) {
        this.timer.startPolling(() => {
          if (this.status.value !== "loading") this.execute(...args);
        }, this.options.polling.interval);
      }

      return [result, undefined];
    } finally {
      this.timer.clearTimeout();
      if (this.abort.isCurrent(executionId)) {
        this.options.onFinally?.({ data: this.state.data.value, error: this.state.error.value });
      }
    }
  }

  async run(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    if (!this.initialized.value) {
      this.initialized.value = true;
      this.setupTracking();
    }
    if (this.options.debounce) {
      return this.timer.debounce(() => this.execute(...args), this.options.debounce);
    }
    return this.execute(...args);
  }

  async start(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    if (this.initialized.value) return [this.data.value, this.error.value];
    this.initialized.value = true;
    this.setupTracking();
    return this.execute(...args);
  }

  stop(): void {
    if (!this.options.key) {
      console.warn("[Task] stop() requires a key — use abortable() to register one");
      return;
    }
    this.abort.release(this.options.key);
    this.abort.invalidate();
    this.state.setIdle();
  }

  clear(): void {
    this.abort.invalidate();
    this.state.clear();
  }

  reset(): void {
    this.abort.invalidate();
    this.state.reset();
  }

  dispose(): void {
    this.abort.invalidate();
    this.timer.dispose();
    this.stopWatch?.();
    this.abort.release(this.options.key);
    this.state.setIdle();
  }
}
