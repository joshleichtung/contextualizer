/**
 * Tests for optimize_context prompt
 */

import { describe, it, expect } from 'vitest';
import { optimizeContextPrompt } from '../../../src/prompts/optimize-context.js';

describe('optimize_context prompt', () => {
  describe('prompt definition', () => {
    it('has correct name', () => {
      expect(optimizeContextPrompt.name).toBe('optimize_context');
    });

    it('has description', () => {
      expect(optimizeContextPrompt.description).toBeTruthy();
      expect(optimizeContextPrompt.description.toLowerCase()).toContain(
        'context',
      );
    });

    it('has correct arguments', () => {
      expect(optimizeContextPrompt.arguments).toBeDefined();
      expect(optimizeContextPrompt.arguments).toHaveLength(1);
      expect(optimizeContextPrompt.arguments![0].name).toBe('strategy');
      expect(optimizeContextPrompt.arguments![0].required).toBe(false);
    });

    it('has provider function', () => {
      expect(optimizeContextPrompt.provider).toBeTypeOf('function');
    });
  });

  describe('provider behavior', () => {
    it('returns valid PromptMessage array', async () => {
      const messages = await optimizeContextPrompt.provider({});
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(1);
    });

    it('message has correct structure', async () => {
      const messages = await optimizeContextPrompt.provider({});
      expect(messages[0].role).toBe('user');
      expect(messages[0].content.type).toBe('text');
      expect(messages[0].content.text).toBeTruthy();
    });

    it('works with strategy "aggressive"', async () => {
      const messages = await optimizeContextPrompt.provider({
        strategy: 'aggressive',
      });
      const text = messages[0].content.text!;
      expect(text).toContain('aggressive');
      expect(text).toContain('Aggressive Strategy');
    });

    it('works with strategy "balanced"', async () => {
      const messages = await optimizeContextPrompt.provider({
        strategy: 'balanced',
      });
      const text = messages[0].content.text!;
      expect(text).toContain('balanced');
      expect(text).toContain('Balanced Strategy');
    });

    it('works with strategy "conservative"', async () => {
      const messages = await optimizeContextPrompt.provider({
        strategy: 'conservative',
      });
      const text = messages[0].content.text!;
      expect(text).toContain('conservative');
      expect(text).toContain('Conservative Strategy');
    });

    it('works without strategy argument (defaults to balanced)', async () => {
      const messages = await optimizeContextPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('balanced');
      expect(text).toContain('Balanced Strategy');
    });

    it('includes strategy-specific guidance for aggressive', async () => {
      const messages = await optimizeContextPrompt.provider({
        strategy: 'aggressive',
      });
      const text = messages[0].content.text!;
      expect(text).toContain('Clear context frequently');
      expect(text).toContain('70%');
      expect(text).toContain('85%');
    });

    it('includes strategy-specific guidance for balanced', async () => {
      const messages = await optimizeContextPrompt.provider({
        strategy: 'balanced',
      });
      const text = messages[0].content.text!;
      expect(text).toContain('task boundaries');
      expect(text).toContain('80%');
      expect(text).toContain('95%');
    });

    it('includes strategy-specific guidance for conservative', async () => {
      const messages = await optimizeContextPrompt.provider({
        strategy: 'conservative',
      });
      const text = messages[0].content.text!;
      expect(text).toContain('Preserve context');
      expect(text).toContain('90%');
      expect(text).toContain('98%');
    });

    it('includes context management best practices', async () => {
      const messages = await optimizeContextPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('Monitor Context Usage');
      expect(text).toContain('Task Boundaries');
      expect(text).toContain('Memory vs Context Trade-offs');
    });

    it('provides manual configuration guidance', async () => {
      const messages = await optimizeContextPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text.toLowerCase()).toContain('manually adjust');
      expect(text).toContain('.contextualizer/config.yaml');
    });

    it('handles unknown strategy gracefully (defaults to balanced)', async () => {
      const messages = await optimizeContextPrompt.provider({
        strategy: 'unknown',
      });
      const text = messages[0].content.text!;
      expect(text).toContain('Balanced Strategy');
    });
  });
});
