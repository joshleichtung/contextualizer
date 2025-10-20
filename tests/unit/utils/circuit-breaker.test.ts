/**
 * Circuit Breaker Tests
 *
 * Tests for circuit breaker pattern implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CircuitBreaker,
  CircuitState,
  getCircuitBreaker,
  DEFAULT_CIRCUIT_CONFIG,
} from '../../../src/utils/circuit-breaker.js';

describe('CircuitBreaker', () => {
  let breaker: CircuitBreaker;

  beforeEach(() => {
    vi.useFakeTimers();
    breaker = new CircuitBreaker('test', DEFAULT_CIRCUIT_CONFIG);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('CLOSED state (normal operation)', () => {
    it('starts in CLOSED state', () => {
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('executes function successfully', async () => {
      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('allows errors without opening circuit below threshold', async () => {
      const error = new Error('Test error');
      const fn = vi.fn().mockRejectedValue(error);

      // Fail 4 times (threshold is 5)
      for (let i = 0; i < 4; i++) {
        try {
          await breaker.execute(fn);
        } catch (e) {
          expect(e).toBe(error);
        }
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
      expect(fn).toHaveBeenCalledTimes(4);
    });

    it('resets failure count on success', async () => {
      const error = new Error('Test error');

      // Fail 3 times
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(() => Promise.reject(error));
        } catch {}
      }

      // Succeed once
      await breaker.execute(() => Promise.resolve('success'));

      // Should be able to fail 4 more times before opening
      for (let i = 0; i < 4; i++) {
        try {
          await breaker.execute(() => Promise.reject(error));
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('OPEN state (failing)', () => {
    beforeEach(async () => {
      // Trip the circuit breaker
      const error = new Error('Test error');
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(error));
        } catch {}
      }
    });

    it('opens circuit after failure threshold', () => {
      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('rejects requests immediately when open', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      try {
        await breaker.execute(fn);
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
        expect(error.message).toContain("Circuit breaker 'test' is OPEN");
        expect(fn).not.toHaveBeenCalled();
      }
    });

    it('includes state and failure count in error details', async () => {
      try {
        await breaker.execute(() => Promise.resolve('test'));
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.details.state).toBe(CircuitState.OPEN);
        expect(error.details.failureCount).toBe(5);
      }
    });

    it('transitions to HALF_OPEN after reset timeout', async () => {
      // Advance time past reset timeout (60 seconds)
      vi.advanceTimersByTime(60000);

      // Next request should put it in HALF_OPEN state
      const fn = vi.fn().mockResolvedValue('success');
      await breaker.execute(fn);

      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('remains OPEN if timeout not reached', async () => {
      // Advance time less than reset timeout
      vi.advanceTimersByTime(30000); // 30 seconds

      try {
        await breaker.execute(() => Promise.resolve('test'));
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('HALF_OPEN state (testing recovery)', () => {
    beforeEach(async () => {
      // Trip circuit breaker
      const error = new Error('Test error');
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(error));
        } catch {}
      }

      // Wait for reset timeout
      vi.advanceTimersByTime(60000);
    });

    it('allows limited requests in HALF_OPEN', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      // First request transitions to HALF_OPEN
      await breaker.execute(fn);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('closes circuit after successful attempts threshold', async () => {
      const fn = vi.fn().mockResolvedValue('success');

      // Need 3 successful attempts to close (halfOpenMaxAttempts)
      await breaker.execute(fn);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      await breaker.execute(fn);
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      await breaker.execute(fn);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('reopens circuit on failure in HALF_OPEN', async () => {
      const error = new Error('Still failing');

      // First request transitions to HALF_OPEN
      try {
        await breaker.execute(() => Promise.reject(error));
      } catch {}

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });

    it('requires consecutive successes to close', async () => {
      // Success 1
      await breaker.execute(() => Promise.resolve('ok'));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Success 2
      await breaker.execute(() => Promise.resolve('ok'));
      expect(breaker.getState()).toBe(CircuitState.HALF_OPEN);

      // Failure - should reopen
      try {
        await breaker.execute(() => Promise.reject(new Error('fail')));
      } catch {}

      expect(breaker.getState()).toBe(CircuitState.OPEN);
    });
  });

  describe('reset()', () => {
    it('resets circuit to CLOSED state', async () => {
      // Trip the breaker
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.OPEN);

      breaker.reset();
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('clears failure count', async () => {
      // Fail 4 times (just below threshold)
      for (let i = 0; i < 4; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {}
      }

      breaker.reset();

      // Should be able to fail 4 more times without opening
      for (let i = 0; i < 4; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {}
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('allows normal operation after reset', async () => {
      // Trip and reset
      for (let i = 0; i < 5; i++) {
        try {
          await breaker.execute(() => Promise.reject(new Error('fail')));
        } catch {}
      }

      breaker.reset();

      const fn = vi.fn().mockResolvedValue('success');
      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('custom configuration', () => {
    it('uses custom failure threshold', async () => {
      const customBreaker = new CircuitBreaker('custom', {
        failureThreshold: 3,
        resetTimeoutMs: 60000,
        halfOpenMaxAttempts: 2,
      });

      // Fail 3 times (custom threshold)
      for (let i = 0; i < 3; i++) {
        try {
          await customBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {}
      }

      expect(customBreaker.getState()).toBe(CircuitState.OPEN);
    });

    it('uses custom half-open attempts', async () => {
      const customBreaker = new CircuitBreaker('custom', {
        failureThreshold: 2,
        resetTimeoutMs: 60000,
        halfOpenMaxAttempts: 2,
      });

      // Trip breaker
      for (let i = 0; i < 2; i++) {
        try {
          await customBreaker.execute(() => Promise.reject(new Error('fail')));
        } catch {}
      }

      // Wait for reset
      vi.advanceTimersByTime(60000);

      // Need 2 successes to close (custom halfOpenMaxAttempts)
      await customBreaker.execute(() => Promise.resolve('ok'));
      expect(customBreaker.getState()).toBe(CircuitState.HALF_OPEN);

      await customBreaker.execute(() => Promise.resolve('ok'));
      expect(customBreaker.getState()).toBe(CircuitState.CLOSED);
    });
  });
});

describe('getCircuitBreaker', () => {
  it('returns a CircuitBreaker instance', () => {
    const breaker = getCircuitBreaker('test');
    expect(breaker).toBeInstanceOf(CircuitBreaker);
  });

  it('returns same instance for same name', () => {
    const breaker1 = getCircuitBreaker('test');
    const breaker2 = getCircuitBreaker('test');

    expect(breaker1).toBe(breaker2);
  });

  it('returns different instances for different names', () => {
    const breaker1 = getCircuitBreaker('test1');
    const breaker2 = getCircuitBreaker('test2');

    expect(breaker1).not.toBe(breaker2);
  });

  it('uses custom config on first creation', () => {
    const config = {
      failureThreshold: 10,
      resetTimeoutMs: 120000,
      halfOpenMaxAttempts: 5,
    };

    const breaker = getCircuitBreaker('custom-config', config);
    expect(breaker).toBeInstanceOf(CircuitBreaker);
  });

  it('ignores config on subsequent calls', () => {
    const config1 = { failureThreshold: 5, resetTimeoutMs: 60000, halfOpenMaxAttempts: 3 };
    const config2 = { failureThreshold: 10, resetTimeoutMs: 120000, halfOpenMaxAttempts: 5 };

    const breaker1 = getCircuitBreaker('reused', config1);
    const breaker2 = getCircuitBreaker('reused', config2);

    expect(breaker1).toBe(breaker2);
  });
});
