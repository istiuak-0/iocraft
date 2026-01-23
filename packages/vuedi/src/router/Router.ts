

export class Router {
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
} as Router & VueRouter

export class Route {}
