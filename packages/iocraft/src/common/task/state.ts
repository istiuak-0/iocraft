import { computed, ref } from "vue";
import type { AsyncFn, TaskStatus } from "./types";

export function createTaskState<TFn extends AsyncFn>() {
  const data = ref<Awaited<ReturnType<TFn>> | undefined>();
  const error = ref<Error | undefined>();
  const status = ref<TaskStatus>("idle");
  const initialized = ref(false);

  const isLoading = computed(() => status.value === "loading");
  const isIdle = computed(() => status.value === "idle");
  const isError = computed(() => status.value === "error");
  const isSuccess = computed(() => status.value === "success");

  function setLoading() { status.value = "loading"; }
  function setIdle() { status.value = "idle"; }
  function setSuccess(result: Awaited<ReturnType<TFn>> | undefined) {
    data.value = result;
    status.value = "success";
  }
  function setError(e: Error) {
    error.value = e;
    status.value = "error";
  }
  function clearTransients() {
    data.value = undefined;
    error.value = undefined;
  }
  function reset() {
    data.value = undefined;
    error.value = undefined;
    status.value = "idle";
    initialized.value = false;
  }

  return {
    data, error, status, initialized,
    isLoading, isIdle, isError, isSuccess,
    setLoading, setIdle, setSuccess, setError, clearTransients, reset,
  };
}