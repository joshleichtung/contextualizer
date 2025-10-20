/**
 * get_config Tool Tests
 *
 * Tests for get_config tool parameter validation and handler behavior
 */

import { describe, it, expect } from 'vitest';
import {
  getConfig,
  GetConfigSchema,
} from '../../../src/tools/get-config.js';

describe('get_config tool', () => {
  describe('schema validation', () => {
    it('validates yaml format', () => {
      const params = { format: 'yaml' };
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates json format', () => {
      const params = { format: 'json' };
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('rejects invalid format', () => {
      const params = { format: 'xml' };
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('defaults format to yaml', () => {
      const params = {};
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('yaml');
      }
    });

    it('validates includeDefaults true', () => {
      const params = { includeDefaults: true };
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates includeDefaults false', () => {
      const params = { includeDefaults: false };
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('defaults includeDefaults to false', () => {
      const params = {};
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeDefaults).toBe(false);
      }
    });

    it('validates both parameters together', () => {
      const params = { format: 'json', includeDefaults: true };
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates empty object with defaults', () => {
      const params = {};
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.format).toBe('yaml');
        expect(result.data.includeDefaults).toBe(false);
      }
    });

    it('rejects non-boolean includeDefaults', () => {
      const params = { includeDefaults: 'yes' };
      const result = GetConfigSchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });

  describe('handler behavior', () => {
    it('returns success ToolResult', async () => {
      const result = await getConfig.handler({});
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });

    it('mentions Epic 6 in placeholder message', async () => {
      const result = await getConfig.handler({});
      expect(result.content[0].text).toContain('Epic 6');
    });

    it('uses default yaml format', async () => {
      const result = await getConfig.handler({});
      expect(result.content[0].text).toContain('yaml');
    });

    it('includes json format when requested', async () => {
      const result = await getConfig.handler({ format: 'json' });
      expect(result.content[0].text).toContain('json');
    });

    it('indicates includeDefaults when true', async () => {
      const result = await getConfig.handler({ includeDefaults: true });
      expect(result.content[0].text).toContain('Include default values');
    });

    it('does not mention defaults when false', async () => {
      const result = await getConfig.handler({ includeDefaults: false });
      expect(result.content[0].text).not.toContain('Include default values');
    });

    it('handles both parameters correctly', async () => {
      const result = await getConfig.handler({
        format: 'json',
        includeDefaults: true,
      });
      expect(result.content[0].text).toContain('json');
      expect(result.content[0].text).toContain('Include default values');
    });
  });

  describe('tool definition', () => {
    it('has correct name', () => {
      expect(getConfig.name).toBe('get_config');
    });

    it('has non-empty description', () => {
      expect(getConfig.description).toBeTruthy();
      expect(getConfig.description.length).toBeGreaterThan(0);
    });

    it('has inputSchema defined', () => {
      expect(getConfig.inputSchema).toBeDefined();
    });

    it('has handler function', () => {
      expect(getConfig.handler).toBeTypeOf('function');
    });
  });
});
