import { watch, type WatchHandle } from "vue";
import { createExecution } from "./execution";
import { createTaskState } from "./state";
import type { AsyncFn, Primitives, TaskOptions } from "./types";
import { AbortRegistry } from "./utils";

export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>) {
  let stopWatch: WatchHandle;

  const state = createTaskState<TFn>();
  const { execute } = createExecution(options, state);


  if (options.watch) {
    const { deps, immediate } = options.watch;
    stopWatch = watch(deps, () => {}, { immediate });
  }

  return {
    ...state,
  };
}

export function abortable(key: Primitives): AbortController {
  AbortRegistry.get(key)?.abort();
  const controller = new AbortController();
  AbortRegistry.set(key, controller);
  return controller;
}
