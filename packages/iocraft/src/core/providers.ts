import { SERVICE_METADATA, type ServiceConstructor, type ServiceMetadata, type ServiceOptions } from "./internals";

/**
 * Registers A Class as Service
 *
 * @export
 * @param {?ServiceOptions} [options]
 * @returns {<C extends ServiceConstructor>(constructor: C) => C}
 */
export function Provide(options?: ServiceOptions): <C extends ServiceConstructor>(constructor: C) => C {
  return function <C extends ServiceConstructor>(constructor: C) {
    if ((constructor as any)[SERVICE_METADATA]?.token) {
      return constructor;
    }

    (constructor as any)[SERVICE_METADATA] = {
      token: Symbol(`[IOCRAFT]: Service - ${constructor.name || 'Anonymous'}`),
      facade: options?.facade ?? true,
    } satisfies ServiceMetadata;

    return constructor;
  };
}

interface RegisterServiceOptions extends ServiceOptions {
  /** Override the default instance */
  instance?: object;
  /** Custom token instead of auto-generated */
  token?: symbol | string;
  /** Lifecycle hooks */
  onInit?: (instance: object) => void;
  onDispose?: (instance: object) => void;
}

/**
 * Manually register a service without decorator
 * Use case: Dynamic registration, third-party classes
 */
export function RegisterService<T extends ServiceConstructor>(
  serviceClass: T,
  options?: RegisterServiceOptions
) {}



/**
 * Register a factory function instead of a class
 * Use case: Complex initialization logic
 */
export function RegisterFactory<T>(
  token: symbol | string,
  factory: (container: unknown) => T,
  options?: FactoryOptions
) {}

interface FactoryOptions {
  singleton?: boolean;
  facade?: boolean;
}


export function RegisterValue<T>(
  token: symbol | string,
  value: T
){

}

export function RegisterModule(services: Array<{
  serviceClass: ServiceConstructor;
  options?: RegisterServiceOptions;
}>){



}