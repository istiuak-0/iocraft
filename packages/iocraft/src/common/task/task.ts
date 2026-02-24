import { Aborter } from "./abort";
import { Executor } from "./executor";
import { Retry } from "./retry";
import { State } from "./state";
import { Watcher } from "./watcher";
import { Timer } from "./timer";
import type { AsyncFn, TaskOptions, TaskReturn } from "./types";



export function task<TFn extends AsyncFn>(options: TaskOptions<TFn>): TaskReturn<TFn> {
  const state = new State<TFn>();
  const abort = new Aborter();
  const timer = new Timer();
  const retry = new Retry(options.retry);

  const executor = new Executor(options, state, abort, timer, retry);
  const watcher = new Watcher(options, executor);

  if (!options.lazy) {
    watcher.setup();
    executor.start(...((options.initialArgs ?? []) as Parameters<TFn>));
  }

  return {
    data: state.data,
    error: state.error,
    status: state.status,
    isLoading: state.isLoading,
    isIdle: state.isIdle,
    isError: state.isError,
    isSuccess: state.isSuccess,
    initialized: state.initialized,
    start: (...args) => {
      if (!state.initialized.value) watcher.setup();
      return executor.start(...args);
    },
    run: (...args) => {
      if (!state.initialized.value) watcher.setup();
      return executor.run(...args);
    },
    stop: () => executor.stop(),
    clear: () => executor.clear(),
    reset: () => executor.reset(),
    dispose: () => {
      watcher.dispose();
      executor.dispose();
    },
  };
}
