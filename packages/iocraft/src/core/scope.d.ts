/**
 * Create a child container with isolated scope
 * Use case: Multi-tenant apps, test isolation, feature modules
 */
export function CreateScope(name?: string): Container

/**
 * Container class for scoped DI
 */
export class Container {
  readonly name: string;
  readonly parent?: Container;

  // All injection methods work on this scope
  inject<T extends ServiceConstructor>(serviceClass: T): InstanceType<T>
  injectInstance<T extends ServiceConstructor>(serviceClass: T): InstanceType<T>
  
  // Registration
  register<T extends ServiceConstructor>(
    serviceClass: T,
    options?: RegisterServiceOptions
  ): void
  
  // Query
  has(serviceClass: ServiceConstructor): boolean
  has(token: symbol | string): boolean
  
  // Lifecycle
  dispose(): void
  clear(): void
  
  // Create child scope
  createChild(name?: string): Container
}

/**
 * Get the current container scope
 * Use case: Access container in service constructors
 */
export function GetCurrentContainer(): Container




/**
 * Inject without facade, always returns original instance
 * Use case: Performance-critical code, when you need the real object
 */
export function InjectRaw<T extends ServiceConstructor>(
  serviceClass: T
): InstanceType<T>

/**
 * Direct registry access (advanced users only)
 * Use case: Framework extensions, advanced patterns
 */
export function GetRegistry(scope?: 'root' | 'temp'): ReadonlyMap<symbol, object>

/**
 * Inject by token instead of class
 * Use case: Dynamic injection, token-based DI
 */
export function InjectByToken<T = any>(token: symbol | string): T | undefined


/**
 * Mark dependencies to be injected in constructor
 * Use case: Constructor injection pattern
 */
export function Injectable(): ClassDecorator

/**
 * Auto-inject dependencies as class properties
 * Use case: Property injection pattern
 */
export function InjectProp(serviceClass?: ServiceConstructor): PropertyDecorator

/**
 * Lazy-inject (only create when accessed)
 * Use case: Circular dependencies, performance
 */
export function InjectLazy(serviceClass: ServiceConstructor): PropertyDecorator

/**
 * Mark a method to be called after all dependencies are injected
 */
export function PostConstruct(): MethodDecorator

/**
 * Mark a method to be called before service disposal
 */
export function PreDestroy(): MethodDecorator


/**
 * Enhanced plugin options
 */
export interface PluginOptions {
  /** Vue Router instance for Nav service */
  router?: Router;
  
  /** Services to eagerly instantiate */
  eagerLoad?: ServiceConstructor[];
  
  /** Enable development mode features */
  devMode?: boolean;
  
  /** Custom error handler */
  onError?: (error: Error, context: string) => void;
  
  /** Enable/disable facade by default */
  defaultFacade?: boolean;
  
  /** Custom logger */
  logger?: Logger;
  
  /** Strict mode: throw on missing services */
  strict?: boolean;
}

/**
 * Configure global options after plugin installation
 */
export function ConfigureIocRaft(options: Partial<PluginOptions>): void

/**
 * Get current configuration
 */
export function GetConfig(): Readonly<PluginOptions>



/**
 * Create a test container isolated from global state
 */
export function CreateTestContainer(): Container

/**
 * Mock a service for testing
 */
export function MockService<T extends ServiceConstructor>(
  serviceClass: T,
  mockInstance: Partial<InstanceType<T>>
): () => void // Returns cleanup function

/**
 * Spy on service instantiation
 */
export function SpyOnService(
  serviceClass: ServiceConstructor,
  callback: (instance: object) => void
): () => void // Returns cleanup function

/**
 * Reset all services to initial state
 */
export function ResetForTesting(): void



/**
 * Enable Vue DevTools integration
 */
export function EnableDevTools(): void

/**
 * Get dependency graph for visualization
 */
export function GetDependencyGraph(): DependencyGraph

interface DependencyGraph {
  nodes: Array<{
    id: string;
    name: string;
    type: 'service' | 'value' | 'factory';
    instantiated: boolean;
  }>;
  edges: Array<{
    from: string;
    to: string;
    type: 'depends' | 'provides';
  }>;
}


/**
 * Register multiple services at once
 * Use case: Bulk registration, feature setup
 */
export function RegisterMany(services: Array<{
  serviceClass: ServiceConstructor;
  options?: RegisterServiceOptions;
}>): void


interface RegisterServiceOptions extends ServiceOptions {
  /** Override the default instance */
  instance?: object;
  /** Custom token instead of auto-generated */
  token?: symbol | string;
  /** Lifecycle hooks */
  onInit?: (instance: object) => void;
  onDispose?: (instance: object) => void;
}

/**
 * Manually register a service without decorator
 * Use case: Dynamic registration, third-party classes
 */
export function RegisterService<T extends ServiceConstructor>(
  serviceClass: T,
  options?: RegisterServiceOptions
) {}



/**
 * Register a factory function instead of a class
 * Use case: Complex initialization logic
 */
export function RegisterFactory<T>(
  token: symbol | string,
  factory: (container: unknown) => T,
  options?: FactoryOptions
) {}

interface FactoryOptions {
  singleton?: boolean;
  facade?: boolean;
}


export function RegisterValue<T>(
  token: symbol | string,
  value: T
){

}

export function RegisterModule(services: Array<{
  serviceClass: ServiceConstructor;
  options?: RegisterServiceOptions;
}>){



}