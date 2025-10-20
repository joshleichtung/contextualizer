/**
 * Error Recovery Integration Tests
 *
 * Tests for end-to-end error recovery scenarios
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  FileOperationError,
  GitOperationError,
  formatErrorResponse,
} from '../../src/utils/errors.js';
import { getCircuitBreaker, CircuitState } from '../../src/utils/circuit-breaker.js';
import { withErrorContext } from '../../src/utils/error-context.js';

// Mock fs-extra before importing modules that use it
vi.mock('fs-extra', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  ensureDir: vi.fn(),
}));

import * as fs from 'fs-extra';
import {
  readFileWithRetry,
  writeFileWithRetry,
  ensureDirWithRetry,
} from '../../src/utils/fs-resilient.js';
import { gitWithRetry } from '../../src/utils/git-resilient.js';

describe('Error Recovery Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getCircuitBreaker('filesystem').reset();
    getCircuitBreaker('git').reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('File Lock Contention Recovery', () => {
    it('retries and eventually succeeds on EBUSY', async () => {
      let attemptCount = 0;
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';

      vi.spyOn(fs, 'readFile').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw ebusyError;
        }
        return 'file content';
      });

      const resultPromise = readFileWithRetry('/test/locked-file.txt');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('file content');
      expect(attemptCount).toBe(3);
      expect(fs.readFile).toHaveBeenCalledTimes(3);
    });

    it('includes breadcrumbs when max retries exceeded', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';
      vi.spyOn(fs, 'readFile').mockRejectedValue(ebusyError);

      try {
        const promise = withErrorContext('integration-test', async () => {
          return await readFileWithRetry('/test/file.txt');
        });
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(FileOperationError);
        const fileError = error as FileOperationError;
        expect(fileError.retryCount).toBe(1); // retryCount increments once per error instance
        expect(fileError.details).toBeDefined();
        const details = fileError.details as any;
        expect(details.breadcrumbs).toBeDefined();
        expect(details.breadcrumbs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Git Lock Recovery', () => {
    it('retries on git lock file contention', async () => {
      let attemptCount = 0;
      const lockError = new Error('index.lock: File exists');

      const mockGitFn = vi.fn(async () => {
        attemptCount++;
        if (attemptCount < 2) {
          throw lockError;
        }
        return 'success';
      });

      const resultPromise = gitWithRetry('commit', mockGitFn);
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('success');
      expect(attemptCount).toBe(2);
    });

    it('includes breadcrumbs in git operation errors', async () => {
      const lockError = new Error('index.lock: File exists');
      const mockGitFn = vi.fn().mockRejectedValue(lockError);

      try {
        const promise = withErrorContext('git-integration-test', async () => {
          return await gitWithRetry('add', mockGitFn);
        });
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(GitOperationError);
        const gitError = error as GitOperationError;
        expect(gitError.retryCount).toBeGreaterThan(0);
        const details = gitError.details as any;
        expect(details.breadcrumbs).toBeDefined();
      }
    });
  });

  describe('Circuit Breaker Protection', () => {
    it('opens circuit after threshold failures and prevents cascading', async () => {
      const error = new Error('Filesystem error');
      vi.spyOn(fs, 'readFile').mockRejectedValue(error);

      // Trip the circuit breaker with 5 failures
      for (let i = 0; i < 5; i++) {
        try {
          const promise = readFileWithRetry(`/test/file${i}.txt`);
          await vi.runAllTimersAsync();
          await promise;
        } catch {}
      }

      const breaker = getCircuitBreaker('filesystem');
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Next request should be rejected immediately without calling fs.readFile
      const callsBefore = (fs.readFile as any).mock.calls.length;
      try {
        await readFileWithRetry('/test/another.txt');
        expect.fail('Should have thrown error');
      } catch (error: any) {
        expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
        const callsAfter = (fs.readFile as any).mock.calls.length;
        expect(callsAfter).toBe(callsBefore); // No new calls
      }
    });

    it('recovers through HALF_OPEN state', async () => {
      const error = new Error('Filesystem error');
      vi.spyOn(fs, 'readFile').mockRejectedValue(error);

      // Trip the breaker
      for (let i = 0; i < 5; i++) {
        try {
          const promise = readFileWithRetry(`/test/file${i}.txt`);
          await vi.runAllTimersAsync();
          await promise;
        } catch {}
      }

      const breaker = getCircuitBreaker('filesystem');
      expect(breaker.getState()).toBe(CircuitState.OPEN);

      // Wait for reset timeout
      vi.advanceTimersByTime(60000);

      // Mock successful operations
      vi.spyOn(fs, 'readFile').mockResolvedValue('content');

      // Three successful attempts should close the circuit
      for (let i = 0; i < 3; i++) {
        const promise = readFileWithRetry(`/test/recovery${i}.txt`);
        await vi.runAllTimersAsync();
        await promise;
      }

      expect(breaker.getState()).toBe(CircuitState.CLOSED);
    });
  });

  describe('Breadcrumb Tracking', () => {
    it('tracks operation chain in breadcrumbs', async () => {
      const error = new Error('Test error');
      vi.spyOn(fs, 'readFile').mockRejectedValue(error);

      try {
        await withErrorContext('outer-operation', async () => {
          const context = (await import('../../src/utils/error-context.js')).getErrorContext();
          context.addBreadcrumb('middle-step', { step: 1 });
          context.addBreadcrumb('inner-step', { step: 2 });
          return await readFileWithRetry('/test/file.txt');
        });
        await vi.runAllTimersAsync();
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        const details = fileError.details as any;
        expect(details.breadcrumbs).toBeDefined();

        const operations = details.breadcrumbs.map((b: any) => b.operation);
        expect(operations).toContain('outer-operation');
        expect(operations).toContain('middle-step');
        expect(operations).toContain('inner-step');
        expect(operations).toContain('readFileWithRetry');
      }
    });

    it('breadcrumbs appear in formatted error response', async () => {
      const error = new Error('Test error');
      vi.spyOn(fs, 'writeFile').mockRejectedValue(error);

      try {
        await withErrorContext('write-operation', async () => {
          return await writeFileWithRetry('/test/file.txt', 'content');
        });
        await vi.runAllTimersAsync();
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        const formatted = formatErrorResponse(fileError);

        expect(formatted).toContain('Operation trace:');
        expect(formatted).toContain('write-operation');
        expect(formatted).toContain('writeFileWithRetry');
      }
    });
  });

  describe('Recovery Suggestions', () => {
    it('provides appropriate suggestions for filesystem errors', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';
      vi.spyOn(fs, 'readFile').mockRejectedValue(ebusyError);

      try {
        const promise = readFileWithRetry('/test/file.txt');
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        expect(fileError.recoverySuggestions).toContain('Operation will be retried automatically');
        expect(fileError.recoverySuggestions).toContain('Check file permissions if error persists');
      }
    });

    it('provides appropriate suggestions for git errors', async () => {
      const lockError = new Error('index.lock: File exists');
      const mockGitFn = vi.fn().mockRejectedValue(lockError);

      try {
        const promise = gitWithRetry('commit', mockGitFn);
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const gitError = error as GitOperationError;
        expect(gitError.recoverySuggestions).toContain('Operation will be retried automatically');
        expect(gitError.recoverySuggestions).toContain(
          'Check if git repository is locked by another process'
        );
      }
    });

    it('formats suggestions in error response', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';
      vi.spyOn(fs, 'readFile').mockRejectedValue(ebusyError);

      try {
        const promise = readFileWithRetry('/test/file.txt');
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        const formatted = formatErrorResponse(fileError);

        expect(formatted).toContain('**Recovery Suggestions**:');
        expect(formatted).toContain('1. Operation will be retried automatically');
        expect(formatted).toContain('2. Check file permissions if error persists');
      }
    });
  });

  describe('Retry Count Tracking', () => {
    it('tracks retry attempts in error', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';
      vi.spyOn(fs, 'readFile').mockRejectedValue(ebusyError);

      try {
        const promise = readFileWithRetry('/test/file.txt');
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        expect(fileError.retryCount).toBe(1); // retryCount increments once per error instance
      }
    });

    it('includes retry count in error response', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';
      vi.spyOn(fs, 'readFile').mockRejectedValue(ebusyError);

      try {
        const promise = readFileWithRetry('/test/file.txt');
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        const formatted = formatErrorResponse(fileError);

        expect(formatted).toContain('**Retry Attempts**: 1'); // retryCount increments once per error instance
      }
    });
  });

  describe('Error Category Routing', () => {
    it('categorizes filesystem errors correctly', async () => {
      const error = new Error('Test error');
      vi.spyOn(fs, 'readFile').mockRejectedValue(error);

      try {
        const promise = readFileWithRetry('/test/file.txt');
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        expect(fileError.category).toBe('filesystem');
        expect(fileError.code).toBe('FILE_OPERATION_ERROR');
      }
    });

    it('categorizes git errors correctly', async () => {
      const error = new Error('Test error');
      const mockGitFn = vi.fn().mockRejectedValue(error);

      try {
        const promise = gitWithRetry('status', mockGitFn);
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const gitError = error as GitOperationError;
        expect(gitError.category).toBe('git');
        expect(gitError.code).toBe('GIT_OPERATION_ERROR');
      }
    });

    it('includes category in error response', async () => {
      const error = new Error('Test error');
      vi.spyOn(fs, 'readFile').mockRejectedValue(error);

      try {
        const promise = readFileWithRetry('/test/file.txt');
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        const formatted = formatErrorResponse(fileError);

        expect(formatted).toContain('**Category**: filesystem');
      }
    });
  });

  describe('Exponential Backoff', () => {
    it('applies exponential backoff between retries', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';
      const delays: number[] = [];

      (fs.readFile as any).mockRejectedValue(ebusyError);

      const promise = readFileWithRetry('/test/file.txt');

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
        await promise;
      } catch {
        // Expected to fail
      }

      // Delays should be exponential: 100ms, 200ms (timer mock captures first 2 delays)
      expect(delays.length).toBeGreaterThanOrEqual(2);
      expect(delays[0]).toBe(100);
      expect(delays[1]).toBe(200);
    });
  });

  describe('Non-Retryable Fast Fail', () => {
    it('fails immediately on non-retryable error', async () => {
      const enoentError: any = new Error('ENOENT');
      enoentError.code = 'ENOENT';
      vi.spyOn(fs, 'readFile').mockRejectedValue(enoentError);

      try {
        const promise = readFileWithRetry('/test/missing.txt');
        await vi.runAllTimersAsync();
        await promise;
        expect.fail('Should have thrown error');
      } catch (error) {
        const fileError = error as FileOperationError;
        expect(fileError.retryCount).toBe(1); // retryCount increments once per error instance
        expect(fileError.isRetryable).toBe(false);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
      }
    });
  });
});
