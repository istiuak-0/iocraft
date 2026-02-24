import { createDebounce, createPoller, createTimeout } from "./timing";
import type { createTaskState } from "./state";
import type { AsyncFn, Primitives, RetryConfig, TaskOptions, TaskResult } from "./types";
import { abortKey, releaseKey } from "./abort";



async function runWithRetry<TFn extends AsyncFn>(
  fn: () => ReturnType<TFn>,
  config: RetryConfig | undefined,
): Promise<TaskResult<TFn>> {
  const maxAttempts = config ? config.count + 1 : 1;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = config?.delay
        ? config.backoff
          ? config.delay * 2 ** (attempt - 1) // backoff:  100ms, 200ms, 400ms...
          : config.delay                        // flat:     100ms, 100ms, 100ms...
        : null;
      if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await fn();
      return [result as Awaited<ReturnType<TFn>>, undefined];
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return [undefined, undefined];
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  return [undefined, lastError];
}

export function createExecution<TFn extends AsyncFn>(
  options: TaskOptions<TFn>,
  state: ReturnType<typeof createTaskState<TFn>>,
) {
  let currentId = 0;
  let poller: ReturnType<typeof createPoller> | undefined;
  const debounce = createDebounce();

  async function execute(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    const executionId = ++currentId;
    abortKey(options.key);

    const timeout = options.timeout
      ? createTimeout(() => {
          if (!options.key) console.warn("[Task] timeout works best with a key — use abortable() to cancel the request");
          abortKey(options.key);
          currentId++;
          state.setIdle();
        }, options.timeout)
      : null;

    try {
      state.setLoading();
      options.onLoading?.();

      const [result, error] = await runWithRetry(() => options.fn(...args), options.retry);

      if (executionId !== currentId) return [undefined, undefined]; // stale, discard

      if (error) {
        state.setError(error);
        options.onError?.(error);
        return [undefined, error];
      }

      state.setSuccess(result);
      options.onSuccess?.(result!);

      if (options.polling && !poller) {
        poller = createPoller(() => {
          if (state.status.value !== "loading") execute(...args);
        }, options.polling.interval);
      }

      return [result, undefined];
    } finally {
      timeout?.clear();
      if (executionId === currentId) {
        options.onFinally?.({ data: state.data.value, error: state.error.value });
      }
    }
  }

  return {
    execute,

    run(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
      return options.debounce
        ? debounce(() => execute(...args), options.debounce)
        : execute(...args);
    },

    start(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
      if (state.initialized.value) return Promise.resolve([state.data.value, state.error.value]);
      state.initialized.value = true;
      return execute(...args);
    },

    stop(): void {
      if (!options.key) {
        console.warn("[Task] stop() requires a key — use abortable() to cancel the request");
        return;
      }
      releaseKey(options.key);
      currentId++;
      state.setIdle();
    },

    clear(): void {
      currentId++;
      state.clearTransients();
    },

    reset(): void {
      currentId++;
      state.reset();
    },

    dispose(): void {
      currentId++;
      poller?.stop();
      poller = undefined;
      releaseKey(options.key);
      state.setIdle();
    },
  };
}