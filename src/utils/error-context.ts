/**
 * Error Context Tracking with Breadcrumbs
 *
 * This module provides error context tracking using AsyncLocalStorage for
 * isolated breadcrumb trails across concurrent operations.
 */

import { AsyncLocalStorage } from 'async_hooks';
import { ContextualizerError } from './errors.js';

/**
 * Breadcrumb entry for operation tracking
 */
export interface Breadcrumb {
  timestamp: Date;
  operation: string;
  details?: unknown;
}

/**
 * Error context class for managing breadcrumbs
 */
export class ErrorContext {
  private breadcrumbs: Breadcrumb[] = [];

  /**
   * Add a breadcrumb to the current context
   */
  addBreadcrumb(operation: string, details?: unknown): void {
    this.breadcrumbs.push({
      timestamp: new Date(),
      operation,
      details,
    });
  }

  /**
   * Get all breadcrumbs in the current context
   */
  getBreadcrumbs(): Breadcrumb[] {
    return [...this.breadcrumbs];
  }

  /**
   * Clear all breadcrumbs in the current context
   */
  clear(): void {
    this.breadcrumbs = [];
  }
}

/**
 * AsyncLocalStorage for context isolation
 */
const errorContextStorage = new AsyncLocalStorage<ErrorContext>();

/**
 * Get the current error context, or create a new one if none exists
 */
export function getErrorContext(): ErrorContext {
  let context = errorContextStorage.getStore();
  if (!context) {
    context = new ErrorContext();
  }
  return context;
}

/**
 * Execute a function within an error context
 *
 * This wrapper:
 * - Creates a new isolated error context
 * - Adds initial breadcrumb for the operation
 * - Attaches breadcrumbs to any ContextualizerError thrown
 *
 * @param operation - Operation name for the breadcrumb
 * @param fn - Async function to execute
 * @returns Result of the function
 */
export async function withErrorContext<T>(
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const context = new ErrorContext();
  context.addBreadcrumb(operation);

  return errorContextStorage.run(context, async () => {
    try {
      return await fn();
    } catch (error) {
      // Attach breadcrumbs to ContextualizerError
      if (error instanceof ContextualizerError) {
        const breadcrumbs = context.getBreadcrumbs();
        error.details = {
          ...(typeof error.details === 'object' && error.details !== null
            ? error.details
            : {}),
          breadcrumbs,
        };
      }
      throw error;
    }
  });
}
