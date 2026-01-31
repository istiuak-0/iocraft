import type { RouteLocationNormalizedGeneric, Router } from 'vue-router';
import { Provide } from '../core';

export interface Nav
  extends
    Omit<Router, 'install' | 'options' | 'currentRoute'>,
    Pick<
      RouteLocationNormalizedGeneric,
      'path' | 'name' | 'params' | 'query' | 'hash' | 'fullPath' | 'matched' | 'meta'
    > {}

@Provide({
  facade: false,
})
export class Nav {}
