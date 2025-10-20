/**
 * manage_memory Tool Tests
 *
 * Tests for manage_memory tool parameter validation and handler behavior
 */

import { describe, it, expect } from 'vitest';
import {
  manageMemory,
  ManageMemorySchema,
} from '../../../src/tools/manage-memory.js';

describe('manage_memory tool', () => {
  describe('schema validation', () => {
    it('validates read action without section', () => {
      const params = { action: 'read' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates read action with section', () => {
      const params = { action: 'read', section: 'project-context' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates update action with required parameters', () => {
      const params = {
        action: 'update',
        section: 'project-context',
        content: 'New content',
      };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates append action with required parameters', () => {
      const params = {
        action: 'append',
        section: 'notes',
        content: 'Additional notes',
      };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates merge action with required parameters', () => {
      const params = {
        action: 'merge',
        section: 'dependencies',
        content: '- new-package',
      };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates update with mode parameter', () => {
      const params = {
        action: 'update',
        section: 'test',
        content: 'content',
        mode: 'replace',
      };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it('validates all mode values', () => {
      const modes = ['replace', 'append', 'merge'];
      modes.forEach((mode) => {
        const params = {
          action: 'update',
          section: 'test',
          content: 'content',
          mode,
        };
        const result = ManageMemorySchema.safeParse(params);
        expect(result.success).toBe(true);
      });
    });

    it('rejects update without section', () => {
      const params = { action: 'update', content: 'content' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects update without content', () => {
      const params = { action: 'update', section: 'test' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects append without section', () => {
      const params = { action: 'append', content: 'content' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects append without content', () => {
      const params = { action: 'append', section: 'test' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects merge without section', () => {
      const params = { action: 'merge', content: 'content' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects merge without content', () => {
      const params = { action: 'merge', section: 'test' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects mode parameter with non-update action', () => {
      const params = {
        action: 'append',
        section: 'test',
        content: 'content',
        mode: 'replace',
      };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });

    it('rejects invalid action', () => {
      const params = { action: 'invalid' };
      const result = ManageMemorySchema.safeParse(params);
      expect(result.success).toBe(false);
    });
  });

  describe('handler behavior', () => {
    it('returns success ToolResult for read', async () => {
      const result = await manageMemory.handler({ action: 'read' });
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');
      expect(result.isError).toBe(false);
    });

    it('mentions Epic 6 in placeholder message', async () => {
      const result = await manageMemory.handler({ action: 'read' });
      expect(result.content[0].text).toContain('Epic 6');
    });

    it('describes read action correctly', async () => {
      const result = await manageMemory.handler({ action: 'read' });
      expect(result.content[0].text).toContain('Read all sections');
    });

    it('describes read with section correctly', async () => {
      const result = await manageMemory.handler({
        action: 'read',
        section: 'project-context',
      });
      expect(result.content[0].text).toContain('Read section "project-context"');
    });

    it('describes update action correctly', async () => {
      const result = await manageMemory.handler({
        action: 'update',
        section: 'test',
        content: 'content',
      });
      expect(result.content[0].text).toContain('Update section "test"');
    });

    it('includes mode in update description', async () => {
      const result = await manageMemory.handler({
        action: 'update',
        section: 'test',
        content: 'content',
        mode: 'merge',
      });
      expect(result.content[0].text).toContain('mode: merge');
    });

    it('defaults to replace mode when not specified', async () => {
      const result = await manageMemory.handler({
        action: 'update',
        section: 'test',
        content: 'content',
      });
      expect(result.content[0].text).toContain('mode: replace');
    });
  });

  describe('tool definition', () => {
    it('has correct name', () => {
      expect(manageMemory.name).toBe('manage_memory');
    });

    it('has non-empty description', () => {
      expect(manageMemory.description).toBeTruthy();
      expect(manageMemory.description.length).toBeGreaterThan(0);
    });

    it('has inputSchema defined', () => {
      expect(manageMemory.inputSchema).toBeDefined();
    });

    it('has handler function', () => {
      expect(manageMemory.handler).toBeTypeOf('function');
    });
  });
});
