import { watch } from "vue";
import type { Executor } from "./executor";
import type { AsyncFn, TaskOptions } from "./types";

export class Watcher<TFn extends AsyncFn> {
  private stopWatch: (() => void) | undefined;

  constructor(
    private readonly options: TaskOptions<TFn>,
    private readonly executor: Executor<TFn>,
  ) {}

  setup(): void {
    if (!this.options.track || this.stopWatch) return;
    this.stopWatch = watch(this.options.track, (newArgs) => this.executor.run(...newArgs), { immediate: false });
  }

  dispose(): void {
    this.stopWatch?.();
  }
}
