import type { RouteLocationNormalizedGeneric, Router } from "vue-router";
import { attach } from "../core";

export interface Nav
  extends
    Omit<Router, "install" | "options" | "currentRoute">,
    Pick<RouteLocationNormalizedGeneric, "path" | "name" | "params" | "query" | "hash" | "fullPath" | "matched" | "meta"> {}

@attach()
export class Nav {}

export class RouterFacade {
  constructor(private router: Router) {}

  get path() {
    return this.router.currentRoute.value.path;
  }
  get name() {
    return this.router.currentRoute.value.name;
  }
  get params() {
    return this.router.currentRoute.value.params;
  }
  get query() {
    return this.router.currentRoute.value.query;
  }
  get hash() {
    return this.router.currentRoute.value.hash;
  }
  get fullPath() {
    return this.router.currentRoute.value.fullPath;
  }
  get matched() {
    return this.router.currentRoute.value.matched;
  }
  get meta() {
    return this.router.currentRoute.value.meta;
  }
  get redirectedFrom() {
    return this.router.currentRoute.value.redirectedFrom;
  }

  get currentRoute() {
    return this.router.currentRoute;
  }
  get options() {
    return this.router.options;
  }

  get listening() {
    return this.router.listening;
  }
  set listening(value: boolean) {
    this.router.listening = value;
  }

  push(...args: Parameters<Router["push"]>) {
    return this.router.push(...args);
  }
  replace(...args: Parameters<Router["replace"]>) {
    return this.router.replace(...args);
  }
  go(delta: number) {
    return this.router.go(delta);
  }
  back() {
    return this.router.back();
  }
  forward() {
    return this.router.forward();
  }

  resolve(...args: Parameters<Router["resolve"]>) {
    return this.router.resolve(...args);
  }

  getRoutes() {
    return this.router.getRoutes();
  }
  hasRoute(...args: Parameters<Router["hasRoute"]>) {
    return this.router.hasRoute(...args);
  }
  addRoute(...args: Parameters<Router["addRoute"]>) {
    return this.router.addRoute(...args);
  }
  removeRoute(...args: Parameters<Router["removeRoute"]>) {
    return this.router.removeRoute(...args);
  }
  clearRoutes() {
    return this.router.clearRoutes();
  }

  beforeEach(...args: Parameters<Router["beforeEach"]>) {
    return this.router.beforeEach(...args);
  }
  beforeResolve(...args: Parameters<Router["beforeResolve"]>) {
    return this.router.beforeResolve(...args);
  }
  afterEach(...args: Parameters<Router["afterEach"]>) {
    return this.router.afterEach(...args);
  }
  onError(...args: Parameters<Router["onError"]>) {
    return this.router.onError(...args);
  }

  isReady() {
    return this.router.isReady();
  }
}
