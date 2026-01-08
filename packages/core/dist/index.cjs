"use strict";
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ImplementsDispose: () => ImplementsDispose,
  Register: () => Register,
  SERVICE_INTERNAL_METADATA: () => SERVICE_INTERNAL_METADATA,
  exposeToChildren: () => exposeToChildren,
  getServiceRef: () => getServiceRef,
  resolve: () => resolve,
  resolveFromContext: () => resolveFromContext,
  resolveInstance: () => resolveInstance,
  serviceRefView: () => serviceRefView,
  serviceRegistry: () => serviceRegistry,
  vuediPlugin: () => vuediPlugin
});
module.exports = __toCommonJS(index_exports);

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
var import_vue2 = require("vue");

// src/libs/types.ts
function ImplementsDispose(instance) {
  return typeof instance.dispose === "function";
}

// src/libs/service-refs.ts
var import_vue = require("vue");
function serviceToRefs(service) {
  const rawService = (0, import_vue.toRaw)(service);
  const refs = {};
  for (const key in service) {
    const value = rawService[key];
    if (value.effect) {
      refs[key] = (0, import_vue.computed)({
        get: () => service[key],
        set: (newValue) => {
          service[key] = newValue;
        }
      });
    } else if ((0, import_vue.isRef)(value) || (0, import_vue.isReactive)(value)) {
      refs[key] = (0, import_vue.toRef)(service, key);
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

// src/libs/service-token.ts
function getServiceToken(target) {
  const ctor = typeof target === "function" ? target : target.constructor;
  const meta = ctor[SERVICE_INTERNAL_METADATA];
  if (!meta?.token) {
    throw new Error(`[VUE DI]: ${ctor?.name || "Unknown"} is not decorated with @Register()`);
  }
  return meta.token;
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
  const serviceToken = getServiceToken(instance);
  (0, import_vue2.provide)(serviceToken, refView);
  if (ownsInstance) {
    const componentInstance = (0, import_vue2.getCurrentInstance)();
    if (componentInstance) {
      (0, import_vue2.onScopeDispose)(() => {
        if (ImplementsDispose(instance)) {
          try {
            instance.dispose();
          } catch (error) {
            console.error("[VUE DI]: Error in scope dispose:", error);
          }
        }
        if (serviceRefView.has(instance)) {
          serviceRefView.delete(instance);
        }
      });
    }
  }
}

// src/functions/resolve.ts
function resolve(serviceClass) {
  const serviceToken = getServiceToken(serviceClass);
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
var import_vue3 = require("vue");
function resolveFromContext(serviceClass) {
  const serviceToken = getServiceToken(serviceClass);
  return (0, import_vue3.inject)(serviceToken);
}

// src/functions/resolve-instance.ts
var import_vue4 = require("vue");
function resolveInstance(serviceClass) {
  let instance = new serviceClass();
  const componentInstance = (0, import_vue4.getCurrentInstance)();
  if (componentInstance) {
    (0, import_vue4.onScopeDispose)(() => {
      if (ImplementsDispose(instance)) {
        try {
          instance.dispose();
        } catch (error) {
          console.error("[VUE DI]: Error in scope dispose:", error);
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
      const serviceToken = getServiceToken(item);
      const serviceInstance = serviceRegistry.has(serviceToken);
      if (!serviceInstance) {
        serviceRegistry.set(serviceToken, new item());
      }
    });
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
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
});
//# sourceMappingURL=index.cjs.map