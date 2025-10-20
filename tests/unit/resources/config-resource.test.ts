/**
 * Tests for config resource
 */

import { describe, it, expect } from 'vitest';
import { configResource } from '../../../src/resources/config-resource.js';

describe('Config Resource', () => {
  describe('provider behavior', () => {
    it('returns ResourceContent with correct uri', async () => {
      const result = await configResource.provider();
      expect(result.uri).toBe('contextualizer://config');
    });

    it('returns MIME type application/x-yaml', async () => {
      const result = await configResource.provider();
      expect(result.mimeType).toBe('application/x-yaml');
    });

    it('returns text content', async () => {
      const result = await configResource.provider();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
    });

    it('returns valid YAML structure', async () => {
      const result = await configResource.provider();
      expect(result.text).toContain('version:');
      expect(result.text).toContain('preset:');
    });

    it('includes placeholder comment', async () => {
      const result = await configResource.provider();
      expect(result.text).toContain('Placeholder');
      expect(result.text).toContain('Epic 6');
    });

    it('includes version field', async () => {
      const result = await configResource.provider();
      expect(result.text).toContain('version: "1.0.0"');
    });

    it('includes preset placeholder', async () => {
      const result = await configResource.provider();
      expect(result.text).toContain('preset: "placeholder"');
    });

    it('explains future functionality', async () => {
      const result = await configResource.provider();
      expect(result.text).toContain('This resource will provide:');
      expect(result.text).toContain('Current effective configuration');
      expect(result.text).toContain('Merged preset defaults');
    });

    it('does not include blob data', async () => {
      const result = await configResource.provider();
      expect(result.blob).toBeUndefined();
    });
  });

  describe('resource definition', () => {
    it('has correct uri', () => {
      expect(configResource.uri).toBe('contextualizer://config');
    });

    it('has name', () => {
      expect(configResource.name).toBe('Configuration');
    });

    it('has description', () => {
      expect(configResource.description).toBeTruthy();
      expect(configResource.description).toContain('placeholder');
    });

    it('has correct MIME type', () => {
      expect(configResource.mimeType).toBe('application/x-yaml');
    });

    it('has provider function', () => {
      expect(configResource.provider).toBeTypeOf('function');
    });

    it('provider returns Promise', () => {
      const result = configResource.provider();
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
