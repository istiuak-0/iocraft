import type { createTaskState } from "./state";
import type { AsyncFn, TaskOptions, TaskResult } from "./types";
import { abortTask, createDebounce, createPoller, createTimeout, releaseKey, runWithRetry } from "./utils";



export function createExecution<TFn extends AsyncFn>(options: TaskOptions<TFn>, state: ReturnType<typeof createTaskState<TFn>>) {
  let currentId = 0; // this id is used to prevent race conditions
  let poller: ReturnType<typeof createPoller> | undefined;
  const debounce = createDebounce();

  async function execute(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    const executionId = ++currentId;
    abortTask(options.key);

    let timeout: ReturnType<typeof createTimeout> | null = null;

    /// Abort the request on timeout
    if (options.timeout) {
      timeout = createTimeout(() => {
        if (!options.key) {
          console.warn("[Task] timeout works best with a key — use abortable() to cancel the request");
        }

        abortTask(options.key);

        currentId++;

        state.status.value = "idle";
        state.error.value = undefined;
      }, options.timeout);
    }

    try {
      state.status.value = "loading";
      state.error.value = undefined;
      options.onLoading?.();

      const [result, error] = await runWithRetry(() => options.fn(...args), options.retry);

      if (executionId !== currentId) return [undefined, undefined];

      if (error) {
        state.status.value = "error";
        state.error.value = error;
        options.onError?.(error);
        return [undefined, error];
      }

      state.status.value = "success";
      state.data.value = result as Awaited<ReturnType<TFn>>;
      options.onSuccess?.(result as Awaited<ReturnType<TFn>>);

      if (options.polling && !poller) {
        poller = createPoller(() => {
          if (state.status.value !== "loading") execute(...args);
        }, options.polling.interval);
      }

      return [result as Awaited<ReturnType<TFn>>, undefined];
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
      return options.debounce ? debounce(() => execute(...args), options.debounce) : execute(...args);
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
      state.status.value = "idle";
      state.error.value = undefined;
    },

    clear(): void {
      currentId++;
      state.data.value = undefined;
      state.error.value = undefined;
    },

    reset(): void {
      currentId++;
      state.status.value = "idle";
      state.data.value = undefined;
      state.error.value = undefined;
      state.initialized.value = false;
    },

    dispose(): void {
      currentId++;
      poller?.stop();
      poller = undefined;
      releaseKey(options.key);
      state.status.value = "idle";
      state.error.value = undefined;
    },
  };
}
