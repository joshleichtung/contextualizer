/**
 * Preset Loader Tests
 *
 * Comprehensive tests for YAML preset loading and validation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  loadPresetFromFile,
  loadPresetsFromDirectory,
  validatePreset,
} from '../../../src/preset/loader.js';
import {
  PresetValidationError,
  PresetLoadError,
} from '../../../src/preset/types.js';

describe('validatePreset', () => {
  it('should validate a minimal preset', () => {
    const data = {
      name: 'test-minimal',
      description: 'Test minimal preset',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: {
        preCommit: {
          enabled: false,
        },
      },
      memory: {
        sections: [
          {
            title: 'Test Section',
            content: 'Test content',
          },
        ],
      },
    };

    const preset = validatePreset('test-minimal', data);

    expect(preset.name).toBe('test-minimal');
    expect(preset.description).toBe('Test minimal preset');
    expect(preset.contextMonitoring.warningThreshold).toBe(80);
    expect(preset.hooks.preCommit.enabled).toBe(false);
    expect(preset.memory.sections).toHaveLength(1);
  });

  it('should validate a full-featured preset', () => {
    const data = {
      name: 'test-full',
      description: 'Test full preset',
      installationTime: '~2 minutes',
      contextMonitoring: {
        warningThreshold: 75,
        criticalThreshold: 90,
        boundaryDetection: 'aggressive',
      },
      hooks: {
        preCommit: {
          enabled: true,
          strictness: 'balanced',
          checks: [
            { name: 'typecheck', failOn: 'errors' },
            { name: 'lint', failOn: 'warnings' },
          ],
        },
      },
      memory: {
        sections: [
          { title: 'Section 1', content: 'Content 1' },
          { title: 'Section 2', content: 'Content 2' },
        ],
        context7Libraries: ['/org/lib1', '/org/lib2'],
      },
      skills: ['skill1', 'skill2'],
      subagents: ['agent1', 'agent2'],
      codingStandards: ['standard1', 'standard2'],
    };

    const preset = validatePreset('test-full', data);

    expect(preset.name).toBe('test-full');
    expect(preset.hooks.preCommit.enabled).toBe(true);
    expect(preset.hooks.preCommit.strictness).toBe('balanced');
    expect(preset.hooks.preCommit.checks).toHaveLength(2);
    expect(preset.memory.context7Libraries).toEqual(['/org/lib1', '/org/lib2']);
    expect(preset.skills).toEqual(['skill1', 'skill2']);
    expect(preset.subagents).toEqual(['agent1', 'agent2']);
    expect(preset.codingStandards).toEqual(['standard1', 'standard2']);
  });

  it('should throw error for missing name', () => {
    const data = {
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: { preCommit: { enabled: false } },
      memory: { sections: [] },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/name.*Must be a string/);
  });

  it('should throw error for invalid context monitoring', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 'invalid',
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: { preCommit: { enabled: false } },
      memory: { sections: [] },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/warningThreshold.*Must be a number/);
  });

  it('should throw error for invalid boundary detection', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'invalid',
      },
      hooks: { preCommit: { enabled: false } },
      memory: { sections: [] },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/boundaryDetection.*Must be one of/);
  });

  it('should throw error for invalid hooks configuration', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: { preCommit: { enabled: 'invalid' } },
      memory: { sections: [] },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/enabled.*Must be a boolean/);
  });

  it('should throw error for invalid strictness', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: {
        preCommit: {
          enabled: true,
          strictness: 'invalid',
        },
      },
      memory: { sections: [] },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/strictness.*Must be one of/);
  });

  it('should throw error for invalid check configuration', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: {
        preCommit: {
          enabled: true,
          checks: [{ name: 'typecheck', failOn: 'invalid' }],
        },
      },
      memory: { sections: [] },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/failOn.*Must be one of/);
  });

  it('should throw error for non-array memory sections', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: { preCommit: { enabled: false } },
      memory: { sections: 'invalid' },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/sections.*Must be an array/);
  });

  it('should throw error for invalid memory section', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: { preCommit: { enabled: false } },
      memory: {
        sections: [{ title: 'Test', content: 123 }],
      },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/content.*Must be a string/);
  });

  it('should throw error for invalid context7Libraries', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: { preCommit: { enabled: false } },
      memory: {
        sections: [],
        context7Libraries: 'invalid',
      },
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/context7Libraries.*Must be an array/);
  });

  it('should throw error for non-string skills', () => {
    const data = {
      name: 'test',
      description: 'Test',
      installationTime: '~30 seconds',
      contextMonitoring: {
        warningThreshold: 80,
        criticalThreshold: 95,
        boundaryDetection: 'balanced',
      },
      hooks: { preCommit: { enabled: false } },
      memory: { sections: [] },
      skills: [123],
    };

    expect(() => validatePreset('test', data)).toThrow(PresetValidationError);
    expect(() => validatePreset('test', data)).toThrow(/skills.*Must be an array of strings/);
  });
});

describe('loadPresetFromFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'preset-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load a valid preset from YAML file', async () => {
    const yamlContent = `
name: test-preset
description: Test preset
installationTime: ~30 seconds
contextMonitoring:
  warningThreshold: 80
  criticalThreshold: 95
  boundaryDetection: balanced
hooks:
  preCommit:
    enabled: false
memory:
  sections:
    - title: Test Section
      content: Test content
`;

    const filePath = path.join(tempDir, 'test.yaml');
    await fs.writeFile(filePath, yamlContent, 'utf-8');

    const preset = await loadPresetFromFile(filePath);

    expect(preset.name).toBe('test-preset');
    expect(preset.description).toBe('Test preset');
    expect(preset.contextMonitoring.warningThreshold).toBe(80);
  });

  it('should throw PresetLoadError for non-existent file', async () => {
    const filePath = path.join(tempDir, 'nonexistent.yaml');

    await expect(loadPresetFromFile(filePath)).rejects.toThrow(PresetLoadError);
  });

  it('should throw PresetValidationError for invalid YAML structure', async () => {
    const yamlContent = `
name: test-preset
description: Test preset
installationTime: ~30 seconds
contextMonitoring:
  warningThreshold: invalid
  criticalThreshold: 95
  boundaryDetection: balanced
hooks:
  preCommit:
    enabled: false
memory:
  sections: []
`;

    const filePath = path.join(tempDir, 'invalid.yaml');
    await fs.writeFile(filePath, yamlContent, 'utf-8');

    await expect(loadPresetFromFile(filePath)).rejects.toThrow(PresetValidationError);
  });

  it('should throw PresetLoadError for empty YAML file', async () => {
    const filePath = path.join(tempDir, 'empty.yaml');
    await fs.writeFile(filePath, '', 'utf-8');

    await expect(loadPresetFromFile(filePath)).rejects.toThrow(PresetLoadError);
  });

  it('should load preset with all optional fields', async () => {
    const yamlContent = `
name: full-preset
description: Full preset
installationTime: ~2 minutes
contextMonitoring:
  warningThreshold: 75
  criticalThreshold: 90
  boundaryDetection: aggressive
hooks:
  preCommit:
    enabled: true
    strictness: balanced
    checks:
      - name: typecheck
        failOn: errors
memory:
  sections:
    - title: Test
      content: Content
  context7Libraries:
    - /org/lib
skills:
  - skill1
subagents:
  - agent1
codingStandards:
  - standard1
`;

    const filePath = path.join(tempDir, 'full.yaml');
    await fs.writeFile(filePath, yamlContent, 'utf-8');

    const preset = await loadPresetFromFile(filePath);

    expect(preset.skills).toEqual(['skill1']);
    expect(preset.subagents).toEqual(['agent1']);
    expect(preset.codingStandards).toEqual(['standard1']);
    expect(preset.memory.context7Libraries).toEqual(['/org/lib']);
  });
});

describe('loadPresetsFromDirectory', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'preset-test-'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load multiple presets from directory', async () => {
    const preset1 = `
name: preset1
description: Preset 1
installationTime: ~30 seconds
contextMonitoring:
  warningThreshold: 80
  criticalThreshold: 95
  boundaryDetection: balanced
hooks:
  preCommit:
    enabled: false
memory:
  sections: []
`;

    const preset2 = `
name: preset2
description: Preset 2
installationTime: ~1 minute
contextMonitoring:
  warningThreshold: 85
  criticalThreshold: 95
  boundaryDetection: balanced
hooks:
  preCommit:
    enabled: true
memory:
  sections: []
`;

    await fs.writeFile(path.join(tempDir, 'preset1.yaml'), preset1, 'utf-8');
    await fs.writeFile(path.join(tempDir, 'preset2.yaml'), preset2, 'utf-8');

    const presets = await loadPresetsFromDirectory(tempDir);

    expect(presets).toHaveLength(2);
    expect(presets.map((p) => p.name).sort()).toEqual(['preset1', 'preset2']);
  });

  it('should load only YAML files', async () => {
    const yamlContent = `
name: test
description: Test
installationTime: ~30 seconds
contextMonitoring:
  warningThreshold: 80
  criticalThreshold: 95
  boundaryDetection: balanced
hooks:
  preCommit:
    enabled: false
memory:
  sections: []
`;

    await fs.writeFile(path.join(tempDir, 'preset.yaml'), yamlContent, 'utf-8');
    await fs.writeFile(path.join(tempDir, 'readme.txt'), 'not yaml', 'utf-8');
    await fs.writeFile(path.join(tempDir, 'config.json'), '{}', 'utf-8');

    const presets = await loadPresetsFromDirectory(tempDir);

    expect(presets).toHaveLength(1);
    expect(presets[0].name).toBe('test');
  });

  it('should return empty array for directory with no YAML files', async () => {
    await fs.writeFile(path.join(tempDir, 'readme.txt'), 'not yaml', 'utf-8');

    const presets = await loadPresetsFromDirectory(tempDir);

    expect(presets).toHaveLength(0);
  });

  it('should throw PresetLoadError for non-existent directory', async () => {
    const nonExistentDir = path.join(tempDir, 'nonexistent');

    await expect(loadPresetsFromDirectory(nonExistentDir)).rejects.toThrow(
      PresetLoadError
    );
  });
});
