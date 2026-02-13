import { type Ref, type ComputedRef } from 'vue'

export interface ResourceOptions<
  T,
  Args extends any[] = any[]
> {
  action: (...args: Args) => Promise<T>;
  mode?: 'eager' | 'lazy';
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onLoading?: () => void;
  watch?: Array<Ref<any> | ComputedRef<any>>;
  debounce?: number;
}

type ResourceStatus = 'idle' | 'loading' | 'success' | 'error';


export interface ResourceBase<T> {
  data: Ref<T | undefined>;
  loading: Ref<boolean>;
  error: Ref<Error | null>;
  status: Ref<ResourceStatus>;
  initialized: Ref<boolean>;
  clear(): void;
}


export interface EagerResource<T, Args extends any[]> extends ResourceBase<T> {
  refetch(...args: Args): void;
}



export interface LazyResource<T, Args extends any[]>
  extends ResourceBase<T> {
  init(...args: Args): void;
  refetch(...args: Args): void;
  abort(): void;
}

