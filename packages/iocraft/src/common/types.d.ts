import type { ComputedRef, Ref } from "vue";

// ============================================================================
// Task System Types
// ============================================================================
// Core type definitions for the reactive task management system.
// These types power the Task class used for async operations with
// built-in retry, debounce, cancellation, and lifecycle support.
// ============================================================================

// ============================================================================
// Core Type Aliases
// ============================================================================

/**
 * Represents the current state of a task in its lifecycle.
 *
 * - `idle`: Task has not started or has been reset
 * - `loading`: Task is currently executing
 * - `success`: Task completed successfully
 * - `error`: Task failed with an error
 */
export type TaskStatus = "idle" | "loading" | "success" | "error";

/**
 * A generic async function type.
 * Represents any function that returns a Promise.
 *
 * @example
 * const fetchUser: AsyncFn = async (id: string) => { ... }
 */
export type AsyncFn = (...args: unknown[]) => Promise<unknown>;

/**
 * The result tuple returned by task execution.
 * Contains either a result or an error, never both.
 *
 * @template TFn - The async function type
 * @returns A tuple of [data | undefined, error | undefined]
 *
 * @example
 * const [data, error] = await task.run();
 * if (error) { /* handle error *\/ }
 * if (data) { /* use data *\/ }
 */
export type TaskResult<TFn extends AsyncFn> = [
  Awaited<ReturnType<TFn>> | undefined,
  Error | undefined
];

/**
 * Primitive types that can be used as keys.
 * Used for identifying and tracking abortable operations.
 */
export type Primitives = string | number | symbol;

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Retry configuration for handling failed task executions.
 *
 * @example
 * // Simple retry with fixed delay
 * retry: { count: 3, delay: 1000 }
 *
 * @example
 * // Retry with exponential backoff
 * retry: { count: 5, delay: 500, backoff: true }
 */
export interface RetryConfig {
  /**
   * Number of retry attempts after the initial failure.
   * Total attempts = count + 1
   */
  count: number;

  /**
   * Delay in milliseconds between retry attempts.
   * If omitted, retries happen immediately.
   */
  delay?: number;

  /**
   * Enables exponential backoff.
   * When true, delay doubles with each attempt: delay * 2^(attempt-1)
   *
   * @default false
   */
  backoff?: boolean;
}

/**
 * Configuration options for creating and managing a Task.
 *
 * @template TFn - The async function type being managed
 *
 * @example
 * const task = new Task({
 *   key: abortable('fetch-user'),
 *   fn: async (id: string) => fetch(`/api/users/${id}`),
 *   retry: { count: 3, delay: 1000, backoff: true },
 *   debounce: 300,
 *   onSuccess: (data) => console.log('Loaded:', data),
 * });
 */
export interface TaskOptions<TFn extends AsyncFn> {
  // --------------------------------------------------------------------------
  // Core Configuration
  // --------------------------------------------------------------------------

  /**
   * Unique identifier for the task.
   * Required for cancellation via stop() and abortable().
   *
   * @see abortable
   */
  key?: Primitives;

  /**
   * The async function to execute.
   * This is the core operation that the Task will manage.
   */
  fn: TFn;

  // --------------------------------------------------------------------------
  // Execution Control
  // --------------------------------------------------------------------------

  /**
   * If true, delays execution until dependencies are tracked.
   * When false (default), runs immediately on creation if `track` is provided.
   *
   * @default false
   */
  lazy?: boolean;

  /**
   * Debounce delay in milliseconds.
   * When set, rapid calls are batched and only the last one executes.
   * Useful for search inputs or resize handlers.
   *
   * @example
   * debounce: 300 // Wait 300ms after last call before executing
   */
  debounce?: number;

  /**
   * Retry configuration for handling failures.
   * If omitted, the task runs only once with no retries.
   */
  retry?: RetryConfig;

  /**
   * Timeout in milliseconds for the async operation.
   * If the operation exceeds this duration, it will be aborted.
   */
  timeout: number;

