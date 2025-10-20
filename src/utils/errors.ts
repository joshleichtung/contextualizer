/**
 * Error Handling Infrastructure
 *
 * This file defines the error class hierarchy and utilities for consistent
 * error handling across all MCP tools.
 */

import { logger } from './logger.js';
import type { ToolResult } from '../types/mcp.js';

/**
 * Base error class for all Contextualizer errors
 */
export class ContextualizerError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = 'ContextualizerError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContextualizerError);
    }
  }
}

/**
 * Error thrown when parameter validation fails
 */
export class ValidationError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details, true);
    this.name = 'ValidationError';
  }
}

/**
 * Error thrown when file operations fail
 */
export class FileOperationError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'FILE_OPERATION_ERROR', details, true);
    this.name = 'FileOperationError';
  }
}

/**
 * Error thrown when conflicts are detected
 */
export class ConflictError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT_ERROR', details, true);
    this.name = 'ConflictError';
  }
}

/**
 * Formats error details for user-friendly display
 */
function formatErrorDetails(details: unknown): string {
  if (!details) {
    return '';
  }

  try {
    return '\n\n' + JSON.stringify(details, null, 2);
  } catch {
    return '\n\n' + String(details);
  }
}

/**
 * Wraps a tool handler with consistent error handling
 *
 * This wrapper:
 * - Catches ContextualizerError instances and formats them for user display
 * - Catches unexpected errors and logs them before returning to user
 * - Ensures all tool handlers return consistent ToolResult format
 *
 * @param handler - The tool handler function to wrap
 * @returns Wrapped handler with error handling
 */
export function wrapToolHandler<T>(
  handler: (params: T) => Promise<ToolResult>
): (params: unknown) => Promise<ToolResult> {
  return async (params: unknown) => {
    try {
      // Cast params to expected type (after Zod validation)
      const validatedParams = params as T;
      return await handler(validatedParams);
    } catch (error) {
      // Handle known Contextualizer errors
      if (error instanceof ContextualizerError) {
        return {
          content: [
            {
              type: 'text',
              text: `❌ ${error.message}${formatErrorDetails(error.details)}`,
            },
          ],
          isError: true,
        };
      }

      // Handle unexpected errors
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error({ error }, 'Unexpected error in tool handler');

      return {
        content: [
          {
            type: 'text',
            text: `❌ Unexpected error: ${errorMessage}`,
          },
        ],
        isError: true,
      };
    }
  };
}
