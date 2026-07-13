import { inject, provide } from "vue";
import { createFacadeObj } from "./facade";
import { creationStack, RootRegistry } from "./internals";
import type { ServiceConstructor } from "./types";
import { getServiceMeta } from "./utils";

/**
 * obtain Facade of a global singleton service From Root Registry
 */
export function obtain<T extends ServiceConstructor>(serviceClass: T) {
  const serviceMeta = getServiceMeta(serviceClass);

  if (RootRegistry.has(serviceMeta.token)) {
    const instance = RootRegistry.get(serviceMeta.token)!;
    return createFacadeObj<InstanceType<T>>(instance);
  }

  if (creationStack.has(serviceMeta.token)) {
    throw new Error(
      `[IocRaft] Circular dependency detected on: ${serviceClass.name}\n`,
    );
  }

  creationStack.add(serviceMeta.token);

  try {
    const instance = new serviceClass();
    RootRegistry.set(serviceMeta.token, instance);
    return createFacadeObj<InstanceType<T>>(instance);
  } finally {
    creationStack.delete(serviceMeta.token);
  }
}


export namespace obtain {

  /**
   * obtain raw instance is a service from service registry
   */
  export function raw<T extends ServiceConstructor>(serviceClass: T) {
    const serviceMeta = getServiceMeta(serviceClass);

    if (RootRegistry.has(serviceMeta.token)) {
      return RootRegistry.get(serviceMeta.token) as InstanceType<T>;
    }

    if (creationStack.has(serviceMeta.token)) {
      throw new Error(
        `[IocRaft] Circular dependency detected on: ${serviceClass.name}\n`,
      );
    }

    creationStack.add(serviceMeta.token);

    try {
      const instance = new serviceClass();
      RootRegistry.set(serviceMeta.token, instance);
      return instance as InstanceType<T>;
    } finally {
      creationStack.delete(serviceMeta.token);
    }
  }

  /**
   * obtain a facade of a new Service Instance
   */
  export function instance<T extends ServiceConstructor>(serviceClass: T) {
    const serviceMeta = getServiceMeta(serviceClass);

    if (creationStack.has(serviceMeta.token)) {
      throw new Error(
        `[IocRaft] Circular dependency detected on: ${serviceClass.name}\n`,
      );
    }

    creationStack.add(serviceMeta.token);

    try {
      const instance = new serviceClass();
      return createFacadeObj<InstanceType<T>>(instance);
    } finally {
      creationStack.delete(serviceMeta.token);
    }
  }



  /**
   * obtain A Service From Context
   */
  export function exposed<T extends ServiceConstructor>(serviceClass: T) {
    const serviceMeta = getServiceMeta(serviceClass);
    return inject<InstanceType<T>>(serviceMeta.token);
  }



}

/**
 * Expose a service to context
 */
export function expose<T extends ServiceConstructor>(
  serviceInstance: InstanceType<T>,
) {
  const serviceMeta = getServiceMeta(serviceInstance);
  provide(serviceMeta.token, serviceInstance);
}