import { computed, ref } from "vue";
import type { AsyncFn, TaskStatus } from "./types";

/**
 * This Holds The Resource States And Necessary Internal Methods To Update Them
 *
 * @export
 * @class State
 * @typedef {State}
 * @template {AsyncFn} TFn
 */
export class State<TFn extends AsyncFn> {
  readonly data = ref<Awaited<ReturnType<TFn>> | undefined>();
  readonly error = ref<Error | undefined>();
  readonly status = ref<TaskStatus>("idle");
  readonly initialized = ref(false);

  readonly isLoading = computed(() => this.status.value === "loading");
  readonly isIdle = computed(() => this.status.value === "idle");
  readonly isError = computed(() => this.status.value === "error");
  readonly isSuccess = computed(() => this.status.value === "success");

  setLoading(): void {
    this.status.value = "loading";
    this.error.value = undefined;
  }

  setSuccess(data: Awaited<ReturnType<TFn>>): void {
    this.data.value = data;
    this.status.value = "success";
  }

  setError(error: Error): void {
    this.error.value = error;
    this.status.value = "error";
  }

  setIdle(): void {
    this.status.value = "idle";
  }

  // Clears data + error, back to idle. Keeps initialized so start() won't re-run.
  clear(): void {
    this.data.value = undefined;
    this.error.value = undefined;
    this.status.value = "idle";
  }

  // Full wipe — same as if the Task was just created. start() will run again.
  reset(): void {
    this.clear();
    this.initialized.value = false;
  }
}
