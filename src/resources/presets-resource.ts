/**
 * Presets Resource
 *
 * Provides available preset definitions via contextualizer://presets.
 * Uses the preset registry for dynamic preset loading from YAML files.
 */

import type { MCPResource, ResourceContent } from '../types/mcp.js';
import { logger } from '../utils/logger.js';
import { getRegistry } from '../preset/registry.js';
import { PRESETS } from '../config/presets.js';

/**
 * Provider function for presets resource
 *
 * Returns preset definitions from the registry (loaded from YAML),
 * with fallback to static presets for backward compatibility.
 */
async function presetsResourceProvider(): Promise<ResourceContent> {
  logger.debug({ resource: 'presets' }, 'Presets resource read');

  let presets;

  try {
    // Try to use registry first (YAML-based presets)
    const registry = getRegistry();

    // Initialize registry if not already done
    if (!registry.isInitialized()) {
      await registry.initialize();
    }

    presets = registry.getAll();
    logger.debug(
      { count: presets.length },
      'Loaded presets from registry'
    );
  } catch (error) {
    // Fallback to static presets if registry fails
    logger.warn(
      { error: error instanceof Error ? error.message : String(error) },
      'Failed to load presets from registry, using static presets'
    );
    presets = PRESETS;
  }

  const presetsData = {
    presets,
  };

  return {
    uri: 'contextualizer://presets',
    mimeType: 'application/json',
    text: JSON.stringify(presetsData, null, 2),
  };
}

/**
 * Presets resource definition
 */
export const presetsResource: MCPResource = {
  uri: 'contextualizer://presets',
  name: 'Presets',
  description: 'Available preset configurations for different development scenarios',
  mimeType: 'application/json',
  provider: presetsResourceProvider,
};
