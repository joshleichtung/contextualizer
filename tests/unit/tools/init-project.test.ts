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
    it('returns success ToolResult', async () => {
      const result = await initProject.handler({ preset: 'minimal' });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });

    it('mentions Epic 2 in placeholder message', async () => {
      const result = await initProject.handler({ preset: 'minimal' });
      expect(result.content[0].text).toContain('Epic 2');
    });

    it('includes preset name in message', async () => {
      const result = await initProject.handler({ preset: 'web-fullstack' });
      expect(result.content[0].text).toContain('web-fullstack');
    });

    it('indicates skip conflict check when requested', async () => {
      const result = await initProject.handler({
        preset: 'minimal',
        options: { skipConflictCheck: true },
      });
      expect(result.content[0].text).toContain('Skip conflict checks');
    });

    it('handles preset without options', async () => {
      const result = await initProject.handler({ preset: 'hackathon' });
      expect(result.content[0].text).toContain('✅ init_project');
      expect(result.isError).toBe(false);
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
