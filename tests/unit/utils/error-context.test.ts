/**
 * Error Context Tests
 *
 * Tests for error context tracking and breadcrumb functionality
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ErrorContext,
  getErrorContext,
  withErrorContext,
  type Breadcrumb,
} from '../../../src/utils/error-context.js';
import { ContextualizerError } from '../../../src/utils/errors.js';

describe('ErrorContext', () => {
  let context: ErrorContext;

  beforeEach(() => {
    context = new ErrorContext();
  });

  it('starts with empty breadcrumbs', () => {
    expect(context.getBreadcrumbs()).toEqual([]);
  });

  it('adds breadcrumb with operation name', () => {
    context.addBreadcrumb('testOperation');
    const breadcrumbs = context.getBreadcrumbs();

    expect(breadcrumbs).toHaveLength(1);
    expect(breadcrumbs[0].operation).toBe('testOperation');
    expect(breadcrumbs[0].timestamp).toBeInstanceOf(Date);
  });

  it('adds breadcrumb with details', () => {
    context.addBreadcrumb('testOperation', { key: 'value' });
    const breadcrumbs = context.getBreadcrumbs();

    expect(breadcrumbs[0].details).toEqual({ key: 'value' });
  });

  it('accumulates multiple breadcrumbs', () => {
    context.addBreadcrumb('operation1');
    context.addBreadcrumb('operation2', { detail: 'test' });
    context.addBreadcrumb('operation3');

    const breadcrumbs = context.getBreadcrumbs();
    expect(breadcrumbs).toHaveLength(3);
    expect(breadcrumbs[0].operation).toBe('operation1');
    expect(breadcrumbs[1].operation).toBe('operation2');
    expect(breadcrumbs[2].operation).toBe('operation3');
  });

  it('returns copy of breadcrumbs', () => {
    context.addBreadcrumb('test');
    const breadcrumbs1 = context.getBreadcrumbs();
    const breadcrumbs2 = context.getBreadcrumbs();

    expect(breadcrumbs1).not.toBe(breadcrumbs2);
    expect(breadcrumbs1).toEqual(breadcrumbs2);
  });

  it('clears all breadcrumbs', () => {
    context.addBreadcrumb('operation1');
    context.addBreadcrumb('operation2');
    expect(context.getBreadcrumbs()).toHaveLength(2);

    context.clear();
    expect(context.getBreadcrumbs()).toEqual([]);
  });
});

describe('getErrorContext', () => {
  it('returns an error context', () => {
    const context = getErrorContext();
    expect(context).toBeInstanceOf(ErrorContext);
  });

  it('returns new context if none in storage', () => {
    const context = getErrorContext();
    expect(context.getBreadcrumbs()).toEqual([]);
  });
});

describe('withErrorContext', () => {
  it('executes function and returns result', async () => {
    const result = await withErrorContext('test', async () => {
      return 'success';
    });

    expect(result).toBe('success');
  });

  it('adds initial breadcrumb', async () => {
    let capturedBreadcrumbs: Breadcrumb[] = [];

    await withErrorContext('testOperation', async () => {
      const context = getErrorContext();
      capturedBreadcrumbs = context.getBreadcrumbs();
    });

    expect(capturedBreadcrumbs).toHaveLength(1);
    expect(capturedBreadcrumbs[0].operation).toBe('testOperation');
  });

  it('allows adding breadcrumbs within context', async () => {
    let capturedBreadcrumbs: Breadcrumb[] = [];

    await withErrorContext('outer', async () => {
      const context = getErrorContext();
      context.addBreadcrumb('inner1');
      context.addBreadcrumb('inner2', { detail: 'test' });
      capturedBreadcrumbs = context.getBreadcrumbs();
    });

    expect(capturedBreadcrumbs).toHaveLength(3);
    expect(capturedBreadcrumbs[0].operation).toBe('outer');
    expect(capturedBreadcrumbs[1].operation).toBe('inner1');
    expect(capturedBreadcrumbs[2].operation).toBe('inner2');
  });

  it('attaches breadcrumbs to ContextualizerError', async () => {
    try {
      await withErrorContext('operation', async () => {
        const context = getErrorContext();
        context.addBreadcrumb('step1');
        context.addBreadcrumb('step2');
        throw new ContextualizerError('Test error', 'TEST', 'unknown');
      });
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBeInstanceOf(ContextualizerError);
      const contextError = error as ContextualizerError;
      expect(contextError.details).toBeDefined();
      const details = contextError.details as any;
      expect(details.breadcrumbs).toBeDefined();
      expect(details.breadcrumbs).toHaveLength(3);
    }
  });

  it('preserves existing error details when adding breadcrumbs', async () => {
    try {
      await withErrorContext('operation', async () => {
        throw new ContextualizerError('Test', 'TEST', 'unknown', {
          existingDetail: 'value',
        });
      });
      expect.fail('Should have thrown error');
    } catch (error) {
      const contextError = error as ContextualizerError;
      const details = contextError.details as any;
      expect(details.existingDetail).toBe('value');
      expect(details.breadcrumbs).toBeDefined();
    }
  });

  it('does not modify non-ContextualizerError errors', async () => {
    const originalError = new Error('Standard error');
    try {
      await withErrorContext('operation', async () => {
        throw originalError;
      });
      expect.fail('Should have thrown error');
    } catch (error) {
      expect(error).toBe(originalError);
      expect((error as any).details).toBeUndefined();
    }
  });

  it('isolates contexts between concurrent operations', async () => {
    const promises = [
      withErrorContext('op1', async () => {
        const context = getErrorContext();
        context.addBreadcrumb('op1-step1');
        await new Promise((resolve) => setTimeout(resolve, 10));
        context.addBreadcrumb('op1-step2');
        return context.getBreadcrumbs();
      }),
      withErrorContext('op2', async () => {
        const context = getErrorContext();
        context.addBreadcrumb('op2-step1');
        await new Promise((resolve) => setTimeout(resolve, 5));
        context.addBreadcrumb('op2-step2');
        return context.getBreadcrumbs();
      }),
    ];

    const [breadcrumbs1, breadcrumbs2] = await Promise.all(promises);

    expect(breadcrumbs1).toHaveLength(3);
    expect(breadcrumbs1[0].operation).toBe('op1');
    expect(breadcrumbs1[1].operation).toBe('op1-step1');
    expect(breadcrumbs1[2].operation).toBe('op1-step2');

    expect(breadcrumbs2).toHaveLength(3);
    expect(breadcrumbs2[0].operation).toBe('op2');
    expect(breadcrumbs2[1].operation).toBe('op2-step1');
    expect(breadcrumbs2[2].operation).toBe('op2-step2');
  });

  it('supports nested error contexts', async () => {
    let innerBreadcrumbs: Breadcrumb[] = [];
    let outerBreadcrumbs: Breadcrumb[] = [];

    await withErrorContext('outer', async () => {
      const outerContext = getErrorContext();
      outerContext.addBreadcrumb('outer-step1');

      await withErrorContext('inner', async () => {
        const innerContext = getErrorContext();
        innerContext.addBreadcrumb('inner-step1');
        innerBreadcrumbs = innerContext.getBreadcrumbs();
      });

      outerContext.addBreadcrumb('outer-step2');
      outerBreadcrumbs = outerContext.getBreadcrumbs();
    });

    // Inner context should only have inner breadcrumbs
    expect(innerBreadcrumbs).toHaveLength(2);
    expect(innerBreadcrumbs[0].operation).toBe('inner');
    expect(innerBreadcrumbs[1].operation).toBe('inner-step1');

    // Outer context should only have outer breadcrumbs
    expect(outerBreadcrumbs).toHaveLength(3);
    expect(outerBreadcrumbs[0].operation).toBe('outer');
    expect(outerBreadcrumbs[1].operation).toBe('outer-step1');
    expect(outerBreadcrumbs[2].operation).toBe('outer-step2');
  });
});
