import { watch, type WatchHandle } from "vue";
import { createExecution } from "./execution";
import { createTaskState } from "./state";
import type { AsyncFn, Primitives, StopPoller, TaskOptions, TaskResult, TaskReturn } from "./types";
import { AbortRegistry, abortTask, createDebounce } from "./utils";

export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>): TaskReturn<TFn> {
  const state = createTaskState<TFn>();

  const pollerRef = { current: undefined as StopPoller | undefined };
  const { execute } = createExecution(options, state, pollerRef);
  
  const debounce = createDebounce();

  let stopWatch: WatchHandle | undefined;
  if (options.watch) {
    const { deps, immediate } = options.watch;
    stopWatch = watch(deps, (newArgs) => execute(...newArgs), { immediate });
  }

  return {
    ...state,

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
        console.warn("[IOCRAFT::TASK] ⟶ stop() requires a key and abortable()");
        return;
      }
      abortTask(options.key);
      state.executionId.value++;
      state.status.value = "idle";
      state.error.value = undefined;
    },

    clear(): void {
      state.executionId.value++;
      state.data.value = undefined;
      state.error.value = undefined;
      state.status.value = "idle";
    },

    reset(): void {
      state.executionId.value++;
      state.status.value = "idle";
      state.data.value = undefined;
      state.error.value = undefined;
      state.initialized.value = false;
    },

    dispose(): void {
      state.executionId.value++;
      stopWatch?.();
      pollerRef.current?.stop(); // accessible via ref object
      pollerRef.current = undefined;
      abortTask(options.key);
      state.status.value = "idle";
      state.error.value = undefined;
    },
  };
}

export function abortable(key: Primitives): AbortController {
  if (AbortRegistry.has(key)) {
    console.error("[IOCRAFT::TASK] ⟶ This Key Is Aredy Presenbt In registry");
  }
  const controller = new AbortController();
  AbortRegistry.set(key, controller);
  return controller;
}
