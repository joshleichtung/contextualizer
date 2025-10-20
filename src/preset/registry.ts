/**
 * Preset Registry
 *
 * Manages preset registration, lookup, and querying.
 * Provides singleton access to all available presets.
 */

import { PresetDefinition } from './types.js';
import { loadDefaultPresets, loadPresetFromFile } from './loader.js';

/**
 * Preset not found error
 */
export class PresetNotFoundError extends Error {
  constructor(public presetName: string) {
    super(`Preset '${presetName}' not found in registry`);
    this.name = 'PresetNotFoundError';
  }
}

/**
 * Preset registry for managing available presets
 */
export class PresetRegistry {
  private presets: Map<string, PresetDefinition> = new Map();
  private initialized = false;

  /**
   * Registers a preset
   */
  register(preset: PresetDefinition): void {
    this.presets.set(preset.name, preset);
  }

  /**
   * Registers multiple presets
   */
  registerAll(presets: PresetDefinition[]): void {
    for (const preset of presets) {
      this.register(preset);
    }
  }

  /**
   * Gets a preset by name
   */
  get(name: string): PresetDefinition {
    const preset = this.presets.get(name);
    if (!preset) {
      throw new PresetNotFoundError(name);
    }
    return preset;
  }

  /**
   * Checks if a preset exists
   */
  has(name: string): boolean {
    return this.presets.has(name);
  }

  /**
   * Gets all registered presets
   */
  getAll(): PresetDefinition[] {
    return Array.from(this.presets.values());
  }

  /**
   * Gets all preset names
   */
  getNames(): string[] {
    return Array.from(this.presets.keys());
  }

  /**
   * Gets preset count
   */
  count(): number {
    return this.presets.size;
  }

  /**
   * Clears all presets
   */
  clear(): void {
    this.presets.clear();
    this.initialized = false;
  }

  /**
   * Loads and registers presets from default directory
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const presets = await loadDefaultPresets();
    this.registerAll(presets);
    this.initialized = true;
  }

  /**
   * Loads and registers a preset from a file
   */
  async loadFromFile(filePath: string): Promise<PresetDefinition> {
    const preset = await loadPresetFromFile(filePath);
    this.register(preset);
    return preset;
  }

  /**
   * Checks if registry is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Finds presets matching a filter function
   */
  find(predicate: (preset: PresetDefinition) => boolean): PresetDefinition[] {
    return this.getAll().filter(predicate);
  }

  /**
   * Gets presets metadata for listing
   */
  getMetadata(): Array<{
    name: string;
    description: string;
    installationTime: string;
  }> {
    return this.getAll().map((preset) => ({
      name: preset.name,
      description: preset.description,
      installationTime: preset.installationTime,
    }));
  }
}

/**
 * Global preset registry instance
 */
let globalRegistry: PresetRegistry | null = null;

/**
 * Gets the global preset registry instance
 */
export function getRegistry(): PresetRegistry {
  if (!globalRegistry) {
    globalRegistry = new PresetRegistry();
  }
  return globalRegistry;
}

/**
 * Resets the global registry (useful for testing)
 */
export function resetRegistry(): void {
  globalRegistry = null;
}

/**
 * Initializes the global registry with default presets
 */
export async function initializeRegistry(): Promise<PresetRegistry> {
  const registry = getRegistry();
  await registry.initialize();
  return registry;
}

/**
 * Loads a preset by name (initializes registry if needed)
 */
export async function loadPresetByName(
  name: string
): Promise<PresetDefinition> {
  const registry = getRegistry();

  if (!registry.isInitialized()) {
    await registry.initialize();
  }

  return registry.get(name);
}
