/**
 * Template Engine
 *
 * Handlebars-based template engine for rendering configuration files
 * and documentation from templates.
 */

import Handlebars from 'handlebars';
import { readFileWithRetry } from '../utils/fs-resilient.js';
import { TemplateError } from './errors.js';
import { logger } from '../utils/logger.js';

/**
 * Template compilation cache
 */
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

/**
 * Register custom Handlebars helpers
 */
export function registerHelpers(): void {
  // Helper: Equality check
  Handlebars.registerHelper('eq', function (a: any, b: any) {
    return a === b;
  });

  // Helper: Not equal check
  Handlebars.registerHelper('neq', function (a: any, b: any) {
    return a !== b;
  });

  // Helper: Greater than
  Handlebars.registerHelper('gt', function (a: number, b: number) {
    return a > b;
  });

  // Helper: Less than
  Handlebars.registerHelper('lt', function (a: number, b: number) {
    return a < b;
  });

  // Helper: Logical OR
  Handlebars.registerHelper('or', function (...args: any[]) {
    // Remove the options object (last argument)
    const values = args.slice(0, -1);
    return values.some((v) => !!v);
  });

  // Helper: Logical AND
  Handlebars.registerHelper('and', function (...args: any[]) {
    // Remove the options object (last argument)
    const values = args.slice(0, -1);
    return values.every((v) => !!v);
  });

  // Helper: Format date
  Handlebars.registerHelper('formatDate', function (date?: Date | string) {
    const d = date ? new Date(date) : new Date();
    return d.toISOString().split('T')[0];
  });

  // Helper: Uppercase
  Handlebars.registerHelper('upper', function (str: string) {
    return str?.toUpperCase() || '';
  });

  // Helper: Lowercase
  Handlebars.registerHelper('lower', function (str: string) {
    return str?.toLowerCase() || '';
  });

  // Helper: Capitalize first letter
  Handlebars.registerHelper('capitalize', function (str: string) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  });

  // Helper: Join array
  Handlebars.registerHelper('join', function (arr: any[], separator: string) {
    if (!Array.isArray(arr)) return '';
    return arr.join(separator);
  });

  // Helper: Default value
  Handlebars.registerHelper('default', function (value: any, defaultValue: any) {
    return value ?? defaultValue;
  });

  logger.debug('Handlebars helpers registered');
}

/**
 * Initialize the template engine
 */
export function initializeEngine(): void {
  registerHelpers();
  logger.info('Template engine initialized');
}

/**
 * Compile a template from string
 *
 * @param templateString - Template string to compile
 * @param cacheKey - Optional cache key for compiled template
 * @returns Compiled Handlebars template
 * @throws TemplateError if compilation fails
 */
export function compileTemplate(
  templateString: string,
  cacheKey?: string
): HandlebarsTemplateDelegate {
  try {
    // Check cache first
    if (cacheKey && templateCache.has(cacheKey)) {
      logger.debug({ cacheKey }, 'Using cached template');
      return templateCache.get(cacheKey)!;
    }

    // Compile template
    const compiled = Handlebars.compile(templateString, {
      noEscape: false,
      strict: false,
      preventIndent: false,
    });

    // Cache if key provided
    if (cacheKey) {
      templateCache.set(cacheKey, compiled);
      logger.debug({ cacheKey }, 'Template cached');
    }

    return compiled;
  } catch (error) {
    throw new TemplateError(
      'Failed to compile template',
      cacheKey,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Load and compile a template from file
 *
 * @param filePath - Path to template file
 * @returns Compiled Handlebars template
 * @throws TemplateError if loading or compilation fails
 */
export async function loadTemplate(
  filePath: string
): Promise<HandlebarsTemplateDelegate> {
  try {
    logger.debug({ filePath }, 'Loading template from file');

    // Read template file
    const templateString = await readFileWithRetry(filePath);

    // Compile with cache key as file path
    return compileTemplate(templateString, filePath);
  } catch (error) {
    throw new TemplateError(
      `Failed to load template from ${filePath}`,
      filePath,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Render a template with data
 *
 * @param template - Compiled Handlebars template
 * @param data - Data to render template with
 * @returns Rendered template string
 * @throws TemplateError if rendering fails
 */
export function renderTemplate(
  template: HandlebarsTemplateDelegate,
  data: Record<string, any>
): string {
  try {
    logger.debug({ dataKeys: Object.keys(data) }, 'Rendering template');
    return template(data);
  } catch (error) {
    throw new TemplateError(
      'Failed to render template',
      undefined,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Load and render a template in one operation
 *
 * @param filePath - Path to template file
 * @param data - Data to render template with
 * @returns Rendered template string
 * @throws TemplateError if loading or rendering fails
 */
export async function loadAndRender(
  filePath: string,
  data: Record<string, any>
): Promise<string> {
  const template = await loadTemplate(filePath);
  return renderTemplate(template, data);
}

/**
 * Clear the template cache
 */
export function clearCache(): void {
  const size = templateCache.size;
  templateCache.clear();
  logger.debug({ clearedTemplates: size }, 'Template cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: templateCache.size,
    keys: Array.from(templateCache.keys()),
  };
}
