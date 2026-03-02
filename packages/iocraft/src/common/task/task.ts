import { watch, type WatchHandle } from "vue";
import type { AsyncFn, Optional, PollerRef, Primitives, TaskOptions, TaskResult, TaskReturn } from "./types";
import { AbortRegistry, abortTask, createDebounce, createExecution, createTaskState } from "./utils";

/**
 *
 * An Async Resource Wrapper That Gives
 * Common Application States
 * Out Of The Box With Full Reactivity
 *
 * @param {TaskOptions<TFn>} options
 * @returns {TaskReturn<TFn>}
 */
export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>): TaskReturn<TFn> {
  const state = createTaskState<TFn>();

  const pollerRef: PollerRef = { current: undefined };

  const { execute } = createExecution(options, state, pollerRef);

  const debounce = createDebounce();

  let stopWatch: Optional<WatchHandle>;

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
      if (!options.key && __DEV__) {
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
  if (AbortRegistry.has(key) && __DEV__) {
    console.error("[IOCRAFT::TASK] ⟶ This Key Is Aredy Presenbt In registry");
  }
  const controller = new AbortController();
  AbortRegistry.set(key, controller);
  return controller;
}
