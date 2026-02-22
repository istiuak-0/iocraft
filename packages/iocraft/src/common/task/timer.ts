export class Timer {
  private debounceHandle: ReturnType<typeof setTimeout> | undefined;
  private pollingHandle: ReturnType<typeof setInterval> | undefined;
  private timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  debounce<T>(fn: () => Promise<T>, ms: number): Promise<T> {
    return new Promise((resolve) => {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = setTimeout(() => resolve(fn()), ms);
    });
  }

  startPolling(fn: () => void, ms: number): void {
    if (this.pollingHandle != null) return;
    this.pollingHandle = setInterval(fn, ms);
  }

  stopPolling(): void {
    clearInterval(this.pollingHandle);
    this.pollingHandle = undefined;
  }

  isPolling(): boolean {
    return this.pollingHandle != null;
  }

  startTimeout(onTimeout: () => void, ms: number): void {
    clearTimeout(this.timeoutHandle);
    this.timeoutHandle = setTimeout(onTimeout, ms);
  }

  clearTimeout(): void {
    clearTimeout(this.timeoutHandle);
    this.timeoutHandle = undefined;
  }

  dispose(): void {
    clearTimeout(this.debounceHandle);
    clearTimeout(this.timeoutHandle);
    clearInterval(this.pollingHandle);
    this.debounceHandle = undefined;
    this.timeoutHandle = undefined;
    this.pollingHandle = undefined;
  }
}