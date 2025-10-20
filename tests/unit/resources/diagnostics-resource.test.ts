/**
 * Tests for diagnostics resource
 */

import { describe, it, expect } from 'vitest';
import { diagnosticsResource } from '../../../src/resources/diagnostics-resource.js';

describe('Diagnostics Resource', () => {
  describe('provider behavior', () => {
    it('returns ResourceContent with correct uri', async () => {
      const result = await diagnosticsResource.provider();
      expect(result.uri).toBe('contextualizer://diagnostics');
    });

    it('returns MIME type application/json', async () => {
      const result = await diagnosticsResource.provider();
      expect(result.mimeType).toBe('application/json');
    });

    it('returns text content', async () => {
      const result = await diagnosticsResource.provider();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
    });

    it('returns valid JSON structure', async () => {
      const result = await diagnosticsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed).toBeDefined();
    });

    it('includes timestamp field', async () => {
      const result = await diagnosticsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.timestamp).toBeDefined();
      expect(typeof parsed.timestamp).toBe('string');
      // Validate ISO 8601 format
      expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
    });

    it('includes version field', async () => {
      const result = await diagnosticsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.version).toBe('1.0.0');
    });

    it('includes summary object', async () => {
      const result = await diagnosticsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.summary).toBeDefined();
      expect(parsed.summary.total).toBe(0);
      expect(parsed.summary.passed).toBe(0);
      expect(parsed.summary.warnings).toBe(0);
      expect(parsed.summary.failures).toBe(0);
      expect(parsed.summary.message).toBeTruthy();
    });

    it('includes placeholder message in summary', async () => {
      const result = await diagnosticsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.summary.message).toContain('Placeholder');
      expect(parsed.summary.message).toContain('Epic 5');
    });

    it('includes empty checks array', async () => {
      const result = await diagnosticsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.checks).toBeDefined();
      expect(Array.isArray(parsed.checks)).toBe(true);
      expect(parsed.checks).toHaveLength(0);
    });

    it('does not include blob data', async () => {
      const result = await diagnosticsResource.provider();
      expect(result.blob).toBeUndefined();
    });

    it('formats JSON with indentation', async () => {
      const result = await diagnosticsResource.provider();
      // Should be formatted with 2-space indentation
      expect(result.text).toContain('\n  ');
    });
  });

  describe('resource definition', () => {
    it('has correct uri', () => {
      expect(diagnosticsResource.uri).toBe('contextualizer://diagnostics');
    });

    it('has name', () => {
      expect(diagnosticsResource.name).toBe('Diagnostics');
    });

    it('has description', () => {
      expect(diagnosticsResource.description).toBeTruthy();
      expect(diagnosticsResource.description).toContain('placeholder');
    });

    it('has correct MIME type', () => {
      expect(diagnosticsResource.mimeType).toBe('application/json');
    });

    it('has provider function', () => {
      expect(diagnosticsResource.provider).toBeTypeOf('function');
    });

    it('provider returns Promise', () => {
      const result = diagnosticsResource.provider();
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
