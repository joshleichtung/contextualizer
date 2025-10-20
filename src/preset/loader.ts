/**
 * Preset Loader
 *
 * Loads and validates preset configurations from YAML files.
 * Provides robust error handling and schema validation.
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import {
  PresetDefinition,
  RawPresetData,
  PresetValidationError,
  PresetLoadError,
  ContextMonitoringConfig,
  HooksConfig,
  MemoryConfig,
  TemplateConfig,
} from './types.js';

/**
 * Default presets directory (relative to project root)
 */
export const DEFAULT_PRESETS_DIR = 'presets';

/**
 * Validates context monitoring configuration
 */
function validateContextMonitoring(
  presetName: string,
  data: unknown
): ContextMonitoringConfig {
  if (!data || typeof data !== 'object') {
    throw new PresetValidationError(
      presetName,
      'contextMonitoring',
      'Must be an object'
    );
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.warningThreshold !== 'number') {
    throw new PresetValidationError(
      presetName,
      'contextMonitoring.warningThreshold',
      'Must be a number'
    );
  }

  if (typeof obj.criticalThreshold !== 'number') {
    throw new PresetValidationError(
      presetName,
      'contextMonitoring.criticalThreshold',
      'Must be a number'
    );
  }

  const validBoundaries = ['aggressive', 'balanced', 'conservative'];
  if (!validBoundaries.includes(obj.boundaryDetection as string)) {
    throw new PresetValidationError(
      presetName,
      'contextMonitoring.boundaryDetection',
      `Must be one of: ${validBoundaries.join(', ')}`
    );
  }

  return {
    warningThreshold: obj.warningThreshold,
    criticalThreshold: obj.criticalThreshold,
    boundaryDetection: obj.boundaryDetection as
      | 'aggressive'
      | 'balanced'
      | 'conservative',
  };
}

/**
 * Validates hooks configuration
 */
function validateHooks(presetName: string, data: unknown): HooksConfig {
  if (!data || typeof data !== 'object') {
    throw new PresetValidationError(presetName, 'hooks', 'Must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!obj.preCommit || typeof obj.preCommit !== 'object') {
    throw new PresetValidationError(
      presetName,
      'hooks.preCommit',
      'Must be an object'
    );
  }

  const preCommit = obj.preCommit as Record<string, unknown>;

  if (typeof preCommit.enabled !== 'boolean') {
    throw new PresetValidationError(
      presetName,
      'hooks.preCommit.enabled',
      'Must be a boolean'
    );
  }

  const config: HooksConfig = {
    preCommit: {
      enabled: preCommit.enabled,
    },
  };

  if (preCommit.strictness !== undefined) {
    const validStrictness = ['strict', 'balanced', 'relaxed'];
    if (!validStrictness.includes(preCommit.strictness as string)) {
      throw new PresetValidationError(
        presetName,
        'hooks.preCommit.strictness',
        `Must be one of: ${validStrictness.join(', ')}`
      );
    }
    config.preCommit.strictness = preCommit.strictness as
      | 'strict'
      | 'balanced'
      | 'relaxed';
  }

  if (preCommit.checks !== undefined) {
    if (!Array.isArray(preCommit.checks)) {
      throw new PresetValidationError(
        presetName,
        'hooks.preCommit.checks',
        'Must be an array'
      );
    }

    config.preCommit.checks = preCommit.checks.map((check, idx) => {
      if (!check || typeof check !== 'object') {
        throw new PresetValidationError(
          presetName,
          `hooks.preCommit.checks[${idx}]`,
          'Must be an object'
        );
      }

      const c = check as Record<string, unknown>;

      if (typeof c.name !== 'string') {
        throw new PresetValidationError(
          presetName,
          `hooks.preCommit.checks[${idx}].name`,
          'Must be a string'
        );
      }

      const validFailOn = ['errors', 'warnings', 'never'];
      if (!validFailOn.includes(c.failOn as string)) {
        throw new PresetValidationError(
          presetName,
          `hooks.preCommit.checks[${idx}].failOn`,
          `Must be one of: ${validFailOn.join(', ')}`
        );
      }

      return {
        name: c.name,
        failOn: c.failOn as 'errors' | 'warnings' | 'never',
      };
    });
  }

  return config;
}

/**
 * Validates memory configuration
 */
function validateMemory(presetName: string, data: unknown): MemoryConfig {
  if (!data || typeof data !== 'object') {
    throw new PresetValidationError(presetName, 'memory', 'Must be an object');
  }

  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.sections)) {
    throw new PresetValidationError(
      presetName,
      'memory.sections',
      'Must be an array'
    );
  }

  const sections = obj.sections.map((section, idx) => {
    if (!section || typeof section !== 'object') {
      throw new PresetValidationError(
        presetName,
        `memory.sections[${idx}]`,
        'Must be an object'
      );
    }

    const s = section as Record<string, unknown>;

    if (typeof s.title !== 'string') {
      throw new PresetValidationError(
        presetName,
        `memory.sections[${idx}].title`,
        'Must be a string'
      );
    }

    if (typeof s.content !== 'string') {
      throw new PresetValidationError(
        presetName,
        `memory.sections[${idx}].content`,
        'Must be a string'
      );
    }

    return {
      title: s.title,
      content: s.content,
    };
  });

  const config: MemoryConfig = { sections };

  if (obj.context7Libraries !== undefined) {
    if (!Array.isArray(obj.context7Libraries)) {
      throw new PresetValidationError(
        presetName,
        'memory.context7Libraries',
        'Must be an array'
      );
    }

    if (!obj.context7Libraries.every((lib) => typeof lib === 'string')) {
      throw new PresetValidationError(
        presetName,
        'memory.context7Libraries',
        'All items must be strings'
      );
    }

    config.context7Libraries = obj.context7Libraries as string[];
  }

  return config;
}

