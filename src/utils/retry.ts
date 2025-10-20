/**
 * Retry Logic with Exponential Backoff
 *
 * This module provides retry functionality with exponential backoff for
 * handling transient failures.
 */

import { ContextualizerError } from './errors.js';
import { getErrorContext } from './error-context.js';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  maxDelayMs: number;
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 100,
  backoffMultiplier: 2,
  maxDelayMs: 5000,
};

/**
 * Retry an operation with exponential backoff
 *
 * This function:
 * - Executes the provided function
 * - Retries on failure with exponential backoff
 * - Only retries if error is retryable
 * - Tracks retry attempts in error context
 *
 * @param fn - Async function to retry
 * @param config - Retry configuration (merged with defaults)
 * @param isRetryableError - Predicate to determine if error is retryable
 * @returns Result of the function
 * @throws Last error if max attempts exceeded
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  isRetryableError: (error: unknown) => boolean = () => true
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: unknown;
  let delay = finalConfig.delayMs;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Increment retry count if ContextualizerError
      if (error instanceof ContextualizerError) {
        error.incrementRetryCount();
      }

      // Check if error is retryable
      // Both the custom predicate AND the error.isRetryable flag must be true
      const predicateAllows = isRetryableError(error);
      const errorAllowsRetry = error instanceof ContextualizerError ? error.isRetryable : true;
      const shouldRetry =
        attempt < finalConfig.maxAttempts &&
        predicateAllows &&
        errorAllowsRetry;

      if (!shouldRetry) {
        throw error;
      }

      // Add breadcrumb for retry
      const context = getErrorContext();
      context.addBreadcrumb(`Retry attempt ${attempt}`, {
        error: String(error),
      });

      // Wait with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(
        delay * finalConfig.backoffMultiplier,
        finalConfig.maxDelayMs
      );
    }
  }

  throw lastError;
}
