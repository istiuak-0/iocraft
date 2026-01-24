import type { Router } from 'vue-router';
import { Service } from '../core';

export interface RouterService extends Router {}

@Service()
export class RouterService {}
