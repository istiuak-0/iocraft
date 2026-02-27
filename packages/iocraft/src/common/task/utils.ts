import type { AsyncFn, Primitives, RetryConfig, TaskResult } from "./types";

export const AbortRegistry = new Map<Primitives, AbortController>();

export function abortTask(key?: Primitives) {
  if (key) AbortRegistry.get(key)?.abort();
}

export function createDebounce() {
  let handle: ReturnType<typeof setTimeout> | undefined;

  return function debounce<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve) => {
      clearTimeout(handle);
      handle = setTimeout(() => resolve(fn()), ms);
    });
  };
}

export function createPoller(fn: () => void, ms: number) {
  const handle = setInterval(fn, ms);
  return {
    stop: () => clearInterval(handle),
  };
}

export function releaseKey(key?: Primitives) {
  if (key == null) return;
  AbortRegistry.get(key)?.abort();
  AbortRegistry.delete(key);
}

function getRetryDelay(config: RetryConfig, attempt: number): number | null {
  if (!config.delay) return null;
  return config.backoff
    ? config.delay * 2 ** (attempt - 1) // exponential: 100ms, 200ms, 400ms...
    : config.delay; // flat: 100ms, 100ms, 100ms...
}

export function createTimeout(onTimeout: () => void, ms: number) {
  const handle = setTimeout(onTimeout, ms);
  return {
    clear: () => clearTimeout(handle),
  };
}

export async function runWithRetry<TFn extends AsyncFn>(fn: () => ReturnType<TFn>, config: RetryConfig): Promise<TaskResult<TFn>> {
  const totalAttemptsAllowed = config ? config.count + 1 : 1;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < totalAttemptsAllowed; attempt++) {
    const isRetry = attempt > 0;

    if (isRetry) {
      const delay = getRetryDelay(config, attempt);
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await fn();
      return [result, undefined];
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return [undefined, undefined];
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  return [undefined, lastError];
}
