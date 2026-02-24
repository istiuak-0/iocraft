import type { Primitives } from "./types";

const registry = new Map<Primitives, AbortController>();

/**
 * Creates or replaces an AbortController for the given key.
 * Aborts any existing controller for the same key.
 * @example
 * fetch("/api/users", { signal: abortable("users").signal });
 */
export function abortable(key: Primitives): AbortController {
  registry.get(key)?.abort();
  const controller = new AbortController();
  registry.set(key, controller);
  return controller;
}

export function abortKey(key?: Primitives) {
  if (key == null) return;
  registry.get(key)?.abort();
}

export function releaseKey(key?: Primitives) {
  if (key == null) return;
  registry.get(key)?.abort();
  registry.delete(key);
}
