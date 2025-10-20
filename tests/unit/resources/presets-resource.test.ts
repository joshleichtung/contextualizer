/**
 * Tests for presets resource
 */

import { describe, it, expect } from 'vitest';
import { presetsResource } from '../../../src/resources/presets-resource.js';
import { PRESETS } from '../../../src/config/presets.js';

describe('Presets Resource', () => {
  describe('provider behavior', () => {
    it('returns ResourceContent with correct uri', async () => {
      const result = await presetsResource.provider();
      expect(result.uri).toBe('contextualizer://presets');
    });

    it('returns MIME type application/json', async () => {
      const result = await presetsResource.provider();
      expect(result.mimeType).toBe('application/json');
    });

    it('returns text content', async () => {
      const result = await presetsResource.provider();
      expect(result.text).toBeTruthy();
      expect(typeof result.text).toBe('string');
    });

    it('returns valid JSON structure', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed).toBeDefined();
    });

    it('includes presets array', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.presets).toBeDefined();
      expect(Array.isArray(parsed.presets)).toBe(true);
    });

    it('returns all 3 presets', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.presets).toHaveLength(3);
    });

    it('includes minimal preset', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      const names = parsed.presets.map((p: any) => p.name);
      expect(names).toContain('minimal');
    });

    it('includes web-fullstack preset', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      const names = parsed.presets.map((p: any) => p.name);
      expect(names).toContain('web-fullstack');
    });

    it('includes hackathon preset', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      const names = parsed.presets.map((p: any) => p.name);
      expect(names).toContain('hackathon');
    });

    it('each preset has required fields', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      parsed.presets.forEach((preset: any) => {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.installationTime).toBeTruthy();
        expect(preset.contextMonitoring).toBeDefined();
        expect(preset.hooks).toBeDefined();
        expect(preset.memory).toBeDefined();
      });
    });

    it('web-fullstack preset includes skills array', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      const webFullstack = parsed.presets.find(
        (p: any) => p.name === 'web-fullstack',
      );
      expect(webFullstack.skills).toBeDefined();
      expect(Array.isArray(webFullstack.skills)).toBe(true);
      expect(webFullstack.skills.length).toBeGreaterThan(0);
    });

    it('web-fullstack preset includes subagents array', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      const webFullstack = parsed.presets.find(
        (p: any) => p.name === 'web-fullstack',
      );
      expect(webFullstack.subagents).toBeDefined();
      expect(Array.isArray(webFullstack.subagents)).toBe(true);
      expect(webFullstack.subagents.length).toBeGreaterThan(0);
    });

    it('web-fullstack preset includes coding standards', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      const webFullstack = parsed.presets.find(
        (p: any) => p.name === 'web-fullstack',
      );
      expect(webFullstack.codingStandards).toBeDefined();
      expect(Array.isArray(webFullstack.codingStandards)).toBe(true);
      expect(webFullstack.codingStandards.length).toBeGreaterThan(0);
    });

    it('web-fullstack preset includes context7Libraries', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      const webFullstack = parsed.presets.find(
        (p: any) => p.name === 'web-fullstack',
      );
      expect(webFullstack.memory.context7Libraries).toBeDefined();
      expect(Array.isArray(webFullstack.memory.context7Libraries)).toBe(true);
      expect(webFullstack.memory.context7Libraries.length).toBeGreaterThan(0);
    });

    it('does not include blob data', async () => {
      const result = await presetsResource.provider();
      expect(result.blob).toBeUndefined();
    });

    it('formats JSON with indentation', async () => {
      const result = await presetsResource.provider();
      // Should be formatted with 2-space indentation
      expect(result.text).toContain('\n  ');
    });

    it('returns same data as PRESETS constant', async () => {
      const result = await presetsResource.provider();
      const parsed = JSON.parse(result.text!);
      expect(parsed.presets).toEqual(PRESETS);
    });
  });

  describe('resource definition', () => {
    it('has correct uri', () => {
      expect(presetsResource.uri).toBe('contextualizer://presets');
    });

    it('has name', () => {
      expect(presetsResource.name).toBe('Presets');
    });

    it('has description', () => {
      expect(presetsResource.description).toBeTruthy();
      expect(presetsResource.description).toContain('preset');
    });

    it('has correct MIME type', () => {
      expect(presetsResource.mimeType).toBe('application/json');
    });

    it('has provider function', () => {
      expect(presetsResource.provider).toBeTypeOf('function');
    });

    it('provider returns Promise', () => {
      const result = presetsResource.provider();
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
