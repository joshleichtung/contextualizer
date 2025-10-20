/**
 * Registry Unit Tests
 *
 * Tests for tool, resource, and prompt registries
 */

import { describe, it, expect } from 'vitest';
import { TOOLS } from '../../src/tools/index.js';
import { RESOURCES } from '../../src/resources/index.js';
import { PROMPTS } from '../../src/prompts/index.js';

describe('Registries', () => {
  describe('Tool Registry', () => {
    it('exports TOOLS array', () => {
      expect(TOOLS).toBeDefined();
      expect(Array.isArray(TOOLS)).toBe(true);
    });

    it('has 5 tools registered (Story 1.2)', () => {
      // Story 1.2 implements 5 core tools
      expect(TOOLS).toHaveLength(5);
    });
  });

  describe('Resource Registry', () => {
    it('exports RESOURCES array', () => {
      expect(RESOURCES).toBeDefined();
      expect(Array.isArray(RESOURCES)).toBe(true);
    });

    it('has 3 resources registered (Story 1.3)', () => {
      // Story 1.3 implements 3 resources
      expect(RESOURCES).toHaveLength(3);
    });

    it('includes config, diagnostics, and presets resources', () => {
      const uris = RESOURCES.map((r) => r.uri);
      expect(uris).toContain('contextualizer://config');
      expect(uris).toContain('contextualizer://diagnostics');
      expect(uris).toContain('contextualizer://presets');
    });
  });

  describe('Prompt Registry', () => {
    it('exports PROMPTS array', () => {
      expect(PROMPTS).toBeDefined();
      expect(Array.isArray(PROMPTS)).toBe(true);
    });

    it('starts empty (skeleton implementation)', () => {
      // Prompts will be added in future stories
      expect(PROMPTS).toHaveLength(0);
    });
  });
});
