import type { RouteLocationNormalizedGeneric, Router } from 'vue-router';

export class RouterService {
  constructor(private _router: Router) {
    return new Proxy(this, {
      get(target, prop) {
        if (prop in target) {
          return (target as any)[prop];
        }

        const val = (target._router as any)[prop];

        if (typeof val === 'function') {
          return val.bind(target._router);
        }

        return val;
      },
    });
  }
}

export class RouteService {
  constructor(private _route: RouteLocationNormalizedGeneric) {
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
