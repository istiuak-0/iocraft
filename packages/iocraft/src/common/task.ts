import { computed, ref, watch } from "vue";

const controllerRegistry = new Map<Primitives, AbortController>();

export function abortable(key: Primitives): AbortController {
  if (controllerRegistry.has(key)) {
    controllerRegistry.delete(key);
  }
  const controller = new AbortController();
  controllerRegistry.set(key, controller);
  return controller;
}

/**
 * Description placeholder
 *
 * @export
 * @class Task
 * @typedef {Task}
 * @template {AsyncFn} TFn
 */
export class Task<TFn extends AsyncFn> {
  // === public reactive states ===
  readonly data = ref<Awaited<ReturnType<TFn>> | undefined>();
  readonly error = ref<Error | undefined>();
  readonly status = ref<TaskStatus>("idle");
  readonly isLoading = computed(() => this.status.value === "loading");
  readonly isIdle = computed(() => this.status.value === "idle");
  readonly isError = computed(() => this.status.value === "error");
  readonly isSuccess = computed(() => this.status.value === "success");
  readonly initialized = ref(false);

  // === private internals ===
  private currentExecutionId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private stopWatch: (() => void) | undefined;

  constructor(private options: TaskOptions<TFn>) {
    this.setupTracking();
  }

  // === private helpers ===
  private setupTracking() {
    const { track, lazy } = this.options;
    if (!track) return;

    this.stopWatch = watch(track, (newArgs) => this.run(...newArgs), {
      immediate: !lazy,
    });
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private abortPrevious() {
    if (this.options.key) {
      controllerRegistry.get(this.options.key)?.abort();
    }
  }

  private getRetryDelay(attempt: number): number | null {
    const retry = this.options.retry;

    if (!retry?.delay || attempt <= 0) {
      return null;
    }

    if (!retry.backoff) {
      return retry.delay;
    }

    return retry.delay * 2 ** (attempt - 1);
  }

  private async attemptWithRetry(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    const maxAttempts = this.options.retry ? this.options.retry.count + 1 : 1;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0 && this.options.retry?.delay) {
        const delay = this.getRetryDelay(attempt);

        if (delay !== null) {
          await this.sleep(delay);
        }
      }

      try {
        const result = (await this.options.fn(...args)) as Awaited<ReturnType<TFn>>;
        return [result, undefined];
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return [undefined, undefined];
        }
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    return [undefined, lastError];
  }

  private async execute(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    const executionId = ++this.currentExecutionId;
    this.abortPrevious();

    try {
      this.status.value = "loading";
      this.error.value = undefined;
      this.options.onLoading?.();

      const [result, retryError] = await this.attemptWithRetry(...args);
      if (executionId !== this.currentExecutionId) {
        return [undefined, undefined];
      }

      if (retryError) {
        this.error.value = retryError;
        this.status.value = "error";
        this.options.onError?.(retryError);
        return [undefined, retryError];
      }

      this.data.value = result;
      this.status.value = "success";
      this.options.onSuccess?.(result!);
      return [result, undefined];
    } finally {
      if (executionId === this.currentExecutionId) {
        this.options.onFinally?.({
          data: this.data.value,
          error: this.error.value,
        });
      }
    }
  }

  // === public methods ===

  async run(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {

    if (this.options.debounce) {
      return new Promise((resolve) => {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => resolve(this.execute(...args)), this.options.debounce);
      });
    }

    return this.execute(...args);

  }

  async start(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    if (this.initialized.value) {
      return [this.data.value, this.error.value];
    }
    this.initialized.value = true;
    return this.execute(...args);
  }

  stop(): void {
    if (!this.options.key) {
      console.warn("[Task] stop() requires a key — use abortable() to register one");
      return;
    }
    controllerRegistry.get(this.options.key)?.abort();
    controllerRegistry.delete(this.options.key);
    this.status.value = "idle";
    this.currentExecutionId++;
  }

  clear(): void {
    this.currentExecutionId++;
    this.data.value = undefined;
    this.error.value = undefined;
    this.status.value = "idle";
  }

  reset(): void {
    this.currentExecutionId++;
    this.data.value = undefined;
    this.error.value = undefined;
    this.status.value = "idle";
    this.initialized.value = false;
  }

  dispose(): void {
    this.currentExecutionId++;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = undefined;
    this.stopWatch?.();

    if (this.options.key) {
      controllerRegistry.get(this.options.key)?.abort();
      controllerRegistry.delete(this.options.key);
    }

    this.status.value = "idle";
  }
}
