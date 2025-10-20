/**
 * Enhanced Preset Type Definitions
 *
 * This module extends the base preset types with YAML-based configuration
 * support, template management, and file generation specifications.
 */

/**
 * Memory section structure
 */
export interface MemorySection {
  title: string;
  content: string;
}

/**
 * Pre-commit hook check configuration
 */
export interface PreCommitCheck {
  name: string;
  failOn: 'errors' | 'warnings' | 'never';
}

/**
 * Pre-commit hook configuration
 */
export interface PreCommitHook {
  enabled: boolean;
  strictness?: 'strict' | 'balanced' | 'relaxed';
  checks?: PreCommitCheck[];
}

/**
 * Hooks configuration
 */
export interface HooksConfig {
  preCommit: PreCommitHook;
}

/**
 * Memory configuration
 */
export interface MemoryConfig {
  sections: MemorySection[];
  context7Libraries?: string[];
}

/**
 * Context monitoring configuration
 */
export interface ContextMonitoringConfig {
  warningThreshold: number;
  criticalThreshold: number;
  boundaryDetection: 'aggressive' | 'balanced' | 'conservative';
}

/**
 * Template file specification for code generation
 */
export interface TemplateFile {
  /** Source template path relative to templates directory */
  source: string;
  /** Destination path in target project (supports variables) */
  destination: string;
  /** Whether to overwrite existing files */
  overwrite?: boolean;
  /** File-specific template variables */
  variables?: Record<string, string>;
}

/**
 * Template configuration for preset
 */
export interface TemplateConfig {
  /** Base directory for templates */
  baseDir: string;
  /** Files to generate from templates */
  files: TemplateFile[];
  /** Global template variables */
  variables?: Record<string, string>;
}

/**
 * Complete preset definition with template support
 */
export interface PresetDefinition {
  name: string;
  description: string;
  installationTime: string;
  contextMonitoring: ContextMonitoringConfig;
  hooks: HooksConfig;
  memory: MemoryConfig;
  skills?: string[];
  subagents?: string[];
  codingStandards?: string[];
  templates?: TemplateConfig;
}

/**
 * Raw preset data from YAML (before validation)
 */
export type RawPresetData = Record<string, unknown>;

/**
 * Preset validation error
 */
export class PresetValidationError extends Error {
  constructor(
    public presetName: string,
    public field: string,
    message: string
  ) {
    super(`Preset '${presetName}' validation failed at '${field}': ${message}`);
    this.name = 'PresetValidationError';
  }
}

/**
 * Preset loading error
 */
export class PresetLoadError extends Error {
  constructor(
    public presetPath: string,
    message: string,
    public cause?: Error
  ) {
    super(`Failed to load preset from '${presetPath}': ${message}`);
    this.name = 'PresetLoadError';
    if (cause) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

/**
 * Type guard for PresetDefinition
 */
export function isValidPreset(value: unknown): value is PresetDefinition {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const obj = value as Record<string, unknown>;

  return (
    typeof obj.name === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.installationTime === 'string' &&
    typeof obj.contextMonitoring === 'object' &&
    typeof obj.hooks === 'object' &&
    typeof obj.memory === 'object'
  );
}
