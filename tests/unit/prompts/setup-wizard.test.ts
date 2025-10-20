/**
 * Tests for setup_wizard prompt
 */

import { describe, it, expect } from 'vitest';
import { setupWizardPrompt } from '../../../src/prompts/setup-wizard.js';

describe('setup_wizard prompt', () => {
  describe('prompt definition', () => {
    it('has correct name', () => {
      expect(setupWizardPrompt.name).toBe('setup_wizard');
    });

    it('has description', () => {
      expect(setupWizardPrompt.description).toBeTruthy();
      expect(setupWizardPrompt.description).toContain('setup');
    });

    it('has correct arguments', () => {
      expect(setupWizardPrompt.arguments).toBeDefined();
      expect(setupWizardPrompt.arguments).toHaveLength(1);
      expect(setupWizardPrompt.arguments![0].name).toBe('project_type');
      expect(setupWizardPrompt.arguments![0].required).toBe(false);
    });

    it('has provider function', () => {
      expect(setupWizardPrompt.provider).toBeTypeOf('function');
    });
  });

  describe('provider behavior', () => {
    it('returns valid PromptMessage array', async () => {
      const messages = await setupWizardPrompt.provider({});
      expect(Array.isArray(messages)).toBe(true);
      expect(messages).toHaveLength(1);
    });

    it('message has correct structure', async () => {
      const messages = await setupWizardPrompt.provider({});
      expect(messages[0].role).toBe('user');
      expect(messages[0].content.type).toBe('text');
      expect(messages[0].content.text).toBeTruthy();
    });

    it('works with project_type argument provided', async () => {
      const messages = await setupWizardPrompt.provider({
        project_type: 'nextjs',
      });
      expect(messages[0].content.text).toContain('nextjs');
    });

    it('works without project_type argument', async () => {
      const messages = await setupWizardPrompt.provider({});
      expect(messages[0].content.text).toContain('detect');
    });

    it('message includes all 3 presets', async () => {
      const messages = await setupWizardPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('minimal');
      expect(text).toContain('web-fullstack');
      expect(text).toContain('hackathon');
    });

    it('mentions Epic 2 and init_project tool', async () => {
      const messages = await setupWizardPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('Epic 2');
      expect(text).toContain('init_project');
    });

    it('provides manual invocation guidance', async () => {
      const messages = await setupWizardPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('manually invoke');
      expect(text).toContain('Example:');
    });

    it('includes setup process steps', async () => {
      const messages = await setupWizardPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('Project Detection');
      expect(text).toContain('Preset Selection');
      expect(text).toContain('Configuration');
      expect(text).toContain('Tool Invocation');
    });

    it('lists files that will be created', async () => {
      const messages = await setupWizardPrompt.provider({});
      const text = messages[0].content.text!;
      expect(text).toContain('.claude/hooks');
      expect(text).toContain('CLAUDE.md');
      expect(text).toContain('.contextualizer/config.yaml');
    });

    it('handles different project types correctly', async () => {
      const projectTypes = ['react', 'vue', 'typescript', 'node'];

      for (const type of projectTypes) {
        const messages = await setupWizardPrompt.provider({
          project_type: type,
        });
        expect(messages[0].content.text).toContain(type);
      }
    });
  });
});
