/**
 * Retry Logic Tests
 *
 * Tests for retry with exponential backoff functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  retryWithBackoff,
  DEFAULT_RETRY_CONFIG,
  type RetryConfig,
} from '../../../src/utils/retry.js';
import { ContextualizerError, FileOperationError } from '../../../src/utils/errors.js';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const resultPromise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on retryable error', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(
        new FileOperationError('EBUSY', { code: 'EBUSY' }, true)
      )
      .mockResolvedValueOnce('success');

    const resultPromise = retryWithBackoff(
      fn,
      { maxAttempts: 3 },
      () => true
    );
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('respects maxAttempts', async () => {
    const error = new FileOperationError('EBUSY', {}, true);
    const fn = vi.fn().mockRejectedValue(error);

    const resultPromise = retryWithBackoff(
      fn,
      { maxAttempts: 3 },
      () => true
    );

    try {
      await vi.runAllTimersAsync();
      await resultPromise;
      expect.fail('Should have thrown error');
    } catch (e) {
      expect(fn).toHaveBeenCalledTimes(3);
      expect(e).toBe(error);
    }
  });

  it('fails immediately on non-retryable error', async () => {
    const error = new FileOperationError('ENOENT', {}, false);
    const fn = vi.fn().mockRejectedValue(error);

    const resultPromise = retryWithBackoff(
      fn,
      { maxAttempts: 3 },
      () => true
    );

    try {
      await vi.runAllTimersAsync();
      await resultPromise;
      expect.fail('Should have thrown error');
    } catch (e) {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(e).toBe(error);
    }
  });

  it('fails immediately when predicate returns false', async () => {
    const error = new Error('Not retryable');
    const fn = vi.fn().mockRejectedValue(error);
    const predicate = vi.fn().mockReturnValue(false);

    const resultPromise = retryWithBackoff(
      fn,
      { maxAttempts: 3 },
      predicate
    );

    try {
      await vi.runAllTimersAsync();
      await resultPromise;
      expect.fail('Should have thrown error');
    } catch (e) {
      expect(fn).toHaveBeenCalledTimes(1);
      expect(predicate).toHaveBeenCalledWith(error);
    }
  });

  it('increments retry count on ContextualizerError', async () => {
    const error = new FileOperationError('EBUSY', {}, true);
    const fn = vi.fn().mockRejectedValue(error);

    const resultPromise = retryWithBackoff(
      fn,
      { maxAttempts: 3 },
      () => true
    );

    try {
      await vi.runAllTimersAsync();
      await resultPromise;
      expect.fail('Should have thrown error');
    } catch (e) {
      expect((e as ContextualizerError).retryCount).toBe(3);
    }
  });

  it('uses exponential backoff delays', async () => {
    const error = new FileOperationError('EBUSY', {}, true);
    const fn = vi.fn().mockRejectedValue(error);
    const delays: number[] = [];

    const config: Partial<RetryConfig> = {
      maxAttempts: 4,
      delayMs: 100,
      backoffMultiplier: 2,
      maxDelayMs: 5000,
    };

    const resultPromise = retryWithBackoff(fn, config, () => true);

    // Track delays by advancing timers incrementally
    for (let i = 0; i < 3; i++) {
      const beforeTime = Date.now();
      vi.setSystemTime(beforeTime);
      await vi.runOnlyPendingTimersAsync();
      const afterTime = Date.now();
      const delay = afterTime - beforeTime;
      if (delay > 0) delays.push(delay);
    }

    try {
      await resultPromise;
    } catch {
      // Expected to fail
    }

    // Delays should be: 100ms, 200ms, 400ms (exponential)
    expect(delays).toHaveLength(3);
    expect(delays[0]).toBe(100);
    expect(delays[1]).toBe(200);
    expect(delays[2]).toBe(400);
  });

  it('caps delay at maxDelayMs', async () => {
    const error = new FileOperationError('EBUSY', {}, true);
    const fn = vi.fn().mockRejectedValue(error);
    const delays: number[] = [];

    const config: Partial<RetryConfig> = {
      maxAttempts: 5,
      delayMs: 1000,
      backoffMultiplier: 3,
      maxDelayMs: 2500,
    };

    const resultPromise = retryWithBackoff(fn, config, () => true);

    // Track delays
    for (let i = 0; i < 4; i++) {
      const beforeTime = Date.now();
      vi.setSystemTime(beforeTime);
      await vi.runOnlyPendingTimersAsync();
      const afterTime = Date.now();
      const delay = afterTime - beforeTime;
      if (delay > 0) delays.push(delay);
    }

    try {
      await resultPromise;
    } catch {
      // Expected to fail
    }

    // Delays: 1000ms, 2500ms (capped), 2500ms (capped), 2500ms (capped)
    expect(delays[0]).toBe(1000);
    expect(delays[1]).toBe(2500); // Would be 3000, but capped
    expect(delays[2]).toBe(2500); // Would be 9000, but capped
  });

  it('uses default config when not provided', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const resultPromise = retryWithBackoff(fn);
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toBe('success');
  });

  it('merges partial config with defaults', async () => {
    const error = new FileOperationError('EBUSY', {}, true);
    const fn = vi.fn().mockRejectedValue(error);

    const resultPromise = retryWithBackoff(
      fn,
      { maxAttempts: 2 }, // Only override maxAttempts
      () => true
    );

    try {
      await vi.runAllTimersAsync();
      await resultPromise;
    } catch {
      // Expected to fail
    }

    // Should use maxAttempts: 2 (custom) and other defaults
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('uses default predicate when not provided', async () => {
    const error = new FileOperationError('Any error', {}, true);
    const fn = vi.fn().mockRejectedValue(error);

    // Default predicate always returns true, but error.isRetryable must be true
    const resultPromise = retryWithBackoff(fn, { maxAttempts: 2 });

    try {
      await vi.runAllTimersAsync();
      await resultPromise;
    } catch {
      // Expected to fail
    }

    expect(fn).toHaveBeenCalledTimes(2);
  });
});
