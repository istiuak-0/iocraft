import { Aborter } from "./abort";
import { Retry } from "./retry";
import { State } from "./state";
import { Timer } from "./timer";
import type { AsyncFn, TaskOptions, TaskResult } from "./types";

export class Executor<TFn extends AsyncFn> {
  constructor(
    private readonly options: TaskOptions<TFn>,
    private readonly state: State<TFn>,
    private readonly abort: Aborter,
    private readonly timer: Timer,
    private readonly retry: Retry,
  ) {}

  async execute(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
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
          if (this.state.status.value !== "loading") this.execute(...args);
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
    if (this.options.debounce) {
      return this.timer.debounce(() => this.execute(...args), this.options.debounce);
    }
    return this.execute(...args);
  }

  async start(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    if (this.state.initialized.value) return [this.state.data.value, this.state.error.value];
    this.state.initialized.value = true;
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
    this.abort.release(this.options.key);
    this.state.setIdle();
  }
}
