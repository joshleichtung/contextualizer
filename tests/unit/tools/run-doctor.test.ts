/**
 * run_doctor Tool Tests
 *
 * Tests for run_doctor tool parameter validation and handler behavior
 */

import { describe, it, expect } from 'vitest';
import {
  runDoctor,
  RunDoctorSchema,
} from '../../../src/tools/run-doctor.js';

describe('run_doctor tool', () => {
  describe('schema validation', () => {
    it('validates all category', () => {
      const params = { category: 'all' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates setup category', () => {
      const params = { category: 'setup' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates hooks category', () => {
      const params = { category: 'hooks' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates memory category', () => {
      const params = { category: 'memory' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates mcp category', () => {
      const params = { category: 'mcp' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates testing category', () => {
      const params = { category: 'testing' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates workflow category', () => {
      const params = { category: 'workflow' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('rejects invalid category values', () => {
      const params = { category: 'invalid' };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('defaults category to all', () => {
      const params = {};
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('all');
      }
    });

    it('validates autofix true', () => {
      const params = { autofix: true };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates autofix false', () => {
      const params = { autofix: false };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('defaults autofix to false', () => {
      const params = {};
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.autofix).toBe(false);
      }
    });

    it('validates optional checkIds array', () => {
      const params = { checkIds: ['check1', 'check2', 'check3'] };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates empty checkIds array', () => {
      const params = { checkIds: [] };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('handles all parameters together', () => {
      const params = {
        category: 'setup',
        autofix: true,
        checkIds: ['check1', 'check2'],
      };
      const result = RunDoctorSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });

  describe('handler behavior', () => {
    it('returns success ToolResult', async () => {
      const result = await runDoctor.handler({});
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });

    it('mentions Epic 5 in placeholder message', async () => {
      const result = await runDoctor.handler({});
      expect(result.content[0].text).toContain('Epic 5');
    });

    it('includes category in message', async () => {
      const result = await runDoctor.handler({ category: 'hooks' });
      expect(result.content[0].text).toContain('hooks');
    });

    it('indicates autofix when enabled', async () => {
      const result = await runDoctor.handler({ autofix: true });
      expect(result.content[0].text).toContain('autofix enabled');
    });

    it('includes checkIds when provided', async () => {
      const result = await runDoctor.handler({
        checkIds: ['check1', 'check2'],
      });
      expect(result.content[0].text).toContain('check1');
      expect(result.content[0].text).toContain('check2');
    });
  });

  describe('tool definition', () => {
    it('has correct name', () => {
      expect(runDoctor.name).toBe('run_doctor');
    });

    it('has non-empty description', () => {
      expect(runDoctor.description).toBeTruthy();
      expect(runDoctor.description.length).toBeGreaterThan(0);
    });

    it('has inputSchema defined', () => {
      expect(runDoctor.inputSchema).toBeDefined();
    });

    it('has handler function', () => {
      expect(runDoctor.handler).toBeTypeOf('function');
    });
  });
});
