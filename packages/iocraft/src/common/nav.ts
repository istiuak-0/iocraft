import type { RouteLocationNormalizedGeneric, Router } from "vue-router";
import { attach } from "../core";

export interface Nav
  extends
    Omit<Router, "install" | "options" | "currentRoute">,
    Pick<RouteLocationNormalizedGeneric, "path" | "name" | "params" | "query" | "hash" | "fullPath" | "matched" | "meta"> {}

@attach()
export class Nav {}
