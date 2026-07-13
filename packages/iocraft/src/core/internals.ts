export const SERVICE_METADATA = Symbol("IOCRAFT_SERVICE_METADATA");
export const RootRegistry = new Map<symbol, object>();
export const creationStack = new Set<symbol>();