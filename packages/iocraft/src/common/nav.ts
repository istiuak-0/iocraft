import type { RouteLocationNormalizedGeneric, Router } from 'vue-router';
import { Register } from '../core';

export interface Nav
  extends
    Omit<Router, 'install' | 'options' | 'currentRoute'>,
    Pick<
      RouteLocationNormalizedGeneric,
      'path' | 'name' | 'params' | 'query' | 'hash' | 'fullPath' | 'matched' | 'meta'
    > {}

@Register()
export class Nav {}
