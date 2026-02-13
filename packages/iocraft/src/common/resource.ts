import { type ComputedRef, type Ref } from "vue";

export interface ResourceOptions<
  T,
  Args extends any[] = any[]
> {
  action: (...args: Args) => Promise<T>;
  mode?: 'eager' | 'lazy';
  watch?: Array<Ref<any> | ComputedRef<any>>;
  debounce?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  onLoading?: () => void;
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


export interface EagerResource<T> extends ResourceBase<T> {
  refetch(): Promise<T>;
}



export interface LazyResource<T, Args extends any[]>
  extends ResourceBase<T> {
  init(...args: Args): Promise<T>;
  refetch(...args: Args): Promise<T>;
}





// export function defineResource<T = any>(option: ResourceOptions<T>): Resource<T> {

//   const responseResource = {

//     get data() {
//       return ref(undefined);
//     },
//     get loading() {
//       return ref(false)
//     },
//     get error() {
//       return ref(null)
//     },
//     get status() {
//       return ref<'idle' | 'loading' | 'success' | 'error'>('idle');
//     },
//     clear: () => { },
//     exec: () => { },
//     reExec: () => { }

//   }



//   if (option.track) {
//     watch(option.track, () => {

//       option.call().then(data => {
//         responseResource.data.value = data as any;
//         responseResource.loading.value = true;



//       })



//     })
//   }



//   return responseResource;



// }