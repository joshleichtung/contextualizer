/**
 * Tests for preset definitions
 */

import { describe, it, expect } from 'vitest';
import {
  PRESETS,
  minimalPreset,
  webFullstackPreset,
  hackathonPreset,
  type PresetDefinition,
} from '../../../src/config/presets.js';

describe('Preset Definitions', () => {
  describe('PRESETS array', () => {
    it('contains all 3 presets', () => {
      expect(PRESETS).toHaveLength(3);
    });

    it('includes minimal preset', () => {
      expect(PRESETS).toContain(minimalPreset);
    });

    it('includes web-fullstack preset', () => {
      expect(PRESETS).toContain(webFullstackPreset);
    });

    it('includes hackathon preset', () => {
      expect(PRESETS).toContain(hackathonPreset);
    });

    it('all presets have unique names', () => {
      const names = PRESETS.map((p) => p.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(PRESETS.length);
    });
  });

  describe('Minimal Preset', () => {
    it('has correct name', () => {
      expect(minimalPreset.name).toBe('minimal');
    });

    it('has required fields', () => {
      expect(minimalPreset).toHaveProperty('name');
      expect(minimalPreset).toHaveProperty('description');
      expect(minimalPreset).toHaveProperty('installationTime');
      expect(minimalPreset).toHaveProperty('contextMonitoring');
      expect(minimalPreset).toHaveProperty('hooks');
      expect(minimalPreset).toHaveProperty('memory');
    });

    it('has correct context monitoring thresholds', () => {
      expect(minimalPreset.contextMonitoring.warningThreshold).toBe(80);
      expect(minimalPreset.contextMonitoring.criticalThreshold).toBe(95);
      expect(minimalPreset.contextMonitoring.boundaryDetection).toBe(
        'balanced',
      );
    });

    it('has pre-commit hook disabled', () => {
      expect(minimalPreset.hooks.preCommit.enabled).toBe(false);
    });

    it('has basic memory section', () => {
      expect(minimalPreset.memory.sections).toHaveLength(1);
      expect(minimalPreset.memory.sections[0].title).toBe('Project Context');
    });

    it('has no skills, subagents, or coding standards', () => {
      expect(minimalPreset.skills).toBeUndefined();
      expect(minimalPreset.subagents).toBeUndefined();
      expect(minimalPreset.codingStandards).toBeUndefined();
    });

    it('has installation time specified', () => {
      expect(minimalPreset.installationTime).toBeTruthy();
      expect(minimalPreset.installationTime).toContain('second');
    });
  });

  describe('Web-Fullstack Preset', () => {
    it('has correct name', () => {
      expect(webFullstackPreset.name).toBe('web-fullstack');
    });

    it('has required fields', () => {
      expect(webFullstackPreset).toHaveProperty('name');
      expect(webFullstackPreset).toHaveProperty('description');
      expect(webFullstackPreset).toHaveProperty('installationTime');
      expect(webFullstackPreset).toHaveProperty('contextMonitoring');
      expect(webFullstackPreset).toHaveProperty('hooks');
      expect(webFullstackPreset).toHaveProperty('memory');
    });

    it('has aggressive context monitoring', () => {
      expect(webFullstackPreset.contextMonitoring.warningThreshold).toBe(75);
      expect(webFullstackPreset.contextMonitoring.criticalThreshold).toBe(90);
      expect(webFullstackPreset.contextMonitoring.boundaryDetection).toBe(
        'aggressive',
      );
    });

    it('has pre-commit hook enabled', () => {
      expect(webFullstackPreset.hooks.preCommit.enabled).toBe(true);
      expect(webFullstackPreset.hooks.preCommit.strictness).toBe('balanced');
    });

    it('has pre-commit checks configured', () => {
      expect(webFullstackPreset.hooks.preCommit.checks).toBeDefined();
      expect(webFullstackPreset.hooks.preCommit.checks).toHaveLength(3);

      const checkNames = webFullstackPreset.hooks.preCommit.checks!.map(
        (c) => c.name,
      );
      expect(checkNames).toContain('typecheck');
      expect(checkNames).toContain('lint');
      expect(checkNames).toContain('test');
    });

    it('has multiple memory sections', () => {
      expect(webFullstackPreset.memory.sections.length).toBeGreaterThan(1);
      expect(
        webFullstackPreset.memory.sections.map((s) => s.title),
      ).toContain('Tech Stack');
      expect(
        webFullstackPreset.memory.sections.map((s) => s.title),
      ).toContain('Architecture Patterns');
    });

    it('has Context7 libraries configured', () => {
      expect(webFullstackPreset.memory.context7Libraries).toBeDefined();
      expect(webFullstackPreset.memory.context7Libraries).toHaveLength(3);
      expect(webFullstackPreset.memory.context7Libraries).toContain(
        '/vercel/next.js',
      );
      expect(webFullstackPreset.memory.context7Libraries).toContain(
        '/facebook/react',
      );
      expect(webFullstackPreset.memory.context7Libraries).toContain(
        '/microsoft/typescript',
      );
    });

    it('has skills array defined', () => {
      expect(webFullstackPreset.skills).toBeDefined();
      expect(webFullstackPreset.skills).toHaveLength(3);
      expect(webFullstackPreset.skills).toContain('nextjs-expert');
      expect(webFullstackPreset.skills).toContain('react-expert');
      expect(webFullstackPreset.skills).toContain('typescript-expert');
    });

    it('has subagents array defined', () => {
      expect(webFullstackPreset.subagents).toBeDefined();
      expect(webFullstackPreset.subagents).toHaveLength(3);
      expect(webFullstackPreset.subagents).toContain('code-reviewer');
      expect(webFullstackPreset.subagents).toContain('test-architect');
      expect(webFullstackPreset.subagents).toContain('doc-writer');
    });

    it('has coding standards array defined', () => {
      expect(webFullstackPreset.codingStandards).toBeDefined();
      expect(webFullstackPreset.codingStandards).toHaveLength(3);
      expect(webFullstackPreset.codingStandards).toContain('typescript-strict');
      expect(webFullstackPreset.codingStandards).toContain(
        'react-best-practices',
      );
      expect(webFullstackPreset.codingStandards).toContain(
        'tailwind-utility-first',
      );
    });

    it('has installation time specified', () => {
      expect(webFullstackPreset.installationTime).toBeTruthy();
      expect(webFullstackPreset.installationTime).toContain('minute');
    });
  });

  describe('Hackathon Preset', () => {
    it('has correct name', () => {
      expect(hackathonPreset.name).toBe('hackathon');
    });

    it('has required fields', () => {
      expect(hackathonPreset).toHaveProperty('name');
      expect(hackathonPreset).toHaveProperty('description');
      expect(hackathonPreset).toHaveProperty('installationTime');
      expect(hackathonPreset).toHaveProperty('contextMonitoring');
      expect(hackathonPreset).toHaveProperty('hooks');
      expect(hackathonPreset).toHaveProperty('memory');
    });

    it('has relaxed context monitoring thresholds', () => {
      expect(hackathonPreset.contextMonitoring.warningThreshold).toBe(90);
      expect(hackathonPreset.contextMonitoring.criticalThreshold).toBe(98);
      expect(hackathonPreset.contextMonitoring.boundaryDetection).toBe(
        'conservative',
      );
    });

    it('has conservative boundary detection', () => {
      expect(hackathonPreset.contextMonitoring.boundaryDetection).toBe(
        'conservative',
      );
    });

    it('has pre-commit hook disabled', () => {
      expect(hackathonPreset.hooks.preCommit.enabled).toBe(false);
    });

    it('has basic memory section', () => {
      expect(hackathonPreset.memory.sections).toHaveLength(1);
      expect(hackathonPreset.memory.sections[0].title).toBe('Project Goals');
    });

    it('has no skills, subagents, or coding standards', () => {
      expect(hackathonPreset.skills).toBeUndefined();
      expect(hackathonPreset.subagents).toBeUndefined();
      expect(hackathonPreset.codingStandards).toBeUndefined();
    });

    it('has fast installation time', () => {
      expect(hackathonPreset.installationTime).toBeTruthy();
      expect(hackathonPreset.installationTime).toContain('second');
    });
  });

  describe('Preset Validation', () => {
    it('all presets have valid structure', () => {
      PRESETS.forEach((preset) => {
        expect(preset.name).toBeTruthy();
        expect(preset.description).toBeTruthy();
        expect(preset.installationTime).toBeTruthy();
        expect(preset.contextMonitoring).toBeDefined();
        expect(preset.hooks).toBeDefined();
        expect(preset.memory).toBeDefined();
      });
    });

    it('all presets have valid context monitoring', () => {
      PRESETS.forEach((preset) => {
        expect(preset.contextMonitoring.warningThreshold).toBeGreaterThan(0);
        expect(preset.contextMonitoring.criticalThreshold).toBeGreaterThan(
          preset.contextMonitoring.warningThreshold,
        );
        expect(['aggressive', 'balanced', 'conservative']).toContain(
          preset.contextMonitoring.boundaryDetection,
        );
      });
    });

    it('all presets have valid hooks configuration', () => {
      PRESETS.forEach((preset) => {
        expect(preset.hooks.preCommit).toBeDefined();
        expect(typeof preset.hooks.preCommit.enabled).toBe('boolean');
      });
    });

    it('all presets have at least one memory section', () => {
      PRESETS.forEach((preset) => {
        expect(preset.memory.sections.length).toBeGreaterThan(0);
        preset.memory.sections.forEach((section) => {
          expect(section.title).toBeTruthy();
          expect(section.content).toBeTruthy();
        });
      });
    });
  });
});
