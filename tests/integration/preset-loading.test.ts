/**
 * Preset Loading Integration Tests
 *
 * End-to-end tests for preset loading from YAML files.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  loadPresetFromFile,
  loadPresetsFromDirectory,
  loadDefaultPresets,
} from '../../src/preset/loader.js';
import {
  PresetRegistry,
  initializeRegistry,
  resetRegistry,
} from '../../src/preset/registry.js';

describe('Preset Loading Integration', () => {
  let tempDir: string;
  let originalCwd: () => string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'preset-integration-'));
    originalCwd = process.cwd;
    resetRegistry();
  });

  afterEach(async () => {
    process.cwd = originalCwd;
    resetRegistry();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should load built-in presets from default directory', async () => {
    // Use actual presets directory
    const presets = await loadDefaultPresets();

    expect(presets.length).toBeGreaterThanOrEqual(3);

    const names = presets.map((p) => p.name);
    expect(names).toContain('minimal');
    expect(names).toContain('web-fullstack');
    expect(names).toContain('hackathon');
  });

  it('should validate minimal preset structure', async () => {
    const presets = await loadDefaultPresets();
    const minimal = presets.find((p) => p.name === 'minimal');

    expect(minimal).toBeDefined();
    expect(minimal?.description).toBe('Minimal preset with basic context monitoring');
    expect(minimal?.installationTime).toBe('~30 seconds');
    expect(minimal?.contextMonitoring.warningThreshold).toBe(80);
    expect(minimal?.contextMonitoring.criticalThreshold).toBe(95);
    expect(minimal?.contextMonitoring.boundaryDetection).toBe('balanced');
    expect(minimal?.hooks.preCommit.enabled).toBe(false);
    expect(minimal?.memory.sections).toHaveLength(1);
  });

  it('should validate web-fullstack preset structure', async () => {
    const presets = await loadDefaultPresets();
    const webFullstack = presets.find((p) => p.name === 'web-fullstack');

    expect(webFullstack).toBeDefined();
    expect(webFullstack?.description).toBe(
      'Full-stack web development with Next.js, React, TypeScript'
    );
    expect(webFullstack?.installationTime).toBe('~2 minutes');
    expect(webFullstack?.contextMonitoring.warningThreshold).toBe(75);
    expect(webFullstack?.contextMonitoring.boundaryDetection).toBe('aggressive');
    expect(webFullstack?.hooks.preCommit.enabled).toBe(true);
    expect(webFullstack?.hooks.preCommit.strictness).toBe('balanced');
    expect(webFullstack?.hooks.preCommit.checks).toHaveLength(3);
    expect(webFullstack?.memory.sections).toHaveLength(2);
    expect(webFullstack?.memory.context7Libraries).toHaveLength(3);
    expect(webFullstack?.skills).toHaveLength(3);
    expect(webFullstack?.subagents).toHaveLength(3);
    expect(webFullstack?.codingStandards).toHaveLength(3);
  });

  it('should validate hackathon preset structure', async () => {
    const presets = await loadDefaultPresets();
    const hackathon = presets.find((p) => p.name === 'hackathon');

    expect(hackathon).toBeDefined();
    expect(hackathon?.description).toBe(
      'Fast iteration mode for hackathons and prototypes'
    );
    expect(hackathon?.installationTime).toBe('~15 seconds');
    expect(hackathon?.contextMonitoring.warningThreshold).toBe(90);
    expect(hackathon?.contextMonitoring.criticalThreshold).toBe(98);
    expect(hackathon?.contextMonitoring.boundaryDetection).toBe('conservative');
    expect(hackathon?.hooks.preCommit.enabled).toBe(false);
  });

  it('should load and register presets in registry', async () => {
    const registry = await initializeRegistry();

    expect(registry.count()).toBeGreaterThanOrEqual(3);
    expect(registry.has('minimal')).toBe(true);
    expect(registry.has('web-fullstack')).toBe(true);
    expect(registry.has('hackathon')).toBe(true);
  });

  it('should retrieve preset from registry', async () => {
    const registry = await initializeRegistry();

    const minimal = registry.get('minimal');
    expect(minimal.name).toBe('minimal');
    expect(minimal.contextMonitoring.warningThreshold).toBe(80);
  });

  it('should list all presets from registry', async () => {
    const registry = await initializeRegistry();

    const presets = registry.getAll();
    expect(presets.length).toBeGreaterThanOrEqual(3);

    const names = presets.map((p) => p.name);
    expect(names).toContain('minimal');
    expect(names).toContain('web-fullstack');
    expect(names).toContain('hackathon');
  });

  it('should get preset metadata', async () => {
    const registry = await initializeRegistry();

    const metadata = registry.getMetadata();
    expect(metadata.length).toBeGreaterThanOrEqual(3);

    const minimalMeta = metadata.find((m) => m.name === 'minimal');
    expect(minimalMeta).toEqual({
      name: 'minimal',
      description: 'Minimal preset with basic context monitoring',
      installationTime: '~30 seconds',
    });
  });

  it('should load custom preset from file into registry', async () => {
    const customPreset = `
name: custom-test
description: Custom test preset
installationTime: ~45 seconds
contextMonitoring:
  warningThreshold: 85
  criticalThreshold: 95
  boundaryDetection: balanced
hooks:
  preCommit:
    enabled: true
memory:
  sections:
    - title: Custom Section
      content: Custom content
skills:
  - custom-skill
`;

    const filePath = path.join(tempDir, 'custom.yaml');
    await fs.writeFile(filePath, customPreset, 'utf-8');

    const registry = new PresetRegistry();
    const preset = await registry.loadFromFile(filePath);

    expect(preset.name).toBe('custom-test');
    expect(registry.has('custom-test')).toBe(true);
    expect(registry.get('custom-test').skills).toEqual(['custom-skill']);
  });

  it('should handle preset with all optional fields', async () => {
    const fullPreset = `
name: full-test
description: Full test preset
installationTime: ~3 minutes
contextMonitoring:
  warningThreshold: 70
  criticalThreshold: 85
  boundaryDetection: aggressive
hooks:
  preCommit:
    enabled: true
    strictness: strict
    checks:
      - name: typecheck
        failOn: errors
      - name: lint
        failOn: warnings
      - name: test
        failOn: errors
      - name: build
        failOn: errors
memory:
  sections:
    - title: Stack
      content: Tech stack details
    - title: Patterns
      content: Architecture patterns
    - title: Standards
      content: Coding standards
  context7Libraries:
    - /org/lib1
    - /org/lib2
    - /org/lib3
skills:
  - skill1
  - skill2
  - skill3
subagents:
  - agent1
  - agent2
codingStandards:
  - standard1
  - standard2
  - standard3
`;

    const filePath = path.join(tempDir, 'full.yaml');
    await fs.writeFile(filePath, fullPreset, 'utf-8');

    const preset = await loadPresetFromFile(filePath);

    expect(preset.name).toBe('full-test');
    expect(preset.hooks.preCommit.strictness).toBe('strict');
    expect(preset.hooks.preCommit.checks).toHaveLength(4);
    expect(preset.memory.sections).toHaveLength(3);
    expect(preset.memory.context7Libraries).toHaveLength(3);
    expect(preset.skills).toHaveLength(3);
    expect(preset.subagents).toHaveLength(2);
    expect(preset.codingStandards).toHaveLength(3);
  });

  it('should find presets using registry filter', async () => {
    const registry = await initializeRegistry();

    const strictPresets = registry.find(
      (p) => p.hooks.preCommit.enabled === true
    );

    expect(strictPresets.length).toBeGreaterThanOrEqual(1);
    expect(strictPresets.some((p) => p.name === 'web-fullstack')).toBe(true);
  });
});
