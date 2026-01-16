import type { ServiceConstructor } from '../libs/utils';

export function exposeToChildren<T extends ServiceConstructor>(_classOrInstance: T | InstanceType<T>): void {
  // let instance: InstanceType<T>;
  // let ownsInstance = false;
  // if (typeof classOrInstance === 'function') {
  //   instance = new classOrInstance() as InstanceType<T>;
  //   ownsInstance = true;
  // } else {
  //   instance = classOrInstance;
  // }
  // const refView = getServiceRef(instance) as InstanceType<T>;
  // const serviceToken = getServiceToken(instance);
  // provide(serviceToken, refView);
  // if (ownsInstance) {
  //   const componentInstance = getCurrentInstance();
  //   if (componentInstance) {
  //     onScopeDispose(() => {
  //       if (ImplementsDispose(instance)) {
  //         try {
  //           (instance as ServiceWithDispose<T>).dispose();
  //         } catch (error) {
  //           console.error('[VUE DI]: Error in scope dispose:', error);
  //         }
  //       }
  //       if (serviceRefView.has(instance)) {
  //         serviceRefView.delete(instance);
  //       }
  //     });
  //   }
  // }
}