  /**
   * Polling interval in milliseconds.
   * When set, the task will automatically re-execute at this interval.
   * Set to 0 or omit to disable polling.
   */
  polling: number;

  /**
   * Reactive dependency tracking function.
   * Returns an array of parameters to watch for changes.
   * When dependencies change, the task automatically re-runs.
   *
   * @example
   * track: () => [userId.value, includeDetails.value]
   */
  track?: () => Parameters<TFn>;

  // --------------------------------------------------------------------------
  // Lifecycle Callbacks
  // --------------------------------------------------------------------------

  /**
   * Called when the task starts loading.
   * Useful for triggering UI loading states.
   */
  onLoading?: () => void;

  /**
   * Called when the task completes successfully.
   *
   * @param data - The resolved data from the async function
   */
  onSuccess?: (data: Awaited<ReturnType<TFn>>) => void;

  /**
   * Called when the task fails with an error.
   *
   * @param error - The error that caused the failure
   */
  onError?: (error: Error) => void;

  /**
   * Called after every execution, regardless of success or failure.
   * Useful for cleanup or logging.
   *
   * @param result - Object containing the final data or error
   */
  onFinally?: (result: {
    data?: Awaited<ReturnType<TFn>>;
    error?: Error;
  }) => void;
}

// ============================================================================
// Return Type Interfaces
// ============================================================================

/**
 * The public API returned by task creation utilities.
 * Provides reactive state and control methods for managing async operations.
 *
 * @template TFn - The async function type
 *
 * @example
 * const { data, error, isLoading, run } = useTask({ ... });
 *
 * // In template:
 * // {{ isLoading.value ? 'Loading...' : data.value }}
 */
export interface TaskReturn<TFn extends AsyncFn> {
  // --------------------------------------------------------------------------
  // Reactive State
  // --------------------------------------------------------------------------

  /**
   * Holds the result of the last successful execution.
   * Undefined until the first successful completion.
   */
  data: Ref<Awaited<ReturnType<TFn>> | undefined>;

  /**
   * Holds the error from the last failed execution.
   * Undefined if no error has occurred.
   */
  error: Ref<Error | undefined>;

  /**
   * Current status of the task.
   * One of: 'idle' | 'loading' | 'success' | 'error'
   */
  status: Ref<TaskStatus>;

  /**
   * Computed flag indicating if the task is currently loading.
   */
  isLoading: ComputedRef<boolean>;

  /**
   * Computed flag indicating if the task is idle.
   */
  isIdle: ComputedRef<boolean>;

  /**
   * Computed flag indicating if the task completed successfully.
   */
  isSuccess: ComputedRef<boolean>;

  /**
   * Computed flag indicating if the task failed with an error.
   */
  isError: ComputedRef<boolean>;

  /**
   * Tracks whether the task has been initialized (started at least once).
   */
  initialized: Ref<boolean>;

  // --------------------------------------------------------------------------
  // Control Methods
  // --------------------------------------------------------------------------

  /**
   * Starts the task if not initialized, otherwise returns cached result.
   *
   * @param args - Arguments to pass to the async function
   * @returns Promise resolving to the task result
   */
  start: (...args: Parameters<TFn>) => Promise<TaskResult<TFn>>;

  /**
   * Executes the task with debounce support.
   *
   * @param args - Arguments to pass to the async function
   * @returns Promise resolving to the task result
   */
  run: (...args: Parameters<TFn>) => Promise<TaskResult<TFn>>;

  /**
   * Stops the task and aborts any in-flight request.
   * Requires a key to be configured.
   */
  stop: () => void;

  /**
   * Clears data and error, resetting to idle state.
   */
  clear: () => void;

  /**
   * Resets the task to its initial state, including the initialized flag.
   */
  reset: () => void;

  /**
   * Fully disposes the task, cleaning up all resources.
   * Task should not be used after calling this.
   */
  dispose: () => void;
}