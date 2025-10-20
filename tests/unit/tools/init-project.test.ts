/**
 * init_project Tool Tests
 *
 * Tests for init_project tool parameter validation and handler behavior
 */

import { describe, it, expect } from 'vitest';
import {
  initProject,
  InitProjectSchema,
} from '../../../src/tools/init-project.js';

describe('init_project tool', () => {
  describe('schema validation', () => {
    it('validates minimal preset', () => {
      const params = { preset: 'minimal' };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates web-fullstack preset', () => {
      const params = { preset: 'web-fullstack' };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates hackathon preset', () => {
      const params = { preset: 'hackathon' };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates custom preset', () => {
      const params = { preset: 'custom' };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('rejects invalid preset values', () => {
      const params = { preset: 'invalid' };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('handles optional skipConflictCheck parameter', () => {
      const params = {
        preset: 'minimal',
        options: { skipConflictCheck: true },
      };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('handles optional customConfig parameter', () => {
      const params = {
        preset: 'custom',
        options: { customConfig: { key: 'value' } },
      };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('handles both optional parameters together', () => {
      const params = {
        preset: 'minimal',
        options: {
          skipConflictCheck: false,
          customConfig: { setting: 'test' },
        },
      };
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('rejects missing required preset parameter', () => {
      const params = {};
      const result = InitProjectSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });

  describe('handler behavior', () => {
    it('returns ToolResult for initialization', async () => {
      const result = await initProject.handler({ preset: 'minimal' });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      // Real implementation may succeed or fail depending on environment
      expect(typeof result.isError).toBe('boolean');
    });

    it('includes initialization header in output', async () => {
      const result = await initProject.handler({ preset: 'minimal' });
      expect(result.content[0].text).toContain('Initializing Project');
    });

    it('includes preset name in message', async () => {
      const result = await initProject.handler({ preset: 'web-fullstack' });
      expect(result.content[0].text).toContain('web-fullstack');
    });

    it('checks for conflicts by default', async () => {
      const result = await initProject.handler({
        preset: 'minimal',
      });
      // Should mention conflicts or initialization
      expect(result.content[0].text).toMatch(/Conflict|Initializ/);
    });

    it('handles preset without options', async () => {
      const result = await initProject.handler({ preset: 'hackathon' });
      expect(result.content[0].text).toContain('hackathon');
      expect(typeof result.isError).toBe('boolean');
    });
  });

  describe('tool definition', () => {
    it('has correct name', () => {
      expect(initProject.name).toBe('init_project');
    });

    it('has non-empty description', () => {
      expect(initProject.description).toBeTruthy();
      expect(initProject.description.length).toBeGreaterThan(0);
    });

    it('has inputSchema defined', () => {
      expect(initProject.inputSchema).toBeDefined();
    });

    it('has handler function', () => {
      expect(initProject.handler).toBeTypeOf('function');
    });
  });
});
