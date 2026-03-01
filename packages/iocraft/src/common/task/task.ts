import { watch, type WatchHandle } from "vue";
import { createExecution } from "./execution";
import { createTaskState } from "./state";
import type { AsyncFn, Primitives, TaskOptions, TaskResult, TaskReturn } from "./types";
import { AbortRegistry, abortTask, createDebounce } from "./utils";

export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>): TaskReturn<TFn> {
  let stopWatch: WatchHandle | undefined;
  let currentId = 0;

  const state = createTaskState<TFn>();
  const { execute } = createExecution(options, state);
  const debounce = createDebounce();

  if (options.watch) {
    const { deps, immediate } = options.watch;
    stopWatch = watch(deps, () => execute(...deps()), { immediate });
  }




  return {
    ...state,

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
      abortTask(options.key);
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
      stopWatch?.();
      abortTask(options.key);
      state.status.value = "idle";
      state.error.value = undefined;
    },
  };
}

export function abortable(key: Primitives): AbortController {
  abortTask(key);
  const controller = new AbortController();
  AbortRegistry.set(key, controller);
  return controller;
}
