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
  wrapToolHandler,
} from '../../../src/utils/errors.js';
import type { ToolResult } from '../../../src/types/mcp.js';

describe('Error Classes', () => {
  describe('ContextualizerError', () => {
    it('creates error with correct properties', () => {
      const error = new ContextualizerError(
        'Test error',
        'TEST_CODE',
        { detail: 'value' },
        true
      );

      expect(error.name).toBe('ContextualizerError');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.details).toEqual({ detail: 'value' });
      expect(error.recoverable).toBe(true);
    });

    it('defaults to recoverable=true', () => {
      const error = new ContextualizerError('Test', 'CODE');
      expect(error.recoverable).toBe(true);
    });

    it('is instance of Error', () => {
      const error = new ContextualizerError('Test', 'CODE');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('ValidationError', () => {
    it('creates validation error with correct code', () => {
      const error = new ValidationError('Invalid input', { field: 'test' });

      expect(error.name).toBe('ValidationError');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'test' });
      expect(error.recoverable).toBe(true);
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
      expect(error.details).toEqual({ path: '/test' });
      expect(error.recoverable).toBe(true);
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
      expect(error.details).toEqual({ file: 'config.yaml' });
      expect(error.recoverable).toBe(true);
    });

    it('is instance of ContextualizerError', () => {
      const error = new ConflictError('Test');
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

    expect(result.content[0].text).toBe('❌ Error without details');
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
});
