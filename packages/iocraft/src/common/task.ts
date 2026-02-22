import { computed, ref, watch } from "vue";
import type { AsyncFn, Primitives, TaskOptions, TaskResult, TaskStatus } from "./types";

// ============================================================================
// Type Imports
// ============================================================================

// Note: Types are imported from '../common/types.d.ts'
// - TaskStatus: 'idle' | 'loading' | 'success' | 'error'
// - AsyncFn: (...args: unknown[]) => Promise<unknown>
// - TaskResult<TFn>: [data | undefined, error | undefined]
// - Primitives: string | number | symbol
// - TaskOptions<TFn>: Configuration options for Task
// ============================================================================

// ============================================================================
// AbortController Registry
// ============================================================================

/**
 * Global registry for tracking AbortControllers by key.
 * Used to manage cancellation of in-flight async operations.
 */
const controllerRegistry = new Map<Primitives, AbortController>();

/**
 * Creates or updates an AbortController for a given key.
 * Automatically aborts any existing controller with the same key.
 *
 * @param key - Unique identifier for the abortable operation
 * @returns A new AbortController instance
 *
 * @example
 * const controller = abortable('fetch-user-data');
 * fetch('/api/user', { signal: controller.signal });
 */
export function abortable(key: Primitives): AbortController {
  // Clean up existing controller if present
  if (controllerRegistry.has(key)) {
    controllerRegistry.delete(key);
  }

  const controller = new AbortController();
  controllerRegistry.set(key, controller);
  return controller;
}

// ============================================================================
// Task Class
// ============================================================================

/**
 * A reactive task manager for handling async operations with built-in support for:
 * - Loading/Error/Success states
 * - Retry logic with exponential backoff
 * - Debouncing
 * - Auto-cancellation of stale requests
 * - Lifecycle callbacks
 * - Reactive dependency tracking
 *
 * @template TFn - The async function type signature
 *
 * @example
 * const fetchUser = new Task({
 *   key: 'user',
 *   fn: async (id: string) => {
 *     const res = await fetch(`/api/users/${id}`, { signal: abortable('user') });
 *     return res.json();
 *   },
 *   retry: { count: 3, delay: 1000, backoff: true },
 *   onSuccess: (data) => console.log('User loaded:', data),
 * });
 *
 * await fetchUser.run('123');
 * console.log(fetchUser.data.value); // User data
 */
export class Task<TFn extends AsyncFn> {
  // ==========================================================================
  // Public Reactive State
  // ==========================================================================

  /**
   * Holds the result of the last successful execution.
   * Undefined if no successful execution has occurred.
   */
  readonly data = ref<Awaited<ReturnType<TFn>> | undefined>();

  /**
   * Holds the error from the last failed execution.
   * Undefined if no error has occurred.
   */
  readonly error = ref<Error | undefined>();

  /**
   * Current status of the task.
   * One of: 'idle' | 'loading' | 'success' | 'error'
   */
  readonly status = ref<TaskStatus>("idle");

  /**
   * Computed flag indicating if the task is currently loading.
   */
  readonly isLoading = computed(() => this.status.value === "loading");

  /**
   * Computed flag indicating if the task is idle (not started or reset).
   */
  readonly isIdle = computed(() => this.status.value === "idle");

  /**
   * Computed flag indicating if the task ended with an error.
   */
  readonly isError = computed(() => this.status.value === "error");

  /**
   * Computed flag indicating if the task completed successfully.
   */
  readonly isSuccess = computed(() => this.status.value === "success");

  /**
   * Tracks whether the task has been initialized (started at least once).
   */
  readonly initialized = ref(false);

  // ==========================================================================
  // Private State
  // ==========================================================================

  /**
   * Monotonically increasing counter to track the latest execution.
   * Used to ignore stale async results from superseded calls.
   */
  private currentExecutionId = 0;

  /**
   * Timer ID for debouncing. Used to cancel pending debounced executions.
   */
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;

  /**
   * Cleanup function returned by watch() for reactive dependency tracking.
   */
  private stopWatch: (() => void) | undefined;

  // ==========================================================================
  // Constructor
  // ==========================================================================

