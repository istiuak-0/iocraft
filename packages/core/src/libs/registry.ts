import type { ServiceConstructor } from './types';

export const SERVICE_INTERNAL_METADATA = Symbol('VUEDI_SERVICE_METADATA');
export const serviceRegistry = new Map<symbol, any>();
export const serviceRefView = new WeakMap<InstanceType<ServiceConstructor>, any>();
