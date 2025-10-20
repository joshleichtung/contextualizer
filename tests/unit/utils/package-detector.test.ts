/**
 * Unit Tests for Package Detector
 *
 * Comprehensive test suite for package.json detection and parsing functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  detectPackageJson,
  extractDependencies,
  detectFrameworks,
  hasFramework,
  getDependencyVersion,
  FrameworkType,
  type PackageJson,
} from '../../../src/utils/package-detector.js';

// Test data directory
const TEST_DIR = path.join(process.cwd(), 'tests', 'fixtures', 'package-detection');

/**
 * Helper to create test package.json file
 */
async function createTestPackageJson(
  directory: string,
  content: PackageJson
): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
  const packagePath = path.join(directory, 'package.json');
  await fs.writeFile(packagePath, JSON.stringify(content, null, 2));
}

/**
 * Helper to clean up test directory
 */
async function cleanupTestDir(directory: string): Promise<void> {
  try {
    await fs.rm(directory, { recursive: true, force: true });
  } catch {
    // Ignore errors if directory doesn't exist
  }
}

describe('Package Detector', () => {
  describe('detectPackageJson', () => {
    const testDir = path.join(TEST_DIR, 'detect-test');

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect existing package.json', async () => {
      const packageContent: PackageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);

      const result = await detectPackageJson(testDir);

      expect(result.found).toBe(true);
      expect(result.projectName).toBe('test-project');
      expect(result.packageJson).toEqual(packageContent);
      expect(result.dependencies).toHaveLength(1);
      expect(result.filePath).toBe(path.join(testDir, 'package.json'));
    });

    it('should return not found when package.json does not exist', async () => {
      const result = await detectPackageJson(testDir);

      expect(result.found).toBe(false);
      expect(result.packageJson).toBeUndefined();
      expect(result.dependencies).toHaveLength(0);
      expect(result.projectName).toBeUndefined();
      expect(result.filePath).toBeUndefined();
    });

    it('should handle package.json without dependencies', async () => {
      const packageContent: PackageJson = {
        name: 'empty-project',
        version: '1.0.0',
      };

      await createTestPackageJson(testDir, packageContent);

      const result = await detectPackageJson(testDir);

      expect(result.found).toBe(true);
      expect(result.projectName).toBe('empty-project');
      expect(result.dependencies).toHaveLength(0);
    });

    it('should throw error for invalid JSON', async () => {
      await fs.mkdir(testDir, { recursive: true });
      const packagePath = path.join(testDir, 'package.json');
      await fs.writeFile(packagePath, '{ invalid json }');

      await expect(detectPackageJson(testDir)).rejects.toThrow(
        'Invalid JSON in package.json'
      );
    });

    it('should extract both dependencies and devDependencies', async () => {
      const packageContent: PackageJson = {
        name: 'full-project',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          next: '^14.0.0',
        },
        devDependencies: {
          typescript: '^5.0.0',
          vitest: '^1.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);

      const result = await detectPackageJson(testDir);

      expect(result.found).toBe(true);
      expect(result.dependencies).toHaveLength(4);

      const reactDep = result.dependencies.find((d) => d.name === 'react');
      expect(reactDep?.isDev).toBe(false);

      const typescriptDep = result.dependencies.find(
        (d) => d.name === 'typescript'
      );
      expect(typescriptDep?.isDev).toBe(true);
    });
  });

  describe('extractDependencies', () => {
    it('should extract production dependencies', () => {
      const packageJson: PackageJson = {
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0',
        },
      };

      const deps = extractDependencies(packageJson);

      expect(deps).toHaveLength(2);
      expect(deps[0]).toEqual({
        name: 'react',
        version: '^18.0.0',
        isDev: false,
      });
      expect(deps[1]).toEqual({
        name: 'react-dom',
        version: '^18.0.0',
        isDev: false,
      });
    });

    it('should extract dev dependencies', () => {
      const packageJson: PackageJson = {
        devDependencies: {
          vitest: '^1.0.0',
          typescript: '^5.0.0',
        },
      };

      const deps = extractDependencies(packageJson);

      expect(deps).toHaveLength(2);
      expect(deps.every((d) => d.isDev)).toBe(true);
    });

    it('should handle empty dependencies', () => {
      const packageJson: PackageJson = {};

      const deps = extractDependencies(packageJson);

      expect(deps).toHaveLength(0);
    });

    it('should combine dependencies and devDependencies', () => {
      const packageJson: PackageJson = {
        dependencies: {
          express: '^4.18.0',
        },
        devDependencies: {
          nodemon: '^3.0.0',
        },
      };

      const deps = extractDependencies(packageJson);

      expect(deps).toHaveLength(2);

      const expressDep = deps.find((d) => d.name === 'express');
      expect(expressDep?.isDev).toBe(false);

      const nodemonDep = deps.find((d) => d.name === 'nodemon');
      expect(nodemonDep?.isDev).toBe(true);
    });
  });

  describe('detectFrameworks', () => {
    it('should detect React framework', () => {
      const deps = [
        { name: 'react', version: '^18.0.0', isDev: false },
        { name: 'react-dom', version: '^18.0.0', isDev: false },
      ];

      const frameworks = detectFrameworks(deps);

      expect(frameworks).toHaveLength(1);
      expect(frameworks[0].type).toBe(FrameworkType.REACT);
      expect(frameworks[0].version).toBe('^18.0.0');
      expect(frameworks[0].confidence).toBe(90);
    });

    it('should detect Next.js framework', () => {
      const deps = [
        { name: 'next', version: '^14.0.0', isDev: false },
        { name: 'react', version: '^18.0.0', isDev: false },
      ];

      const frameworks = detectFrameworks(deps);

      expect(frameworks.length).toBeGreaterThanOrEqual(1);

      const nextFramework = frameworks.find((f) => f.type === FrameworkType.NEXT);
      expect(nextFramework).toBeDefined();
      expect(nextFramework?.confidence).toBe(100);
    });

    it('should detect Vue framework', () => {
      const deps = [{ name: 'vue', version: '^3.0.0', isDev: false }];

      const frameworks = detectFrameworks(deps);

      expect(frameworks).toHaveLength(1);
      expect(frameworks[0].type).toBe(FrameworkType.VUE);
      expect(frameworks[0].confidence).toBe(90);
    });

    it('should detect Angular framework', () => {
      const deps = [
        { name: '@angular/core', version: '^17.0.0', isDev: false },
      ];

      const frameworks = detectFrameworks(deps);

      expect(frameworks).toHaveLength(1);
      expect(frameworks[0].type).toBe(FrameworkType.ANGULAR);
      expect(frameworks[0].confidence).toBe(100);
    });

    it('should detect Svelte framework', () => {
      const deps = [{ name: 'svelte', version: '^4.0.0', isDev: false }];

      const frameworks = detectFrameworks(deps);

      expect(frameworks).toHaveLength(1);
      expect(frameworks[0].type).toBe(FrameworkType.SVELTE);
      expect(frameworks[0].confidence).toBe(90);
    });

    it('should detect SvelteKit framework', () => {
      const deps = [
        { name: '@sveltejs/kit', version: '^2.0.0', isDev: false },
        { name: 'svelte', version: '^4.0.0', isDev: false },
      ];

      const frameworks = detectFrameworks(deps);

      expect(frameworks.length).toBeGreaterThanOrEqual(1);

      const svelteKitFramework = frameworks.find(
        (f) => f.type === FrameworkType.SVELTEKIT
      );
      expect(svelteKitFramework).toBeDefined();
      expect(svelteKitFramework?.confidence).toBe(100);
    });

    it('should detect backend frameworks', () => {
      const deps = [
        { name: 'express', version: '^4.18.0', isDev: false },
        { name: 'fastify', version: '^4.0.0', isDev: false },
        { name: '@nestjs/core', version: '^10.0.0', isDev: false },
      ];

      const frameworks = detectFrameworks(deps);

      expect(frameworks).toHaveLength(3);

      const express = frameworks.find((f) => f.type === FrameworkType.EXPRESS);
      expect(express?.confidence).toBe(80);

      const fastify = frameworks.find((f) => f.type === FrameworkType.FASTIFY);
      expect(fastify?.confidence).toBe(90);

      const nest = frameworks.find((f) => f.type === FrameworkType.NEST);
      expect(nest?.confidence).toBe(100);
    });

    it('should return empty array when no frameworks detected', () => {
      const deps = [
        { name: 'lodash', version: '^4.17.0', isDev: false },
        { name: 'moment', version: '^2.29.0', isDev: false },
      ];

      const frameworks = detectFrameworks(deps);

      expect(frameworks).toHaveLength(0);
    });

    it('should sort frameworks by confidence descending', () => {
      const deps = [
        { name: 'react', version: '^18.0.0', isDev: false }, // 90
        { name: 'next', version: '^14.0.0', isDev: false }, // 100
        { name: 'express', version: '^4.18.0', isDev: false }, // 80
      ];

      const frameworks = detectFrameworks(deps);

      expect(frameworks[0].confidence).toBeGreaterThanOrEqual(
        frameworks[1].confidence
      );
      expect(frameworks[1].confidence).toBeGreaterThanOrEqual(
        frameworks[2].confidence
      );
    });
  });

  describe('hasFramework', () => {
    const testDeps = [
      { name: 'react', version: '^18.0.0', isDev: false },
      { name: 'typescript', version: '^5.0.0', isDev: true },
    ];

    it('should return true when framework exists', () => {
      expect(hasFramework(testDeps, 'react')).toBe(true);
    });

    it('should return false when framework does not exist', () => {
      expect(hasFramework(testDeps, 'vue')).toBe(false);
    });

    it('should check devDependencies as well', () => {
      expect(hasFramework(testDeps, 'typescript')).toBe(true);
    });

    it('should return false for empty dependencies', () => {
      expect(hasFramework([], 'react')).toBe(false);
    });
  });

  describe('getDependencyVersion', () => {
    const testDeps = [
      { name: 'react', version: '^18.2.0', isDev: false },
      { name: 'next', version: '14.0.4', isDev: false },
      { name: 'typescript', version: '~5.3.0', isDev: true },
    ];

    it('should return version for existing dependency', () => {
      expect(getDependencyVersion(testDeps, 'react')).toBe('^18.2.0');
    });

    it('should return exact version without caret', () => {
      expect(getDependencyVersion(testDeps, 'next')).toBe('14.0.4');
    });

    it('should return version with tilde', () => {
      expect(getDependencyVersion(testDeps, 'typescript')).toBe('~5.3.0');
    });

    it('should return undefined for non-existent dependency', () => {
      expect(getDependencyVersion(testDeps, 'vue')).toBeUndefined();
    });

    it('should return undefined for empty dependencies', () => {
      expect(getDependencyVersion([], 'react')).toBeUndefined();
    });
  });
});
