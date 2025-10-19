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

    it('starts empty (skeleton implementation)', () => {
      // Story 1.1 only sets up infrastructure
      // Tools will be added in Story 1.2+
      expect(TOOLS).toHaveLength(0);
    });
  });

  describe('Resource Registry', () => {
    it('exports RESOURCES array', () => {
      expect(RESOURCES).toBeDefined();
      expect(Array.isArray(RESOURCES)).toBe(true);
    });

    it('starts empty (skeleton implementation)', () => {
      // Resources will be added in future stories
      expect(RESOURCES).toHaveLength(0);
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
