import { reactive, computed, watch, watchEffect, type ComputedRef, type WatchStopHandle, toRaw } from "vue";

export function Store<T extends Record<string, any>>(initialState: T) {
  const state = reactive(initialState) as T;
  const initial = structuredClone(initialState);

  return class {
    readonly state = state;

    get snapshot(): T {
      return structuredClone(toRaw(state));
    }

    update(changes: Partial<T>): void {
      Object.assign(state, changes);
    }

    pick<K extends keyof T>(key: K): T[K] {
      return state[key]
    }

    compute<R>(fn: (state: T) => R): ComputedRef<R> {
      return computed(() => fn(state));
    }

    observe<K extends keyof T>(
      source: K,
      callback: (newValue: T[K], oldValue: T[K]) => void
    ): WatchStopHandle;

    observe<R>(
      source: (state: T) => R,
      callback: (newValue: R, oldValue: R) => void
    ): WatchStopHandle;

    observe<K extends keyof T, R>(
      source: K | ((state: T) => R),
      callback: (newValue: any, oldValue: any) => void
    ): WatchStopHandle {
      const getter = typeof source === 'function'
        ? () => source(state)
        : () => state[source as K];

      return watch(getter, callback);
    }

    effect(fn: (state: T) => void): WatchStopHandle {
      return watchEffect(() => fn(state));
    }

    reset(): void {
      Object.assign(state, structuredClone(initial));
    }
  };
}

