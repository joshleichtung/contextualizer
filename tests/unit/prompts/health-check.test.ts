/**
 * Tests for health_check prompt
 */

import { describe, it, expect } from 'vitest';
import { healthCheckPrompt } from '../../../src/prompts/health-check.js';

describe('health_check prompt', () => {
  describe('prompt definition', () => {
    it('has correct name', () => {
      expect(healthCheckPrompt.name).toBe('health_check');
    });

    it('has description', () => {
      expect(healthCheckPrompt.description).toBeTruthy();
      expect(healthCheckPrompt.description).toContain('health');
    });

    it('has no required arguments', () => {
      expect(healthCheckPrompt.arguments).toBeDefined();
      expect(healthCheckPrompt.arguments).toHaveLength(0);
    });

    it('has provider function', () => {
      expect(healthCheckPrompt.provider).toBeTypeOf('function');
    });
  });

  describe('provider behavior', () => {
    it('returns valid PromptMessage array', async () => {
      const messages = await healthCheckPrompt.provider({});
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(1);
    });

    it('message has correct structure', async () => {
      const messages = await healthCheckPrompt.provider({});
      expect(messages[0].role).toBe('user');
      expect(messages[0].content.type).toBe('text');
      expect(messages[0].content.text).toBeTruthy();
    });

    it('works with no arguments', async () => {
      const messages = await healthCheckPrompt.provider({});
      expect(messages[0].content.text).toContain('health check');
    });

    it('lists diagnostic check categories', async () => {
      const messages = await healthCheckPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('15+ Diagnostic Checks');
      expect(text).toContain('Setup checks');
      expect(text).toContain('Hook checks');
      expect(text).toContain('Memory checks');
      expect(text).toContain('MCP checks');
    });

    it('mentions Epic 5 and run_doctor tool', async () => {
      const messages = await healthCheckPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('Epic 5');
      expect(text).toContain('run_doctor');
    });

    it('describes report format with status indicators', async () => {
      const messages = await healthCheckPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('Pass ✅');
      expect(text).toContain('Warn ⚠️');
      expect(text).toContain('Fail ❌');
    });

    it('includes health check process steps', async () => {
      const messages = await healthCheckPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('Configuration Validation');
      expect(text).toContain('Hook Health');
      expect(text).toContain('Memory Structure');
      expect(text).toContain('MCP Server Status');
    });

    it('provides manual invocation guidance', async () => {
      const messages = await healthCheckPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('manually invoke');
      expect(text).toContain('Example:');
    });
  });
});
