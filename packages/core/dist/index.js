"use strict";

// src/libs/registry.ts
var SERVICE_INTERNAL_METADATA = /* @__PURE__ */ Symbol("VUEDI_SERVICE_METADATA");
var serviceRegistry = /* @__PURE__ */ new Map();
var serviceRefView = /* @__PURE__ */ new WeakMap();

// src/decorators/register.ts
function Register() {
  return function(constructor) {
    if (constructor[SERVICE_INTERNAL_METADATA]?.token) {
      return constructor;
    }
    const token = /* @__PURE__ */ Symbol(`vuedi:service:${constructor.name || "Anonymous"}`);
    constructor[SERVICE_INTERNAL_METADATA] = { token };
    return constructor;
  };
}

// src/functions/expose-children.ts
import { getCurrentInstance, onScopeDispose, provide } from "vue";

// src/libs/types.ts
function ImplementsDispose(instance) {
  return typeof instance.dispose === "function";
}

// src/libs/service-refs.ts
import { computed, isReactive, isRef, toRaw, toRef } from "vue";
function serviceToRefs(service) {
  const rawService = toRaw(service);
  const refs = {};
  for (const key in service) {
    const value = rawService[key];
    if (value.effect) {
      refs[key] = computed({
        get: () => service[key],
        set: (newValue) => {
          service[key] = newValue;
        }
      });
    } else if (isRef(value) || isReactive(value)) {
      refs[key] = toRef(service, key);
    }
  }
  return refs;
}
function getServiceRef(instance) {
  const cached = serviceRefView.get(instance);
  if (cached) return cached;
  const refs = serviceToRefs(instance);
  serviceRefView.set(instance, refs);
  return refs;
}

// src/functions/expose-children.ts
function exposeToChildren(classOrInstance) {
  let instance;
  let ownsInstance = false;
  if (typeof classOrInstance === "function") {
    instance = new classOrInstance();
    ownsInstance = true;
  } else {
    instance = classOrInstance;
  }
  const refView = getServiceRef(instance);
  provide(instance.constructor, refView);
  if (ownsInstance) {
    const componentInstance = getCurrentInstance();
    if (componentInstance) {
      onScopeDispose(() => {
        if (ImplementsDispose(instance)) {
          try {
            instance.dispose();
          } catch (error) {
            console.error("Error in context service onUnmounted:", error);
          }
        }
        if (serviceRefView.has(instance)) {
          serviceRefView.delete(instance);
        }
        instance = null;
      });
    }
  }
}

// src/functions/resolve.ts
function resolve(serviceClass) {
  const config = serviceClass[SERVICE_INTERNAL_METADATA];
  if (!config) {
    throw new Error("[VUE DI]: No Config Meta date Found, Make Sure To Use @Register() Service Classes");
  }
  const serviceToken = config.token;
  let instance;
  if (serviceRegistry.has(serviceToken)) {
    instance = serviceRegistry.get(serviceToken);
  } else {
    instance = new serviceClass();
    serviceRegistry.set(serviceToken, instance);
  }
  return getServiceRef(instance);
}

// src/functions/resolve-context.ts
import { inject } from "vue";
function resolveFromContext(serviceClass) {
  return inject(serviceClass.name);
}

// src/functions/resolve-instance.ts
import { getCurrentInstance as getCurrentInstance2, onScopeDispose as onScopeDispose2 } from "vue";
function resolveInstance(serviceClass) {
  let instance = new serviceClass();
  const componentInstance = getCurrentInstance2();
  if (componentInstance) {
    onScopeDispose2(() => {
      if (ImplementsDispose(instance)) {
        try {
          instance.dispose();
        } catch (error) {
          console.error("Error in scope dispose:", error);
        }
      }
      if (serviceRefView.has(instance)) {
        serviceRefView.delete(instance);
      }
    });
  }
  return getServiceRef(instance);
}

// src/plugin/vuedi.plugin.ts
var vuediPlugin = (_app, options) => {
  if (options?.services) {
    options.services.forEach((item) => {
      const serviceInstance = serviceRegistry.has(item);
      if (!serviceInstance) {
        serviceRegistry.set(item, new item());
      }
    });
  }
};
export {
  ImplementsDispose,
  Register,
  SERVICE_INTERNAL_METADATA,
  exposeToChildren,
  getServiceRef,
  resolve,
  resolveFromContext,
  resolveInstance,
  serviceRefView,
  serviceRegistry,
  vuediPlugin
};
//# sourceMappingURL=index.js.map