/**
 * Resilient Git Operations
 *
 * This module provides git operations with retry logic and circuit
 * breaker protection for handling transient failures.
 */

import simpleGit, { SimpleGit } from 'simple-git';
import { GitOperationError } from './errors.js';
import { retryWithBackoff } from './retry.js';
import { getCircuitBreaker } from './circuit-breaker.js';
import { getErrorContext } from './error-context.js';

/**
 * Circuit breaker for git operations
 */
const gitCircuitBreaker = getCircuitBreaker('git');

/**
 * Determine if a git error is retryable
 *
 * Retryable errors include:
 * - Lock file contention (.git/index.lock)
 * - Network timeouts and connection issues
 * - Temporary git state issues
 */
function isRetryableGitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();
  return (
    message.includes('lock') ||
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('connection')
  );
}

/**
 * Execute a git operation with retry logic
 *
 * @param operation - Operation name for logging
 * @param fn - Function that accepts SimpleGit instance and performs operation
 * @returns Result of the git operation
 * @throws GitOperationError if operation fails after retries
 */
export async function gitWithRetry<T>(
  operation: string,
  fn: (git: SimpleGit) => Promise<T>
): Promise<T> {
  const context = getErrorContext();
  context.addBreadcrumb('gitWithRetry', { operation });

  const git = simpleGit();

  return gitCircuitBreaker.execute(() =>
    retryWithBackoff(
      async () => {
        try {
          return await fn(git);
        } catch (error) {
          throw new GitOperationError(
            `Git operation '${operation}' failed`,
            { operation, error: String(error) },
            isRetryableGitError(error)
          );
        }
      },
      { maxAttempts: 3, delayMs: 200 },
      // Predicate must check the GitOperationError's isRetryable property
      (error) => {
        if (error instanceof GitOperationError) {
          return error.isRetryable;
        }
        return isRetryableGitError(error);
      }
    )
  );
}
