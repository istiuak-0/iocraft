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

  return { data, error, status, initialized, isLoading, isIdle, isError, isSuccess };
}
