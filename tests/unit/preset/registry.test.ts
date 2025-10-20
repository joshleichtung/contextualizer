/**
 * Preset Registry Tests
 *
 * Comprehensive tests for preset registry management.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  PresetRegistry,
  PresetNotFoundError,
  getRegistry,
  resetRegistry,
  initializeRegistry,
} from '../../../src/preset/registry.js';
import type { PresetDefinition } from '../../../src/preset/types.js';

const createTestPreset = (name: string): PresetDefinition => ({
  name,
  description: `Test preset ${name}`,
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
        title: 'Test',
        content: 'Test content',
      },
    ],
  },
});

describe('PresetRegistry', () => {
  let registry: PresetRegistry;

  beforeEach(() => {
    registry = new PresetRegistry();
  });

  describe('register', () => {
    it('should register a preset', () => {
      const preset = createTestPreset('test');
      registry.register(preset);

      expect(registry.has('test')).toBe(true);
      expect(registry.count()).toBe(1);
    });

    it('should overwrite existing preset with same name', () => {
      const preset1 = createTestPreset('test');
      const preset2 = {
        ...createTestPreset('test'),
        description: 'Updated description',
      };

      registry.register(preset1);
      registry.register(preset2);

      expect(registry.count()).toBe(1);
      expect(registry.get('test').description).toBe('Updated description');
    });
  });

  describe('registerAll', () => {
    it('should register multiple presets', () => {
      const presets = [
        createTestPreset('preset1'),
        createTestPreset('preset2'),
        createTestPreset('preset3'),
      ];

      registry.registerAll(presets);

      expect(registry.count()).toBe(3);
      expect(registry.has('preset1')).toBe(true);
      expect(registry.has('preset2')).toBe(true);
      expect(registry.has('preset3')).toBe(true);
    });

    it('should handle empty array', () => {
      registry.registerAll([]);
      expect(registry.count()).toBe(0);
    });
  });

  describe('get', () => {
    it('should get a registered preset', () => {
      const preset = createTestPreset('test');
      registry.register(preset);

      const retrieved = registry.get('test');
      expect(retrieved).toEqual(preset);
    });

    it('should throw PresetNotFoundError for non-existent preset', () => {
      expect(() => registry.get('nonexistent')).toThrow(PresetNotFoundError);
      expect(() => registry.get('nonexistent')).toThrow(/nonexistent.*not found/);
    });
  });

  describe('has', () => {
    it('should return true for registered preset', () => {
      const preset = createTestPreset('test');
      registry.register(preset);

      expect(registry.has('test')).toBe(true);
    });

    it('should return false for non-existent preset', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('should return all registered presets', () => {
      const presets = [
        createTestPreset('preset1'),
        createTestPreset('preset2'),
      ];

      registry.registerAll(presets);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
      expect(all.map((p) => p.name).sort()).toEqual(['preset1', 'preset2']);
    });

    it('should return empty array when no presets registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getNames', () => {
    it('should return all preset names', () => {
      registry.registerAll([
        createTestPreset('preset1'),
        createTestPreset('preset2'),
        createTestPreset('preset3'),
      ]);

      const names = registry.getNames();
      expect(names.sort()).toEqual(['preset1', 'preset2', 'preset3']);
    });

    it('should return empty array when no presets registered', () => {
      expect(registry.getNames()).toEqual([]);
    });
  });

  describe('count', () => {
    it('should return correct count', () => {
      expect(registry.count()).toBe(0);

      registry.register(createTestPreset('preset1'));
      expect(registry.count()).toBe(1);

      registry.register(createTestPreset('preset2'));
      expect(registry.count()).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all presets', () => {
      registry.registerAll([
        createTestPreset('preset1'),
        createTestPreset('preset2'),
      ]);

      expect(registry.count()).toBe(2);

      registry.clear();

      expect(registry.count()).toBe(0);
      expect(registry.getAll()).toEqual([]);
    });

    it('should reset initialized flag', () => {
      registry.registerAll([createTestPreset('test')]);
      expect(registry.isInitialized()).toBe(false);

      registry.clear();
      expect(registry.isInitialized()).toBe(false);
    });
  });

  describe('find', () => {
    beforeEach(() => {
      registry.registerAll([
        createTestPreset('minimal'),
        {
          ...createTestPreset('advanced'),
          hooks: { preCommit: { enabled: true } },
        },
        {
          ...createTestPreset('hackathon'),
          contextMonitoring: {
            warningThreshold: 90,
            criticalThreshold: 98,
            boundaryDetection: 'conservative',
          },
        },
      ]);
    });

    it('should find presets matching predicate', () => {
      const found = registry.find((p) => p.hooks.preCommit.enabled);
      expect(found).toHaveLength(1);
      expect(found[0].name).toBe('advanced');
    });

    it('should return empty array when no matches', () => {
      const found = registry.find((p) => p.name === 'nonexistent');
      expect(found).toEqual([]);
    });

    it('should find all presets when predicate always true', () => {
      const found = registry.find(() => true);
      expect(found).toHaveLength(3);
    });
  });

  describe('getMetadata', () => {
    it('should return metadata for all presets', () => {
      registry.registerAll([
        createTestPreset('preset1'),
        createTestPreset('preset2'),
      ]);

      const metadata = registry.getMetadata();

      expect(metadata).toHaveLength(2);
      expect(metadata[0]).toEqual({
        name: 'preset1',
        description: 'Test preset preset1',
        installationTime: '~30 seconds',
      });
    });

    it('should return empty array when no presets', () => {
      expect(registry.getMetadata()).toEqual([]);
    });
  });

  describe('isInitialized', () => {
    it('should return false initially', () => {
      expect(registry.isInitialized()).toBe(false);
    });

    it('should return true after initialization', async () => {
      // Create temp directory structure with test preset
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'preset-test-'));

      try {
        // Create presets subdirectory
        const presetsDir = path.join(tempDir, 'presets');
        await fs.mkdir(presetsDir);

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
        await fs.writeFile(path.join(presetsDir, 'test.yaml'), yamlContent, 'utf-8');

        // Mock process.cwd to use temp directory
        const originalCwd = process.cwd;
        process.cwd = () => tempDir;

        await registry.initialize();
        expect(registry.isInitialized()).toBe(true);

        // Restore
        process.cwd = originalCwd;
      } finally {
        await fs.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});

describe('Global Registry Functions', () => {
  beforeEach(() => {
    resetRegistry();
  });

  afterEach(() => {
    resetRegistry();
  });

  describe('getRegistry', () => {
    it('should return singleton instance', () => {
      const registry1 = getRegistry();
      const registry2 = getRegistry();

      expect(registry1).toBe(registry2);
    });

    it('should return new instance after reset', () => {
      const registry1 = getRegistry();
      resetRegistry();
      const registry2 = getRegistry();

      expect(registry1).not.toBe(registry2);
    });
  });

  describe('resetRegistry', () => {
    it('should clear singleton instance', () => {
      const registry = getRegistry();
      registry.register(createTestPreset('test'));

      resetRegistry();

      const newRegistry = getRegistry();
      expect(newRegistry.count()).toBe(0);
    });
  });
});
