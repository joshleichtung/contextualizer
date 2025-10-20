/**
 * Template Renderer
 *
 * High-level template rendering with variable substitution,
 * framework detection, and preset-specific logic.
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { loadAndRender, initializeEngine } from './engine.js';
import { RenderError, VariableError } from './errors.js';
import { logger } from '../utils/logger.js';
import { detectPackageJson } from '../utils/package-detector.js';
import type { PresetDefinition } from '../preset/types.js';

/**
 * Template rendering context
 */
export interface RenderContext {
  /** Project name */
  projectName: string;

  /** Setup/generation date */
  setupDate: string;

  /** Preset name */
  preset: string;

  /** Detected framework name */
  framework?: string;

  /** Detected framework version */
  frameworkVersion?: string;

  /** Detected React version */
  reactVersion?: string;

  /** Detected TypeScript version */
  typescriptVersion?: string;

  /** List of detected technologies */
  detectedTech?: Array<{ name: string; version: string }>;

  /** Context monitoring configuration */
  contextMonitoring: {
    warningThreshold: number;
    criticalThreshold: number;
    boundaryDetection: string;
  };

  /** Hooks configuration */
  hooks: {
    preCommit: {
      enabled: boolean;
      strictness?: string;
      checks?: Array<{ name: string; failOn: string }>;
    };
  };

  /** Memory sections */
  memorySections: Array<{ title: string; content: string }>;

  /** Skills list */
  skills?: string[];

  /** Subagents list */
  subagents?: string[];

  /** Coding standards */
  codingStandards?: string[];

  /** Context7 libraries */
  context7Libraries?: string[];

  /** Additional custom variables */
  [key: string]: any;
}

/**
 * Framework version detection result
 */
interface FrameworkVersions {
  framework?: string;
  frameworkVersion?: string;
  reactVersion?: string;
  typescriptVersion?: string;
  detectedTech: Array<{ name: string; version: string }>;
}

/**
 * Detect framework versions from package.json
 *
 * @param projectRoot - Project root directory
 * @returns Framework versions object
 */
