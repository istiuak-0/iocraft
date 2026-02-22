import type { AsyncFn, RetryConfig, TaskResult } from "./types";

export class Retry {
  constructor(private readonly config?: RetryConfig) {}

  async run<TFn extends AsyncFn>(fn: () => ReturnType<TFn>): Promise<TaskResult<TFn>> {
    const maxAttempts = this.config ? this.config.count + 1 : 1;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt > 0) {
        const delay = this.getDelay(attempt);
        if (delay) await this.sleep(delay);
      }

      try {
        const result = await fn();
        return [result as Awaited<ReturnType<TFn>>, undefined];
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return [undefined, undefined];
        }
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    return [undefined, lastError];
  }

  // Flat: 100ms, 100ms ...   Backoff: 100ms, 200ms, 400ms ...
  private getDelay(attempt: number): number | null {
    if (!this.config?.delay) return null;
    return this.config.backoff
      ? this.config.delay * 2 ** (attempt - 1)
      : this.config.delay;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}