/**
 * Template Engine Tests
 *
 * Comprehensive tests for Handlebars template engine functionality.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import {
  initializeEngine,
  registerHelpers,
  compileTemplate,
  loadTemplate,
  renderTemplate,
  loadAndRender,
  clearCache,
  getCacheStats,
} from './engine.js';
import { TemplateError } from './errors.js';

describe('Template Engine', () => {
  let tempDir: string;

  beforeEach(async () => {
    // Create temporary directory for test templates
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'template-test-'));
    // Initialize engine before each test
    initializeEngine();
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.rm(tempDir, { recursive: true, force: true });
    // Clear template cache
    clearCache();
  });

  describe('Engine Initialization', () => {
    it('should initialize engine without errors', () => {
      expect(() => initializeEngine()).not.toThrow();
    });

    it('should register helpers without errors', () => {
      expect(() => registerHelpers()).not.toThrow();
    });
  });

  describe('Template Compilation', () => {
    it('should compile simple template', () => {
      const template = compileTemplate('Hello {{name}}!');
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');
    });

    it('should compile template with cache key', () => {
      const template = compileTemplate('Hello {{name}}!', 'test-key');
      const stats = getCacheStats();
      expect(stats.keys).toContain('test-key');
      expect(stats.size).toBe(1);
    });

    it('should return cached template when cache key is reused', () => {
      const template1 = compileTemplate('Hello {{name}}!', 'reuse-key');
      const template2 = compileTemplate('Different {{content}}', 'reuse-key');
      // Should return the same cached template
      expect(template1).toBe(template2);
    });

    it('should throw TemplateError on invalid template syntax during render', () => {
      // Invalid syntax compiles but throws during render
      const template = compileTemplate('{{#each }}');
      expect(() => renderTemplate(template, {})).toThrow(TemplateError);
    });

    it('should compile template without escaping HTML when needed', () => {
      const template = compileTemplate('{{{html}}}');
      const result = renderTemplate(template, { html: '<b>Bold</b>' });
      expect(result).toBe('<b>Bold</b>');
    });
  });

  describe('Template Rendering', () => {
    it('should render template with simple variables', () => {
      const template = compileTemplate('Hello {{name}}!');
      const result = renderTemplate(template, { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('should render template with nested variables', () => {
      const template = compileTemplate('{{user.name}} is {{user.age}} years old');
      const result = renderTemplate(template, {
        user: { name: 'Alice', age: 30 },
      });
      expect(result).toBe('Alice is 30 years old');
    });

    it('should render template with conditionals', () => {
      const template = compileTemplate(
        '{{#if isActive}}Active{{else}}Inactive{{/if}}'
      );
      expect(renderTemplate(template, { isActive: true })).toBe('Active');
      expect(renderTemplate(template, { isActive: false })).toBe('Inactive');
    });

    it('should render template with loops', () => {
      const template = compileTemplate(
        '{{#each items}}{{this}},{{/each}}'
      );
      const result = renderTemplate(template, { items: ['a', 'b', 'c'] });
      expect(result).toBe('a,b,c,');
    });

    it('should handle missing variables gracefully with strict:false', () => {
      // With strict:false mode, missing variables/helpers render as empty string
      const template = compileTemplate('{{missingVar}}');
      const result = renderTemplate(template, {});
      expect(result).toBe('');
    });
  });

  describe('Custom Helpers', () => {
    it('should use eq helper for equality check', () => {
      const template = compileTemplate(
        '{{#if (eq status "active")}}Yes{{else}}No{{/if}}'
      );
      expect(renderTemplate(template, { status: 'active' })).toBe('Yes');
      expect(renderTemplate(template, { status: 'inactive' })).toBe('No');
    });

    it('should use neq helper for inequality check', () => {
      const template = compileTemplate(
        '{{#if (neq status "inactive")}}Active{{else}}Not Active{{/if}}'
      );
      expect(renderTemplate(template, { status: 'active' })).toBe('Active');
      expect(renderTemplate(template, { status: 'inactive' })).toBe('Not Active');
    });

    it('should use gt helper for greater than comparison', () => {
      const template = compileTemplate(
        '{{#if (gt age 18)}}Adult{{else}}Minor{{/if}}'
      );
      expect(renderTemplate(template, { age: 25 })).toBe('Adult');
      expect(renderTemplate(template, { age: 15 })).toBe('Minor');
    });

    it('should use lt helper for less than comparison', () => {
      const template = compileTemplate(
        '{{#if (lt age 18)}}Minor{{else}}Adult{{/if}}'
      );
      expect(renderTemplate(template, { age: 15 })).toBe('Minor');
      expect(renderTemplate(template, { age: 25 })).toBe('Adult');
    });

    it('should use or helper for logical OR', () => {
      const template = compileTemplate(
        '{{#if (or isAdmin isModerator)}}Access{{else}}No Access{{/if}}'
      );
      expect(renderTemplate(template, { isAdmin: true, isModerator: false })).toBe('Access');
      expect(renderTemplate(template, { isAdmin: false, isModerator: true })).toBe('Access');
      expect(renderTemplate(template, { isAdmin: false, isModerator: false })).toBe('No Access');
    });

    it('should use and helper for logical AND', () => {
      const template = compileTemplate(
        '{{#if (and isActive isPremium)}}Premium Active{{else}}Standard{{/if}}'
      );
      expect(renderTemplate(template, { isActive: true, isPremium: true })).toBe('Premium Active');
      expect(renderTemplate(template, { isActive: true, isPremium: false })).toBe('Standard');
    });

    it('should use formatDate helper', () => {
      const template = compileTemplate('Date: {{formatDate date}}');
      const result = renderTemplate(template, {
        date: new Date('2024-01-15'),
      });
      expect(result).toBe('Date: 2024-01-15');
    });

    it('should use upper helper', () => {
      const template = compileTemplate('{{upper text}}');
      expect(renderTemplate(template, { text: 'hello' })).toBe('HELLO');
    });

    it('should use lower helper', () => {
      const template = compileTemplate('{{lower text}}');
      expect(renderTemplate(template, { text: 'HELLO' })).toBe('hello');
    });

    it('should use capitalize helper', () => {
      const template = compileTemplate('{{capitalize text}}');
      expect(renderTemplate(template, { text: 'hello' })).toBe('Hello');
    });

    it('should use join helper', () => {
      const template = compileTemplate('{{join items ", "}}');
      const result = renderTemplate(template, {
        items: ['apple', 'banana', 'cherry'],
      });
      expect(result).toBe('apple, banana, cherry');
    });

    it('should use default helper', () => {
      const template = compileTemplate('{{default value "fallback"}}');
      expect(renderTemplate(template, { value: 'actual' })).toBe('actual');
      expect(renderTemplate(template, {})).toBe('fallback');
    });
  });

  describe('File Operations', () => {
    it('should load template from file', async () => {
      const templatePath = path.join(tempDir, 'test.hbs');
      await fs.writeFile(templatePath, 'Hello {{name}}!', 'utf-8');

      const template = await loadTemplate(templatePath);
      expect(template).toBeDefined();
      expect(typeof template).toBe('function');

      const result = renderTemplate(template, { name: 'File' });
      expect(result).toBe('Hello File!');
    });

    it('should cache loaded template with file path as key', async () => {
      const templatePath = path.join(tempDir, 'cached.hbs');
      await fs.writeFile(templatePath, 'Cached {{value}}', 'utf-8');

      await loadTemplate(templatePath);
      const stats = getCacheStats();

      expect(stats.keys).toContain(templatePath);
    });

    it('should throw TemplateError when file does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'nonexistent.hbs');

      await expect(loadTemplate(nonExistentPath)).rejects.toThrow(TemplateError);
    });

    it('should load and render in one operation', async () => {
      const templatePath = path.join(tempDir, 'combined.hbs');
      await fs.writeFile(
        templatePath,
        'Project: {{projectName}}, Version: {{version}}',
        'utf-8'
      );

      const result = await loadAndRender(templatePath, {
        projectName: 'TestProject',
        version: '1.0.0',
      });

      expect(result).toBe('Project: TestProject, Version: 1.0.0');
    });
  });

  describe('Cache Management', () => {
    it('should clear cache', () => {
      compileTemplate('Test {{value}}', 'key1');
      compileTemplate('Another {{value}}', 'key2');

      let stats = getCacheStats();
      expect(stats.size).toBe(2);

      clearCache();
      stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toHaveLength(0);
    });

    it('should return accurate cache statistics', () => {
      const keys = ['key1', 'key2', 'key3'];
      keys.forEach((key) => compileTemplate(`Template {{${key}}}`, key));

      const stats = getCacheStats();
      expect(stats.size).toBe(3);
      expect(stats.keys).toEqual(expect.arrayContaining(keys));
    });

    it('should handle empty cache statistics', () => {
      clearCache();
      const stats = getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.keys).toEqual([]);
    });
  });

  describe('Complex Templates', () => {
    it('should render complex nested template', () => {
      const template = compileTemplate(`
# {{projectName}}

{{#if description}}
Description: {{description}}
{{/if}}

## Features

{{#each features}}
- {{this.name}}: {{this.description}}
{{/each}}

## Configuration

{{#each config}}
**{{@key}}**: {{this}}
{{/each}}
      `);

      const result = renderTemplate(template, {
        projectName: 'My Project',
        description: 'A test project',
        features: [
          { name: 'Feature 1', description: 'First feature' },
          { name: 'Feature 2', description: 'Second feature' },
        ],
        config: {
          version: '1.0.0',
          author: 'Test Author',
        },
      });

      expect(result).toContain('# My Project');
      expect(result).toContain('Description: A test project');
      expect(result).toContain('- Feature 1: First feature');
      expect(result).toContain('**version**: 1.0.0');
    });

    it('should handle template with multiple helper combinations', () => {
      const template = compileTemplate(`
{{#if (and isActive (gt score 50))}}
Status: {{upper status}}
Score: {{score}}
{{#each (join achievements ", ")}}
{{this}}
{{/each}}
{{else}}
Status: {{default status "Unknown"}}
{{/if}}
      `);

      const result = renderTemplate(template, {
        isActive: true,
        score: 75,
        status: 'verified',
        achievements: ['Winner', 'Expert'],
      });

      expect(result).toContain('Status: VERIFIED');
      expect(result).toContain('Score: 75');
    });
  });
});
