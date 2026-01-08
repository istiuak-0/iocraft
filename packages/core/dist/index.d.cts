import { FunctionPlugin } from 'vue';

type ServiceConstructor<T extends object = object> = new () => T;
interface Disposable {
    dispose(): void;
}
declare function ImplementsDispose(instance: unknown): boolean;
type ServiceWithDispose<T> = T & {
    dispose(): void;
};
type ServiceMetadata = {
    token: symbol;
};

declare function Register(): <C extends ServiceConstructor>(constructor: C) => C;

declare function exposeToChildren<T extends ServiceConstructor>(classOrInstance: T | InstanceType<T>): void;

declare function resolve<T extends ServiceConstructor>(serviceClass: T): InstanceType<T>;

declare function resolveFromContext<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> | undefined;

declare function resolveInstance<T extends ServiceConstructor>(serviceClass: T): InstanceType<T>;

declare const SERVICE_INTERNAL_METADATA: unique symbol;
declare const serviceRegistry: Map<symbol, any>;
declare const serviceRefView: WeakMap<object, any>;

declare function getServiceRef<T extends InstanceType<ServiceConstructor>>(instance: T): T;

type VueDIOptions = {
    services: ServiceConstructor[];
};
declare const vuediPlugin: FunctionPlugin<[Partial<VueDIOptions>?]>;

export { type Disposable, ImplementsDispose, Register, SERVICE_INTERNAL_METADATA, type ServiceConstructor, type ServiceMetadata, type ServiceWithDispose, exposeToChildren, getServiceRef, resolve, resolveFromContext, resolveInstance, serviceRefView, serviceRegistry, vuediPlugin };
