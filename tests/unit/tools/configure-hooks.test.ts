/**
 * configure_hooks Tool Tests
 *
 * Tests for configure_hooks tool parameter validation and handler behavior
 */

import { describe, it, expect } from 'vitest';
import {
  configureHooks,
  ConfigureHooksSchema,
} from '../../../src/tools/configure-hooks.js';

describe('configure_hooks tool', () => {
  describe('schema validation', () => {
    it('validates user-prompt-submit hookType', () => {
      const params = { hookType: 'user-prompt-submit', action: 'update' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates pre-commit hookType', () => {
      const params = { hookType: 'pre-commit', action: 'update' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('rejects invalid hookType', () => {
      const params = { hookType: 'invalid', action: 'update' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('validates update action', () => {
      const params = { hookType: 'user-prompt-submit', action: 'update' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates disable action', () => {
      const params = { hookType: 'user-prompt-submit', action: 'disable' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates enable action', () => {
      const params = { hookType: 'user-prompt-submit', action: 'enable' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('rejects invalid action', () => {
      const params = { hookType: 'user-prompt-submit', action: 'invalid' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('validates optional config with strictness', () => {
      const params = {
        hookType: 'user-prompt-submit',
        action: 'update',
        config: { strictness: 'strict' },
      };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates all strictness levels', () => {
      const levels = ['strict', 'balanced', 'relaxed'];
      levels.forEach((level) => {
        const params = {
          hookType: 'user-prompt-submit',
          action: 'update',
          config: { strictness: level },
        };
        const result = ConfigureHooksSchema.safeParse(params);
        expect(result.success).toBe(true);
      });
    });

    it('validates optional config with thresholds', () => {
      const params = {
        hookType: 'user-prompt-submit',
        action: 'update',
        config: { thresholds: { warning: 50, critical: 80 } },
      };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('rejects thresholds below 0', () => {
      const params = {
        hookType: 'user-prompt-submit',
        action: 'update',
        config: { thresholds: { warning: -1, critical: 80 } },
      };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects thresholds above 100', () => {
      const params = {
        hookType: 'user-prompt-submit',
        action: 'update',
        config: { thresholds: { warning: 50, critical: 101 } },
      };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('validates optional config with checks array', () => {
      const params = {
        hookType: 'user-prompt-submit',
        action: 'update',
        config: {
          checks: [
            { name: 'check1', failOn: 'errors' },
            { name: 'check2', failOn: 'warnings' },
            { name: 'check3', failOn: 'never' },
          ],
        },
      };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates complete config object', () => {
      const params = {
        hookType: 'pre-commit',
        action: 'update',
        config: {
          strictness: 'balanced',
          thresholds: { warning: 60, critical: 90 },
          checks: [{ name: 'lint', failOn: 'errors' }],
        },
      };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('requires both hookType and action', () => {
      const params = { hookType: 'user-prompt-submit' };
      const result = ConfigureHooksSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });

  describe('handler behavior', () => {
    it('returns success ToolResult', async () => {
      const result = await configureHooks.handler({
        hookType: 'user-prompt-submit',
        action: 'update',
      });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });

    it('mentions Epic 4 in placeholder message', async () => {
      const result = await configureHooks.handler({
        hookType: 'user-prompt-submit',
        action: 'update',
      });
      expect(result.content[0].text).toContain('Epic 4');
    });

    it('includes action in message', async () => {
      const result = await configureHooks.handler({
        hookType: 'pre-commit',
        action: 'disable',
      });
      expect(result.content[0].text).toContain('Disable');
    });

    it('includes hookType in message', async () => {
      const result = await configureHooks.handler({
        hookType: 'pre-commit',
        action: 'enable',
      });
      expect(result.content[0].text).toContain('pre-commit');
    });

    it('includes strictness when provided', async () => {
      const result = await configureHooks.handler({
        hookType: 'user-prompt-submit',
        action: 'update',
        config: { strictness: 'strict' },
      });
      expect(result.content[0].text).toContain('strict');
    });
  });

  describe('tool definition', () => {
    it('has correct name', () => {
      expect(configureHooks.name).toBe('configure_hooks');
    });

    it('has non-empty description', () => {
      expect(configureHooks.description).toBeTruthy();
      expect(configureHooks.description.length).toBeGreaterThan(0);
    });

    it('has inputSchema defined', () => {
      expect(configureHooks.inputSchema).toBeDefined();
    });

    it('has handler function', () => {
      expect(configureHooks.handler).toBeTypeOf('function');
    });
  });
});
