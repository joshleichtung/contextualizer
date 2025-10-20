/**
 * Error Handling Tests
 *
 * Tests for error class hierarchy and wrapToolHandler utility
 */

import { describe, it, expect } from 'vitest';
import {
  ContextualizerError,
  ValidationError,
  FileOperationError,
  ConflictError,
  GitOperationError,
  NetworkError,
  ConfigurationError,
  wrapToolHandler,
  formatErrorResponse,
  type ErrorCategory,
} from '../../../src/utils/errors.js';
import type { ToolResult } from '../../../src/types/mcp.js';

describe('Error Classes', () => {
  describe('ContextualizerError', () => {
    it('creates error with correct properties', () => {
      const error = new ContextualizerError(
        'Test error',
        'TEST_CODE',
        'validation',
        { detail: 'value' },
        true,
        ['Suggestion 1', 'Suggestion 2'],
        true
      );

      expect(error.name).toBe('ContextualizerError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.category).toBe('validation');
      expect(error.details).toEqual({ detail: 'value' });
      expect(error.recoverable).toBe(true);
      expect(error.recoverySuggestions).toEqual(['Suggestion 1', 'Suggestion 2']);
      expect(error.isRetryable).toBe(true);
      expect(error.retryCount).toBe(0);
    });

    it('defaults to recoverable=true and isRetryable=false', () => {
      const error = new ContextualizerError('Test', 'CODE', 'unknown');
      expect(error.recoverable).toBe(true);
      expect(error.isRetryable).toBe(false);
    });

    it('is instance of Error', () => {
      const error = new ContextualizerError('Test', 'CODE', 'unknown');
      expect(error).toBeInstanceOf(Error);
    });

    it('adds recovery suggestions', () => {
      const error = new ContextualizerError('Test', 'CODE', 'unknown');
      error.addRecoverySuggestion('Try this');
      error.addRecoverySuggestion('Or this');

      expect(error.recoverySuggestions).toEqual(['Try this', 'Or this']);
    });

    it('increments retry count', () => {
      const error = new ContextualizerError('Test', 'CODE', 'unknown');
      expect(error.retryCount).toBe(0);

      error.incrementRetryCount();
      expect(error.retryCount).toBe(1);

      error.incrementRetryCount();
      expect(error.retryCount).toBe(2);
    });
  });

  describe('ValidationError', () => {
    it('creates validation error with correct code', () => {
      const error = new ValidationError('Invalid input', { field: 'test' });

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.category).toBe('validation');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.recoverable).toBe(true);
      expect(error.isRetryable).toBe(false);
    });

    it('has recovery suggestions', () => {
      const error = new ValidationError('Invalid input');
      expect(error.recoverySuggestions.length).toBeGreaterThan(0);
      expect(error.recoverySuggestions).toContain('Check parameter format and values');
    });

    it('is instance of ContextualizerError', () => {
      const error = new ValidationError('Test');
      expect(error).toBeInstanceOf(ContextualizerError);
    });
  });

  describe('FileOperationError', () => {
    it('creates file operation error with correct code', () => {
      const error = new FileOperationError('File not found', {
        path: '/test',
      });

      expect(error.name).toBe('FileOperationError');
      expect(error.message).toBe('File not found');
      expect(error.code).toBe('FILE_OPERATION_ERROR');
      expect(error.category).toBe('filesystem');
      expect(error.details).toEqual({ path: '/test' });
      expect(error.recoverable).toBe(true);
      expect(error.isRetryable).toBe(true);
    });

    it('can be non-retryable', () => {
      const error = new FileOperationError('Invalid path', {}, false);
      expect(error.isRetryable).toBe(false);
      expect(error.recoverySuggestions).toContain('Check file permissions and paths');
    });

    it('has retryable recovery suggestions', () => {
      const error = new FileOperationError('EBUSY', {}, true);
      expect(error.recoverySuggestions).toContain('Operation will be retried automatically');
    });

    it('is instance of ContextualizerError', () => {
      const error = new FileOperationError('Test');
      expect(error).toBeInstanceOf(ContextualizerError);
    });
  });

  describe('ConflictError', () => {
    it('creates conflict error with correct code', () => {
      const error = new ConflictError('Config exists', { file: 'config.yaml' });

      expect(error.name).toBe('ConflictError');
      expect(error.message).toBe('Config exists');
      expect(error.code).toBe('CONFLICT_ERROR');
      expect(error.category).toBe('validation');
      expect(error.details).toEqual({ file: 'config.yaml' });
      expect(error.recoverable).toBe(true);
      expect(error.isRetryable).toBe(false);
    });

    it('has recovery suggestions', () => {
      const error = new ConflictError('Conflict');
      expect(error.recoverySuggestions).toContain('Review conflicting changes');
    });

    it('is instance of ContextualizerError', () => {
      const error = new ConflictError('Test');
      expect(error).toBeInstanceOf(ContextualizerError);
    });
  });

  describe('GitOperationError', () => {
    it('creates git error with correct properties', () => {
      const error = new GitOperationError('Git failed', { operation: 'commit' });

      expect(error.name).toBe('GitOperationError');
      expect(error.code).toBe('GIT_OPERATION_ERROR');
      expect(error.category).toBe('git');
      expect(error.isRetryable).toBe(true);
    });

    it('can be non-retryable', () => {
      const error = new GitOperationError('Not a git repo', {}, false);
      expect(error.isRetryable).toBe(false);
    });

    it('has recovery suggestions', () => {
      const error = new GitOperationError('Lock file', {}, true);
      expect(error.recoverySuggestions).toContain('Operation will be retried automatically');
    });

    it('is instance of ContextualizerError', () => {
      const error = new GitOperationError('Test');
      expect(error).toBeInstanceOf(ContextualizerError);
    });
  });

  describe('NetworkError', () => {
    it('creates network error with correct properties', () => {
      const error = new NetworkError('Connection failed', { url: 'https://example.com' });

      expect(error.name).toBe('NetworkError');
      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.category).toBe('network');
      expect(error.isRetryable).toBe(true);
    });

    it('has recovery suggestions', () => {
      const error = new NetworkError('Timeout');
      expect(error.recoverySuggestions).toContain('Check network connectivity');
    });

    it('is instance of ContextualizerError', () => {
      const error = new NetworkError('Test');
      expect(error).toBeInstanceOf(ContextualizerError);
    });
  });

  describe('ConfigurationError', () => {
    it('creates configuration error with correct properties', () => {
      const error = new ConfigurationError('Invalid config', { file: 'config.yaml' });

      expect(error.name).toBe('ConfigurationError');
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.category).toBe('configuration');
      expect(error.isRetryable).toBe(false);
    });

    it('has recovery suggestions', () => {
      const error = new ConfigurationError('Bad syntax');
      expect(error.recoverySuggestions).toContain('Check .contextualizer/config.yaml syntax');
    });

    it('is instance of ContextualizerError', () => {
      const error = new ConfigurationError('Test');
      expect(error).toBeInstanceOf(ContextualizerError);
    });
  });
});

