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