export async function detectFrameworkVersions(
  projectRoot: string = process.cwd()
): Promise<FrameworkVersions> {
  try {
    logger.debug({ projectRoot }, 'Detecting framework versions');

    const detection = await detectPackageJson(projectRoot);

    if (!detection.found) {
      logger.debug('No package.json found');
      return { detectedTech: [] };
    }

    // Read package.json to get versions
    const packageJsonPath = path.join(projectRoot, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    const result: FrameworkVersions = { detectedTech: [] };

    // Detect Next.js
    if (allDeps['next']) {
      const version = allDeps['next'].replace(/^[\^~]/, '');
      result.framework = 'Next.js';
      result.frameworkVersion = version;
      result.detectedTech.push({
        name: 'Next.js',
        version: version,
      });
    }

    // Detect React
    if (allDeps['react']) {
      const version = allDeps['react'].replace(/^[\^~]/, '');
      result.reactVersion = version;
      result.detectedTech.push({
        name: 'React',
        version: version,
      });

      // If no Next.js but has React, set as framework
      if (!result.framework) {
        result.framework = 'React';
        result.frameworkVersion = version;
      }
    }

    // Detect TypeScript
    if (allDeps['typescript']) {
      const version = allDeps['typescript'].replace(/^[\^~]/, '');
      result.typescriptVersion = version;
      result.detectedTech.push({
        name: 'TypeScript',
        version: version,
      });
    }

    // Detect Vue
    if (allDeps['vue']) {
      const vueVersion = allDeps['vue'].replace(/^[\^~]/, '');
      result.framework = 'Vue';
      result.frameworkVersion = vueVersion;
      result.detectedTech.push({ name: 'Vue', version: vueVersion });
    }

    // Detect Angular
    if (allDeps['@angular/core']) {
      const angularVersion = allDeps['@angular/core'].replace(/^[\^~]/, '');
      result.framework = 'Angular';
      result.frameworkVersion = angularVersion;
      result.detectedTech.push({ name: 'Angular', version: angularVersion });
    }

    // Detect Svelte
    if (allDeps['svelte']) {
      const svelteVersion = allDeps['svelte'].replace(/^[\^~]/, '');
      result.framework = 'Svelte';
      result.frameworkVersion = svelteVersion;
      result.detectedTech.push({ name: 'Svelte', version: svelteVersion });
    }

    logger.debug({ result }, 'Framework versions detected');
    return result;
  } catch (error) {
    logger.warn({ error }, 'Failed to detect framework versions');
    return { detectedTech: [] };
  }
}

/**
 * Build render context from preset definition
 *
 * @param preset - Preset definition
 * @param projectName - Project name
 * @param projectRoot - Project root directory
 * @returns Render context for templates
 */
export async function buildRenderContext(
  preset: PresetDefinition,
  projectName: string,
  projectRoot: string = process.cwd()
): Promise<RenderContext> {
  logger.debug({ preset: preset.name, projectName }, 'Building render context');

  // Detect framework versions
  const versions = await detectFrameworkVersions(projectRoot);

  // Build context
  const context: RenderContext = {
    projectName,
    setupDate: new Date().toISOString().split('T')[0],
    preset: preset.name,
    framework: versions.framework,
    frameworkVersion: versions.frameworkVersion,
    reactVersion: versions.reactVersion,
    typescriptVersion: versions.typescriptVersion,
    detectedTech: versions.detectedTech.length > 0 ? versions.detectedTech : undefined,
    contextMonitoring: {
      warningThreshold: preset.contextMonitoring.warningThreshold,
      criticalThreshold: preset.contextMonitoring.criticalThreshold,
      boundaryDetection: preset.contextMonitoring.boundaryDetection as string,
    },
    hooks: {
      preCommit: {
        enabled: preset.hooks.preCommit.enabled,
        strictness: preset.hooks.preCommit.strictness as string | undefined,
        checks: preset.hooks.preCommit.checks
          ? preset.hooks.preCommit.checks.map((check) => ({
              name: check.name,
              failOn: check.failOn as string,
            }))
          : undefined,
      },
    },
    memorySections: preset.memory.sections,
    skills: preset.skills,
    subagents: preset.subagents,
    codingStandards: preset.codingStandards,
    context7Libraries: preset.memory.context7Libraries,
  };

  logger.debug(
    {
      projectName,
      preset: preset.name,
      framework: versions.framework,
      techCount: versions.detectedTech.length,
    },
    'Render context built'
  );

  return context;
}

/**
 * Render a template file with context
 *
 * @param templatePath - Path to template file
 * @param context - Render context
 * @param additionalVariables - Additional variables to merge
 * @returns Rendered template string
 * @throws RenderError if rendering fails
 */
export async function renderTemplateFile(
  templatePath: string,
  context: RenderContext,
  additionalVariables?: Record<string, any>
): Promise<string> {
  try {
    logger.debug({ templatePath }, 'Rendering template file');

    // Merge additional variables
    const variables = { ...context, ...additionalVariables };

    // Render template
    const rendered = await loadAndRender(templatePath, variables);

    logger.debug(
      { templatePath, renderedLength: rendered.length },
      'Template rendered successfully'
    );

    return rendered;
  } catch (error) {
    throw new RenderError(
      `Failed to render template: ${templatePath}`,
      context,
      templatePath,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Validate required variables in context
 *
 * @param context - Render context
 * @param requiredVars - List of required variable names
 * @throws VariableError if required variables are missing
 */
export function validateRequiredVariables(
  context: RenderContext,
  requiredVars: string[]
): void {
  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!(varName in context) || context[varName] === undefined) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new VariableError(
      `Missing required variables: ${missing.join(', ')}`,
      missing[0]
    );
  }
}

/**
 * Initialize the renderer (ensures engine is initialized)
 */
export function initializeRenderer(): void {
  initializeEngine();
  logger.info('Template renderer initialized');
}
