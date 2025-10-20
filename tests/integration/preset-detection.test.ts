/**
 * Integration Tests for Preset Detection
 *
 * End-to-end testing of the complete preset detection workflow including
 * package.json detection, framework analysis, and preset recommendation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import {
  detectPackageJson,
  detectFrameworks,
  type PackageJson,
} from '../../src/utils/package-detector.js';
import { recommendPreset } from '../../src/utils/preset-recommender.js';

// Test data directory
const TEST_DIR = path.join(
  process.cwd(),
  'tests',
  'fixtures',
  'preset-integration'
);

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

describe('Preset Detection Integration', () => {
  describe('Next.js Project Detection', () => {
    const testDir = path.join(TEST_DIR, 'nextjs-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'my-nextjs-app',
        version: '0.1.0',
        dependencies: {
          next: '14.0.4',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          typescript: '^5.3.0',
          '@types/react': '^18.2.0',
          '@types/node': '^20.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect Next.js project and recommend web-fullstack', async () => {
      // Step 1: Detect package.json
      const detection = await detectPackageJson(testDir);

      expect(detection.found).toBe(true);
      expect(detection.projectName).toBe('my-nextjs-app');
      expect(detection.dependencies.length).toBeGreaterThan(0);

      // Step 2: Detect frameworks
      const frameworks = detectFrameworks(detection.dependencies);

      expect(frameworks.length).toBeGreaterThan(0);
      const hasNext = frameworks.some((f) => f.type === 'next.js');
      expect(hasNext).toBe(true);

      // Step 3: Get preset recommendation
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.confidence).toBeGreaterThan(40);
    });
  });

  describe('React + Vite Project Detection', () => {
    const testDir = path.join(TEST_DIR, 'react-vite-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'vite-react-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          vite: '^5.0.0',
          '@vitejs/plugin-react': '^4.2.0',
          typescript: '^5.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect React + Vite and recommend appropriate preset', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      // Should recommend either web-fullstack or hackathon
      expect(['web-fullstack', 'hackathon']).toContain(recommendation.preset);

      // Should have decent confidence
      expect(recommendation.confidence).toBeGreaterThan(30);
    });
  });

  describe('Vue 3 Project Detection', () => {
    const testDir = path.join(TEST_DIR, 'vue-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'my-vue-app',
        version: '1.0.0',
        dependencies: {
          vue: '^3.3.0',
        },
        devDependencies: {
          '@vitejs/plugin-vue': '^4.0.0',
          vite: '^5.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect Vue project and recommend web-fullstack', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(recommendation.preset).toBe('web-fullstack');

      const hasVue = frameworks.some((f) => f.type === 'vue');
      expect(hasVue).toBe(true);
    });
  });

  describe('Angular Project Detection', () => {
    const testDir = path.join(TEST_DIR, 'angular-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'my-angular-app',
        version: '1.0.0',
        dependencies: {
          '@angular/core': '^17.0.0',
          '@angular/common': '^17.0.0',
          '@angular/platform-browser': '^17.0.0',
          rxjs: '^7.8.0',
          tslib: '^2.6.0',
        },
        devDependencies: {
          '@angular/cli': '^17.0.0',
          typescript: '^5.2.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect Angular project and recommend web-fullstack', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(recommendation.preset).toBe('web-fullstack');

      const hasAngular = frameworks.some((f) => f.type === 'angular');
      expect(hasAngular).toBe(true);
    });
  });

  describe('Svelte Project Detection', () => {
    const testDir = path.join(TEST_DIR, 'svelte-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'my-svelte-app',
        version: '1.0.0',
        dependencies: {
          svelte: '^4.2.0',
        },
        devDependencies: {
          '@sveltejs/vite-plugin-svelte': '^3.0.0',
          vite: '^5.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect Svelte project and recommend hackathon', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(recommendation.preset).toBe('hackathon');

      const hasSvelte = frameworks.some((f) => f.type === 'svelte');
      expect(hasSvelte).toBe(true);
    });
  });

  describe('Express Backend Project Detection', () => {
    const testDir = path.join(TEST_DIR, 'express-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'my-express-api',
        version: '1.0.0',
        dependencies: {
          express: '^4.18.2',
          cors: '^2.8.5',
          dotenv: '^16.0.0',
        },
        devDependencies: {
          nodemon: '^3.0.0',
          typescript: '^5.0.0',
          '@types/express': '^4.17.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect Express backend and recommend web-fullstack', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(recommendation.preset).toBe('web-fullstack');

      const hasExpress = frameworks.some((f) => f.type === 'express');
      expect(hasExpress).toBe(true);
    });
  });

  describe('NestJS Project Detection', () => {
    const testDir = path.join(TEST_DIR, 'nestjs-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'my-nest-app',
        version: '1.0.0',
        dependencies: {
          '@nestjs/core': '^10.0.0',
          '@nestjs/common': '^10.0.0',
          '@nestjs/platform-express': '^10.0.0',
          'reflect-metadata': '^0.1.13',
          rxjs: '^7.8.0',
        },
        devDependencies: {
          '@nestjs/cli': '^10.0.0',
          typescript: '^5.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect NestJS project and recommend web-fullstack', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(recommendation.preset).toBe('web-fullstack');

      const hasNest = frameworks.some((f) => f.type === 'nest.js');
      expect(hasNest).toBe(true);
      expect(frameworks[0].confidence).toBe(100);
    });
  });

  describe('Simple Project with No Frameworks', () => {
    const testDir = path.join(TEST_DIR, 'simple-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'simple-lib',
        version: '1.0.0',
        dependencies: {
          lodash: '^4.17.21',
          axios: '^1.6.0',
        },
        devDependencies: {
          vitest: '^1.0.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should recommend minimal preset for projects without frameworks', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(frameworks).toHaveLength(0);
      expect(recommendation.preset).toBe('minimal');
    });
  });

  describe('Full-Stack Project with Multiple Frameworks', () => {
    const testDir = path.join(TEST_DIR, 'fullstack-project');

    beforeEach(async () => {
      const packageContent: PackageJson = {
        name: 'fullstack-monorepo',
        version: '1.0.0',
        dependencies: {
          next: '14.0.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          express: '^4.18.2',
          '@nestjs/core': '^10.0.0',
        },
        devDependencies: {
          typescript: '^5.3.0',
          tailwindcss: '^3.4.0',
        },
      };

      await createTestPackageJson(testDir, packageContent);
    });

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should detect multiple frameworks and recommend web-fullstack with high confidence', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(frameworks.length).toBeGreaterThan(2);
      expect(recommendation.preset).toBe('web-fullstack');
      expect(recommendation.confidence).toBeGreaterThan(50);

      // Should have multiple reasons
      expect(recommendation.reasons.length).toBeGreaterThan(1);
    });
  });

  describe('Error Handling', () => {
    const testDir = path.join(TEST_DIR, 'error-project');

    afterEach(async () => {
      await cleanupTestDir(testDir);
    });

    it('should handle missing package.json gracefully', async () => {
      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(detection.found).toBe(false);
      expect(frameworks).toHaveLength(0);
      expect(recommendation.preset).toBe('minimal');
    });

    it('should handle package.json with no dependencies', async () => {
      const packageContent: PackageJson = {
        name: 'empty-project',
        version: '1.0.0',
      };

      await createTestPackageJson(testDir, packageContent);

      const detection = await detectPackageJson(testDir);
      const frameworks = detectFrameworks(detection.dependencies);
      const recommendation = recommendPreset(frameworks, detection.dependencies);

      expect(detection.found).toBe(true);
      expect(detection.dependencies).toHaveLength(0);
      expect(frameworks).toHaveLength(0);
      expect(recommendation.preset).toBe('minimal');
    });
  });
});
