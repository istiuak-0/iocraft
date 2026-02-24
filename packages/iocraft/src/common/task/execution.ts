import { Aborter } from "./abort";
import { Retry } from "./retry";
import { State } from "./state";
import { Timer } from "./timer";
import type { AsyncFn, TaskOptions, TaskResult } from "./types";

import type { Primitives } from "./types";

const registry = new Map<Primitives, AbortController>();

/**
 * Manages abort controllers for canceling in-flight requests.
 * Tracks request IDs to ignore stale responses.
 */
export class Aborter {
  private currentId = 0;

  next(): number {
    return ++this.currentId;
  }

  isCurrent(id: number): boolean {
    return id === this.currentId;
  }

  invalidate(): void {
    this.currentId++;
  }

  register(key: Primitives): AbortController {
    registry.get(key)?.abort();
    const controller = new AbortController();
    registry.set(key, controller);
    return controller;
  }

  abort(key?: Primitives): void {
    if (key == null) return;
    registry.get(key)?.abort();
  }

  release(key?: Primitives): void {
    if (key == null) return;
    registry.get(key)?.abort();
    registry.delete(key);
  }
}

/**
 * Creates or replaces an AbortController for the given key.
 * Aborts any existing controller for the same key.
 * @example
 * ```ts
 * fetch("/api/users", { signal: abortable("users").signal });
 * ```
 */
export function abortable(key: Primitives): AbortController {
  registry.get(key)?.abort();
  const controller = new AbortController();
  registry.set(key, controller);
  return controller;
}

class Executor<TFn extends AsyncFn> {
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
    this.state.clearTransients();
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

import type { AsyncFn, RetryConfig, TaskResult } from "./types";

export class Retry {
  constructor(private readonly config?: RetryConfig) {}

  async run<TFn extends AsyncFn>(fn: () => ReturnType<TFn>): Promise<TaskResult<TFn>> {
    const maxAttempts = this.config ? this.config.count + 1 : 1;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = this.getDelay(attempt);
        if (delay) await this.sleep(delay);
      }

      try {
        const result = await fn();
        return [result as Awaited<ReturnType<TFn>>, undefined];
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return [undefined, undefined];
        }
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    return [undefined, lastError];
  }

  // Flat: 100ms, 100ms ...   Backoff: 100ms, 200ms, 400ms ...
  private getDelay(attempt: number): number | null {
    if (!this.config?.delay) return null;
    return this.config.backoff ? this.config.delay * 2 ** (attempt - 1) : this.config.delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

import { watch } from "vue";


export class Watcher<TFn extends AsyncFn> {
  private stopWatch: (() => void) | undefined;

  constructor(
    private readonly options: TaskOptions<TFn>,
    private readonly executor: Executor<TFn>,
  ) {}

  setup(): void {
    if (!this.options.track || this.stopWatch) return;
    this.stopWatch = watch(this.options.track, (newArgs) => this.executor.run(...newArgs), { immediate: false });
  }

  dispose(): void {
    this.stopWatch?.();
  }
}