  /**
   * Creates a new Task instance.
   *
   * @param options - Configuration options including the async function, retry settings, callbacks, etc.
   */
  constructor(private readonly options: TaskOptions<TFn>) {
    this.setupTracking();
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Sets up reactive dependency tracking if the `track` option is provided.
   * Automatically re-runs the task when tracked dependencies change.
   */
  private setupTracking(): void {
    const { track, lazy } = this.options;

    if (!track) {
      return;
    }

    // Watch for changes in tracked dependencies
    this.stopWatch = watch(track, (newArgs) => this.run(...newArgs), {
      immediate: !lazy, // Run immediately unless lazy mode is enabled
    });
  }

  /**
   * Creates a promise that resolves after the specified delay.
   *
   * @param ms - Delay in milliseconds
   * @returns A promise that resolves after the delay
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Aborts any previous in-flight request associated with the task's key.
   * Prevents race conditions from outdated requests.
   */
  private abortPrevious(): void {
    if (this.options.key) {
      controllerRegistry.get(this.options.key)?.abort();
    }
  }

  /**
   * Calculates the retry delay based on the attempt number.
   * Supports exponential backoff if configured.
   *
   * @param attempt - The current attempt number (1-indexed)
   * @returns The delay in milliseconds, or null if no retry should occur
   */
  private getRetryDelay(attempt: number): number | null {
    const { retry } = this.options;

    // No retry configured or no delay specified
    if (!retry?.delay || attempt <= 0) {
      return null;
    }

    // Fixed delay (no backoff)
    if (!retry.backoff) {
      return retry.delay;
    }

    // Exponential backoff: delay * 2^(attempt - 1)
    return retry.delay * 2 ** (attempt - 1);
  }

  /**
   * Executes the async function with retry logic.
   * Retries on failure up to the configured number of attempts.
   *
   * @param args - Arguments to pass to the async function
   * @returns A tuple of [result, error] - one will be undefined
   */
  private async attemptWithRetry(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    const maxAttempts = this.options.retry ? this.options.retry.count + 1 : 1;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Apply delay before retry (not before first attempt)
      if (attempt > 0 && this.options.retry?.delay) {
        const delay = this.getRetryDelay(attempt);
        if (delay !== null) {
          await this.sleep(delay);
        }
      }

      try {
        const result = (await this.options.fn(...args)) as Awaited<ReturnType<TFn>>;
        return [result, undefined];
      } catch (e) {
        // Ignore abort errors - they're expected during cancellation
        if (e instanceof DOMException && e.name === "AbortError") {
          return [undefined, undefined];
        }

        // Normalize error type
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }

    // All attempts exhausted, return the last error
    return [undefined, lastError];
  }

  /**
   * Core execution logic for the task.
   * Handles state updates, lifecycle callbacks, and stale result filtering.
   *
   * @param args - Arguments to pass to the async function
   * @returns A tuple of [result, error] - one will be undefined
   */
  private async execute(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    // Capture execution ID to detect stale calls
    const executionId = ++this.currentExecutionId;

    // Abort any previous in-flight request
    this.abortPrevious();

    try {
      // Update state for loading
      this.status.value = "loading";
      this.error.value = undefined;
      this.options.onLoading?.();

      // Execute with retry logic
      const [result, retryError] = await this.attemptWithRetry(...args);

      // Ignore results from stale executions
      if (executionId !== this.currentExecutionId) {
        return [undefined, undefined];
      }

      // Handle error case
      if (retryError) {
        this.error.value = retryError;
        this.status.value = "error";
        this.options.onError?.(retryError);
        return [undefined, retryError];
      }

      // Handle success case
      this.data.value = result;
      this.status.value = "success";
      this.options.onSuccess?.(result!);
      return [result, undefined];
    } finally {
      // Always call onFinally if this is still the latest execution
      if (executionId === this.currentExecutionId) {
        this.options.onFinally?.({
          data: this.data.value,
          error: this.error.value,
        });
      }
    }
  }

  // ==========================================================================
  // Public Methods - Execution
  // ==========================================================================

  /**
   * Runs the task with debouncing support.
   * If debounce is configured, delays execution until no new calls occur within the debounce window.
   *
   * @param args - Arguments to pass to the async function
   * @returns A promise resolving to the task result
   */
  async run(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    if (this.options.debounce) {
      return new Promise((resolve) => {
        // Cancel any pending debounced call
        clearTimeout(this.debounceTimer);

        // Schedule new debounced execution
        this.debounceTimer = setTimeout(() => resolve(this.execute(...args)), this.options.debounce);
      });
    }

    return this.execute(...args);
  }

  /**
   * Starts the task if it hasn't been initialized yet.
   * Subsequent calls return cached results without re-executing.
   *
   * @param args - Arguments to pass to the async function
   * @returns A promise resolving to the task result
   */
  async start(...args: Parameters<TFn>): Promise<TaskResult<TFn>> {
    if (this.initialized.value) {
      return [this.data.value, this.error.value];
    }

    this.initialized.value = true;
    return this.execute(...args);
  }

  // ==========================================================================
  // Public Methods - Lifecycle Management
  // ==========================================================================

  /**
   * Stops the current task execution and aborts any in-flight request.
   * Requires a key to be set via abortable().
   *
   * @remarks
   * If no key is configured, a warning is logged and the method returns early.
   */
  stop(): void {
    if (!this.options.key) {
      console.warn("[Task] stop() requires a key — use abortable() to register one");
      return;
    }

    controllerRegistry.get(this.options.key)?.abort();
    controllerRegistry.delete(this.options.key);
    this.status.value = "idle";
    this.currentExecutionId++;
  }

  /**
   * Clears the task's data and error, resetting to idle state.
   * Does not affect the initialized flag.
   */
  clear(): void {
    this.currentExecutionId++;
    this.data.value = undefined;
    this.error.value = undefined;
    this.status.value = "idle";
  }

  /**
   * Resets the task to its initial state.
   * Clears data, error, and the initialized flag.
   */
  reset(): void {
    this.currentExecutionId++;
    this.data.value = undefined;
    this.error.value = undefined;
    this.status.value = "idle";
    this.initialized.value = false;
  }

  /**
   * Fully disposes the task, cleaning up all resources.
   * Stops watching dependencies, clears timers, and aborts in-flight requests.
   *
   * @remarks
   * The task should not be used after calling dispose().
   */
  dispose(): void {
    this.currentExecutionId++;

    // Clear debounce timer
    clearTimeout(this.debounceTimer);
    this.debounceTimer = undefined;

    // Stop reactive dependency tracking
    this.stopWatch?.();

    // Abort and clean up controller
    if (this.options.key) {
      controllerRegistry.get(this.options.key)?.abort();
      controllerRegistry.delete(this.options.key);
    }

    this.status.value = "idle";
  }
}
