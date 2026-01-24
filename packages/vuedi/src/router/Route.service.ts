import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';

export class RouteService {
  constructor(private _route: RouteLocationNormalizedLoadedGeneric) {
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) {
          return (target as any)[prop];
        }

        const val = (target._route as any)[prop];

        if (typeof val === 'function') {
          return val.bind(target._route);
        }

        return val;
      },
    });
  }
}
