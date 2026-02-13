import { ref } from 'vue';
import { type EagerResource, type LazyResource, type ResourceOptions } from './resource.d';



// in development
export function defineResource<T, Args extends any[]>(
  option: ResourceOptions<T, Args> & { mode: 'eager' }
): EagerResource<T, Args>;

export function defineResource<T, Args extends any[]>(
  option: ResourceOptions<T, Args> & { mode: 'lazy' }
): LazyResource<T, Args>;


export function defineResource<T, Args extends any[]>(
  option: ResourceOptions<T, Args>
): EagerResource<T, Args> | LazyResource<T, Args> | void {


  const {
    action,
    mode = 'lazy',
    watch,
    debounce,
    onSuccess,
    onError,
    onLoading
  } = option;


  const data = ref<T | undefined>(undefined);
  const loading = ref(false);
  const error = ref<Error | null>(null);
  const status = ref<'idle' | 'loading' | 'success' | 'error'>('idle');
  const initialized = ref(false);

  const clear = () => {
    data.value = undefined;
    error.value = null;
    status.value = 'idle';
    loading.value = false;
    initialized.value = false;
  };




  const execute = async (...args: Args): Promise<T> => {
    if (loading.value) return data.value as T;

    loading.value = true;
    status.value = 'loading';
    onLoading?.();

    try {
      const result = await action(...args);
      data.value = result;
      error.value = null;
      status.value = 'success';
      initialized.value = true;
      onSuccess?.(result);
      return result;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      error.value = errorObj;
      status.value = 'error';
      onError?.(errorObj);
      throw errorObj;
    } finally {
      loading.value = false;
    }
  };







  if (mode === 'eager') {



  } else {

  }
}