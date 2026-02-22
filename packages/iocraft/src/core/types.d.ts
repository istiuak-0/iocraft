import type { Router } from "vue-router";

// ============================================================================
// Service Types
// ============================================================================

/**
 * A constructor type for creating service instances.
 * Services are classes that can be injected and managed by the IoC container.
 *
 * @template T - The service type, must be an object
 *
 * @example
 * class UserService {
 *   getUser(id: string) { return { id, name: 'John' }; }
 * }
 * const service: ServiceConstructor<UserService> = UserService;
 */
export type ServiceConstructor<T extends object = object> = new () => T;

/**
 * Configuration options for initializing the plugin.
 * Used to set up the service container and routing integration.
 */
export interface PluginOptions {
  /**
   * Array of service constructors to eagerly load on startup.
   * These services will be instantiated immediately when the plugin is registered.
   */
  eagerLoad: ServiceConstructor[];

  /**
   * The Vue Router instance for routing integration.
   * Enables services to interact with the application's routing system.
   */
  router: Router;
}

/**
 * Metadata associated with a registered service.
 * Used internally by the IoC container for service resolution.
 */
export interface ServiceMetadata {
  /**
   * Unique identifier for the service.
   * Used as the injection token when resolving dependencies.
   */
  token: symbol;
}

// ============================================================================
// Vue Lifecycle Hook Interfaces
// ============================================================================
// These interfaces define optional lifecycle methods that services can implement.
// When a service implements any of these interfaces, the corresponding methods
// will be called at specific points in the component/service lifecycle.
// ============================================================================

// -----------------------------------------------------------------------------
// Standard Component Lifecycle Hooks
// -----------------------------------------------------------------------------

/**
 * Called after the instance has been mounted.
 * At this point, the DOM has been created and is accessible.
 */
export interface OnMounted {
  onMounted(): void;
}

/**
 * Called after the component's DOM has been updated due to reactive changes.
 */
export interface OnUpdated {
  onUpdated(): void;
}

/**
 * Called after the instance has been unmounted.
 * Use this for cleanup tasks like removing event listeners or canceling timers.
 */
export interface OnUnmounted {
  onUnmounted(): void;
}

// -----------------------------------------------------------------------------
// Before Hooks (Pre-Update/Unmount)
// -----------------------------------------------------------------------------

/**
 * Called before the instance is mounted.
 * Useful for initial setup that needs to happen before DOM creation.
 */
export interface OnBeforeMount {
  onBeforeMount(): void;
}

/**
 * Called before the component updates due to reactive changes.
 * Can be used to access the DOM before it's updated.
 */
export interface OnBeforeUpdate {
  onBeforeUpdate(): void;
}

/**
 * Called before the instance is unmounted.
 * Final opportunity to perform cleanup before destruction.
 */
export interface OnBeforeUnmount {
  onBeforeUnmount(): void;
}

// -----------------------------------------------------------------------------
// Error & Debugging Hooks
// -----------------------------------------------------------------------------

/**
 * Called when an error from any descendant component is captured.
 * Can be used for error logging or reporting.
 *
 * @returns void (can return boolean in Vue to control error propagation)
 */
export interface OnErrorCaptured {
  onErrorCaptured(): void;
}

/**
 * Called when a reactive dependency used during rendering is tracked.
 * Useful for debugging reactivity and understanding render dependencies.
 */
export interface OnRenderTracked {
  onRenderTracked(): void;
}

/**
 * Called when a reactive dependency used during rendering triggers an update.
 * Useful for debugging why a component re-rendered.
 */
export interface OnRenderTriggered {
  onRenderTriggered(): void;
}

// -----------------------------------------------------------------------------
// Keep-Alive Hooks
// -----------------------------------------------------------------------------

/**
 * Called when a component wrapped in `<KeepAlive>` is activated.
 * Useful for resuming paused operations or refreshing data.
 */
export interface OnActivated {
  onActivated(): void;
}

/**
 * Called when a component wrapped in `<KeepAlive>` is deactivated.
 * Useful for pausing operations or caching state.
 */
export interface OnDeactivated {
  onDeactivated(): void;
}

// -----------------------------------------------------------------------------
// Server-Side Rendering (SSR) Hooks
// -----------------------------------------------------------------------------

/**
 * Called during server-side rendering before the component is rendered.
 * Useful for fetching data that's needed before rendering on the server.
 */
export interface OnServerPrefetch {
  onServerPrefetch(): void;
}

// -----------------------------------------------------------------------------
// Composition API & Plugin Hooks
// -----------------------------------------------------------------------------

/**
 * Called when the component's scope is disposed.
 * Used for cleaning up effects created with the Composition API.
 */
export interface OnScopeDispose {
  onScopeDispose(): void;
}

// -----------------------------------------------------------------------------
// IoCraft-Specific Hooks
// -----------------------------------------------------------------------------

/**
 * Called when a service is unregistered from the container.
 * Use this for cleanup specific to the IoC container, such as:
 * - Deregistering from event buses
 * - Clearing cached references
 * - Releasing resources held by the container
 */
export interface OnUnRegister {
  onUnRegister(): void;
}