/**
 * Validates template configuration
 */
function validateTemplates(
  presetName: string,
  data: unknown
): TemplateConfig | undefined {
  if (data === undefined) {
    return undefined;
  }

  if (!data || typeof data !== 'object') {
    throw new PresetValidationError(
      presetName,
      'templates',
      'Must be an object'
    );
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.baseDir !== 'string') {
    throw new PresetValidationError(
      presetName,
      'templates.baseDir',
      'Must be a string'
    );
  }

  if (!Array.isArray(obj.files)) {
    throw new PresetValidationError(
      presetName,
      'templates.files',
      'Must be an array'
    );
  }

  const files = obj.files.map((file, idx) => {
    if (!file || typeof file !== 'object') {
      throw new PresetValidationError(
        presetName,
        `templates.files[${idx}]`,
        'Must be an object'
      );
    }

    const f = file as Record<string, unknown>;

    if (typeof f.source !== 'string') {
      throw new PresetValidationError(
        presetName,
        `templates.files[${idx}].source`,
        'Must be a string'
      );
    }

    if (typeof f.destination !== 'string') {
      throw new PresetValidationError(
        presetName,
        `templates.files[${idx}].destination`,
        'Must be a string'
      );
    }

    return {
      source: f.source,
      destination: f.destination,
      overwrite: f.overwrite === true,
      variables:
        f.variables && typeof f.variables === 'object'
          ? (f.variables as Record<string, string>)
          : undefined,
    };
  });

  return {
    baseDir: obj.baseDir,
    files,
    variables:
      obj.variables && typeof obj.variables === 'object'
        ? (obj.variables as Record<string, string>)
        : undefined,
  };
}

/**
 * Validates and converts raw preset data to PresetDefinition
 */
export function validatePreset(
  presetName: string,
  data: RawPresetData
): PresetDefinition {
  if (typeof data.name !== 'string') {
    throw new PresetValidationError(presetName, 'name', 'Must be a string');
  }

  if (typeof data.description !== 'string') {
    throw new PresetValidationError(
      presetName,
      'description',
      'Must be a string'
    );
  }

  if (typeof data.installationTime !== 'string') {
    throw new PresetValidationError(
      presetName,
      'installationTime',
      'Must be a string'
    );
  }

  const preset: PresetDefinition = {
    name: data.name,
    description: data.description,
    installationTime: data.installationTime,
    contextMonitoring: validateContextMonitoring(
      presetName,
      data.contextMonitoring
    ),
    hooks: validateHooks(presetName, data.hooks),
    memory: validateMemory(presetName, data.memory),
  };

  // Optional fields
  if (data.skills !== undefined) {
    if (
      !Array.isArray(data.skills) ||
      !data.skills.every((s) => typeof s === 'string')
    ) {
      throw new PresetValidationError(
        presetName,
        'skills',
        'Must be an array of strings'
      );
    }
    preset.skills = data.skills as string[];
  }

  if (data.subagents !== undefined) {
    if (
      !Array.isArray(data.subagents) ||
      !data.subagents.every((s) => typeof s === 'string')
    ) {
      throw new PresetValidationError(
        presetName,
        'subagents',
        'Must be an array of strings'
      );
    }
    preset.subagents = data.subagents as string[];
  }

  if (data.codingStandards !== undefined) {
    if (
      !Array.isArray(data.codingStandards) ||
      !data.codingStandards.every((s) => typeof s === 'string')
    ) {
      throw new PresetValidationError(
        presetName,
        'codingStandards',
        'Must be an array of strings'
      );
    }
    preset.codingStandards = data.codingStandards as string[];
  }

  if (data.templates !== undefined) {
    preset.templates = validateTemplates(presetName, data.templates);
  }

  return preset;
}

/**
 * Loads a preset from a YAML file
 */
export async function loadPresetFromFile(
  filePath: string
): Promise<PresetDefinition> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = yaml.load(content) as RawPresetData;

    if (!data) {
      throw new Error('YAML file is empty or invalid');
    }

    const presetName = path.basename(filePath, '.yaml');
    return validatePreset(presetName, data);
  } catch (error) {
    if (error instanceof PresetValidationError) {
      throw error;
    }

    throw new PresetLoadError(
      filePath,
      error instanceof Error ? error.message : String(error),
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Loads all presets from a directory
 */
export async function loadPresetsFromDirectory(
  dirPath: string
): Promise<PresetDefinition[]> {
  try {
    const files = await fs.readdir(dirPath);
    const yamlFiles = files.filter((f) => f.endsWith('.yaml'));

    const presets = await Promise.all(
      yamlFiles.map((file) => loadPresetFromFile(path.join(dirPath, file)))
    );

    return presets;
  } catch (error) {
    if (error instanceof PresetValidationError) {
      throw error;
    }

    throw new PresetLoadError(
      dirPath,
      `Failed to load presets from directory: ${error instanceof Error ? error.message : String(error)}`,
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Loads presets from the default directory
 */
export async function loadDefaultPresets(): Promise<PresetDefinition[]> {
  const presetsDir = path.join(process.cwd(), DEFAULT_PRESETS_DIR);
  return loadPresetsFromDirectory(presetsDir);
}
