import type { AsyncFn, Primitives, RetryConfig, TaskResult } from "./types";

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

export function createTimeout(onTimeout: () => void, ms: number) {
  const handle = setTimeout(onTimeout, ms);
  return {
    clear: () => clearTimeout(handle),
  };
}

export const AbortRegistry = new Map<Primitives, AbortController>();

export function abortTask(key?: Primitives) {
  if (key == null) return;
  AbortRegistry.get(key)?.abort();
}

export function releaseKey(key?: Primitives) {
  if (key == null) return;
  AbortRegistry.get(key)?.abort();
  AbortRegistry.delete(key);
}

export async function runWithRetry<TFn extends AsyncFn>(
  fn: () => ReturnType<TFn>,
  config: RetryConfig | undefined,
): Promise<TaskResult<TFn>> {
  const maxAttempts = config ? config.count + 1 : 1;
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      const delay = config?.delay ? (config.backoff ? config.delay * 2 ** (attempt - 1) : config.delay) : null;
      if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }

    try {
      const result = await fn();
      return [result as Awaited<ReturnType<TFn>>, undefined];
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return [undefined, undefined];
      lastError = e instanceof Error ? e : new Error(String(e));
    }
  }

  return [undefined, lastError];
}
