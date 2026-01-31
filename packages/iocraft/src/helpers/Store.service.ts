export function Store<T extends Record<string, any>>(initialState: T) {
  return class {
    state = initialState;

    getState() {}

    setState(_partialState: Partial<T>) {}

    select<K extends keyof T>(_key: K) {}

    computed() {}

    watch() {}

    watchEffect() {}

    reset(): void {}

    onInit() {}

    onDispose() {}
  };
}
