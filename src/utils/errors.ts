/**
 * Error Handling Infrastructure
 *
 * This file defines the error class hierarchy and utilities for consistent
 * error handling across all MCP tools.
 */

import { logger } from './logger.js';
import type { ToolResult } from '../types/mcp.js';

/**
 * Error category types for classification
 */
export type ErrorCategory =
  | 'validation'
  | 'filesystem'
  | 'git'
  | 'configuration'
  | 'network'
  | 'unknown';

/**
 * Base error class for all Contextualizer errors
 */
export class ContextualizerError extends Error {
  public recoverySuggestions: string[] = [];
  public retryCount: number = 0;

  constructor(
    message: string,
    public code: string,
    public category: ErrorCategory,
    public details?: unknown,
    public recoverable: boolean = true,
    recoverySuggestions: string[] = [],
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ContextualizerError';
    this.recoverySuggestions = [...recoverySuggestions];
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ContextualizerError);
    }
  }

  /**
   * Add a recovery suggestion to this error
   */
  addRecoverySuggestion(suggestion: string): void {
    this.recoverySuggestions.push(suggestion);
  }

  /**
   * Increment the retry count
   */
  incrementRetryCount(): void {
    this.retryCount++;
  }
}

/**
 * Error thrown when parameter validation fails
 */
export class ValidationError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 'validation', details, true, [], false);
    this.name = 'ValidationError';
    this.addRecoverySuggestion('Check parameter format and values');
    this.addRecoverySuggestion('Refer to tool documentation for valid inputs');
  }
}

/**
 * Error thrown when file operations fail
 */
export class FileOperationError extends ContextualizerError {
  constructor(message: string, details?: unknown, isRetryable: boolean = true) {
    super(message, 'FILE_OPERATION_ERROR', 'filesystem', details, true, [], isRetryable);
    this.name = 'FileOperationError';
    if (isRetryable) {
      this.addRecoverySuggestion('Operation will be retried automatically');
      this.addRecoverySuggestion('Check file permissions if error persists');
    } else {
      this.addRecoverySuggestion('Check file permissions and paths');
      this.addRecoverySuggestion('Verify disk space is available');
    }
  }
}

/**
 * Error thrown when conflicts are detected
 */
export class ConflictError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFLICT_ERROR', 'validation', details, true, [], false);
    this.name = 'ConflictError';
    this.addRecoverySuggestion('Review conflicting changes');
    this.addRecoverySuggestion('Manually resolve conflicts if necessary');
  }
}

/**
 * Error thrown when git operations fail
 */
export class GitOperationError extends ContextualizerError {
  constructor(message: string, details?: unknown, isRetryable: boolean = true) {
    super(message, 'GIT_OPERATION_ERROR', 'git', details, true, [], isRetryable);
    this.name = 'GitOperationError';
    if (isRetryable) {
      this.addRecoverySuggestion('Operation will be retried automatically');
      this.addRecoverySuggestion('Check if git repository is locked by another process');
    } else {
      this.addRecoverySuggestion('Verify git repository is initialized');
      this.addRecoverySuggestion('Check git remote configuration');
    }
  }
}

/**
 * Error thrown when network operations fail
 */
export class NetworkError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'NETWORK_ERROR', 'network', details, true, [], true);
    this.name = 'NetworkError';
    this.addRecoverySuggestion('Operation will be retried automatically');
    this.addRecoverySuggestion('Check network connectivity');
    this.addRecoverySuggestion('Verify firewall settings if error persists');
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends ContextualizerError {
  constructor(message: string, details?: unknown) {
    super(message, 'CONFIGURATION_ERROR', 'configuration', details, true, [], false);
    this.name = 'ConfigurationError';
    this.addRecoverySuggestion('Check .contextualizer/config.yaml syntax');
    this.addRecoverySuggestion('Run diagnostics with run_doctor tool');
    this.addRecoverySuggestion('Refer to configuration documentation');
  }
}

/**
 * Formats a ContextualizerError into a structured, user-friendly response
 */
export function formatErrorResponse(error: ContextualizerError): string {
  let response = `❌ ${error.message}\n\n`;

  // Add error metadata
  response += `**Error Code**: ${error.code}\n`;
  response += `**Category**: ${error.category}\n`;

  // Add retry information
  if (error.isRetryable && error.retryCount > 0) {
    response += `**Retry Attempts**: ${error.retryCount}\n`;
  }

  response += '\n';

  // Add recovery suggestions
  if (error.recoverySuggestions.length > 0) {
    response += '**Recovery Suggestions**:\n';
    error.recoverySuggestions.forEach((suggestion, index) => {
      response += `${index + 1}. ${suggestion}\n`;
    });
    response += '\n';
  }

  // Add error details
  if (error.details) {
    response += '**Details**:\n';

    // Extract breadcrumbs if present
    const details = error.details as any;
    if (details.breadcrumbs && Array.isArray(details.breadcrumbs)) {
      response += '\nOperation trace:\n';
      details.breadcrumbs.forEach((breadcrumb: any, index: number) => {
        response += `  ${index + 1}. ${breadcrumb.operation}`;
        if (breadcrumb.details) {
          response += ` - ${JSON.stringify(breadcrumb.details)}`;
        }
        response += '\n';
      });

      // Show other details without breadcrumbs
      const { breadcrumbs, ...otherDetails } = details;
      if (Object.keys(otherDetails).length > 0) {
        response += '\n' + JSON.stringify(otherDetails, null, 2);
      }
    } else {
      response += JSON.stringify(error.details, null, 2);
    }
  }

  return response;
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
        const errorResponse = formatErrorResponse(error);
        logger.error(
          {
            code: error.code,
            category: error.category,
            retryCount: error.retryCount,
          },
          'Tool error'
        );

        return {
          content: [
            {
              type: 'text',
              text: errorResponse,
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
