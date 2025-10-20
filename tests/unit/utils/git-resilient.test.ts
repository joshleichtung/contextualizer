/**
 * Git Resilience Tests
 *
 * Tests for resilient git operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gitWithRetry } from '../../../src/utils/git-resilient.js';
import { GitOperationError } from '../../../src/utils/errors.js';
import { getCircuitBreaker } from '../../../src/utils/circuit-breaker.js';

// Mock simple-git
vi.mock('simple-git', () => ({
  default: vi.fn(() => ({})),
}));

describe('Git Resilient Operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getCircuitBreaker('git').reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('gitWithRetry', () => {
    it('executes git operation successfully without retry', async () => {
      const mockGitFn = vi.fn().mockResolvedValue('success');

      const resultPromise = gitWithRetry('test', mockGitFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockGitFn).toHaveBeenCalledTimes(1);
    });

    it('retries on lock file error', async () => {
      const lockError = new Error('index.lock: File exists');
      const mockGitFn = vi
        .fn()
        .mockRejectedValueOnce(lockError)
        .mockRejectedValueOnce(lockError)
        .mockResolvedValueOnce('success');

      const resultPromise = gitWithRetry('commit', mockGitFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockGitFn).toHaveBeenCalledTimes(3);
    });

    it('retries on network timeout', async () => {
      const timeoutError = new Error('Connection timeout');
      const mockGitFn = vi
        .fn()
        .mockRejectedValueOnce(timeoutError)
        .mockResolvedValueOnce('success');

      const resultPromise = gitWithRetry('pull', mockGitFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockGitFn).toHaveBeenCalledTimes(2);
    });

    it('retries on network error', async () => {
      const networkError = new Error('network error: failed');
      const mockGitFn = vi
        .fn()
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce('success');

      const resultPromise = gitWithRetry('fetch', mockGitFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(mockGitFn).toHaveBeenCalledTimes(2);
    });

    it('fails immediately on non-retryable error', async () => {
      const notGitError = new Error('not a git repository');
      const mockGitFn = vi.fn().mockRejectedValue(notGitError);

      const resultPromise = gitWithRetry('status', mockGitFn);

      try {
        await vi.runAllTimersAsync();
        await resultPromise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GitOperationError);
        expect((error as GitOperationError).isRetryable).toBe(false);
        expect(mockGitFn).toHaveBeenCalledTimes(1);
      }
    });

    it('throws GitOperationError with details', async () => {
      const error = new Error('Test git error');
      const mockGitFn = vi.fn().mockRejectedValue(error);

      const resultPromise = gitWithRetry('commit', mockGitFn);

      try {
        await vi.runAllTimersAsync();
        await resultPromise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GitOperationError);
        const gitError = error as GitOperationError;
        expect(gitError.message).toContain("Git operation 'commit' failed");
        expect(gitError.details).toBeDefined();
        expect((gitError.details as any).operation).toBe('commit');
      }
    });

    it('includes recovery suggestions for retryable errors', async () => {
      const lockError = new Error('index.lock: File exists');
      const mockGitFn = vi.fn().mockRejectedValue(lockError);

      const resultPromise = gitWithRetry('add', mockGitFn);

      try {
        await vi.runAllTimersAsync();
        await resultPromise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const gitError = error as GitOperationError;
        expect(gitError.recoverySuggestions).toContain('Operation will be retried automatically');
        expect(gitError.recoverySuggestions).toContain(
          'Check if git repository is locked by another process'
        );
      }
    });

    it('uses circuit breaker protection', async () => {
      const error = new Error('Git error');
      const mockGitFn = vi.fn().mockRejectedValue(error);

      // Trip the circuit breaker (5 failures)
      for (let i = 0; i < 5; i++) {
        try {
          const promise = gitWithRetry(`operation${i}`, mockGitFn);
          await vi.runAllTimersAsync();
          await promise;
        } catch {}
      }

      // Next call should be rejected by circuit breaker
      try {
        await gitWithRetry('next-operation', mockGitFn);
        expect.fail('Should have thrown circuit breaker error');
      } catch (error: any) {
        expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
      }
    });

    it('receives SimpleGit instance in callback', async () => {
      let receivedGit: any;
      const mockGitFn = vi.fn((git) => {
        receivedGit = git;
        return Promise.resolve('ok');
      });

      const resultPromise = gitWithRetry('test', mockGitFn);
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(receivedGit).toBeDefined();
      expect(mockGitFn).toHaveBeenCalledWith(receivedGit);
    });
  });
});
