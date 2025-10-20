/**
 * Resilient Filesystem Operations
 *
 * This module provides filesystem operations with retry logic and circuit
 * breaker protection for handling transient failures.
 */

import * as fs from 'fs-extra';
import { FileOperationError } from './errors.js';
import { retryWithBackoff } from './retry.js';
import { getCircuitBreaker } from './circuit-breaker.js';
import { getErrorContext } from './error-context.js';

/**
 * Circuit breaker for filesystem operations
 */
const fsCircuitBreaker = getCircuitBreaker('filesystem');

/**
 * Determine if a filesystem error is retryable
 *
 * Retryable errors include:
 * - EBUSY: Resource busy or locked
 * - EACCES: Permission denied (may be temporary)
 * - EMFILE: Too many open files
 * - EAGAIN: Resource temporarily unavailable
 */
function isRetryableFileError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const retryableCodes = ['EBUSY', 'EACCES', 'EMFILE', 'EAGAIN'];
  return retryableCodes.some((code) => (error as any).code === code);
}

/**
 * Read a file with retry logic
 *
 * @param path - File path to read
 * @param encoding - File encoding (default: utf8)
 * @returns File contents as string
 * @throws FileOperationError if operation fails after retries
 */
export async function readFileWithRetry(
  path: string,
  encoding: BufferEncoding = 'utf8'
): Promise<string> {
  const context = getErrorContext();
  context.addBreadcrumb('readFileWithRetry', { path });

  return fsCircuitBreaker.execute(() =>
    retryWithBackoff(
      async () => {
        try {
          return await fs.readFile(path, encoding);
        } catch (error) {
          throw new FileOperationError(
            `Failed to read file: ${path}`,
            { path, error: String(error) },
            isRetryableFileError(error)
          );
        }
      },
      { maxAttempts: 3, delayMs: 100 },
      (error) => {
        if (error instanceof FileOperationError) {
          return error.isRetryable;
        }
        return isRetryableFileError(error);
      }
    )
  );
}

/**
 * Write a file with retry logic
 *
 * @param path - File path to write
 * @param content - Content to write
 * @param encoding - File encoding (default: utf8)
 * @throws FileOperationError if operation fails after retries
 */
export async function writeFileWithRetry(
  path: string,
  content: string,
  encoding: BufferEncoding = 'utf8'
): Promise<void> {
  const context = getErrorContext();
  context.addBreadcrumb('writeFileWithRetry', { path });

  return fsCircuitBreaker.execute(() =>
    retryWithBackoff(
      async () => {
        try {
          await fs.writeFile(path, content, encoding);
        } catch (error) {
          throw new FileOperationError(
            `Failed to write file: ${path}`,
            { path, error: String(error) },
            isRetryableFileError(error)
          );
        }
      },
      { maxAttempts: 3, delayMs: 100 },
      (error) => {
        if (error instanceof FileOperationError) {
          return error.isRetryable;
        }
        return isRetryableFileError(error);
      }
    )
  );
}

/**
 * Ensure a directory exists with retry logic
 *
 * @param path - Directory path to ensure
 * @throws FileOperationError if operation fails after retries
 */
export async function ensureDirWithRetry(path: string): Promise<void> {
  const context = getErrorContext();
  context.addBreadcrumb('ensureDirWithRetry', { path });

  return fsCircuitBreaker.execute(() =>
    retryWithBackoff(
      async () => {
        try {
          await fs.ensureDir(path);
        } catch (error) {
          throw new FileOperationError(
            `Failed to create directory: ${path}`,
            { path, error: String(error) },
            isRetryableFileError(error)
          );
        }
      },
      { maxAttempts: 3, delayMs: 100 },
      (error) => {
        if (error instanceof FileOperationError) {
          return error.isRetryable;
        }
        return isRetryableFileError(error);
      }
    )
  );
}
