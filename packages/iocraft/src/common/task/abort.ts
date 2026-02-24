import type { Primitives } from "./types";

const registry = new Map<Primitives, AbortController>();

/**
 * Manages abort controllers for canceling in-flight requests.
 * Tracks request IDs to ignore stale responses.
 */
export class Aborter {
  private currentId = 0;

  next(): number {
    return ++this.currentId;
  }

  isCurrent(id: number): boolean {
    return id === this.currentId;
  }

  invalidate(): void {
    this.currentId++;
  }

  register(key: Primitives): AbortController {
    registry.get(key)?.abort();
    const controller = new AbortController();
    registry.set(key, controller);
    return controller;
  }

  abort(key?: Primitives): void {
    if (key == null) return;
    registry.get(key)?.abort();
  }

  release(key?: Primitives): void {
    if (key == null) return;
    registry.get(key)?.abort();
    registry.delete(key);
  }
}

/**
 * Creates or replaces an AbortController for the given key.
 * Aborts any existing controller for the same key.
 * @example
 * ```ts
 * fetch("/api/users", { signal: abortable("users").signal });
 * ```
 */
export function abortable(key: Primitives): AbortController {
  registry.get(key)?.abort();
  const controller = new AbortController();
  registry.set(key, controller);
  return controller;
}