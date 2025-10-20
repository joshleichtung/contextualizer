/**
 * Template System Errors
 *
 * Custom error classes for template operations.
 */

/**
 * Base error for template operations
 */
export class TemplateError extends Error {
  constructor(
    message: string,
    public templatePath?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'TemplateError';

    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Error for template rendering failures
 */
export class RenderError extends TemplateError {
  constructor(
    message: string,
    public variables: Record<string, any>,
    templatePath?: string,
    cause?: Error
  ) {
    super(message, templatePath, cause);
    this.name = 'RenderError';
  }
}

/**
 * Error for template variable issues
 */
export class VariableError extends TemplateError {
  constructor(
    message: string,
    public variableName: string,
    templatePath?: string,
    cause?: Error
  ) {
    super(message, templatePath, cause);
    this.name = 'VariableError';
  }
}

/**
 * Error for template not found
 */
export class TemplateNotFoundError extends TemplateError {
  constructor(templatePath: string) {
    super(`Template not found: ${templatePath}`, templatePath);
    this.name = 'TemplateNotFoundError';
  }
}