describe('wrapToolHandler', () => {
  it('wraps successful handler execution', async () => {
    const handler = async () => ({
      content: [{ type: 'text' as const, text: 'Success' }],
      isError: false,
    });

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toBe('Success');
    expect(result.isError).toBe(false);
  });

  it('wraps ValidationError correctly', async () => {
    const handler = async () => {
      throw new ValidationError('Invalid parameter', { field: 'test' });
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('❌ Invalid parameter');
    expect(result.content[0].text).toContain('"field": "test"');
    expect(result.isError).toBe(true);
  });

  it('wraps FileOperationError correctly', async () => {
    const handler = async () => {
      throw new FileOperationError('File not found');
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toContain('❌ File not found');
    expect(result.isError).toBe(true);
  });

  it('wraps ConflictError correctly', async () => {
    const handler = async () => {
      throw new ConflictError('Configuration conflict');
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toContain('❌ Configuration conflict');
    expect(result.isError).toBe(true);
  });

  it('wraps unexpected errors', async () => {
    const handler = async () => {
      throw new Error('Unexpected error');
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toContain('❌ Unexpected error');
    expect(result.content[0].text).toContain('Unexpected error');
    expect(result.isError).toBe(true);
  });

  it('handles errors without details gracefully', async () => {
    const handler = async () => {
      throw new ValidationError('Error without details');
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toContain('❌ Error without details');
    expect(result.content[0].text).toContain('**Error Code**: VALIDATION_ERROR');
    expect(result.isError).toBe(true);
  });

  it('passes parameters to handler', async () => {
    const handler = async (params: { value: number }) => ({
      content: [{ type: 'text' as const, text: `Value: ${params.value}` }],
      isError: false,
    });

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({ value: 42 });

    expect(result.content[0].text).toBe('Value: 42');
  });

  it('includes error code and category in response', async () => {
    const handler = async () => {
      throw new FileOperationError('Test error');
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toContain('**Error Code**: FILE_OPERATION_ERROR');
    expect(result.content[0].text).toContain('**Category**: filesystem');
  });

  it('includes recovery suggestions in response', async () => {
    const handler = async () => {
      throw new ValidationError('Invalid parameter');
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toContain('**Recovery Suggestions**:');
    expect(result.content[0].text).toContain('1. Check parameter format and values');
  });

  it('includes retry count when retries occurred', async () => {
    const handler = async () => {
      const error = new FileOperationError('EBUSY');
      error.incrementRetryCount();
      error.incrementRetryCount();
      throw error;
    };

    const wrapped = wrapToolHandler(handler);
    const result = await wrapped({});

    expect(result.content[0].text).toContain('**Retry Attempts**: 2');
  });
});

describe('formatErrorResponse', () => {
  it('formats basic error with code and category', () => {
    const error = new ContextualizerError('Test error', 'TEST_CODE', 'validation');
    const response = formatErrorResponse(error);

    expect(response).toContain('❌ Test error');
    expect(response).toContain('**Error Code**: TEST_CODE');
    expect(response).toContain('**Category**: validation');
  });

  it('includes recovery suggestions', () => {
    const error = new ValidationError('Invalid input');
    const response = formatErrorResponse(error);

    expect(response).toContain('**Recovery Suggestions**:');
    expect(response).toContain('1. Check parameter format and values');
    expect(response).toContain('2. Refer to tool documentation for valid inputs');
  });

  it('includes retry count when retries occurred', () => {
    const error = new FileOperationError('EBUSY');
    error.incrementRetryCount();
    error.incrementRetryCount();
    const response = formatErrorResponse(error);

    expect(response).toContain('**Retry Attempts**: 2');
  });

  it('does not show retry count for non-retried errors', () => {
    const error = new ValidationError('Invalid');
    const response = formatErrorResponse(error);

    expect(response).not.toContain('**Retry Attempts**');
  });

  it('includes error details as JSON', () => {
    const error = new FileOperationError('Failed', { path: '/test', code: 'ENOENT' });
    const response = formatErrorResponse(error);

    expect(response).toContain('**Details**:');
    expect(response).toContain('"path": "/test"');
    expect(response).toContain('"code": "ENOENT"');
  });

  it('includes breadcrumbs in operation trace', () => {
    const error = new FileOperationError('Failed');
    error.details = {
      breadcrumbs: [
        { timestamp: new Date(), operation: 'readFile', details: { path: '/test' } },
        { timestamp: new Date(), operation: 'retry', details: { attempt: 1 } },
      ],
      otherDetail: 'value',
    };
    const response = formatErrorResponse(error);

    expect(response).toContain('Operation trace:');
    expect(response).toContain('1. readFile');
    expect(response).toContain('2. retry');
    expect(response).toContain('"otherDetail": "value"');
  });

  it('handles errors without details gracefully', () => {
    const error = new ContextualizerError('Simple error', 'CODE', 'unknown');
    const response = formatErrorResponse(error);

    expect(response).toContain('❌ Simple error');
    expect(response).not.toContain('**Details**:');
  });
});
