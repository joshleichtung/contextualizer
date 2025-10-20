/**
 * Template System Exports
 *
 * Central export point for template system components.
 */

export {
  initializeEngine,
  registerHelpers,
  compileTemplate,
  loadTemplate,
  renderTemplate,
  loadAndRender,
  clearCache,
  getCacheStats,
} from './engine.js';

export {
  buildRenderContext,
  renderTemplateFile,
  validateRequiredVariables,
  initializeRenderer,
  detectFrameworkVersions,
  type RenderContext,
} from './renderer.js';

export {
  TemplateError,
  RenderError,
  VariableError,
  TemplateNotFoundError,
} from './errors.js';
