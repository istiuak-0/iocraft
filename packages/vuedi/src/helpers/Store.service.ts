import { computed, type ComputedRef } from 'vue';

export function Store<T extends Record<string, any>>(initialState: T) {
  return class {
    state = initialState;

    getState(): T {
      return this.state;
    }

    setState(partialState: Partial<T>): void {
      for (const key in partialState) {
        if (Object.hasOwn(partialState, key) && partialState[key] !== undefined) {
          (this.state as any)[key] = partialState[key];
        }
      }
    }

    reset(): void {
      const fresh = initialState;

      for (const key in this.state) {
        if (Object.hasOwn(this.state, key)) delete (this.state as any)[key];
      }

      for (const key in fresh) {
        if (Object.hasOwn(fresh, key)) (this.state as any)[key] = fresh[key];
      }
    }

    select<K extends keyof T>(key: K): ComputedRef<T[K]> {
      return computed(() => this.state[key]);
    }
  };
}
