import type { createTaskState } from "./state";
import type { AsyncFn, TaskOptions, TaskResult } from "./types";
import { abortTask, createPoller, createTimeout, runTask } from "./utils";

export function createExecution<TFn extends AsyncFn>(options: TaskOptions<TFn>, state: ReturnType<typeof createTaskState<TFn>>) {
  let poller: ReturnType<typeof createPoller>;

  async function execute(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    const currentExecutionId = ++state.executionId.value;
    abortTask(options.key);

    let timeout: ReturnType<typeof createTimeout> | undefined;

    if (options.timeout) {
      timeout = createTimeout(() => {
        if (!options.key) {
          console.warn("[IOCRAFT::TASK] ⟶ timeout works best with a key — use abortable() to cancel the request");
        }
        abortTask(options.key);
        state.executionId.value++;
        state.status.value = "idle";
        state.error.value = undefined;
      }, options.timeout);
    }

    try {
      state.status.value = "loading";
      state.error.value = undefined;
      options.onLoading?.();

      const [result, error] = await runTask(() => options.fn(...args), options.retry);

      if (currentExecutionId !== state.executionId.value) return [undefined, undefined];

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
      if (currentExecutionId === state.executionId.value) {
        options.onFinally?.({ data: state.data.value, error: state.error.value });
      }
    }
  }

  return { execute };
}
