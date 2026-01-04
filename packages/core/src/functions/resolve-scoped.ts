import type { ServiceConstructor } from '../libs/types';
import { resolve } from './resolve';
import { resolveFromContext } from './resolve-context';

export function resolveScoped<T extends ServiceConstructor>(serviceClass: T): InstanceType<T> {
  return resolveFromContext(serviceClass) ?? resolve(serviceClass);
}
