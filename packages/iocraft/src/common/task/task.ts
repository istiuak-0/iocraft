import { watch } from "vue";
import { createExecution } from "./execution";
import { createTaskState } from "./state";
import type { AsyncFn, TaskOptions, TaskReturn } from "./types";

export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>): TaskReturn<TFn> {
  const state = createTaskState<TFn>();
  const execution = createExecution(options, state);

  let stopWatch: (() => void) | undefined;

  function setupWatch() {
    if (!options.track || stopWatch) return;
    stopWatch = watch(options.track, (newArgs) => execution.run(...newArgs), { immediate: false });
  }

  if (!options.lazy) {
    setupWatch();
    execution.start(...((options.initialArgs ?? []) as Parameters<TFn>));
  }

  return {
    ...state,
    start: (...args) => {
      if (!state.initialized.value) setupWatch();
      return execution.start(...args);
    },
    run: (...args) => {
      if (!state.initialized.value) setupWatch();
      return execution.run(...args);
    },
    stop: () => execution.stop(),
    clear: () => execution.clear(),
    reset: () => execution.reset(),
    dispose: () => {
      stopWatch?.();
      execution.dispose();
    },
  };
}