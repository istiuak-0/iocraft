```ts

task<TParams, TData>({
  run: (params: TParams) => Promise<TData>,
  track?: () => any[],
  lazy?: boolean,  
  

  debounce?: number,
  throttle?: number,
  
  // Hooks
  onLoading?: (params: TParams) => void,
  onSuccess?: (data: TData, params: TParams) => void,
  onError?: (error: Error, params: TParams) => void,
  onFinally?: (params: TParams) => void,
  


  rollback?: (params: TParams, error: Error) => void,
})





{

  data: Ref<TData | null>,
  error: Ref<Error | null>,
  status: Ref<TaskStatus>,
  

  isLoading: ComputedRef<boolean>,
  isIdle: ComputedRef<boolean>,
  isSuccess: ComputedRef<boolean>,
  isError: ComputedRef<boolean>,
  
initialized: Ref<boolean>, // optional
  start: (params: TParams) => Promise<TData>,  
  run: (params: TParams) => Promise<TData>, 
  stop: () => void,     
  clear: () => void,  
}


```