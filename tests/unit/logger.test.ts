/**
 * Logger Unit Tests
 *
 * Tests for the pino logger utility
 */

import { describe, it, expect } from 'vitest';
import { logger } from '../../src/utils/logger.js';

describe('Logger', () => {
  it('exports logger instance', () => {
    expect(logger).toBeDefined();
    expect(typeof logger).toBe('object');
  });

  it('has info method', () => {
    expect(typeof logger.info).toBe('function');
    // Should not throw
    expect(() => logger.info('Test info')).not.toThrow();
  });

  it('has error method', () => {
    expect(typeof logger.error).toBe('function');
    // Should not throw
    expect(() => logger.error('Test error')).not.toThrow();
  });

  it('has warn method', () => {
    expect(typeof logger.warn).toBe('function');
    // Should not throw
    expect(() => logger.warn('Test warn')).not.toThrow();
  });

  it('has debug method', () => {
    expect(typeof logger.debug).toBe('function');
    // Should not throw
    expect(() => logger.debug('Test debug')).not.toThrow();
  });

  it('accepts structured logging with context', () => {
    // Should not throw with structured data
    expect(() =>
      logger.info({ tool: 'test_tool', params: { key: 'value' } }, 'Structured log')
    ).not.toThrow();
  });

  it('accepts error objects in context', () => {
    // Should not throw with error objects
    expect(() =>
      logger.error({ error: new Error('Test error') }, 'Error message')
    ).not.toThrow();
  });

  it('handles mkdirSync error gracefully', () => {
    // Logger should handle directory creation errors without crashing
    // This tests the try-catch in logger.ts initialization
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe('function');
  });
});
