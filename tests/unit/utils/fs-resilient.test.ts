/**
 * Filesystem Resilience Tests
 *
 * Tests for resilient filesystem operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FileOperationError } from '../../../src/utils/errors.js';
import { getCircuitBreaker } from '../../../src/utils/circuit-breaker.js';

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
} from '../../../src/utils/fs-resilient.js';

describe('Filesystem Resilient Operations', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    getCircuitBreaker('filesystem').reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('readFileWithRetry', () => {
    it('reads file successfully without retry', async () => {
      vi.spyOn(fs, 'readFile').mockResolvedValue('file content');

      const resultPromise = readFileWithRetry('/test/file.txt');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('file content');
      expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    it('retries on EBUSY error', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';

      vi.spyOn(fs, 'readFile')
        .mockRejectedValueOnce(ebusyError)
        .mockRejectedValueOnce(ebusyError)
        .mockResolvedValueOnce('file content');

      const resultPromise = readFileWithRetry('/test/file.txt');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('file content');
      expect(fs.readFile).toHaveBeenCalledTimes(3);
    });

    it('retries on EACCES error', async () => {
      const eaccesError: any = new Error('EACCES');
      eaccesError.code = 'EACCES';

      vi.spyOn(fs, 'readFile')
        .mockRejectedValueOnce(eaccesError)
        .mockResolvedValueOnce('file content');

      const resultPromise = readFileWithRetry('/test/file.txt');
      await vi.runAllTimersAsync();
      const result = await resultPromise;

      expect(result).toBe('file content');
      expect(fs.readFile).toHaveBeenCalledTimes(2);
    });

    it('fails immediately on non-retryable error', async () => {
      const enoentError: any = new Error('ENOENT');
      enoentError.code = 'ENOENT';

      vi.spyOn(fs, 'readFile').mockRejectedValue(enoentError);

      const resultPromise = readFileWithRetry('/test/file.txt');

      try {
        await vi.runAllTimersAsync();
        await resultPromise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(FileOperationError);
        expect((error as FileOperationError).isRetryable).toBe(false);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
      }
    });

    it('throws FileOperationError with details', async () => {
      const error = new Error('Test error');
      vi.spyOn(fs, 'readFile').mockRejectedValue(error);

      const resultPromise = readFileWithRetry('/test/file.txt');

      try {
        await vi.runAllTimersAsync();
        await resultPromise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(FileOperationError);
        const fileError = error as FileOperationError;
        expect(fileError.message).toContain('Failed to read file');
        expect(fileError.message).toContain('/test/file.txt');
        expect(fileError.details).toBeDefined();
      }
    });

    it('uses circuit breaker protection', async () => {
      const error = new Error('Filesystem error');
      vi.spyOn(fs, 'readFile').mockRejectedValue(error);

      // Trip the circuit breaker (5 failures)
      for (let i = 0; i < 5; i++) {
        try {
          const promise = readFileWithRetry(`/test/file${i}.txt`);
          await vi.runAllTimersAsync();
          await promise;
        } catch {}
      }

      // Next call should be rejected by circuit breaker
      try {
        await readFileWithRetry('/test/another.txt');
        expect.fail('Should have thrown circuit breaker error');
      } catch (error: any) {
        expect(error.code).toBe('CIRCUIT_BREAKER_OPEN');
      }
    });
  });

  describe('writeFileWithRetry', () => {
    it('writes file successfully without retry', async () => {
      vi.spyOn(fs, 'writeFile').mockResolvedValue(undefined);

      const resultPromise = writeFileWithRetry('/test/file.txt', 'content');
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(fs.writeFile).toHaveBeenCalledWith('/test/file.txt', 'content', 'utf8');
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
    });

    it('retries on EBUSY error', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';

      vi.spyOn(fs, 'writeFile')
        .mockRejectedValueOnce(ebusyError)
        .mockResolvedValueOnce(undefined);

      const resultPromise = writeFileWithRetry('/test/file.txt', 'content');
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(fs.writeFile).toHaveBeenCalledTimes(2);
    });

    it('fails on non-retryable error', async () => {
      const error = new Error('Not retryable');
      vi.spyOn(fs, 'writeFile').mockRejectedValue(error);

      const resultPromise = writeFileWithRetry('/test/file.txt', 'content');

      try {
        await vi.runAllTimersAsync();
        await resultPromise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(FileOperationError);
      }
    });
  });

  describe('ensureDirWithRetry', () => {
    it('creates directory successfully without retry', async () => {
      vi.spyOn(fs, 'ensureDir').mockResolvedValue(undefined);

      const resultPromise = ensureDirWithRetry('/test/dir');
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(fs.ensureDir).toHaveBeenCalledWith('/test/dir');
      expect(fs.ensureDir).toHaveBeenCalledTimes(1);
    });

    it('retries on EBUSY error', async () => {
      const ebusyError: any = new Error('EBUSY');
      ebusyError.code = 'EBUSY';

      vi.spyOn(fs, 'ensureDir')
        .mockRejectedValueOnce(ebusyError)
        .mockResolvedValueOnce(undefined);

      const resultPromise = ensureDirWithRetry('/test/dir');
      await vi.runAllTimersAsync();
      await resultPromise;

      expect(fs.ensureDir).toHaveBeenCalledTimes(2);
    });

    it('throws FileOperationError with details', async () => {
      const error = new Error('Test error');
      vi.spyOn(fs, 'ensureDir').mockRejectedValue(error);

      const resultPromise = ensureDirWithRetry('/test/dir');

      try {
        await vi.runAllTimersAsync();
        await resultPromise;
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(FileOperationError);
        const fileError = error as FileOperationError;
        expect(fileError.message).toContain('Failed to create directory');
        expect(fileError.message).toContain('/test/dir');
      }
    });
  });
});
