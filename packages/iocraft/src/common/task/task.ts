import { createExecution } from "./execution";
import { createTaskState } from "./state";
import type { AsyncFn, Primitives, TaskOptions } from "./types";
import { AbortRegistry } from "./utils";

export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>) {
  const state = createTaskState<TFn>();
  createExecution(options, state);

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
